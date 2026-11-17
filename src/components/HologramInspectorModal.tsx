import React, { useEffect, useState } from 'react';
import { Check, Copy, Send, X } from 'lucide-react';
import { ChamberConfig, PLACEHOLDER_PORTFOLIO } from '../data/portfolioSections';
import { ScrambleText } from '../utils/scrambleText';

interface HologramInspectorModalProps {
  chamber: ChamberConfig | null;
  onClose: () => void;
}

export const HologramInspectorModal: React.FC<HologramInspectorModalProps> = ({
  chamber,
  onClose,
}) => {
  const [selectedProjIdx, setSelectedProjIdx] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!chamber) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chamber, onClose]);

  if (!chamber) return null;

  const activeProj = PLACEHOLDER_PORTFOLIO.projects[selectedProjIdx] ?? PLACEHOLDER_PORTFOLIO.projects[0];

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PLACEHOLDER_PORTFOLIO.email);
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-[#0B0D10]/70 p-4 md:p-8"
      onClick={onClose}
    >
      {/* Corner-bracketed holographic HUD panel matching Frame 00:04 of the reference video */}
      <div
        className="relative w-full max-w-4xl border border-[#00FFFF]/35 bg-[#121417]/94 p-6 md:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Crisp Pure Cyan Corner Reticle Brackets */}
        <span aria-hidden="true" className="absolute -top-[1px] -left-[1px] h-4 w-4 border-t-2 border-l-2 border-[#00FFFF]" />
        <span aria-hidden="true" className="absolute -top-[1px] -right-[1px] h-4 w-4 border-t-2 border-r-2 border-[#00FFFF]" />
        <span aria-hidden="true" className="absolute -bottom-[1px] -left-[1px] h-4 w-4 border-b-2 border-l-2 border-[#00FFFF]" />
        <span aria-hidden="true" className="absolute -bottom-[1px] -right-[1px] h-4 w-4 border-b-2 border-r-2 border-[#00FFFF]" />

        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 border-b border-[#8A929A]/25 pb-4 mb-6">
          <div>
            <p className="font-mono-hud text-[11px] tracking-widest text-[#00FFFF] mb-1">
              <ScrambleText text={chamber.hudTitle} />
            </p>
            <h2 className="font-mono-hud text-lg md:text-xl font-medium tracking-wider text-[#FFFFFF]">
              <ScrambleText text={chamber.sectionTag} />
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 border border-[#00FFFF]/40 px-3 py-1.5 font-mono-hud text-[11px] text-[#00FFFF] hover:bg-[#00FFFF]/10 transition-colors cursor-pointer"
          >
            CLOSE
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CH.01 // SUMMIT -> Identity & About Me */}
        {chamber.id === 'summit' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-4">
              <p className="font-mono-hud text-xs tracking-wider text-[#00FFFF]">
                IDENTITY // {PLACEHOLDER_PORTFOLIO.name.toUpperCase()}
              </p>
              <h3 className="text-xl font-semibold text-[#FFFFFF]">
                {PLACEHOLDER_PORTFOLIO.about.headline}
              </h3>
              <p className="text-sm leading-relaxed text-[#8A929A]">
                {PLACEHOLDER_PORTFOLIO.about.summary}
              </p>
              <p className="font-mono-hud text-xs text-[#FFFFFF] pt-2">
                LOC: {PLACEHOLDER_PORTFOLIO.location}
              </p>
            </div>

            <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-[#8A929A]/25 pt-4 md:pt-0 md:pl-6 space-y-4">
              <p className="font-mono-hud text-xs tracking-wider text-[#00FFFF]">
                CORE SUBSYSTEMS
              </p>
              {PLACEHOLDER_PORTFOLIO.about.capabilities.map((cap) => (
                <div key={cap.label} className="border-b border-[#8A929A]/15 pb-3 last:border-b-0">
                  <p className="font-mono-hud text-[11px] text-[#FFFFFF] mb-1">{cap.label}</p>
                  <p className="font-mono-hud text-[11px] text-[#8A929A]">{cap.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CH.02 // DRIFT -> Projects & System Architecture (matches Frame 00:04) */}
        {chamber.id === 'drift' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {PLACEHOLDER_PORTFOLIO.projects.map((proj, idx) => {
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

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 border border-[#8A929A]/25 bg-[#16191F]/80 p-5 space-y-3">
                <div className="flex items-center justify-between font-mono-hud text-[11px] text-[#00FFFF]">
                  <span>SYSTEM ARCHITECTURE // {activeProj.category}</span>
                  <span>{activeProj.year}</span>
                </div>
                <h3 className="text-lg font-semibold text-[#FFFFFF]">{activeProj.title}</h3>
                <p className="text-sm leading-relaxed text-[#8A929A]">{activeProj.summary}</p>
                <div className="pt-2 border-t border-[#8A929A]/20 font-mono-hud text-xs text-[#FFFFFF]">
                  STACK: <span className="text-[#00FFFF]">{activeProj.stack}</span>
                </div>
              </div>

              <div className="md:col-span-5 border border-[#8A929A]/25 bg-[#16191F]/80 p-5 space-y-3">
                <p className="font-mono-hud text-[11px] tracking-wider text-[#00FFFF]">
                  TELEMETRY BENCHMARKS
                </p>
                <div className="space-y-2.5 font-mono-hud text-xs">
                  <div className="flex justify-between border-b border-[#8A929A]/15 pb-2">
                    <span className="text-[#8A929A]">LATENCY:</span>
                    <span className="text-[#FFFFFF]">{activeProj.latency}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#8A929A]/15 pb-2">
                    <span className="text-[#8A929A]">THROUGHPUT:</span>
                    <span className="text-[#FFFFFF]">{activeProj.throughput}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A929A]">EFFICIENCY:</span>
                    <span className="text-[#00FFFF]">{activeProj.efficiency}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CH.03 // THE IRIS -> Career Experience Timeline */}
        {chamber.id === 'iris' && (
          <div className="space-y-4">
            {PLACEHOLDER_PORTFOLIO.experience.map((exp) => (
              <div
                key={exp.company}
                className="border border-[#8A929A]/25 bg-[#16191F]/80 p-4 grid grid-cols-1 md:grid-cols-12 gap-4"
              >
                <div className="md:col-span-4 space-y-1">
                  <p className="font-mono-hud text-xs text-[#00FFFF]">{exp.period}</p>
                  <p className="text-sm font-semibold text-[#FFFFFF]">{exp.role}</p>
                  <p className="font-mono-hud text-[11px] text-[#8A929A]">{exp.company}</p>
                </div>
                <div className="md:col-span-8 space-y-2">
                  <p className="text-xs leading-relaxed text-[#8A929A]">{exp.detail}</p>
                  <p className="font-mono-hud text-[11px] text-[#FFFFFF]">{exp.stack}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CH.04 // THE PEDESTAL -> Contact Uplink Terminal */}
        {chamber.id === 'pedestal' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-4">
              <p className="font-mono-hud text-xs text-[#00FFFF]">DIRECT CHANNEL</p>
              <p className="text-sm leading-relaxed text-[#8A929A]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Transmit an inquiry or
                establish a direct uplink below.
              </p>

              <div className="flex items-center justify-between gap-2 border border-[#8A929A]/30 bg-[#16191F] px-3 py-2.5">
                <span className="font-mono-hud text-xs text-[#FFFFFF] truncate">
                  {PLACEHOLDER_PORTFOLIO.email}
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
                      className="w-full border border-[#8A929A]/30 bg-[#16191F] px-3 py-2 font-mono-hud text-xs text-[#FFFFFF] placeholder:text-[#8A929A] focus:border-[#00FFFF] focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="EMAIL"
                      value={formState.email}
                      onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                      className="w-full border border-[#8A929A]/30 bg-[#16191F] px-3 py-2 font-mono-hud text-xs text-[#FFFFFF] placeholder:text-[#8A929A] focus:border-[#00FFFF] focus:outline-none"
                    />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="MESSAGE PAYLOAD..."
                    value={formState.message}
                    onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                    className="w-full border border-[#8A929A]/30 bg-[#16191F] px-3 py-2 font-mono-hud text-xs text-[#FFFFFF] placeholder:text-[#8A929A] focus:border-[#00FFFF] focus:outline-none resize-none"
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
