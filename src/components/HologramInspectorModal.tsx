import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Copy, Send, X } from 'lucide-react';
import { ChamberConfig } from '../data/portfolioSections';
import { RESUME_DATA } from '../data/resume';
import { ScrambleText } from '../utils/scrambleText';

interface HologramInspectorModalProps {
  chamber: ChamberConfig | null;
  autoRevealAmount?: number;
  autoEnterT?: number;
  autoExitT?: number;
  onClose: () => void;
}

/**
 * Procedural Cybernetic Wireframe Face Mesh SVG displayed when no custom portrait photo
 * is linked yet in `src/data/resume.ts -> identity.avatarUrl`.
 */
const HoloBiometricSilhouette: React.FC = () => (
  <svg
    viewBox="0 0 220 260"
    className="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Calibration grid & concentric biometric rings */}
    <circle cx="110" cy="112" r="78" stroke="#00FFFF" strokeOpacity="0.16" strokeDasharray="3 4" />
    <circle cx="110" cy="112" r="56" stroke="#FFFFFF" strokeOpacity="0.12" />
    <line x1="16" y1="112" x2="204" y2="112" stroke="#00FFFF" strokeOpacity="0.18" />
    <line x1="110" y1="18" x2="110" y2="244" stroke="#00FFFF" strokeOpacity="0.18" />

    {/* Wireframe head & shoulder polygonal silhouette */}
    <path
      d="M110 42 L144 54 L158 88 L154 128 L138 158 L110 172 L82 158 L66 128 L62 88 L76 54 Z"
      stroke="#00FFFF"
      strokeWidth="1.2"
      strokeOpacity="0.85"
      fill="#00FFFF"
      fillOpacity="0.04"
    />
    {/* Faceted internal facial mesh triangles */}
    <path
      d="M76 54 L110 74 L144 54 M62 88 L90 96 L110 74 L130 96 L158 88 M66 128 L92 124 L110 144 L128 124 L154 128 M90 96 L92 124 M130 96 L128 124 M110 74 L110 144 M82 158 L110 144 L138 158"
      stroke="#00FFFF"
      strokeWidth="0.85"
      strokeOpacity="0.52"
    />
    {/* Ocular tracking markers */}
    <rect x="82" y="92" width="16" height="8" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.85" />
    <rect x="122" y="92" width="16" height="8" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.85" />
    <circle cx="90" cy="96" r="1.8" fill="#00FFFF" />
    <circle cx="130" cy="96" r="1.8" fill="#00FFFF" />

    {/* Shoulders / collar structural frame */}
    <path
      d="M36 244 L56 196 L90 182 L110 192 L130 182 L164 196 L184 244"
      stroke="#FFFFFF"
      strokeWidth="1.1"
      strokeOpacity="0.55"
    />
    <path
      d="M90 182 L94 166 M130 182 L126 166 M56 196 L110 218 L164 196"
      stroke="#00FFFF"
      strokeWidth="0.85"
      strokeOpacity="0.4"
    />
  </svg>
);

export const HologramInspectorModal: React.FC<HologramInspectorModalProps> = ({
  chamber,
  autoRevealAmount = 0,
  autoEnterT = 0,
  autoExitT = 0,
  onClose,
}) => {
  const [selectedProjIdx, setSelectedProjIdx] = useState(0);
  const [irisTab, setIrisTab] = useState<'projects' | 'experience'>('projects');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setAvatarFailed(false);
  }, [RESUME_DATA.identity.avatarUrl]);

  useEffect(() => {
    if (!chamber) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chamber, onClose]);

  const isScrollDriven = !chamber && autoRevealAmount > 0.01;
  if (!chamber && !isScrollDriven) return null;

  const activeSectionId: ChamberConfig['id'] = chamber ? chamber.id : 'drift';
  const activeHudTitle = chamber ? chamber.hudTitle : 'NEURAL CORE · CH.02';
  const activeSectionTag = chamber ? chamber.sectionTag : 'ABOUT ME // INSIDE CHOSEN BLOCK';
  const activeProj = RESUME_DATA.projects[selectedProjIdx] ?? RESUME_DATA.projects[0];
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.email.trim() || !formState.message.trim()) {
      setFormError('ALL FIELDS REQUIRED FOR TRANSMISSION');
      return;
    }
    setFormError(null);
    setSubmitted(true);
  };

  const scrollCardStyle: React.CSSProperties | undefined = isScrollDriven
    ? {
        opacity: autoRevealAmount,
        transform: `translate3d(0, ${((1 - autoEnterT) * 18 - autoExitT * 14).toFixed(1)}px, 0) scale(${(
          0.94 +
          0.06 * autoEnterT +
          0.03 * autoExitT
        ).toFixed(4)})`,
        willChange: 'transform, opacity',
      }
    : undefined;

  return (
    <div
      role="dialog"
      aria-modal={!isScrollDriven}
      className={`fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 md:p-8 ${
        isScrollDriven ? 'pointer-events-none' : 'pointer-events-auto bg-[#090C10]/32'
      }`}
      onClick={!isScrollDriven ? onClose : undefined}
    >
      {/* Translucent crystalline HUD card hovering directly over the live 3D WebGL scene */}
      <div
        key={isScrollDriven ? 'scroll-about' : chamber?.id}
        style={scrollCardStyle}
        className={`${isScrollDriven ? 'pointer-events-none max-lg:max-h-[86vh] max-lg:overflow-y-auto' : 'holo-window-enter pointer-events-auto max-h-[90vh] overflow-y-auto'} relative w-full max-w-5xl border border-[#8A929A]/40 bg-[#0D1116]/72 p-4 md:p-6 shadow-2xl`}
        onClick={(e) => {
          if (!isScrollDriven) e.stopPropagation();
        }}
      >
        {/* Crisp Pure Cyan Corner Reticle Brackets */}
        <span aria-hidden="true" className="absolute -top-[1px] -left-[1px] h-4 w-4 border-t-2 border-l-2 border-[#00FFFF]" />
        <span aria-hidden="true" className="absolute -top-[1px] -right-[1px] h-4 w-4 border-t-2 border-r-2 border-[#00FFFF]" />
        <span aria-hidden="true" className="absolute -bottom-[1px] -left-[1px] h-4 w-4 border-b-2 border-l-2 border-[#00FFFF]" />
        <span aria-hidden="true" className="absolute -bottom-[1px] -right-[1px] h-4 w-4 border-b-2 border-r-2 border-[#00FFFF]" />

        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#8A929A]/25 pb-3 mb-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display-hud text-base md:text-lg font-medium tracking-tight text-[#FFFFFF]">
              {RESUME_DATA.identity.name}
            </span>
            <span className="font-mono-hud text-[10px] tracking-widest text-[#00FFFF]">
              // <ScrambleText text={activeHudTitle} />
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline font-mono-hud text-[11px] tracking-wider text-[#8A929A]">
              <ScrambleText text={activeSectionTag} durationMs={320} />
            </span>
            <button
              type="button"
              onClick={onClose}
              className="pointer-events-auto inline-flex items-center gap-1.5 border border-[#00FFFF]/45 bg-[#121417]/80 px-2.5 py-1 font-mono-hud text-[11px] text-[#00FFFF] hover:bg-[#00FFFF]/15 transition-colors cursor-pointer"
            >
              CLOSE
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CH.01 & CH.02 (AUTO-SCROLL ABOUT ME) -> CREATIVE IDENTITY CARD + FACE */}
        {/* ===================================================================== */}
        {(activeSectionId === 'summit' || activeSectionId === 'drift') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* LEFT: Holographic Biometric Face Portrait Slot */}
            <div className="lg:col-span-4 flex flex-col justify-between border border-[#8A929A]/30 bg-[#0A0E13]/72 p-3.5 relative">
              <span aria-hidden="true" className="absolute top-1.5 left-1.5 h-2.5 w-2.5 border-t border-l border-[#00FFFF]/70" />
              <span aria-hidden="true" className="absolute top-1.5 right-1.5 h-2.5 w-2.5 border-t border-r border-[#00FFFF]/70" />
              <span aria-hidden="true" className="absolute bottom-1.5 left-1.5 h-2.5 w-2.5 border-b border-l border-[#00FFFF]/70" />
              <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 border-b border-r border-[#00FFFF]/70" />

              <div className="flex items-center justify-between font-mono-hud text-[10px] tracking-widest text-[#8A929A] mb-2.5">
                <span className="text-[#00FFFF]">FACE_ID // 01</span>
                <span>BIOMETRIC LOCK</span>
              </div>

              <div className="relative aspect-square max-h-[275px] w-full overflow-hidden border border-[#00FFFF]/30 bg-[#06090D] group">
                {hasPhoto ? (
                  <img
                    src={RESUME_DATA.identity.avatarUrl}
                    alt={RESUME_DATA.identity.name}
                    onError={() => setAvatarFailed(true)}
                    className="h-full w-full object-cover grayscale contrast-125 brightness-95 transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center p-2">
                    <HoloBiometricSilhouette />
                  </div>
                )}

                {/* Pure Cyan Hologram Duotone + Scanlines + Animated Laser Sweep */}
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
                  className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-[#00FFFF]/25 to-transparent holo-scan-sweep"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#06090D] via-[#06090D]/60 to-transparent"
                />

                {/* Corner Crosshairs & Portrait Tag */}
                <div className="pointer-events-none absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between font-mono-hud text-[9px] tracking-wider">
                  <span className="text-[#FFFFFF]/90">{RESUME_DATA.identity.avatarCaption}</span>
                  <span className="text-[#00FFFF]">{hasPhoto ? 'PHOTO_SYNC' : 'HOLO_MESH'}</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#8A929A]/20 flex items-center justify-between gap-2 font-mono-hud text-[10px]">
                <span className="text-[#8A929A]">STATUS</span>
                <span className="text-[#00FFFF] truncate">{RESUME_DATA.identity.availability}</span>
              </div>
            </div>

            {/* CENTER: Narrative Manifesto + Vector Schematic Node Flow */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="border border-[#8A929A]/25 bg-[#0A0E13]/65 p-4 space-y-2.5">
                <p className="font-mono-hud text-[10px] tracking-widest text-[#00FFFF]">
                  SYSTEM OPERATOR // {RESUME_DATA.identity.role.toUpperCase()}
                </p>
                <h3 className="font-display-hud text-lg md:text-xl font-medium text-[#FFFFFF]">
                  {RESUME_DATA.about.headline}
                </h3>
                <p className="text-xs md:text-[13px] leading-relaxed text-[#A7B0B8]">
                  {RESUME_DATA.about.summary}
                </p>
              </div>

              {/* Schematic Connector Architecture (matching reference card SVG circuit diagram) */}
              <div className="border border-[#8A929A]/25 bg-[#0A0E13]/65 p-4 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between font-mono-hud text-[10px] tracking-widest text-[#FFFFFF] mb-3">
                  <span>CORE ARCHITECTURE</span>
                  <span className="text-[#8A929A]">NODE_TOPOLOGY</span>
                </div>

                <div className="relative grid grid-cols-12 items-center gap-2">
                  {/* Origin Node Box */}
                  <div className="col-span-4 border border-[#00FFFF]/40 bg-[#10161D]/85 p-2.5 text-center space-y-1.5">
                    <svg viewBox="0 0 64 64" className="w-10 h-10 mx-auto" fill="none" aria-hidden="true">
                      <circle cx="32" cy="32" r="24" stroke="#00FFFF" strokeOpacity="0.45" strokeDasharray="3 3" />
                      <polygon points="32,12 50,22 50,42 32,52 14,42 14,22" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1.2" />
                      <circle cx="32" cy="32" r="4" fill="#00FFFF" />
                      <line x1="32" y1="12" x2="32" y2="52" stroke="#00FFFF" strokeOpacity="0.45" />
                      <line x1="14" y1="22" x2="50" y2="42" stroke="#00FFFF" strokeOpacity="0.45" />
                      <line x1="50" y1="22" x2="14" y2="42" stroke="#00FFFF" strokeOpacity="0.45" />
                    </svg>
                    <p className="font-mono-hud text-[9px] tracking-wider text-[#FFFFFF]">
                      OPERATOR
                    </p>
                    <p className="font-mono-hud text-[8px] text-[#00FFFF]">01_KERNEL</p>
                  </div>

                  {/* Curved SVG Branch Connectors */}
                  <div className="col-span-2 h-full flex items-center justify-center">
                    <svg viewBox="0 0 60 120" className="w-full h-28" fill="none" aria-hidden="true">
                      <path d="M0 60 C28 60, 26 20, 60 20" stroke="#00FFFF" strokeOpacity="0.7" strokeWidth="1.2" />
                      <path d="M0 60 L60 60" stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="1.2" />
                      <path d="M0 60 C28 60, 26 100, 60 100" stroke="#00FFFF" strokeOpacity="0.7" strokeWidth="1.2" />
                      <circle cx="0" cy="60" r="2.5" fill="#00FFFF" />
                      <circle cx="60" cy="20" r="2" fill="#00FFFF" />
                      <circle cx="60" cy="60" r="2" fill="#FFFFFF" />
                      <circle cx="60" cy="100" r="2" fill="#00FFFF" />
                    </svg>
                  </div>

                  {/* Three Capability Target Boxes */}
                  <div className="col-span-6 space-y-2">
                    {RESUME_DATA.about.capabilities.map((cap) => (
                      <div
                        key={cap.code}
                        className="border border-[#8A929A]/35 bg-[#10161D]/80 px-2.5 py-2 hover:border-[#00FFFF]/65 transition-colors"
                      >
                        <div className="flex items-center justify-between font-mono-hud text-[9px]">
                          <span className="text-[#FFFFFF] tracking-wider">{cap.label}</span>
                          <span className="text-[#00FFFF]">{cap.code}</span>
                        </div>
                        <p className="font-mono-hud text-[9px] text-[#8A929A] mt-0.5 truncate">
                          {cap.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Performance / Identity Telemetry Column (matching reference card right panel) */}
            <div className="lg:col-span-3 flex flex-col justify-between border border-[#8A929A]/25 bg-[#0A0E13]/70 p-4">
              <div className="space-y-3">
                <p className="font-mono-hud text-[11px] tracking-[0.14em] text-[#FFFFFF]">
                  TELEMETRY
                </p>

                <div className="space-y-2 font-mono-hud text-[11px]">
                  {RESUME_DATA.about.telemetry.map((row) => (
                    <div
                      key={row.label}
                      className={`flex flex-col gap-0.5 py-1.5 px-2 ${
                        row.highlight
                          ? 'bg-gradient-to-r from-[#8A929A]/30 via-[#8A929A]/12 to-transparent border-l-2 border-[#00FFFF]'
                          : 'border-b border-[#8A929A]/15'
                      }`}
                    >
                      <span className="text-[9px] tracking-widest text-[#8A929A]">{row.label}:</span>
                      <span className="text-[11px] text-[#FFFFFF]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#8A929A]/20 space-y-2 pointer-events-auto">
                <p className="font-mono-hud text-[9px] tracking-widest text-[#8A929A]">
                  DIRECT CHANNELS
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <a
                    href={RESUME_DATA.identity.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between border border-[#8A929A]/35 px-2 py-1.5 font-mono-hud text-[10px] text-[#FFFFFF] hover:border-[#00FFFF] hover:text-[#00FFFF] transition-colors"
                  >
                    GITHUB
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                  <a
                    href={RESUME_DATA.identity.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between border border-[#8A929A]/35 px-2 py-1.5 font-mono-hud text-[10px] text-[#FFFFFF] hover:border-[#00FFFF] hover:text-[#00FFFF] transition-colors"
                  >
                    LINKEDIN
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="w-full inline-flex items-center justify-between border border-[#00FFFF]/40 bg-[#00FFFF]/8 px-2.5 py-1.5 font-mono-hud text-[10px] text-[#00FFFF] hover:bg-[#00FFFF]/15 transition-colors cursor-pointer"
                >
                  <span className="truncate">{RESUME_DATA.identity.email}</span>
                  {copiedEmail ? <Check className="w-3 h-3 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* CH.03 // THE IRIS -> PROJECTS ARCHITECTURE & EXPERIENCE TIMELINE      */}
        {/* ===================================================================== */}
        {activeSectionId === 'iris' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#8A929A]/20 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIrisTab('projects')}
                  className={`font-mono-hud text-xs px-3 py-1.5 border transition-colors cursor-pointer ${
                    irisTab === 'projects'
                      ? 'border-[#00FFFF] bg-[#00FFFF]/15 text-[#00FFFF]'
                      : 'border-[#8A929A]/30 text-[#8A929A] hover:text-[#FFFFFF]'
                  }`}
                >
                  01 // PROJECTS
                </button>
                <button
                  type="button"
                  onClick={() => setIrisTab('experience')}
                  className={`font-mono-hud text-xs px-3 py-1.5 border transition-colors cursor-pointer ${
                    irisTab === 'experience'
                      ? 'border-[#00FFFF] bg-[#00FFFF]/15 text-[#00FFFF]'
                      : 'border-[#8A929A]/30 text-[#8A929A] hover:text-[#FFFFFF]'
                  }`}
                >
                  02 // EXPERIENCE
                </button>
              </div>
            </div>

            {irisTab === 'projects' ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  {RESUME_DATA.projects.map((proj, idx) => {
                    const isActive = idx === selectedProjIdx;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => setSelectedProjIdx(idx)}
                        className={`font-mono-hud text-xs px-3 py-1.5 border transition-colors cursor-pointer ${
                          isActive
                            ? 'border-[#00FFFF] bg-[#00FFFF]/12 text-[#00FFFF]'
                            : 'border-[#8A929A]/30 text-[#8A929A] hover:border-[#00FFFF]/50 hover:text-[#FFFFFF]'
                        }`}
                      >
                        {proj.id}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-8 border border-[#8A929A]/25 bg-[#0A0E13]/70 p-5 space-y-4">
                    <div className="flex items-center justify-between font-mono-hud text-[11px] text-[#FFFFFF]">
                      <span className="tracking-widest">SYSTEM ARCHITECTURE // {activeProj.category}</span>
                      <span className="text-[#00FFFF]">{activeProj.year}</span>
                    </div>

                    <div className="border border-dashed border-[#8A929A]/30 bg-[#070A0E]/60 p-3">
                      <svg viewBox="0 0 520 120" className="w-full h-24 md:h-28" fill="none" aria-hidden="true">
                        <rect x="8" y="20" width="90" height="80" stroke="#8A929A" strokeOpacity="0.6" />
                        <circle cx="53" cy="60" r="22" stroke="#00FFFF" strokeOpacity="0.45" />
                        <line x1="35" y1="48" x2="71" y2="72" stroke="#FFFFFF" strokeOpacity="0.6" />
                        <line x1="35" y1="72" x2="71" y2="48" stroke="#00FFFF" strokeOpacity="0.6" />
                        <text x="53" y="14" textAnchor="middle" fill="#8A929A" fontSize="8" fontFamily="JetBrains Mono, monospace">
                          NEURAL INPUT
                        </text>

                        <path d="M98 44 L164 44" stroke="#FFFFFF" strokeOpacity="0.7" />
                        <path d="M98 76 C125 76, 130 88, 164 88" stroke="#00FFFF" strokeOpacity="0.7" />

                        <rect x="164" y="18" width="96" height="46" stroke="#FFFFFF" strokeOpacity="0.7" />
                        <line x1="176" y1="26" x2="248" y2="56" stroke="#00FFFF" strokeOpacity="0.55" />
                        <line x1="248" y1="26" x2="176" y2="56" stroke="#00FFFF" strokeOpacity="0.55" />
                        <text x="212" y="12" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="JetBrains Mono, monospace">
                          ATTENTION
                        </text>

                        <rect x="164" y="74" width="96" height="32" stroke="#8A929A" strokeOpacity="0.6" />
                        <text x="212" y="93" textAnchor="middle" fill="#00FFFF" fontSize="8" fontFamily="JetBrains Mono, monospace">
                          CONSENSUS
                        </text>

                        <path d="M260 40 C295 40, 305 58, 344 58" stroke="#FFFFFF" strokeOpacity="0.75" />
                        <path d="M260 90 C295 90, 305 64, 344 64" stroke="#00FFFF" strokeOpacity="0.75" />

                        <rect x="344" y="20" width="164" height="80" stroke="#8A929A" strokeOpacity="0.65" />
                        <rect x="360" y="38" width="54" height="42" stroke="#00FFFF" strokeOpacity="0.6" />
                        <rect x="434" y="38" width="54" height="42" stroke="#FFFFFF" strokeOpacity="0.55" />
                        <line x1="414" y1="59" x2="434" y2="59" stroke="#00FFFF" strokeOpacity="0.8" />
                        <text x="426" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="JetBrains Mono, monospace">
                          NODE INFRASTRUCTURE
                        </text>
                      </svg>
                    </div>

                    <div>
                      <h3 className="font-display-hud text-lg font-medium text-[#FFFFFF]">{activeProj.title}</h3>
                      <p className="text-sm leading-relaxed text-[#A7B0B8] mt-1">{activeProj.summary}</p>
                    </div>

                    <div className="pt-2.5 border-t border-[#8A929A]/20 font-mono-hud text-xs text-[#FFFFFF]">
                      STACK: <span className="text-[#00FFFF]">{activeProj.stack}</span>
                    </div>
                  </div>

                  <div className="md:col-span-4 border border-[#8A929A]/25 bg-[#0A0E13]/70 p-5 space-y-4">
                    <p className="font-mono-hud text-xs tracking-[0.14em] text-[#FFFFFF]">
                      PERFORMANCE
                    </p>
                    <div className="space-y-3 font-mono-hud text-xs">
                      <div className="flex justify-between items-center bg-gradient-to-r from-[#8A929A]/35 via-[#8A929A]/14 to-transparent px-2.5 py-2 border-l-2 border-[#00FFFF]">
                        <span className="text-[#8A929A]">LATENCY:</span>
                        <span className="text-[#FFFFFF]">{activeProj.latency}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#8A929A]/15 pb-2 px-1">
                        <span className="text-[#8A929A]">THROUGHPUT:</span>
                        <span className="text-[#FFFFFF]">{activeProj.throughput}</span>
                      </div>
                      <div className="flex justify-between px-1">
                        <span className="text-[#8A929A]">EFFICIENCY:</span>
                        <span className="text-[#00FFFF]">{activeProj.efficiency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {RESUME_DATA.experience.map((exp) => (
                  <div
                    key={exp.company}
                    className="border border-[#8A929A]/25 bg-[#0A0E13]/70 p-4 grid grid-cols-1 md:grid-cols-12 gap-4 hover:border-[#00FFFF]/40 transition-colors"
                  >
                    <div className="md:col-span-4 space-y-1">
                      <p className="font-mono-hud text-xs text-[#00FFFF]">{exp.period}</p>
                      <p className="font-display-hud text-sm font-medium text-[#FFFFFF]">{exp.role}</p>
                      <p className="font-mono-hud text-[11px] text-[#8A929A]">{exp.company}</p>
                    </div>
                    <div className="md:col-span-8 space-y-2">
                      <p className="text-xs leading-relaxed text-[#A7B0B8]">{exp.detail}</p>
                      <p className="font-mono-hud text-[11px] text-[#FFFFFF]">{exp.stack}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* CH.04 // THE PEDESTAL -> CONTACT UPLINK TERMINAL                       */}
        {/* ===================================================================== */}
        {activeSectionId === 'pedestal' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-4">
              <p className="font-mono-hud text-xs text-[#00FFFF]">DIRECT CHANNEL</p>
              <p className="text-sm leading-relaxed text-[#A7B0B8]">
                {RESUME_DATA.identity.manifesto}
              </p>

              <div className="flex items-center justify-between gap-2 border border-[#8A929A]/30 bg-[#0A0E13] px-3 py-2.5">
                <span className="font-mono-hud text-xs text-[#FFFFFF] truncate">
                  {RESUME_DATA.identity.email}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1 font-mono-hud text-[11px] text-[#00FFFF] hover:text-white cursor-pointer shrink-0"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> COPIED
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> COPY
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="md:col-span-7">
              {submitted ? (
                <div className="border border-[#00FFFF]/50 bg-[#00FFFF]/10 p-5 space-y-2">
                  <p className="font-mono-hud text-xs text-[#00FFFF]">TRANSMISSION LOGGED</p>
                  <p className="text-sm text-[#FFFFFF]">
                    Thank you, {formState.name}. Your message has been queued.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormState({ name: '', email: '', message: '' });
                    }}
                    className="font-mono-hud text-xs text-[#00FFFF] underline cursor-pointer pt-1"
                  >
                    NEW TRANSMISSION
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="NAME"
                      value={formState.name}
                      onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                      className="w-full border border-[#8A929A]/30 bg-[#0A0E13] px-3 py-2 font-mono-hud text-xs text-[#FFFFFF] placeholder:text-[#8A929A] focus:border-[#00FFFF] focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="EMAIL"
                      value={formState.email}
                      onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                      className="w-full border border-[#8A929A]/30 bg-[#0A0E13] px-3 py-2 font-mono-hud text-xs text-[#FFFFFF] placeholder:text-[#8A929A] focus:border-[#00FFFF] focus:outline-none"
                    />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="MESSAGE PAYLOAD..."
                    value={formState.message}
                    onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                    className="w-full border border-[#8A929A]/30 bg-[#0A0E13] px-3 py-2 font-mono-hud text-xs text-[#FFFFFF] placeholder:text-[#8A929A] focus:border-[#00FFFF] focus:outline-none resize-none"
                  />
                  {formError && <p className="font-mono-hud text-[11px] text-[#00FFFF]">{formError}</p>}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 border border-[#00FFFF] bg-[#00FFFF]/15 px-4 py-2 font-mono-hud text-xs text-[#00FFFF] hover:bg-[#00FFFF]/25 transition-colors cursor-pointer"
                    >
                      TRANSMIT
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
