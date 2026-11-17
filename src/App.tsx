/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { HologramInspectorModal, ScrollCardKind } from './components/HologramInspectorModal';
import { DETAILED_CHAMBERS } from './data/portfolioSections';
import { RESUME_DATA } from './data/resume';
import { PedestalMode } from './three/detailedChambers';
import { ObsidianCyanScene } from './three/ObsidianCyanScene';
import { ambientAudio } from './utils/ambientAudio';
import { ScrambleText } from './utils/scrambleText';

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

interface ScrollCardState {
  activeCard: ScrollCardKind | null;
  revealAmount: number;
  enterT: number;
  exitT: number;
}

function getScrollCardState(progress: number): ScrollCardState {
  // CH.02 // ABOUT ME (enters 0.25->0.32, holds, fades out 0.41->0.49 with neuron dive)
  if (progress >= 0.25 && progress <= 0.49) {
    const enterT = smoothstep(0.25, 0.32, progress);
    const exitT = smoothstep(0.41, 0.49, progress);
    return {
      activeCard: 'about',
      revealAmount: enterT * (1 - exitT),
      enterT,
      exitT,
    };
  }

  // CH.03 // WORK (enters 0.63->0.69, holds, fades out 0.77->0.85 with iris plunge)
  if (progress >= 0.63 && progress <= 0.85) {
    const enterT = smoothstep(0.63, 0.69, progress);
    const exitT = smoothstep(0.77, 0.85, progress);
    return {
      activeCard: 'work',
      revealAmount: enterT * (1 - exitT),
      enterT,
      exitT,
    };
  }

  // CH.04 // CONTACT (enters 0.91->0.96, remains open at pedestal 1.00)
  if (progress >= 0.91) {
    const enterT = smoothstep(0.91, 0.96, progress);
    return {
      activeCard: 'contact',
      revealAmount: enterT,
      enterT,
      exitT: 0,
    };
  }

  return { activeCard: null, revealAmount: 0, enterT: 0, exitT: 0 };
}

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChamberIdx, setActiveChamberIdx] = useState(0);
  const [warpIntensity, setWarpIntensity] = useState(0);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [pedestalMode, setPedestalMode] = useState<PedestalMode>('blockchain');
  const [cameraResetNonce, setCameraResetNonce] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [hudHidden, setHudHidden] = useState(false);

  useEffect(() => {
    let raf = 0;
    const syncScroll = () => {
      raf = 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      setScrollProgress(progress);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(syncScroll);
    };

    syncScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', syncScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', syncScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setHudHidden((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      ambientAudio.dispose();
    };
  }, []);

  const handleTelemetryUpdate = useCallback(
    (chamberIdx: number, warp: number, orbiting: boolean) => {
      setActiveChamberIdx((prev) => {
        if (prev !== chamberIdx) ambientAudio.playPulse();
        return chamberIdx;
      });
      setWarpIntensity(warp);
      setIsOrbiting(orbiting);
    },
    []
  );

  const handleJumpChamber = useCallback((idx: number) => {
    const ch = DETAILED_CHAMBERS[idx];
    if (!ch) return;
    ambientAudio.playPulse();
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({
      top: ch.scrollAt * maxScroll,
      behavior: 'smooth',
    });
    setCameraResetNonce((n) => n + 1);
  }, []);

  const handleToggleSound = useCallback(() => {
    const next = ambientAudio.toggle();
    setSoundEnabled(next);
  }, []);

  const activeChamber = DETAILED_CHAMBERS[activeChamberIdx] ?? DETAILED_CHAMBERS[0];
  const cardState = getScrollCardState(scrollProgress);

  return (
    <div className="relative bg-[#121417] text-[#FFFFFF]">
      {/* Full-Viewport Obsidian & Pure Cyan 3D Engine */}
      <ObsidianCyanScene
        scrollProgress={scrollProgress}
        pedestalMode={pedestalMode}
        cameraResetNonce={cameraResetNonce}
        onTelemetryUpdate={handleTelemetryUpdate}
      />

      {/* Subtle Pure Cyan Portal Warp Flash */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 bg-[#00FFFF]"
        style={{ opacity: warpIntensity * 0.05, transition: 'opacity 60ms linear' }}
      />

      {/* Minimal Edge HUD Overlay */}
      {!hudHidden && (
        <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-5 md:p-7">
          {/* Top Row: Clean Chapter Stamp Left, Crisp Identity Right */}
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-0.5">
              <p className="font-mono-hud text-xs font-medium tracking-widest text-[#FFFFFF]">
                <ScrambleText text={activeChamber.hudTitle} />
              </p>
              <p className="font-mono-hud text-[10px] tracking-wider text-[#00FFFF]">
                <ScrambleText text={activeChamber.sectionTag} durationMs={320} />
              </p>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div className="hidden sm:block space-y-0.5">
                <p className="font-mono-hud text-[11px] tracking-widest text-[#00FFFF]">
                  {RESUME_DATA.identity.name.toUpperCase()}
                </p>
                <p className="font-mono-hud text-[10px] text-[#8A929A]">
                  {RESUME_DATA.identity.role}
                </p>
              </div>
              {isOrbiting && (
                <button
                  type="button"
                  onClick={() => setCameraResetNonce((n) => n + 1)}
                  className="pointer-events-auto font-mono-hud text-[10px] tracking-wider border border-[#8A929A]/50 bg-[#121417]/80 px-2.5 py-1 text-[#FFFFFF] hover:border-[#00FFFF] hover:text-[#00FFFF] transition-colors cursor-pointer"
                >
                  RESET VIEW
                </button>
              )}
            </div>
          </div>

          {/* Quiet Initial Scroll Prompt (fades out cleanly once user scrolls past 4%) */}
          {scrollProgress < 0.04 && (
            <div
              aria-hidden="true"
              className="mx-auto flex flex-col items-center gap-2 opacity-75 transition-opacity"
            >
              <span className="font-mono-hud text-[10px] tracking-[0.22em] text-[#00FFFF]">
                SCROLL TO EXPLORE
              </span>
              <span className="h-5 w-[1px] bg-gradient-to-b from-[#00FFFF] to-transparent" />
            </div>
          )}

          {/* Bottom Row: Quiet Sound Toggle Left + Minimal Chapter Progress Right */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleToggleSound}
              className="pointer-events-auto inline-flex items-center gap-1.5 font-mono-hud text-[10px] tracking-wider text-[#8A929A] hover:text-[#00FFFF] transition-colors cursor-pointer"
              aria-label="Toggle ambient sound"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-[#00FFFF]" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{soundEnabled ? 'AUDIO ON' : 'AUDIO OFF'}</span>
            </button>

            <div className="pointer-events-auto flex items-center gap-3">
              <div className="flex items-center gap-1">
                {DETAILED_CHAMBERS.map((ch, idx) => {
                  const isActive = idx === activeChamberIdx;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => handleJumpChamber(idx)}
                      className={`font-mono-hud text-[10px] px-1.5 py-0.5 border transition-colors cursor-pointer ${
                        isActive
                          ? 'border-[#00FFFF] text-[#00FFFF] bg-[#00FFFF]/12'
                          : 'border-[#8A929A]/25 text-[#8A929A] hover:border-[#00FFFF]/50 hover:text-[#FFFFFF]'
                      }`}
                    >
                      {ch.index}
                    </button>
                  );
                })}
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <div className="relative h-[2px] w-20 bg-[#8A929A]/25">
                  <div
                    className="absolute top-0 left-0 h-full bg-[#00FFFF]"
                    style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                  />
                </div>
                <span className="font-mono-hud text-[10px] text-[#00FFFF] w-8 text-right">
                  {String(Math.round(scrollProgress * 100)).padStart(3, '0')}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Scroll-Driven Holographic Resume Cards */}
      <HologramInspectorModal
        activeCard={cardState.activeCard}
        revealAmount={cardState.revealAmount}
        enterT={cardState.enterT}
        exitT={cardState.exitT}
        pedestalMode={pedestalMode}
        onSelectPedestalMode={(m) => {
          ambientAudio.playPulse();
          setPedestalMode(m);
        }}
      />

      {/* 800vh Scroll Driver */}
      <main className="relative z-0 pointer-events-none" aria-hidden="true">
        <div className="h-[800vh]" />
      </main>
    </div>
  );
}
