import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  Github,
  Linkedin,
  Mail,
  MessageSquare,
  Phone,
  Send,
} from 'lucide-react';
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

const PEDESTAL_MODES: {
  id: PedestalMode;
  label: string;
  preview: string;
}[] = [
  { id: 'email', label: 'Email', preview: RESUME_DATA.identity.email },
  { id: 'github', label: 'GitHub', preview: RESUME_DATA.identity.githubHandle },
  { id: 'linkedin', label: 'LinkedIn', preview: RESUME_DATA.identity.linkedinHandle },
  { id: 'contact', label: 'Phone & Form', preview: RESUME_DATA.identity.phone },
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
  const [copiedField, setCopiedField] = useState<'email' | 'phone' | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [messageText, setMessageText] = useState('');
  const [formError, setFormError] = useState('');
  const [formSent, setFormSent] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [RESUME_DATA.identity.avatarUrl]);

  if (!activeCard || revealAmount <= 0.01) return null;

  const hasPhoto = Boolean(RESUME_DATA.identity.avatarUrl.trim()) && !avatarFailed;

  const handleCopy = async (field: 'email' | 'phone', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = senderEmail.trim();
    const trimmedMsg = messageText.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!trimmedMsg) {
      setFormError('Please enter a short message.');
      return;
    }
    setFormError('');
    setFormSent(true);

    const subject = encodeURIComponent(`Portfolio Inquiry from ${trimmedEmail}`);
    const body = encodeURIComponent(`From: ${trimmedEmail}\n\n${trimmedMsg}`);
    window.location.href = `mailto:${RESUME_DATA.identity.email}?subject=${subject}&body=${body}`;
  };

  if (activeCard === 'contact') {
    const activeFigure = RESUME_DATA.stageFigures[pedestalMode];
    const telHref = `tel:${RESUME_DATA.identity.phone.replace(/[^\d+]/g, '')}`;

    return (
      <div
        aria-live="polite"
        style={{
          opacity: revealAmount,
          transform: `translate3d(0, ${((1 - enterT) * 16).toFixed(1)}px, 0)`,
          willChange: 'transform, opacity',
        }}
        className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between px-4 pt-16 pb-16 sm:px-8 sm:pt-20 sm:pb-16"
      >
        {/* Top/Center Focal Stage: Bold Contact Panel Anchored Inside the Active 3D Figure */}
        <div className="flex-1 flex items-center justify-center">
          <div className="pointer-events-auto relative w-full max-w-[460px] border border-[#00FFFF]/60 bg-[#05090E]/62 backdrop-blur-[6px] p-5 sm:p-6 shadow-[0_0_52px_rgba(0,255,255,0.18)]">
            <span aria-hidden="true" className="absolute -top-[1px] -left-[1px] h-3.5 w-3.5 border-t-2 border-l-2 border-[#00FFFF]" />
            <span aria-hidden="true" className="absolute -top-[1px] -right-[1px] h-3.5 w-3.5 border-t-2 border-r-2 border-[#00FFFF]" />
            <span aria-hidden="true" className="absolute -bottom-[1px] -left-[1px] h-3.5 w-3.5 border-b-2 border-l-2 border-[#00FFFF]" />
            <span aria-hidden="true" className="absolute -bottom-[1px] -right-[1px] h-3.5 w-3.5 border-b-2 border-r-2 border-[#00FFFF]" />

            {pedestalMode === 'email' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-[#00FFFF]">
                    <Mail className="w-4 h-4" />
                    <span>{activeFigure.title}</span>
                  </div>
                  <span className="font-mono-hud text-[11px] text-[#B8C4D0]">
                    {RESUME_DATA.identity.availability}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="font-display-hud text-xl sm:text-2xl font-semibold tracking-tight text-[#FFFFFF] break-all">
                    {RESUME_DATA.identity.email}
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#CBD5E1]">
                    {activeFigure.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <a
                    href={`mailto:${RESUME_DATA.identity.email}`}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 bg-[#00FFFF] px-4 py-2.5 text-sm font-semibold text-[#060A0F] hover:bg-[#D8FFFF] transition-colors focus-visible:outline-2 focus-visible:outline-[#FFFFFF]"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="whitespace-nowrap">Send Email</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy('email', RESUME_DATA.identity.email)}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-[#00FFFF]/65 bg-[#0A131C]/90 px-4 py-2.5 text-sm font-medium text-[#FFFFFF] hover:border-[#00FFFF] hover:text-[#00FFFF] transition-colors cursor-pointer"
                  >
                    {copiedField === 'email' ? (
                      <>
                        <Check className="w-4 h-4 text-[#00FFFF]" />
                        <span className="whitespace-nowrap">Copied Address</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="whitespace-nowrap">Copy Address</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {pedestalMode === 'github' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-[#00FFFF]">
                    <Github className="w-4 h-4" />
                    <span>{activeFigure.title}</span>
                  </div>
                  <span className="font-mono-hud text-[11px] text-[#B8C4D0]">Open Source</span>
                </div>

                <div className="space-y-1.5">
                  <p className="font-display-hud text-2xl sm:text-3xl font-semibold tracking-tight text-[#FFFFFF]">
                    {RESUME_DATA.identity.githubHandle}
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#CBD5E1]">
                    {activeFigure.description}
                  </p>
                </div>

                <a
                  href={RESUME_DATA.identity.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 bg-[#00FFFF] px-5 py-3 text-sm font-semibold text-[#060A0F] hover:bg-[#D8FFFF] transition-colors focus-visible:outline-2 focus-visible:outline-[#FFFFFF]"
                >
                  <Github className="w-4 h-4" />
                  <span className="whitespace-nowrap">Open GitHub Profile</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            )}

            {pedestalMode === 'linkedin' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-[#00FFFF]">
                    <Linkedin className="w-4 h-4" />
                    <span>{activeFigure.title}</span>
                  </div>
                  <span className="font-mono-hud text-[11px] text-[#B8C4D0]">
                    {RESUME_DATA.identity.linkedinHandle}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="font-display-hud text-2xl sm:text-3xl font-semibold tracking-tight text-[#FFFFFF]">
                    {RESUME_DATA.identity.name}
                  </p>
                  <p className="text-xs sm:text-sm text-[#D8FFFF]">
                    {RESUME_DATA.identity.role} · {RESUME_DATA.identity.location}
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#CBD5E1]">
                    {activeFigure.description}
                  </p>
                </div>

                <a
                  href={RESUME_DATA.identity.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 bg-[#00FFFF] px-5 py-3 text-sm font-semibold text-[#060A0F] hover:bg-[#D8FFFF] transition-colors focus-visible:outline-2 focus-visible:outline-[#FFFFFF]"
                >
                  <Linkedin className="w-4 h-4" />
                  <span className="whitespace-nowrap">Connect on LinkedIn</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            )}

            {pedestalMode === 'contact' && (
              <div className="space-y-3.5">
                {/* Bold Direct Phone Number Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border border-[#00FFFF]/45 bg-[#0A131C]/90 px-3.5 py-2.5">
                  <a
                    href={telHref}
                    className="inline-flex items-center gap-2.5 text-base sm:text-lg font-semibold text-[#FFFFFF] hover:text-[#00FFFF] transition-colors font-mono-hud"
                  >
                    <Phone className="w-4 h-4 text-[#00FFFF] shrink-0" />
                    <span>{RESUME_DATA.identity.phone}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy('phone', RESUME_DATA.identity.phone)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-[#00FFFF]/40 text-[#00FFFF] hover:bg-[#00FFFF]/15 transition-colors cursor-pointer"
                  >
                    {copiedField === 'phone' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>

                {formSent ? (
                  <div className="border border-[#00FFFF]/50 bg-[#0A1922]/90 p-4 space-y-3 text-center">
                    <p className="text-sm font-semibold text-[#FFFFFF]">
                      Message prepared for {RESUME_DATA.identity.name}
                    </p>
                    <p className="text-xs text-[#CBD5E1]">
                      Your email draft opened. You can also reach me directly at{' '}
                      <span className="text-[#00FFFF]">{RESUME_DATA.identity.email}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFormSent(false);
                        setMessageText('');
                      }}
                      className="inline-flex min-h-[40px] items-center justify-center border border-[#00FFFF]/60 px-4 py-2 text-xs font-medium text-[#00FFFF] hover:bg-[#00FFFF]/15 transition-colors cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-2.5" noValidate>
                    <div>
                      <label htmlFor="contact-email" className="sr-only">
                        Your Email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="Your email address"
                        className="w-full min-h-[42px] border border-[#8A929A]/45 bg-[#090F17]/95 px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#8A929A] focus:border-[#00FFFF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-message" className="sr-only">
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        rows={2}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Write your message or project inquiry..."
                        className="w-full border border-[#8A929A]/45 bg-[#090F17]/95 px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#8A929A] focus:border-[#00FFFF] focus:outline-none resize-none"
                      />
                    </div>
                    {formError && (
                      <p className="text-xs font-medium text-[#00FFFF]" role="alert">
                        {formError}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 bg-[#00FFFF] px-4 py-2.5 text-sm font-semibold text-[#060A0F] hover:bg-[#D8FFFF] transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Big, Noticeable Bottom Figure & Contact Switcher Buttons */}
        <div className="pointer-events-auto mx-auto w-full max-w-[780px] pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {PEDESTAL_MODES.map((m) => {
              const isActive = pedestalMode === m.id;
              const Icon =
                m.id === 'email'
                  ? Mail
                  : m.id === 'github'
                    ? Github
                    : m.id === 'linkedin'
                      ? Linkedin
                      : MessageSquare;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectPedestalMode(m.id)}
                  aria-pressed={isActive}
                  className={`flex min-h-[58px] items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#00FFFF] ${
                    isActive
                      ? 'border-2 border-[#00FFFF] bg-[#0B1E28]/92 text-[#FFFFFF] shadow-[0_0_24px_rgba(0,255,255,0.28)]'
                      : 'border border-[#8A929A]/45 bg-[#080C12]/88 text-[#D6E0E8] hover:border-[#00FFFF]/80 hover:bg-[#0B141D]/92 hover:text-[#FFFFFF]'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-[#00FFFF]' : 'text-[#8A929A]'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap truncate">
                      {m.label}
                    </p>
                    <p
                      className={`font-mono-hud text-[10px] truncate ${
                        isActive ? 'text-[#D8FFFF]' : 'text-[#8A929A]'
                      }`}
                    >
                      {m.preview}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const cardWidthClass =
    activeCard === 'work'
      ? 'w-full md:w-[46%] lg:w-[43%] max-w-[530px]'
      : 'w-full md:w-[45%] lg:w-[42%] max-w-[490px]';

  const isWorkLeft = activeCard === 'work';

  const wrapperAlignClass = isWorkLeft
    ? 'justify-center md:justify-start md:pl-8 lg:pl-12'
    : 'justify-center md:justify-end md:pr-8 lg:pr-12';

  const animStyle: React.CSSProperties = {
    opacity: revealAmount,
    transform: isWorkLeft
      ? `translate3d(${(-(1 - enterT) * 22 - exitT * 18).toFixed(1)}px, 0, 0) scale(${(
          0.96 +
          0.04 * enterT +
          0.015 * exitT
        ).toFixed(4)})`
      : `translate3d(${((1 - enterT) * 22 - exitT * 18).toFixed(1)}px, 0, 0) scale(${(
          0.96 +
          0.04 * enterT +
          0.015 * exitT
        ).toFixed(4)})`,
    willChange: 'transform, opacity',
  };

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed inset-0 z-30 flex items-center ${wrapperAlignClass} p-4 sm:p-6`}
    >
      <div
        style={animStyle}
        className={`pointer-events-none relative ${cardWidthClass} border border-[#00FFFF]/35 bg-[#080C12]/84 backdrop-blur-md ${
          activeCard === 'work' ? 'p-4 md:p-5' : 'p-5 md:p-6'
        } shadow-[0_14px_48px_rgba(0,0,0,0.78)]`}
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
        {/* CH.03 // WORK — Right-Half Docked Card (3D Figure on Left Half)   */}
        {/* ================================================================= */}
        {activeCard === 'work' && (
          <div className="space-y-2.5">
            {/* Selected Systems */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-[#8A929A]/25 pb-1">
                <p className="font-mono-hud text-[10px] tracking-widest text-[#00FFFF]">
                  SELECTED SYSTEMS
                </p>
                <span className="font-mono-hud text-[9px] tracking-wider text-[#8A929A]">
                  CH.03 // WORK
                </span>
              </div>
              <div className="space-y-1.5">
                {RESUME_DATA.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="border border-[#8A929A]/25 bg-[#090D12]/80 px-2.5 py-1.5 space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display-hud text-xs font-medium text-[#FFFFFF]">
                        {proj.title}
                      </span>
                      <span className="font-mono-hud text-[9.5px] text-[#00FFFF] shrink-0">
                        {proj.latency} · {proj.throughput}
                      </span>
                    </div>
                    <p className="text-[10.5px] leading-snug text-[#B8C2CC]">{proj.summary}</p>
                    <p className="font-mono-hud text-[8.5px] text-[#8A929A]">{proj.stack}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Career Timeline */}
            <div className="space-y-1.5">
              <p className="font-mono-hud text-[10px] tracking-widest text-[#00FFFF] border-b border-[#8A929A]/25 pb-1">
                EXPERIENCE
              </p>
              <div className="space-y-1.5">
                {RESUME_DATA.experience.map((exp) => (
                  <div
                    key={exp.company}
                    className="border border-[#8A929A]/25 bg-[#090D12]/80 px-2.5 py-1.5 space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2 font-mono-hud text-[8.5px]">
                      <span className="text-[#00FFFF]">{exp.period}</span>
                      <span className="text-[#8A929A] truncate">{exp.company}</span>
                    </div>
                    <p className="font-display-hud text-xs font-medium text-[#FFFFFF]">
                      {exp.role}
                    </p>
                    <p className="text-[10.5px] leading-snug text-[#B8C2CC]">{exp.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
