import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { RESUME_DATA } from '../data/resume';
import { PedestalMode } from '../three/detailedChambers';

export type ScrollCardKind = 'about' | 'work' | 'contact';

interface HologramInspectorModalProps {
  activeCard: ScrollCardKind | null;
  revealAmount: number;
  enterT: number;
  exitT: number;
  pedestalMode: PedestalMode;
  onSelectPedestalMode: (mode: PedestalMode) => void;
}

const PEDESTAL_MODES: { id: PedestalMode; label: string }[] = [
  { id: 'blockchain', label: 'BLOCKCHAIN' },
  { id: 'neural', label: 'NEURAL' },
  { id: 'helix', label: 'HELIX' },
];

/**
 * Compact Cybernetic Wireframe Face SVG displayed inside the top-left portrait badge
 * until `avatarUrl` is set in `src/data/resume.ts`.
 */
const HoloFaceBadge: React.FC = () => (
  <svg
    viewBox="0 0 100 100"
    className="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="50" cy="44" r="34" stroke="#00FFFF" strokeOpacity="0.22" strokeDasharray="2 3" />
    <line x1="8" y1="44" x2="92" y2="44" stroke="#00FFFF" strokeOpacity="0.18" />
    <line x1="50" y1="8" x2="50" y2="92" stroke="#00FFFF" strokeOpacity="0.18" />
    <path
      d="M50 18 L66 25 L72 42 L70 59 L62 72 L50 78 L38 72 L30 59 L28 42 L34 25 Z"
      stroke="#00FFFF"
      strokeWidth="1.3"
      strokeOpacity="0.9"
      fill="#00FFFF"
      fillOpacity="0.06"
    />
    <path
      d="M34 25 L50 34 L66 25 M28 42 L41 46 L50 34 L59 46 L72 42 M30 59 L42 57 L50 66 L58 57 L70 59 M50 34 L50 66"
      stroke="#00FFFF"
      strokeWidth="0.9"
      strokeOpacity="0.55"
    />
    <rect x="36" y="42" width="9" height="5" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.85" />
    <rect x="55" y="42" width="9" height="5" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.85" />
    <circle cx="40.5" cy="44.5" r="1.3" fill="#00FFFF" />
    <circle cx="59.5" cy="44.5" r="1.3" fill="#00FFFF" />
    <path
      d="M18 96 L28 82 L42 77 L50 82 L58 77 L72 82 L82 96"
      stroke="#FFFFFF"
      strokeWidth="1.1"
      strokeOpacity="0.55"
    />
  </svg>
);

export const HologramInspectorModal: React.FC<HologramInspectorModalProps> = ({
  activeCard,
  revealAmount,
  enterT,
  exitT,
  pedestalMode,
  onSelectPedestalMode,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [RESUME_DATA.identity.avatarUrl]);

  if (!activeCard || revealAmount <= 0.01) return null;

  const hasPhoto = Boolean(RESUME_DATA.identity.avatarUrl.trim()) && !avatarFailed;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(RESUME_DATA.identity.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      setCopiedEmail(false);
    }
  };

  const cardWidthClass =
    activeCard === 'work'
      ? 'max-w-3xl'
      : activeCard === 'about'
        ? 'max-w-xl'
        : 'max-w-lg';

  const animStyle: React.CSSProperties = {
    opacity: revealAmount,
    transform: `translate3d(0, ${((1 - enterT) * 16 - exitT * 14).toFixed(1)}px, 0) scale(${(
      0.95 +
      0.05 * enterT +
      0.025 * exitT
    ).toFixed(4)})`,
    willChange: 'transform, opacity',
  };

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        style={animStyle}
        className={`pointer-events-none relative w-full ${cardWidthClass} border border-[#00FFFF]/35 bg-[#080C12]/84 backdrop-blur-md p-5 md:p-6 shadow-[0_14px_48px_rgba(0,0,0,0.78)]`}
      >
        {/* Crisp Pure Cyan Corner Reticles */}
        <span aria-hidden="true" className="absolute -top-[1px] -left-[1px] h-3.5 w-3.5 border-t-2 border-l-2 border-[#00FFFF]" />
        <span aria-hidden="true" className="absolute -top-[1px] -right-[1px] h-3.5 w-3.5 border-t-2 border-r-2 border-[#00FFFF]" />
        <span aria-hidden="true" className="absolute -bottom-[1px] -left-[1px] h-3.5 w-3.5 border-b-2 border-l-2 border-[#00FFFF]" />
        <span aria-hidden="true" className="absolute -bottom-[1px] -right-[1px] h-3.5 w-3.5 border-b-2 border-r-2 border-[#00FFFF]" />

        {/* ================================================================= */}
        {/* CH.02 // ABOUT ME — Top-Left Portrait + Name + Location + Bio      */}
        {/* ================================================================= */}
        {activeCard === 'about' && (
          <div className="space-y-4">
            {/* Top-Left Compact Biometric Face ID + Identity Header */}
            <div className="flex items-center gap-4 border-b border-[#8A929A]/25 pb-4">
              <div className="relative h-20 w-20 sm:h-[86px] sm:w-[86px] shrink-0 overflow-hidden border border-[#00FFFF]/55 bg-[#06090D]">
                {hasPhoto ? (
                  <img
                    src={RESUME_DATA.identity.avatarUrl}
                    alt={RESUME_DATA.identity.name}
                    onError={() => setAvatarFailed(true)}
                    className="h-full w-full object-cover grayscale contrast-125 brightness-95"
                  />
                ) : (
                  <HoloFaceBadge />
                )}

                {/* Pure Cyan Hologram Concept Tint + Scanlines + Vertical Sweep */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[#00FFFF]/14 mix-blend-screen"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 holo-scanlines opacity-75"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-transparent via-[#00FFFF]/30 to-transparent holo-scan-sweep"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0.5 right-1 font-mono-hud text-[8px] tracking-wider text-[#00FFFF]"
                >
                  {RESUME_DATA.identity.avatarCaption}
                </span>
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display-hud text-xl sm:text-2xl font-medium tracking-tight text-[#FFFFFF] truncate">
                    {RESUME_DATA.identity.name}
                  </h2>
                  <span className="font-mono-hud text-[10px] tracking-widest text-[#00FFFF] border border-[#00FFFF]/50 bg-[#00FFFF]/12 px-2.5 py-0.5 shrink-0">
                    {RESUME_DATA.identity.availability}
                  </span>
                </div>
                <p className="font-mono-hud text-xs text-[#D8FFFF]/90 truncate">
                  {RESUME_DATA.identity.role}
                </p>
                <p className="font-mono-hud text-[11px] tracking-wider text-[#9CA6B0]">
                  {RESUME_DATA.identity.location}
                </p>
              </div>
            </div>

            {/* Clean, High-Contrast Bio Description */}
            <p className="text-sm sm:text-[15px] leading-relaxed text-[#E8F0F4]">
              {RESUME_DATA.about.summary}
            </p>
          </div>
        )}

        {/* ================================================================= */}
        {/* CH.03 // WORK — Scannable Projects & Experience Side-by-Side      */}
        {/* ================================================================= */}
        {activeCard === 'work' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left: Featured Systems */}
            <div className="md:col-span-7 space-y-2.5">
              <p className="font-mono-hud text-[10px] tracking-widest text-[#00FFFF]">
                SELECTED SYSTEMS
              </p>
              <div className="space-y-2">
                {RESUME_DATA.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="border border-[#8A929A]/25 bg-[#090D12]/80 px-3 py-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display-hud text-sm font-medium text-[#FFFFFF]">
                        {proj.title}
                      </span>
                      <span className="font-mono-hud text-[10px] text-[#00FFFF] shrink-0">
                        {proj.latency} · {proj.throughput}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-[#A7B0B8]">{proj.summary}</p>
                    <p className="font-mono-hud text-[9px] text-[#8A929A]">{proj.stack}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Career Timeline */}
            <div className="md:col-span-5 space-y-2.5">
              <p className="font-mono-hud text-[10px] tracking-widest text-[#00FFFF]">
                EXPERIENCE
              </p>
              <div className="space-y-2">
                {RESUME_DATA.experience.map((exp) => (
                  <div
                    key={exp.company}
                    className="border border-[#8A929A]/25 bg-[#090D12]/80 px-3 py-2.5 space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2 font-mono-hud text-[9px]">
                      <span className="text-[#00FFFF]">{exp.period}</span>
                      <span className="text-[#8A929A] truncate">{exp.company}</span>
                    </div>
                    <p className="font-display-hud text-xs font-medium text-[#FFFFFF]">
                      {exp.role}
                    </p>
                    <p className="text-[11px] leading-snug text-[#A7B0B8]">{exp.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* CH.04 // CONTACT — Direct Uplink & Pedestal Mode Switcher         */}
        {/* ================================================================= */}
        {activeCard === 'contact' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#8A929A]/20 pb-3">
              <div>
                <p className="font-mono-hud text-[10px] tracking-widest text-[#00FFFF]">
                  DIRECT UPLINK // {RESUME_DATA.identity.availability}
                </p>
                <h2 className="font-display-hud text-lg font-medium text-[#FFFFFF] mt-0.5">
                  {RESUME_DATA.identity.name}
                </h2>
              </div>
              <span className="font-mono-hud text-[10px] text-[#8A929A]">
                {RESUME_DATA.identity.location}
              </span>
            </div>

            <div className="pointer-events-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={handleCopyEmail}
                className="flex-1 flex items-center justify-between border border-[#00FFFF]/50 bg-[#00FFFF]/10 px-3 py-2 font-mono-hud text-xs text-[#00FFFF] hover:bg-[#00FFFF]/20 transition-colors cursor-pointer"
              >
                <span className="truncate">{RESUME_DATA.identity.email}</span>
                <span className="inline-flex items-center gap-1 ml-2 shrink-0 text-[10px]">
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> COPIED
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> COPY
                    </>
                  )}
                </span>
              </button>
              <a
                href={RESUME_DATA.identity.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 border border-[#8A929A]/35 px-3 py-2 font-mono-hud text-xs text-[#FFFFFF] hover:border-[#00FFFF] hover:text-[#00FFFF] transition-colors"
              >
                GITHUB <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={RESUME_DATA.identity.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 border border-[#8A929A]/35 px-3 py-2 font-mono-hud text-xs text-[#FFFFFF] hover:border-[#00FFFF] hover:text-[#00FFFF] transition-colors"
              >
                LINKEDIN <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#8A929A]/20">
              <span className="font-mono-hud text-[9px] tracking-widest text-[#8A929A]">
                STAGE HOLOGRAM
              </span>
              <div className="flex items-center gap-1.5">
                {PEDESTAL_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectPedestalMode(m.id)}
                    className={`font-mono-hud text-[10px] px-2 py-0.5 border transition-colors cursor-pointer ${
                      pedestalMode === m.id
                        ? 'border-[#00FFFF] bg-[#00FFFF]/15 text-[#00FFFF]'
                        : 'border-[#8A929A]/30 text-[#8A929A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
