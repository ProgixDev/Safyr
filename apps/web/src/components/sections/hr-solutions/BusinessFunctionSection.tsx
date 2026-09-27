"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  type Transition,
} from "framer-motion";
import {
  ChevronRight,
  CheckCircle2,
  Clock,
  Film,
  X,
  Maximize2,
  Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const SPRING: Transition = { type: "spring", stiffness: 380, damping: 30 };

interface Tab {
  id: string;
  title: string;
  shortTitle?: string;
  description: string;
  icon: LucideIcon;
  color: string;
  glow: string;
  kpis: { value: string; label: string }[];
  features: string[];
  video?: string | null;
}

interface BusinessFunctionSectionProps {
  tabs: Tab[];
  title: string;
  subtitle: string;
  description: string;
  color: string;
  glow: string;
  sectionId: string;
  autoAdvanceInterval?: number;
}

/* ─── Progress Rail ──────────────────────────────────────────────────────── */
function ProgressRail({
  active,
  total,
  color,
}: {
  active: number;
  total: number;
  color: string;
}) {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-px hidden lg:block">
      <div className="absolute inset-0 bg-[#2d4160]/50" />
      <motion.div
        className="absolute top-0 left-0 right-0 origin-top"
        style={{ backgroundColor: color }}
        animate={{ scaleY: (active + 1) / total }}
        transition={{ duration: 0.6, ease: EASE }}
      />
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border transition-colors duration-400"
          style={{
            top: `calc(${(i / (total - 1 || 1)) * 100}% - 4px)`,
            backgroundColor: i <= active ? color : "#0f172a",
            borderColor: i <= active ? color : "#2d4160",
            boxShadow: i === active ? `0 0 7px ${color}` : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ─── KPI Chip ────────────────────────────────────────────────────────────── */
function KpiChip({
  value,
  label,
  color,
  delay,
}: {
  value: string;
  label: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/6 bg-white/3"
    >
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div>
        <p
          className="text-lg font-bold leading-none tracking-tight"
          style={{ color }}
        >
          {value}
        </p>
        <p className="text-[11px] text-[#64748b] mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

/* ─── Video Lightbox ──────────────────────────────────────────────────────── */
function VideoLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-10"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#030912]/92 backdrop-blur-xl" />

      <motion.div
        initial={{ scale: 0.86, opacity: 0, y: 32 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.86, opacity: 0, y: 32 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="relative z-10 w-full max-w-5xl rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/[0.07]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#357AB7]/60 to-transparent z-10" />
        <video autoPlay loop muted playsInline className="w-full h-auto block">
          <source src={src} type="video/mp4" />
        </video>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.12 }}
        onClick={onClose}
        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-[#0f172a]/90 border border-white/10 flex items-center justify-center text-[#94a3b8] hover:text-white hover:border-[#357AB7]/50 transition-all duration-200 cursor-pointer"
      >
        <X size={16} />
      </motion.button>
    </motion.div>
  );
}

/* ─── Video Placeholder ───────────────────────────────────────────────────── */
function VideoPlaceholder({ color }: { color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative rounded-2xl overflow-hidden border border-white/8 group"
      style={{ minHeight: "200px" }}
    >
      <div
        className="absolute top-0 inset-x-0 h-0.5 z-10"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(to right, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${color}08 0%, transparent 70%)`,
        }}
      />
      <div className="relative flex flex-col items-center justify-center gap-3 py-14">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center border"
          style={{
            backgroundColor: `${color}10`,
            borderColor: `${color}25`,
          }}
        >
          <Film size={20} style={{ color: `${color}80` }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: `${color}90` }}>
            Démo vidéo à venir
          </p>
          <p className="text-xs text-[#3d5170] mt-1">Bientôt disponible</p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-medium mt-1"
          style={{
            backgroundColor: `${color}08`,
            borderColor: `${color}20`,
            color: `${color}70`,
          }}
        >
          <Clock size={10} />
          Prochainement
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Video Card ──────────────────────────────────────────────────────────── */
function VideoCard({
  src,
  color,
  onExpand,
}: {
  src: string;
  color: string;
  onExpand: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative rounded-2xl overflow-hidden border border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] group cursor-pointer"
      style={{ boxShadow: `0 0 60px ${color}18, 0 20px 60px rgba(0,0,0,0.5)` }}
      onClick={onExpand}
    >
      <div
        className="absolute top-0 inset-x-0 h-0.5 z-10"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />

      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="block w-full max-h-[300px] object-cover"
      >
        <source src={src} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[#030912]/0 group-hover:bg-[#030912]/40 transition-colors duration-300 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          className="opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border backdrop-blur-sm"
            style={{
              backgroundColor: `${color}20`,
              borderColor: `${color}50`,
            }}
          >
            <Maximize2 size={14} style={{ color }} />
            <span className="text-xs font-semibold text-white">
              Plein écran
            </span>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-3 right-3 z-10">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border backdrop-blur-md text-[10px] font-medium"
          style={{
            backgroundColor: `${color}15`,
            borderColor: `${color}30`,
            color,
          }}
        >
          <Play size={9} className="fill-current" />
          Aperçu
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Step Tab Button ──────────────────────────────────────────────────────── */
function StepTab({
  tab,
  index,
  isActive,
  onClick,
}: {
  tab: Tab;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;

  return (
    <motion.button
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
      onClick={onClick}
      className={`
        relative w-full text-left px-4 py-3 rounded-xl border transition-all duration-300 group
        ${
          isActive
            ? "border-white/12 bg-white/5"
            : "border-transparent bg-transparent hover:border-white/6 hover:bg-white/2.5"
        }
      `}
    >
      {isActive && (
        <motion.div
          layoutId={`activeTabGlow-${tab.id}`}
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at left center, ${tab.glow} 0%, transparent 70%)`,
          }}
          transition={SPRING}
        />
      )}

      <div className="relative flex items-center gap-4">
        <div
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: isActive ? `${tab.color}18` : "transparent",
            border: `1px solid ${isActive ? `${tab.color}40` : "#2d4160"}`,
          }}
        >
          <Icon
            size={18}
            style={{ color: isActive ? tab.color : "#475569" }}
            className="transition-colors duration-300"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold leading-snug transition-colors duration-300 ${
              isActive
                ? "text-[#f1f5f9]"
                : "text-[#64748b] group-hover:text-[#94a3b8]"
            }`}
          >
            {tab.title}
          </p>
        </div>

        <ChevronRight
          size={14}
          className="shrink-0 transition-all duration-300"
          style={{
            color: isActive ? tab.color : "#2d4160",
            transform: isActive ? "translateX(2px)" : "none",
          }}
        />
      </div>
    </motion.button>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */
export default function BusinessFunctionSection({
  tabs,
  title,
  description,
  color,
  glow,
  sectionId,
  autoAdvanceInterval = 8000,
}: BusinessFunctionSectionProps) {
  const [active, setActive] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const tab = tabs[active];

  useEffect(() => {
    const id = setInterval(() => {
      setActive((p) => (p + 1) % tabs.length);
    }, autoAdvanceInterval);
    return () => clearInterval(id);
  }, [autoAdvanceInterval, tabs.length]);

  const handleTabClick = useCallback((i: number) => {
    setActive(i);
  }, []);

  return (
    <section
      ref={sectionRef}
      id={sectionId}
      className="relative py-28 bg-[#050a10] overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient mesh with section color */}
        <div className="absolute inset-0 opacity-30">
          <motion.div
            className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full blur-[100px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
            }}
          />
          <motion.div
            className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[80px]"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            style={{
              background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
            }}
          />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(#357AB7 1px, transparent 1px), linear-gradient(to right, #357AB7 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Animated scanning line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{
            background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
            opacity: 0.5,
          }}
        />

        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-16 flex flex-col items-center gap-4"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f1f5f9] leading-tight font-display">
            {title}
          </h2>
          <p className="text-lg text-[#94a3b8] max-w-2xl leading-relaxed">
            {description}
          </p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="w-24 h-1 rounded-full origin-center"
            style={{
              background: `linear-gradient(90deg, ${color}, transparent)`,
            }}
          />
        </motion.div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[340px_1fr] gap-8 xl:gap-12 items-start">
          {/* Left: Tab list */}
          <div className="relative pl-6 lg:pl-8 flex flex-col gap-1">
            <ProgressRail
              active={active}
              total={tabs.length}
              color={tab.color}
            />

            {tabs.map((t, i) => (
              <StepTab
                key={t.id}
                tab={t}
                index={i}
                isActive={i === active}
                onClick={() => handleTabClick(i)}
              />
            ))}

            {/* Auto-advance progress bar */}
            <div className="mt-4 pl-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-[#3d5170] uppercase tracking-wider">
                  Défilement auto
                </span>
              </div>
              <div className="h-0.5 w-full rounded-full bg-[#1e293b] overflow-hidden">
                <motion.div
                  key={active}
                  className="h-full rounded-full origin-left"
                  style={{ backgroundColor: tab.color }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: autoAdvanceInterval / 1000,
                    ease: "linear",
                  }}
                />
              </div>
            </div>

            {/* Step dots - mobile only */}
            <div className="flex lg:hidden items-center gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {tabs.map((t, i) => (
                <button
                  key={i}
                  onClick={() => handleTabClick(i)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    i === active ? "text-white" : "text-[#64748b]"
                  }`}
                  style={{
                    backgroundColor:
                      i === active ? `${t.color}20` : "transparent",
                    border: `1px solid ${i === active ? `${t.color}40` : "transparent"}`,
                  }}
                >
                  {t.shortTitle || t.title}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Content panel */}
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 24, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -24, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: EASE }}
                className="flex flex-col gap-5"
              >
                {/* Title */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${tab.color}18` }}
                    >
                      <tab.icon size={16} style={{ color: tab.color }} />
                    </div>
                    <div
                      className="h-px flex-1"
                      style={{
                        background: `linear-gradient(90deg, ${tab.color}40, transparent)`,
                      }}
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#f1f5f9] leading-snug">
                    {tab.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-[#94a3b8] leading-relaxed text-sm sm:text-base max-w-lg">
                  {tab.description}
                </p>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <AnimatePresence mode="wait">
                    {tab.kpis.map((kpi, i) => (
                      <KpiChip
                        key={`${active}-kpi-${i}`}
                        value={kpi.value}
                        label={kpi.label}
                        color={tab.color}
                        delay={0.12 + i * 0.05}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Features list */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`features-${active}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2"
                  >
                    {tab.features.map((feat, i) => (
                      <motion.div
                        key={`${active}-feat-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.08 + i * 0.03,
                          ease: EASE,
                        }}
                        className="flex items-start gap-2.5 text-sm text-[#94a3b8]"
                      >
                        <CheckCircle2
                          size={14}
                          className="shrink-0 mt-0.5"
                          style={{ color: tab.color }}
                        />
                        {feat}
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Video placeholder */}
                <AnimatePresence mode="wait">
                  {tab.video ? (
                    <VideoCard
                      key={`video-${active}`}
                      src={tab.video}
                      color={tab.color}
                      onExpand={() => setLightboxSrc(tab.video || null)}
                    />
                  ) : (
                    <VideoPlaceholder
                      key={`placeholder-${active}`}
                      color={tab.color}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <VideoLightbox
            src={lightboxSrc}
            onClose={() => setLightboxSrc(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
