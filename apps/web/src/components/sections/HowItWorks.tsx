"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  type Transition,
} from "framer-motion";
import {
  X,
  Maximize2,
  Users,
  BookOpen,
  DollarSign,
  BarChart3,
  Receipt,
  Landmark,
  CalendarDays,
  MapPin,
  Package,
  ScanLine,
  Play,
  ChevronRight,
  Clock,
  Film,
  CheckCircle2,
  Smartphone,
  Bell,
  Navigation,
  Camera,
  Shield,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import Link from "next/link";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const SPRING: Transition = { type: "spring", stiffness: 380, damping: 30 };

/* ─── Per-step metadata ─────────────────────────────────────────────────── */
const STEP_META = [
  {
    icon: Users,
    color: "#22d3ee",
    glow: "rgba(34,211,238,0.18)",
    video: "https://res.cloudinary.com/dpo7sqgyg/video/upload/rh_f6xn0n.mp4" as
      | string
      | null,
    kpis: [
      { value: "70%", label: "moins de temps RH" },
      { value: "0 erreur", label: "de calcul de paie" },
    ],
    features: [
      "Dossiers agents complets avec pièces jointes",
      "Suivi des certifications & habilitations",
      "Médecine du travail & formations",
      "Entretiens, discipline & offboarding",
      "Tableau de bord widgets personnalisables",
      "Bilan social & indicateurs de conformité",
    ],
  },
  {
    icon: DollarSign,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.18)",
    video: null as string | null,
    kpis: [
      { value: "100%", label: "DSN automatisée" },
      { value: "0 ressaisie", label: "des variables" },
    ],
    features: [
      "Saisie et import des variables de paie",
      "Calcul automatique des bulletins",
      "Contrôle des charges sociales patronales",
      "Gestion des acomptes et soldes de tout compte",
      "Bilan social et rapport de masse salariale",
      "Archivage légal & comparatif N/N-1",
    ],
  },
  {
    icon: BookOpen,
    color: "#818cf8",
    glow: "rgba(129,140,248,0.18)",
    video:
      "https://res.cloudinary.com/dpo7sqgyg/video/upload/maincourante_hhghmi.mp4" as
        | string
        | null,
    kpis: [
      { value: "100%", label: "traçabilité CNAPS" },
      { value: "Temps réel", label: "alertes critiques" },
    ],
    features: [
      "Journal horodaté et géolocalisé",
      "Incidents enrichis : photos, vidéos, notes vocales",
      "Alertes critiques et workflow de validation",
      "Rondes de sécurité et statuts en direct",
      "Portail agents & portail clients",
      "Exports réglementaires prêts pour l'audit",
    ],
  },
  {
    icon: CalendarDays,
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.18)",
    video: null as string | null,
    kpis: [
      { value: "Auto", label: "détection conflits" },
      { value: "0 trou", label: "de couverture" },
    ],
    features: [
      "Planification agents, postes et sites",
      "Gestion des vacations et rotations",
      "Détection automatique des conflits de qualifications",
      "Alertes heures supplémentaires et absences",
      "Vue calendrier interactive par semaine / mois",
      "Diffusion automatique aux agents",
    ],
  },
  {
    icon: MapPin,
    color: "#fb923c",
    glow: "rgba(251,146,60,0.18)",
    video: null as string | null,
    kpis: [
      { value: "Live", label: "position des agents" },
      { value: "Géofencing", label: "alertes de zone" },
    ],
    features: [
      "Carte interactive en temps réel",
      "Statut de connexion et niveau de batterie",
      "Géofencing avec alertes de sortie de zone",
      "Historique des déplacements et rondes",
      "Alertes rondes manquées automatiques",
      "Vue filtrée par site ou équipe",
    ],
  },
  {
    icon: Receipt,
    color: "#34d399",
    glow: "rgba(52,211,153,0.18)",
    video: null as string | null,
    kpis: [
      { value: "Auto", label: "heures facturables" },
      { value: "KPI", label: "CA par client" },
    ],
    features: [
      "Devis, bons de commande et factures clients",
      "Avoirs, ajustements et remises",
      "Calcul automatique des heures depuis le planning",
      "Suivi des paiements et relances",
      "Rapports KPI chiffre d'affaires par site",
      "Gestion TVA et services récurrents",
    ],
  },
  {
    icon: BarChart3,
    color: "#2dd4bf",
    glow: "rgba(45,212,191,0.18)",
    video: null as string | null,
    kpis: [
      { value: "Instantané", label: "résultat estimé" },
      { value: "FEC", label: "généré en 1 clic" },
    ],
    features: [
      "Trésorerie et chiffre d'affaires en temps réel",
      "Résultat estimé instantané",
      "Préparation et déclaration de TVA",
      "Génération du FEC pour l'expert-comptable",
      "Suivi des factures en retard",
      "Rapports financiers mensuels et annuels",
    ],
  },
  {
    icon: Landmark,
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.18)",
    video: null as string | null,
    kpis: [
      { value: "Multi", label: "comptes bancaires" },
      { value: "Auto", label: "réconciliation" },
    ],
    features: [
      "Vue consolidée de tous les comptes bancaires",
      "Historique des transactions crédit / débit",
      "Réconciliation avec les factures émises",
      "Suivi des recettes et dépenses mensuelles",
      "Alertes solde bas et anomalies",
      "Export des relevés pour la comptabilité",
    ],
  },
  {
    icon: Package,
    color: "#f472b6",
    glow: "rgba(244,114,182,0.18)",
    video: null as string | null,
    kpis: [
      { value: "Tracé", label: "par agent" },
      { value: "Alertes", label: "réapprovisionnement" },
    ],
    features: [
      "Catalogue équipements, uniformes et matériels",
      "Suivi des quantités et valeur totale du stock",
      "Attributions par agent tracées",
      "Alertes de seuil de réapprovisionnement",
      "Historique des mouvements de stock",
      "Rapports de dotation par site",
    ],
  },
  {
    icon: ScanLine,
    color: "#e879f9",
    glow: "rgba(232,121,249,0.18)",
    video: null as string | null,
    kpis: [
      { value: "Auto", label: "extraction de données" },
      { value: "0", label: "ressaisie manuelle" },
    ],
    features: [
      "Import de documents papier par photo ou scan",
      "Extraction automatique des données structurées",
      "Reconnaissance cartes d'identité et certificats",
      "Intégration directe aux dossiers agents",
      "Suivi du statut de traitement par document",
      "Archivage sécurisé cloud avec recherche plein texte",
    ],
  },
] as const;

/* ─── Lightbox ───────────────────────────────────────────────────────────── */
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
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#22d3ee]/60 to-transparent z-10" />
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
        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-[#0f172a]/90 border border-white/10 flex items-center justify-center text-[#94a3b8] hover:text-white hover:border-[#22d3ee]/50 transition-all duration-200 cursor-pointer"
      >
        <X size={16} />
      </motion.button>
    </motion.div>
  );
}

/* ─── Animated progress rail ─────────────────────────────────────────────── */
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
            top: `calc(${(i / (total - 1)) * 100}% - 4px)`,
            backgroundColor: i <= active ? color : "#0f172a",
            borderColor: i <= active ? color : "#2d4160",
            boxShadow: i === active ? `0 0 7px ${color}` : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ─── KPI chip ───────────────────────────────────────────────────────────── */
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

/* ─── Video placeholder ──────────────────────────────────────────────────── */
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
      {/* Top accent line */}
      <div
        className="absolute top-0 inset-x-0 h-0.5 z-10"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
        }}
      />
      {/* Subtle grid texture */}
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

/* ─── Video preview card ─────────────────────────────────────────────────── */
function VideoCard({
  src,
  color,
  onExpand,
  portrait = false,
}: {
  src: string;
  color: string;
  onExpand: () => void;
  portrait?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={`relative rounded-2xl overflow-hidden border border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] group cursor-pointer ${portrait ? "mx-auto w-fit" : ""}`}
      style={{ boxShadow: `0 0 60px ${color}18, 0 20px 60px rgba(0,0,0,0.5)` }}
      onClick={onExpand}
    >
      {/* Top accent line */}
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
        className="block"
        style={
          portrait
            ? { width: "220px", height: "auto" }
            : { width: "100%", maxHeight: "360px", objectFit: "cover" }
        }
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Hover overlay */}
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

      {/* Corner badge */}
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
          Aperçu en direct
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Step tab button ────────────────────────────────────────────────────── */
function StepTab({
  step,
  meta,
  index,
  isActive,
  onClick,
}: {
  step: (typeof siteConfig.howItWorks)[number];
  meta: (typeof STEP_META)[number];
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = meta.icon;

  return (
    <motion.button
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: EASE }}
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
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeTabGlow"
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at left center, ${meta.glow} 0%, transparent 70%)`,
          }}
          transition={SPRING}
        />
      )}

      <div className="relative flex items-center gap-4">
        {/* Icon circle */}
        <div
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: isActive ? `${meta.color}18` : "transparent",
            border: `1px solid ${isActive ? `${meta.color}40` : "#2d4160"}`,
          }}
        >
          <Icon
            size={18}
            style={{ color: isActive ? meta.color : "#475569" }}
            className="transition-colors duration-300"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[10px] font-bold tracking-[0.12em] uppercase transition-colors duration-300"
              style={{ color: isActive ? meta.color : "#3d5170" }}
            >
              {step.step}
            </span>
          </div>
          <p
            className={`text-sm font-semibold leading-snug transition-colors duration-300 ${
              isActive
                ? "text-[#f1f5f9]"
                : "text-[#64748b] group-hover:text-[#94a3b8]"
            }`}
          >
            {step.title}
          </p>
        </div>

        <ChevronRight
          size={14}
          className="shrink-0 transition-all duration-300"
          style={{
            color: isActive ? meta.color : "#2d4160",
            transform: isActive ? "translateX(2px)" : "none",
          }}
        />
      </div>
    </motion.button>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const MOBILE_VIDEO =
    "https://res.cloudinary.com/dpo7sqgyg/video/upload/demo_mg9dxg.mp4";
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-120px" });

  const step = siteConfig.howItWorks[active];
  const meta = STEP_META[active];

  /* auto-advance */
  useEffect(() => {
    const id = setInterval(() => {
      setActive((p) => (p + 1) % siteConfig.howItWorks.length);
    }, 7000);
    return () => clearInterval(id);
  }, [active]);

  const handleTabClick = useCallback((i: number) => {
    setActive(i);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-32 bg-[#080f1a] overflow-hidden"
    >
      {/* ── Atmospheric background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep radial */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(15,23,42,0) 0%, #080f1a 70%)",
          }}
        />
        {/* Active step ambient glow — follows color */}
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[60%] h-[80%] rounded-full"
          animate={{ backgroundColor: meta.glow.replace("0.18", "0.06") }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{ filter: "blur(80px)" }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(to right, #22d3ee 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        {/* Top / bottom lines */}
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#22d3ee]/20 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#22d3ee]/10 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.75, ease: EASE }}
          className="text-center mb-20 flex flex-col items-center gap-4"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#f1f5f9] leading-tight max-w-2xl font-display">
            10 modules,{" "}
            <span className="text-[#22d3ee]">une seule plateforme</span>
          </h2>
          <p className="text-base text-[#64748b] max-w-xl leading-relaxed">
            Chaque module couvre un pilier de vos opérations de sécurité privée
            — du recrutement à la trésorerie, tout est connecté.
          </p>
        </motion.div>

        {/* ── Two-column layout ── */}
        <div className="grid lg:grid-cols-[380px_1fr] gap-8 xl:gap-14 items-start">
          {/* ── LEFT: Tab list + progress rail ── */}
          <div className="relative pl-6 lg:pl-8 flex flex-col gap-1">
            <ProgressRail
              active={active}
              total={siteConfig.howItWorks.length}
              color={meta.color}
            />

            {siteConfig.howItWorks.map((s, i) => (
              <StepTab
                key={s.step}
                step={s}
                meta={STEP_META[i]}
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
                  style={{ backgroundColor: meta.color }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 7, ease: "linear" }}
                />
              </div>
            </div>

            {/* Step dots — mobile only */}
            <div className="flex flex-wrap items-center gap-2 mt-4 lg:hidden">
              {siteConfig.howItWorks.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleTabClick(i)}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: i === active ? 20 : 6,
                    height: 6,
                    backgroundColor: i === active ? meta.color : "#2d4160",
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT: Content panel ── */}
          <div className="min-h-130">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 24, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -24, filter: "blur(4px)" }}
                transition={{ duration: 0.45, ease: EASE }}
                className="flex flex-col gap-6"
              >
                {/* Step label + title */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] font-bold tracking-[0.18em] uppercase"
                      style={{ color: meta.color }}
                    >
                      Étape {step.step}
                    </span>
                    <div
                      className="h-px flex-1"
                      style={{
                        background: `linear-gradient(90deg, ${meta.color}40, transparent)`,
                      }}
                    />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#f1f5f9] leading-snug">
                    {step.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-[#94a3b8] leading-relaxed text-base max-w-lg">
                  {step.description}
                </p>

                {/* KPI chips */}
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <AnimatePresence mode="wait">
                    {meta.kpis.map((kpi, i) => (
                      <KpiChip
                        key={`${active}-kpi-${i}`}
                        value={kpi.value}
                        label={kpi.label}
                        color={meta.color}
                        delay={0.15 + i * 0.07}
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
                    {meta.features.map((feat, i) => (
                      <motion.div
                        key={`${active}-feat-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.1 + i * 0.04,
                          ease: EASE,
                        }}
                        className="flex items-start gap-2.5 text-sm text-[#94a3b8]"
                      >
                        <CheckCircle2
                          size={14}
                          className="shrink-0 mt-0.5"
                          style={{ color: meta.color }}
                        />
                        {feat}
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Video */}
                <AnimatePresence mode="wait">
                  {meta.video ? (
                    <VideoCard
                      key={`video-${active}`}
                      src={meta.video}
                      color={meta.color}
                      onExpand={() => setLightboxSrc(meta.video)}
                    />
                  ) : (
                    <VideoPlaceholder
                      key={`placeholder-${active}`}
                      color={meta.color}
                    />
                  )}
                </AnimatePresence>

                {/* CTA for HR step */}
                {active === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4, ease: EASE }}
                  >
                    <Link
                      href="/solutions/hr"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={{
                        backgroundColor: `${meta.color}15`,
                        border: `1px solid ${meta.color}30`,
                        color: meta.color,
                      }}
                    >
                      Découvrir le module RH complet
                      <ChevronRight size={14} />
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Mobile app feature banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ delay: 0.5, duration: 0.75, ease: EASE }}
          className="mt-20 relative rounded-2xl overflow-hidden border border-white/[0.07]"
          style={{
            background:
              "linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(129,140,248,0.06) 50%, rgba(52,211,153,0.06) 100%)",
          }}
        >
          {/* Top accent */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#22d3ee]/40 to-transparent" />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(to right, #22d3ee 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Glow blob */}
          <div
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-48 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(34,211,238,0.08) 0%, transparent 70%)",
              filter: "blur(24px)",
            }}
          />

          <div className="relative px-8 py-10 sm:px-12 sm:py-12 grid lg:grid-cols-[1fr_auto] gap-10 items-start">
            {/* Left: text + features */}
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: "rgba(34,211,238,0.1)",
                    borderColor: "rgba(34,211,238,0.25)",
                  }}
                >
                  <Smartphone size={22} className="text-[#22d3ee]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#22d3ee]">
                      Inclus dans Safyr
                    </span>
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: "rgba(34,211,238,0.08)",
                        borderColor: "rgba(34,211,238,0.2)",
                        color: "rgba(34,211,238,0.7)",
                      }}
                    >
                      Bientôt disponible
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#f1f5f9] leading-snug">
                    Application mobile pour vos agents
                  </h3>
                </div>
              </div>

              <p className="text-[#94a3b8] text-sm leading-relaxed max-w-xl">
                Vos agents de sécurité disposent de leur propre application
                mobile pour pointer leurs présences, effectuer leurs rondes,
                signaler des incidents avec photos et notes vocales, et
                consulter leur planning — directement depuis leur smartphone,
                même hors connexion.
              </p>

              {/* Feature list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {[
                  {
                    icon: CheckCircle2,
                    text: "Pointage de présence géolocalisé",
                  },
                  { icon: Navigation, text: "Rondes et patrouilles guidées" },
                  { icon: Bell, text: "Réception des alertes en temps réel" },
                  { icon: Camera, text: "Signalement d'incidents avec médias" },
                  {
                    icon: CheckCircle2,
                    text: "Consultation du planning et des gardes",
                  },
                  {
                    icon: Shield,
                    text: "Accès sécurisé par agent avec droits",
                  },
                ].map(({ icon: Icon, text }, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -8 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{
                      delay: 0.7 + i * 0.05,
                      duration: 0.3,
                      ease: EASE,
                    }}
                    className="flex items-center gap-2.5 text-sm text-[#94a3b8]"
                  >
                    <Icon size={14} className="shrink-0 text-[#22d3ee]" />
                    {text}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: portrait video + app store pills */}
            <div className="flex flex-col items-center gap-4">
              <VideoCard
                src={MOBILE_VIDEO}
                color="#22d3ee"
                onExpand={() => setLightboxSrc(MOBILE_VIDEO)}
                portrait
              />
              <div className="flex flex-row lg:flex-col gap-3">
                {[
                  { label: "App Store", sub: "iOS — Bientôt" },
                  { label: "Google Play", sub: "Android — Bientôt" },
                ].map(({ label, sub }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-not-allowed select-none"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <Smartphone size={18} className="text-[#475569] shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#64748b]">
                        {label}
                      </p>
                      <p className="text-[10px] text-[#3d5170]">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Bottom connector to next section ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="flex flex-col items-center mt-16 gap-3"
        >
          <span className="text-xs text-[#3d5170] uppercase tracking-[0.2em]">
            Ils nous font confiance
          </span>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full"
                style={{ backgroundColor: "#2d4160" }}
                animate={{ height: [4, 10, 4], opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 1.4,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Lightbox ── */}
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
