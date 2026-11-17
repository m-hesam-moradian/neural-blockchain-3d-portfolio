/**
 * Procedural Web Audio ambient synthesizer (zero external audio files / zero 404s).
 */
class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscLow: OscillatorNode | null = null;
  private oscShimmer: OscillatorNode | null = null;
  private enabled = false;

  public toggle(): boolean {
    if (this.enabled) {
      this.stop();
      return false;
    }
    this.start();
    return true;
  }

  public start() {
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }

      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }

      if (!this.oscLow) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, this.ctx.currentTime);
        filter.connect(this.masterGain);

        this.oscLow = this.ctx.createOscillator();
        this.oscLow.type = 'sine';
        this.oscLow.frequency.setValueAtTime(55, this.ctx.currentTime);
        const lowGain = this.ctx.createGain();
        lowGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
        this.oscLow.connect(lowGain);
        lowGain.connect(filter);
        this.oscLow.start();

        this.oscShimmer = this.ctx.createOscillator();
        this.oscShimmer.type = 'triangle';
        this.oscShimmer.frequency.setValueAtTime(165, this.ctx.currentTime);
        const shimmerGain = this.ctx.createGain();
        shimmerGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        this.oscShimmer.connect(shimmerGain);
        shimmerGain.connect(filter);
        this.oscShimmer.start();
      }

      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.6);
      this.enabled = true;
      this.playPulse();
    } catch {
      this.enabled = false;
    }
  }

  public stop() {
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);
    }
    this.enabled = false;
  }

  public playPulse() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore audio scheduling errors
    }
  }

  public dispose() {
    this.stop();
    if (this.oscLow) {
      try {
        this.oscLow.stop();
      } catch {
        // ignore
      }
      this.oscLow = null;
    }
    if (this.oscShimmer) {
      try {
        this.oscShimmer.stop();
      } catch {
        // ignore
      }
      this.oscShimmer = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const ambientAudio = new AmbientAudioEngine();
