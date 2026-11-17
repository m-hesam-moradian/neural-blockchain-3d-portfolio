/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MultiWorldScene } from './three/MultiWorldScene';
import { CHAMBERS, PedestalShapeId } from './three/worldBuilders';

const PEDESTAL_SHAPES: { id: PedestalShapeId; label: string }[] = [
  { id: 'cube', label: 'CHAIN_CUBE' },
  { id: 'knot', label: 'KNOT_MESH' },
  { id: 'helix', label: 'HELIX_CORE' },
];

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChamberIdx, setActiveChamberIdx] = useState(0);
  const [portalFlash, setPortalFlash] = useState(0);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [pedestalShape, setPedestalShape] = useState<PedestalShapeId>('cube');
  const [cameraResetNonce, setCameraResetNonce] = useState(0);

  const calloutElRef = useRef<HTMLDivElement | null>(null);

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

  const handleTelemetryUpdate = useCallback(
    (chamberIdx: number, flash: number, orbiting: boolean) => {
      setActiveChamberIdx(chamberIdx);
      setPortalFlash(flash);
      setIsOrbiting(orbiting);
    },
    []
  );

  const handleJumpChamber = useCallback((idx: number) => {
    const ch = CHAMBERS[idx];
    if (!ch) return;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({
      top: ch.scrollAt * maxScroll,
      behavior: 'smooth',
    });
    setCameraResetNonce((n) => n + 1);
  }, []);

  const activeChamber = CHAMBERS[activeChamberIdx] ?? CHAMBERS[0];

  return (
    <div className="relative bg-[#121417] text-[#FFFFFF]">
      {/* Full-Viewport Multi-Chamber 3D Scene */}
      <MultiWorldScene
        scrollProgress={scrollProgress}
        pedestalShape={pedestalShape}
        cameraResetNonce={cameraResetNonce}
        calloutElRef={calloutElRef}
        onTelemetryUpdate={handleTelemetryUpdate}
      />

      {/* Portal Fly-Through Cyan Atmospheric Flash */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 bg-[#00FFFF]"
        style={{ opacity: portalFlash * 0.24, transition: 'opacity 60ms linear' }}
      />

      {/* Spatial 3D Callout Pin anchored to active 3D sculpture (Igloo-style leader line) */}
      <div
        ref={calloutElRef}
        className="pointer-events-none fixed top-0 left-0 z-10"
        style={{ opacity: 0 }}
      >
        <div className="flex items-start gap-2">
          <div className="mt-2 h-[1px] w-8 bg-[#00FFFF]/80" />
          <div className="border-l border-[#00FFFF]/70 pl-2.5">
            <p className="font-mono-hud text-[11px] font-medium tracking-wider text-[#FFFFFF]">
              {activeChamber.index} // {activeChamber.label}
            </p>
            <p className="font-mono-hud text-[10px] tracking-wider text-[#00FFFF]">
              {activeChamber.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Minimal Igloo-Style Sci-Fi HUD Overlay */}
      <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-6">
        {/* Top Corners */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-mono-hud text-xs tracking-wider text-[#00FFFF]">
              SYSTEM.SYNC // PHASE 02: MULTI-CHAMBER FLIGHT
            </p>
            <p className="font-mono-hud text-[11px] tracking-wider text-[#8A929A]">
              SECTOR: <span className="text-[#FFFFFF]">{activeChamber.label}</span> · DEPTH:{' '}
              <span className="text-[#00FFFF]">
                {String(Math.abs(activeChamber.chamberY)).padStart(3, '0')}M
              </span>
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-end space-y-1 text-right">
            {isOrbiting ? (
              <button
                type="button"
                onClick={() => setCameraResetNonce((n) => n + 1)}
                className="pointer-events-auto font-mono-hud text-[11px] tracking-wider text-[#FFFFFF] border border-[#00FFFF]/60 bg-[#121417]/85 px-2.5 py-1 hover:border-[#00FFFF] hover:text-[#00FFFF] transition-colors cursor-pointer"
              >
                [ RESET FLIGHT CAMERA ]
              </button>
            ) : (
              <p className="font-mono-hud text-[11px] tracking-wider text-[#8A929A]">
                SCROLL TO FLY · DRAG TO ORBIT
              </p>
            )}
          </div>
        </div>

        {/* Pedestal Morph Selector when inside Chamber 04 (matches Igloo stage switcher) */}
        {activeChamberIdx === 4 && (
          <div className="pointer-events-auto mx-auto flex items-center gap-2 border border-[#00FFFF]/35 bg-[#121417]/85 px-3 py-1.5">
            {PEDESTAL_SHAPES.map((shape) => {
              const isSelected = pedestalShape === shape.id;
              return (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => setPedestalShape(shape.id)}
                  className={`font-mono-hud text-[11px] px-2.5 py-1 transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#00FFFF]/15 text-[#00FFFF] border border-[#00FFFF]/70'
                      : 'text-[#8A929A] hover:text-[#FFFFFF] border border-transparent'
                  }`}
                >
                  {shape.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom Row: Minimal Chamber Jump Bar + Scroll % */}
        <div className="flex items-end justify-between gap-4">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
            {CHAMBERS.map((ch, idx) => {
              const isActive = idx === activeChamberIdx;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleJumpChamber(idx)}
                  className={`font-mono-hud text-[11px] px-2.5 py-1 border transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-[#00FFFF] text-[#00FFFF] bg-[#00FFFF]/10'
                      : 'border-[#8A929A]/30 text-[#8A929A] bg-[#121417]/75 hover:border-[#00FFFF]/60 hover:text-[#FFFFFF]'
                  }`}
                >
                  {ch.index}
                </button>
              );
            })}
          </div>

          <p className="font-mono-hud text-[11px] tracking-wider text-[#8A929A]">
            SCROLL {String(Math.round(scrollProgress * 100)).padStart(3, '0')}%
          </p>
        </div>
      </div>

      {/* 700vh Scroll Driver */}
      <main className="relative z-0 pointer-events-none" aria-hidden="true">
        <div className="h-[700vh]" />
      </main>
    </div>
  );
}
