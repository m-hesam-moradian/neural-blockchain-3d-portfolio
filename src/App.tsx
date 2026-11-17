/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { HologramInspectorModal } from './components/HologramInspectorModal';
import {
  ChamberConfig,
  DETAILED_CHAMBERS,
} from './data/portfolioSections';
import { RESUME_DATA } from './data/resume';
import { PedestalMode } from './three/detailedChambers';
import { ObsidianCyanScene } from './three/ObsidianCyanScene';
import { ambientAudio } from './utils/ambientAudio';
import { ScrambleText } from './utils/scrambleText';

const PEDESTAL_MODES: { id: PedestalMode; label: string }[] = [
  { id: 'blockchain', label: '01 // BLOCKCHAIN_GRAPH' },
  { id: 'neural', label: '02 // NEURAL_WAVE' },
  { id: 'helix', label: '03 // PROTOCOL_HELIX' },
];

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChamberIdx, setActiveChamberIdx] = useState(0);
  const [warpIntensity, setWarpIntensity] = useState(0);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [pedestalMode, setPedestalMode] = useState<PedestalMode>('blockchain');
  const [cameraResetNonce, setCameraResetNonce] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [hudHidden, setHudHidden] = useState(false);
  const [inspectedChamber, setInspectedChamber] = useState<ChamberConfig | null>(null);
  const [dismissedAutoAbout, setDismissedAutoAbout] = useState(false);

  const calloutPrimaryRef = useRef<HTMLButtonElement | null>(null);
  const calloutSecondaryRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const syncScroll = () => {
      raf = 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      setScrollProgress(progress);
      if (progress < 0.22 || progress > 0.53) {
        setDismissedAutoAbout(false);
      }
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
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
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
  const autoEnterT = smoothstep(0.25, 0.33, scrollProgress);
  const autoExitT = smoothstep(0.42, 0.50, scrollProgress);
  const autoAboutAmount =
    hudHidden || dismissedAutoAbout || inspectedChamber ? 0 : autoEnterT * (1 - autoExitT);

  return (
    <div className="relative bg-[#121417] text-[#FFFFFF]">
      {/* Full-Viewport Obsidian & Pure Cyan 3D Engine */}
      <ObsidianCyanScene
        scrollProgress={scrollProgress}
        pedestalMode={pedestalMode}
        cameraResetNonce={cameraResetNonce}
        calloutPrimaryRef={calloutPrimaryRef}
        calloutSecondaryRef={calloutSecondaryRef}
        onTelemetryUpdate={handleTelemetryUpdate}
      />

      {/* Portal / Warp Pure Cyan Atmospheric Flash (kept subtle to preserve #121417 dark graphite contrast) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 bg-[#00FFFF]"
        style={{ opacity: warpIntensity * 0.05, transition: 'opacity 60ms linear' }}
      />

      {/* Projected 3D Spatial Callout Pins (matching reference video leader lines) */}
      {!hudHidden && (
        <>
          <button
            ref={calloutPrimaryRef}
            type="button"
            onClick={() => {
              ambientAudio.playPulse();
              setInspectedChamber(activeChamber);
            }}
            style={{ position: 'fixed', top: 0, left: 0, opacity: 0 }}
            className="z-20 group flex items-start gap-2.5 text-left cursor-pointer"
          >
            <span className="mt-2 h-[1px] w-9 bg-[#00FFFF] group-hover:w-12 transition-all duration-150" />
            <span className="border-l border-[#00FFFF]/80 bg-[#121417]/75 px-2.5 py-1.5 group-hover:border-[#00FFFF] group-hover:bg-[#121417]/95 transition-colors">
              <span className="block font-mono-hud text-[11px] font-medium tracking-wider text-[#FFFFFF]">
                {activeChamber.calloutPrimaryTitle}
              </span>
              <span className="block font-mono-hud text-[10px] tracking-wider text-[#00FFFF]">
                {activeChamber.calloutPrimarySub}
              </span>
            </span>
          </button>

          <button
            ref={calloutSecondaryRef}
            type="button"
            onClick={() => {
              ambientAudio.playPulse();
              setInspectedChamber(activeChamber);
            }}
            style={{ position: 'fixed', top: 0, left: 0, opacity: 0 }}
            className="hidden md:flex z-20 group items-start gap-2.5 text-right cursor-pointer"
          >
            <span className="border-r border-[#8A929A]/60 bg-[#121417]/70 px-2.5 py-1.5 group-hover:border-[#00FFFF] transition-colors">
              <span className="block font-mono-hud text-[10px] tracking-wider text-[#FFFFFF]">
                {activeChamber.calloutSecondaryTitle}
              </span>
              <span className="block font-mono-hud text-[10px] tracking-wider text-[#8A929A] group-hover:text-[#00FFFF]">
                {activeChamber.calloutSecondarySub}
              </span>
            </span>
            <span className="mt-2 h-[1px] w-8 bg-[#8A929A]/70 group-hover:bg-[#00FFFF]" />
          </button>
        </>
      )}

      {/* Left & Right Vertical Millimeter Scale Rulers (matching reference screenshots) */}
      {!hudHidden && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none fixed left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col items-start gap-2.5 opacity-60"
          >
            {Array.from({ length: 19 }).map((_, idx) => (
              <span
                key={idx}
                className={`block h-[1px] ${
                  idx % 6 === 0 ? 'w-3 bg-[#00FFFF]/80' : 'w-1.5 bg-[#8A929A]'
                }`}
              />
            ))}
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none fixed right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col items-end gap-2.5 opacity-65"
          >
            <div className="relative flex flex-col items-end gap-2.5">
              {Array.from({ length: 19 }).map((_, idx) => (
                <span
                  key={idx}
                  className={`block h-[1px] ${
                    idx % 6 === 0 ? 'w-3 bg-[#00FFFF]/80' : 'w-1.5 bg-[#8A929A]'
                  }`}
                />
              ))}
              {/* Elevation cursor along right ruler */}
              <span
                className="absolute right-0 w-4 h-[2px] bg-[#00FFFF] transition-all duration-75"
                style={{ top: `${Math.round(scrollProgress * 100)}%` }}
              />
            </div>
          </div>
        </>
      )}

      {/* CH.01 Bottom-Left Circular Telemetry Radar Reticle */}
      {!hudHidden && activeChamberIdx === 0 && warpIntensity < 0.3 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-7 bottom-16 z-20 hidden md:flex items-center gap-3 opacity-65"
        >
          <div className="relative h-14 w-14 rounded-full border border-[#8A929A]/45 flex items-center justify-center">
            <div className="h-9 w-9 rounded-full border border-[#00FFFF]/60 border-t-transparent animate-[spin_9s_linear_infinite]" />
            <span className="absolute h-1.5 w-1.5 rounded-full bg-[#00FFFF]" />
          </div>
          <div className="font-mono-hud text-[9px] leading-tight tracking-widest text-[#8A929A]">
            <p className="text-[#00FFFF]">LEDGER // CHAINED</p>
            <p>BLOCKS: 27 · BINARY 0/1</p>
          </div>
        </div>
      )}

      {/* CH.02 Center Hero Neuron Corner-Bracket Reticle */}
      {!hudHidden &&
        activeChamberIdx === 1 &&
        warpIntensity < 0.35 &&
        !isOrbiting &&
        autoAboutAmount < 0.15 && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-15 flex items-center justify-center"
          >
            <div className="relative h-44 w-44 md:h-52 md:w-52">
              <span className="absolute -top-5 right-0 font-mono-hud text-[9px] tracking-widest text-[#00FFFF]/80">
                NEURON_0x0A
              </span>
              <span className="absolute top-0 left-0 h-4 w-4 border-t border-l border-[#00FFFF]/80" />
              <span className="absolute top-0 right-0 h-4 w-4 border-t border-r border-[#00FFFF]/80" />
              <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-[#00FFFF]/80" />
              <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-[#00FFFF]/80" />
            </div>
          </div>
        )}

      {/* Minimal Igloo-Style Corner HUD Overlay */}
      <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-5 md:p-7">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-6">
          {!hudHidden ? (
            <div className="space-y-1">
              <p className="font-mono-hud text-xs md:text-sm font-medium tracking-widest text-[#FFFFFF]">
                <ScrambleText text={activeChamber.hudTitle} />
              </p>
              <p className="font-mono-hud text-[11px] tracking-wider text-[#00FFFF]">
                <ScrambleText text={activeChamber.sectionTag} durationMs={320} />
              </p>
            </div>
          ) : (
            <div />
          )}

          <div className="flex flex-col items-end gap-2 text-right">
            {!hudHidden && (
              <div className="hidden sm:block max-w-xs space-y-1">
                <p className="font-mono-hud text-[11px] tracking-widest text-[#00FFFF]">
                  ////// {RESUME_DATA.identity.name.toUpperCase()}
                </p>
                <p className="font-mono-hud text-[10px] leading-relaxed text-[#8A929A]">
                  {RESUME_DATA.identity.manifesto}
                </p>
              </div>
            )}

            <div className="pointer-events-auto flex items-center gap-2">
              {!hudHidden && (
                <button
                  type="button"
                  onClick={() => {
                    ambientAudio.playPulse();
                    setInspectedChamber(activeChamber);
                  }}
                  className="font-mono-hud text-[11px] tracking-wider border border-[#00FFFF]/60 bg-[#121417]/85 px-3 py-1.5 text-[#00FFFF] hover:bg-[#00FFFF]/15 transition-colors cursor-pointer whitespace-nowrap"
                >
                  [ {activeChamber.actionLabel} ]
                </button>
              )}

              {isOrbiting && !hudHidden && (
                <button
                  type="button"
                  onClick={() => setCameraResetNonce((n) => n + 1)}
                  className="font-mono-hud text-[11px] tracking-wider border border-[#8A929A]/50 bg-[#121417]/85 px-2.5 py-1.5 text-[#FFFFFF] hover:border-[#00FFFF] hover:text-[#00FFFF] transition-colors cursor-pointer whitespace-nowrap"
                >
                  RESET ANGLE
                </button>
              )}

              <button
                type="button"
                onClick={() => setHudHidden((h) => !h)}
                className="font-mono-hud text-[11px] tracking-wider border border-[#8A929A]/40 bg-[#121417]/80 px-2.5 py-1.5 text-[#8A929A] hover:text-[#FFFFFF] hover:border-[#00FFFF]/50 transition-colors cursor-pointer whitespace-nowrap"
                title="Toggle HUD (H)"
              >
                {hudHidden ? 'SHOW HUD' : 'HIDE HUD'}
              </button>
            </div>
          </div>
        </div>

        {/* Pedestal Interactive Mode Switcher when inside CH.04 */}
        {!hudHidden && activeChamberIdx === 3 && (
          <div className="pointer-events-auto mx-auto flex flex-wrap items-center justify-center gap-1.5 border border-[#00FFFF]/35 bg-[#121417]/90 px-3 py-2">
            {PEDESTAL_MODES.map((m) => {
              const isSelected = pedestalMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    ambientAudio.playPulse();
                    setPedestalMode(m.id);
                  }}
                  className={`font-mono-hud text-[11px] px-2.5 py-1 border transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'border-[#00FFFF] bg-[#00FFFF]/15 text-[#00FFFF]'
                      : 'border-transparent text-[#8A929A] hover:text-[#FFFFFF]'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
            <span aria-hidden="true" className="hidden sm:inline text-[#8A929A]/40 px-1">
              |
            </span>
            <button
              type="button"
              onClick={() => setInspectedChamber(activeChamber)}
              className="font-mono-hud text-[11px] px-2.5 py-1 border border-[#00FFFF]/50 text-[#FFFFFF] hover:bg-[#00FFFF]/15 hover:text-[#00FFFF] transition-colors cursor-pointer whitespace-nowrap"
            >
              CONNECT / CONTACT
            </button>
          </div>
        )}

        {/* Bottom Row: Sound Toggle (left) + Chamber Steps & Scroll Progress Track (right) */}
        {!hudHidden && (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <button
              type="button"
              onClick={handleToggleSound}
              className="pointer-events-auto inline-flex items-center gap-2 font-mono-hud text-[11px] tracking-wider text-[#8A929A] hover:text-[#00FFFF] transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-[#00FFFF]" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span>SOUND: {soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <div className="pointer-events-auto flex items-center gap-4">
              <div className="flex items-center gap-1">
                {DETAILED_CHAMBERS.map((ch, idx) => {
                  const isActive = idx === activeChamberIdx;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => handleJumpChamber(idx)}
                      className={`font-mono-hud text-[11px] px-2 py-0.5 border transition-colors cursor-pointer ${
                        isActive
                          ? 'border-[#00FFFF] text-[#00FFFF] bg-[#00FFFF]/12'
                          : 'border-[#8A929A]/30 text-[#8A929A] hover:border-[#00FFFF]/60 hover:text-[#FFFFFF]'
                      }`}
                    >
                      {ch.index}
                    </button>
                  );
                })}
              </div>

              <div className="hidden sm:flex items-center gap-2.5">
                <span className="font-mono-hud text-[10px] tracking-widest text-[#8A929A]">
                  SCROLL
                </span>
                <div className="relative h-[2px] w-24 bg-[#8A929A]/30">
                  <div
                    className="absolute top-0 left-0 h-full bg-[#00FFFF]"
                    style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                  />
                </div>
                <span className="font-mono-hud text-[11px] text-[#00FFFF] w-9 text-right">
                  {String(Math.round(scrollProgress * 100)).padStart(3, '0')}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bracketed Holographic Inspector Modal + Auto Scroll-Driven About Me Window */}
      <HologramInspectorModal
        chamber={inspectedChamber}
        autoRevealAmount={autoAboutAmount}
        autoEnterT={autoEnterT}
        autoExitT={autoExitT}
        onClose={() => {
          if (inspectedChamber) {
            setInspectedChamber(null);
          } else {
            setDismissedAutoAbout(true);
          }
        }}
      />

      {/* 800vh Scroll Driver */}
      <main className="relative z-0 pointer-events-none" aria-hidden="true">
        <div className="h-[800vh]" />
      </main>
    </div>
  );
}
