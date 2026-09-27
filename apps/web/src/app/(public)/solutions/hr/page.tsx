"use client";

import { useState, useEffect, useRef } from "react";

import { motion, useInView, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Users,
  ChevronRight,
  ArrowRight,
  ArrowUp,
  Clock,
  Shield,
  CheckCircle2,
  Zap,
  X,
  Plus,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  UserCheck,
  Award,
  Activity,
  Play,
  Quote,
  Star,
  Menu,
} from "lucide-react";

import BusinessFunctionSection from "@/components/sections/hr-solutions/BusinessFunctionSection";
import JourneyTimeline from "@/components/sections/hr-solutions/JourneyTimeline";
import WorkflowCard from "@/components/sections/hr-solutions/WorkflowCard";
import ComplianceChecklist from "@/components/sections/hr-solutions/ComplianceChecklist";
import IntegrationEcosystem from "@/components/sections/hr-solutions/IntegrationEcosystem";

import {
  businessFunctions,
  journeySteps,
  workflows,
  complianceItems,
  integrationModules,
  faqs,
  heroKpis,
  statusColors,
  statusLabels,
} from "@/config/hr-solutions";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

/* ─── Section Divider ─────────────────────────────────────────────────────── */
function SectionDivider({ color = "#357AB7" }: { color?: string }) {
  return (
    <div className="relative h-px w-full overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#1e293b] to-transparent" />
      {/* Glow effect */}
      <div
        className="absolute inset-0 blur-xl"
        style={{
          background: `radial-linear(circle at 50% 50%, ${color}30, transparent 70%)`,
        }}
      />
      {/* Animated light */}
      <motion.div
        className="absolute top-0 left-0 h-full"
        style={{
          background: `linear-linear(90deg, transparent, ${color}, ${color}80, transparent)`,
        }}
        initial={{ x: "-100%" }}
        whileInView={{ x: "100%" }}
        transition={{ duration: 1.5, ease: EASE }}
        viewport={{ once: true }}
      />
    </div>
  );
}

/* ─── Section Navigation ───────────────────────────────────────────────────── */
const NAV_SECTIONS = [
  { id: "employee-journey", label: "Parcours", color: "#357AB7" },
  { id: "lifecycle", label: "Cycle de vie", color: "#357AB7" },
  { id: "compliance", label: "Conformité", color: "#a78bfa" },
  { id: "operations", label: "Opérations", color: "#34d399" },
  { id: "automation", label: "Automatisation", color: "#fb923c" },
  { id: "workflows", label: "Workflows", color: "#a78bfa" },
  { id: "integrations", label: "Intégrations", color: "#fb923c" },
];

function SectionNavigation() {
  const [activeSection, setActiveSection] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sections = NAV_SECTIONS;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 },
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const handleNavClick = (id: string) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 124;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="fixed top-20 left-0 right-0 z-40 bg-[#030712]/95 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-11">
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleNavClick(section.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeSection === section.id
                    ? "text-white"
                    : "text-[#64748b] hover:text-white hover:bg-white/5"
                }`}
              >
                {activeSection === section.id && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      backgroundColor: `${section.color}20`,
                      border: `1px solid ${section.color}40`,
                    }}
                  />
                )}
                <span className="relative z-10">{section.label}</span>
              </button>
            ))}
          </div>

          {/* Section label — mobile only */}
          <span className="lg:hidden text-xs font-semibold text-[#64748b] uppercase tracking-widest">
            Module RH
          </span>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1 bg-[#030712]">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleNavClick(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeSection === section.id
                      ? "text-white"
                      : "text-[#64748b]"
                  }`}
                  style={
                    activeSection === section.id
                      ? { backgroundColor: `${section.color}15` }
                      : {}
                  }
                >
                  {section.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ─── Certifications Section ─────────────────────────────────────────────── */
function CertificationsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

  const certifications = [
    { name: "CNAPS", desc: "Agrément officiel", icon: Shield },
    { name: "RGPD", desc: "Conforme européen", icon: CheckCircle2 },
    { name: "ISO 27001", desc: "Sécurité données", icon: Shield },
    { name: "DSN", desc: "Déclaration automatisée", icon: FileText },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-16 bg-[#030712] overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(53,122,183,0.15) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="flex flex-wrap justify-center items-center gap-6 md:gap-12"
        >
          {certifications.map((cert, index) => (
            <motion.div
              key={cert.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="flex items-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#357AB7]/30 transition-colors">
                <cert.icon size={22} className="text-[#357AB7]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{cert.name}</p>
                <p className="text-xs text-[#64748b]">{cert.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Video Demo Section ───────────────────────────────────────────────── */
function VideoDemoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="relative py-20 bg-[#030712] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(53,122,183,0.1) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 font-display">
            Découvrez <span className="text-[#357AB7]">Safyr</span> en action
          </h2>
          <p className="text-[#64748b]">
            Une démonstration visuelle de la plateforme
          </p>
        </motion.div>

        {/* Video — RH module */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="relative rounded-2xl border border-white/10 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        >
          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#357AB7]/60 to-transparent z-10" />
          <video
            src="https://res.cloudinary.com/dpo7sqgyg/video/upload/rh_f6xn0n.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Trusted By Section ───────────────────────────────────────────────── */
function TrustedBySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

  const companies = [
    { name: "Atlantis Sécurité", initials: "AS", color: "#357AB7" },
    { name: "Protect & Care", initials: "PC", color: "#34d399" },
    { name: "Gardiennage Sud", initials: "GS", color: "#fb923c" },
    { name: "Vigie Permanente", initials: "VP", color: "#a78bfa" },
    { name: "Sécuritas France", initials: "SF", color: "#f472b6" },
    { name: "Groupe Ops", initials: "GO", color: "#fbbf24" },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-12 bg-[#030712] border-y border-white/5"
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-8"
        >
          <p className="text-xs text-[#475569] uppercase tracking-widest">
            Déjà utilisés par plus de 200 entreprises
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="flex items-center gap-3 opacity-50 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: `${company.color}20`,
                  color: company.color,
                }}
              >
                {company.initials}
              </div>
              <span className="text-sm text-[#64748b] hidden md:block">
                {company.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Stats Marquee ───────────────────────────────────────────────────────── */
function StatsMarquee() {
  const stats = [
    { value: "247", label: "Agents", icon: Users, color: "#357AB7" },
    { value: "98%", label: "Conformité", icon: Shield, color: "#34d399" },
    { value: "70%", label: "Temps gagné", icon: Clock, color: "#fbbf24" },
    { value: "0", label: "Erreurs", icon: CheckCircle2, color: "#a78bfa" },
    { value: "24/7", label: "Support", icon: Activity, color: "#f472b6" },
  ];

  return (
    <div className="relative py-6 bg-[#030712] border-y border-white/5 overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-linear-to-r from-[#030712] via-transparent to-[#030712] z-10" />
      </div>
      <div className="flex animate-marquee gap-8">
        {[...stats, ...stats, ...stats].map((stat, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-xs text-[#64748b]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}

/* ─── Benefits Section ────────────────────────────────────────────────────── */
function BenefitsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const benefits = [
    {
      value: "70%",
      label: "Temps gagné",
      desc: "sur la gestion quotidienne",
      color: "#357AB7",
    },
    {
      value: "100%",
      label: "Conformité",
      desc: "CNAPS garantie",
      color: "#34d399",
    },
    {
      value: "0",
      label: "Erreurs",
      desc: "de calcul de paie",
      color: "#fbbf24",
    },
    {
      value: "24/7",
      label: "Support",
      desc: "équipe dédiée",
      color: "#a78bfa",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-20 bg-[#030712] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(#357AB7 1px, transparent 1px), linear-gradient(to right, #357AB7 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 font-display">
            Pourquoi choisir <span className="text-[#357AB7]">Safyr</span> ?
          </h2>
          <p className="text-[#64748b]">Les avantages qui font la différence</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="relative p-6 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/12 transition-all duration-300 group"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-linear(circle at center, ${benefit.color}10 0%, transparent 70%)`,
                }}
              />
              <div className="relative">
                <p
                  className="text-4xl font-bold mb-1"
                  style={{ color: benefit.color }}
                >
                  {benefit.value}
                </p>
                <p className="text-sm font-semibold text-white mb-1">
                  {benefit.label}
                </p>
                <p className="text-xs text-[#64748b]">{benefit.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Quick Features Grid ─────────────────────────────────────────────────── */
function QuickFeatures() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const features = [
    {
      icon: Users,
      title: "Dossiers agents",
      desc: "Profils complets",
      color: "#357AB7",
    },
    {
      icon: UserCheck,
      title: "Recrutement",
      desc: "Pipeline complet",
      color: "#34d399",
    },
    {
      icon: Award,
      title: "Formations",
      desc: "SSIAP, SST, H0B0",
      color: "#fbbf24",
    },
    {
      icon: Shield,
      title: "Conformité CNAPS",
      desc: "100% automatisé",
      color: "#f472b6",
    },
    {
      icon: Calendar,
      title: "Médecine du travail",
      desc: "Alertes intelligentes",
      color: "#a78bfa",
    },
    {
      icon: DollarSign,
      title: "Variables paie",
      desc: "Sync automatique",
      color: "#357AB7",
    },
    {
      icon: FileText,
      title: "Registres légaux",
      desc: "DUERP, personnel",
      color: "#34d399",
    },
    {
      icon: Zap,
      title: "Signatures numériques",
      desc: "Dématérialisé",
      color: "#fb923c",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-20 bg-[#030712] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(#357AB7 1px, transparent 1px), linear-gradient(to right, #357AB7 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Animated gradient blobs */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] rounded-full blur-[120px]"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background:
              "radial-gradient(circle, rgba(53,122,183,0.1) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-display">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-lg text-[#94a3b8]">
            Pour piloter efficacement votre service RH
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="group relative p-6 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/12 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${feature.color}15 0%, transparent 70%)`,
                }}
              />

              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 group-hover:rotate-3"
                  style={{
                    backgroundColor: `${feature.color}15`,
                    border: `1px solid ${feature.color}30`,
                  }}
                >
                  <feature.icon size={26} style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#64748b]">{feature.desc}</p>
              </div>

              {/* Arrow indicator */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="absolute bottom-4 right-4"
              >
                <ArrowRight size={16} style={{ color: feature.color }} />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Animated Counter ─────────────────────────────────────────────────────── */
function AnimatedCounter({ value, suffix }: { value: string; suffix: string }) {
  const [displayValue, setDisplayValue] = useState("0");
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const isNumeric = !isNaN(Number(value.replace("%", "")));

    if (!isNumeric || value === "Temps réel") {
      const timer = setTimeout(() => setDisplayValue(value), 0);
      return () => clearTimeout(timer);
    }

    const numValue = Number(value.replace("%", ""));
    const duration = 1500;
    const steps = 30;
    const increment = numValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current).toString());
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [hasStarted, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue}
      {suffix}
    </span>
  );
}

/* ─── Floating Particles ─────────────────────────────────────────────────── */
function FloatingParticles() {
  const [particles] = useState(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    })),
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#357AB7] opacity-15"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.2;
          }
          50% {
            transform: translateY(-80px) translateX(15px);
            opacity: 0.15;
          }
          90% {
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Hero Section ───────────────────────────────────────────────────────── */
function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[95vh] flex items-center bg-[#030712] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 opacity-40">
          <div
            className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]"
            style={{
              background:
                "radial-gradient(circle, rgba(53,122,183,0.3) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px]"
            style={{
              background:
                "radial-gradient(circle, rgba(52,211,153,0.25) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full blur-[80px]"
            style={{
              background:
                "radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#357AB7 1px, transparent 1px), linear-gradient(to right, #357AB7 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Top/bottom lines */}
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#357AB7]/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#357AB7]/30 to-transparent" />

        <FloatingParticles />

        {/* Animated grid lines */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px w-full bg-linear-to-r from-transparent via-[#357AB7]/5 to-transparent"
              style={{ top: `${20 + i * 15}%` }}
              animate={{
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                delay: i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pb-20 pt-36">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
            animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#f1f5f9] leading-[1.1] mb-6 font-display">
              Pilotez vos agents de{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#357AB7] via-[#34d399] to-[#357AB7]">
                sécurité
              </span>{" "}
              simplement
            </h1>

            <p className="text-lg sm:text-xl text-[#94a3b8] leading-relaxed mb-8 max-w-xl">
              De la candidature au départ : recrutement, formations, conformité
              CNAPS, médecine du travail, paie et plus encore. Une solution
              tout-en-un pour votre service RH.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-4 mb-10"
            >
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-3.5 text-base rounded-xl"
              >
                <Play size={18} className="mr-2" />
                Voir la démo
              </Button>
            </motion.div>

            {/* Enhanced KPIs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {heroKpis.map((kpi, index) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="p-4 rounded-2xl border border-white/8 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/12 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#357AB7]" />
                    <p className="text-2xl font-bold text-[#357AB7]">
                      <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                    </p>
                  </div>
                  <p className="text-xs text-[#64748b]">{kpi.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Enhanced Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: -10 }}
            animate={isInView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8, ease: EASE }}
            className="relative hidden lg:block perspective"
          >
            {/* Main dashboard card */}
            <div className="relative rounded-2xl border border-white/10 bg-[#0f172a]/90 backdrop-blur-2xl overflow-hidden shadow-2xl transform transition-transform hover:scale-[1.01] duration-500">
              {/* Top bar */}
              <div className="h-14 border-b border-white/10 flex items-center px-5 gap-3">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500/60" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/60" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 h-8 bg-white/5 rounded-lg flex items-center px-3">
                  <span className="text-xs text-[#64748b]">
                    safyr.app/hr/dashboard
                  </span>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-5 space-y-4">
                {/* Header stats */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Tableau de bord RH
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      Mise à jour en temps réel
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#34d399]/10 border border-[#34d399]/20">
                    <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
                    <span className="text-xs text-[#34d399]">En ligne</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Total agents",
                      value: "247",
                      icon: Users,
                      color: "#357AB7",
                      trend: "+12%",
                    },
                    {
                      label: "En poste",
                      value: "198",
                      icon: UserCheck,
                      color: "#34d399",
                      trend: "+5%",
                    },
                    {
                      label: "En formation",
                      value: "23",
                      icon: Award,
                      color: "#fbbf24",
                      trend: "+8%",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon size={16} style={{ color: stat.color }} />
                        <span className="text-[10px] text-[#34d399]">
                          {stat.trend}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-[#64748b]">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Mini chart */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-[#64748b]">
                      Évolution des effectifs
                    </span>
                    <TrendingUp size={14} className="text-[#34d399]" />
                  </div>
                  <div className="flex items-end gap-1 h-16">
                    {[40, 55, 45, 60, 75, 65, 80, 70, 85, 90, 95, 100].map(
                      (h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.8 + i * 0.05, duration: 0.3 }}
                          className="flex-1 rounded-sm"
                          style={{
                            backgroundColor: i >= 10 ? "#34d399" : "#357AB7",
                            opacity: i >= 10 ? 1 : 0.5,
                          }}
                        />
                      ),
                    )}
                  </div>
                </div>

                {/* Agents table */}
                <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 justify-between">
                    <span className="text-xs text-[#64748b]">
                      Agents récents
                    </span>
                    <span className="text-[10px] text-[#357AB7] cursor-pointer hover:underline">
                      Voir tout
                    </span>
                  </div>
                  {[
                    {
                      name: "Jean M.",
                      role: "Agent SSIAP",
                      status: "Actif",
                      color: "#34d399",
                    },
                    {
                      name: "Marie L.",
                      role: "Chef équipe",
                      status: "Actif",
                      color: "#34d399",
                    },
                    {
                      name: "Pierre D.",
                      role: "Agent CQP",
                      status: "Formation",
                      color: "#fbbf24",
                    },
                  ].map((agent, i) => (
                    <div
                      key={i}
                      className="h-12 border-b border-white/5 flex items-center px-4 gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#357AB7] to-[#34d399] flex items-center justify-center text-[12px] text-white font-medium">
                        {agent.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">
                          {agent.name}
                        </p>
                        <p className="text-[10px] text-[#64748b]">
                          {agent.role}
                        </p>
                      </div>
                      <span
                        className="text-[10px] px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${agent.color}15`,
                          color: agent.color,
                        }}
                      >
                        {agent.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-px rounded-2xl bg-linear-to-r from-[#357AB7]/20 via-[#34d399]/10 to-[#a78bfa]/20 blur-xl -z-10" />
            </div>

            {/* Floating elements */}
            <motion.div
              className="absolute -top-6 -right-6 p-4 rounded-xl bg-[#0f172a]/90 border border-white/10 shadow-xl backdrop-blur-xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#34d399]/20 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-[#34d399]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">100%</p>
                  <p className="text-[10px] text-[#64748b]">Conforme CNAPS</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-6 p-3 rounded-xl bg-[#0f172a]/90 border border-white/10 shadow-xl backdrop-blur-xl"
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#357AB7]/20 flex items-center justify-center">
                  <Shield size={16} className="text-[#357AB7]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">DSN</p>
                  <p className="text-[9px] text-[#64748b]">Automatisé</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] text-[#475569] uppercase tracking-widest">
          Découvrir
        </span>
        <motion.div
          className="w-6 h-10 rounded-full border border-white/20 flex justify-center pt-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#357AB7]" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── FAQ Accordion ───────────────────────────────────────────────────────── */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="relative py-28 bg-[#030712] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient mesh */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px]"
            style={{
              background:
                "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)",
            }}
          />
        </div>

        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(#357AB7 1px, transparent 1px), linear-gradient(to right, #357AB7 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#f1f5f9] mt-2 font-display mb-4">
            Questions fréquentes
          </h2>
          <p className="text-lg text-[#94a3b8]">
            Tout ce que vous devez savoir sur le module RH Safyr
          </p>
        </motion.div>

        {/* FAQ items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="rounded-xl border border-white/6 bg-white/[0.02] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
              >
                <span className="text-sm font-medium text-[#e2e8f0]">
                  {faq.question}
                </span>
                <Plus
                  size={16}
                  className={`shrink-0 text-[#64748b] transition-transform duration-200 ${
                    openIndex === index ? "rotate-45" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4">
                      <p className="text-sm text-[#94a3b8] leading-relaxed">
                        {faq.answer}
                      </p>
                      <span className="inline-block mt-3 text-[10px] font-medium px-2 py-1 rounded bg-[#a78bfa]/10 text-[#a78bfa]">
                        {faq.category}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-[#64748b] mb-4">
            Vous avez une autre question ?
          </p>
          <Button className="bg-[#357AB7] hover:bg-[#295F8E] text-[#050a10] font-semibold">
            Nous contacter
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Testimonials Section ───────────────────────────────────────────────── */
function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const testimonials = [
    {
      quote:
        "Safyr a transformé notre gestion RH. Fini les dossiers papier, tout est centralisé et la conformité CNAPS est garantie à 100%.",
      author: "Jean-Philippe M.",
      role: "Directeur des opérations",
      company: "Sécurité Atlantis",
      rating: 5,
    },
    {
      quote:
        "Le module recrutement est incroyable. On a réduit notre temps de recrutement de 50% et la qualité des candidats s'est améliorée.",
      author: "Sophie L.",
      role: "Responsable RH",
      company: "Protect & Care",
      rating: 5,
    },
    {
      quote:
        "L'automatisation des déclarations DSN nous fait gagner des heures chaque mois. Un gain de productivité énorme.",
      author: "Michel R.",
      role: "Gérant",
      company: "Gardiennage Sud",
      rating: 5,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-28 bg-[#030712] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-linear(circle at 50% 50%, rgba(53,122,183,0.1) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-linear(#357AB7 1px, transparent 1px), linear-linear(to right, #357AB7 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-display">
            Ce que nos clients disent
          </h2>
          <p className="text-lg text-[#94a3b8]">
            Des centaines de sociétés de sécurité nous font confiance
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="relative group p-6 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
            >
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, rgba(53,122,183,0.1) 0%, transparent 70%)`,
                }}
              />

              {/* Quote icon */}
              <Quote
                size={32}
                className="absolute top-4 right-4 text-white/10"
              />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="text-[#fbbf24] fill-[#fbbf24]"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-[#94a3b8] leading-relaxed mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#357AB7] to-[#34d399] flex items-center justify-center text-white font-bold text-sm">
                  {testimonial.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {testimonial.author}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {testimonial.role} &mdash; {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Floating Back to Top ─────────────────────────────────────────────── */
function FloatingBackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-[#357AB7] text-[#030712] flex items-center justify-center shadow-lg shadow-[#357AB7]/30 hover:bg-[#295F8E] transition-colors"
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ─── CTA Section ─────────────────────────────────────────────────────────── */
function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="relative py-32 bg-[#030712] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 opacity-40">
          <div
            className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]"
            style={{
              background:
                "radial-gradient(circle, rgba(53,122,183,0.3) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px]"
            style={{
              background:
                "radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(#357AB7 1px, transparent 1px), linear-gradient(to right, #357AB7 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#357AB7]/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#357AB7]/40 to-transparent" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f1f5f9] mb-6 font-display leading-tight">
            Transformez votre gestion RH dès aujourd&apos;hui
          </h2>
          <p className="text-lg text-[#94a3b8] mb-10 max-w-2xl mx-auto leading-relaxed">
            Rejoignez les centaines de sociétés de sécurité privée qui font
            confiance à Safyr pour gérer leurs équipes efficacement.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button className="bg-[#357AB7] hover:bg-[#295F8E] text-[#030712] font-semibold px-10 py-4 text-lg rounded-xl shadow-lg shadow-[#357AB7]/20 hover:shadow-[#357AB7]/30 transition-all">
              Planifier une démo
              <ArrowRight size={20} className="ml-2" />
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-10 py-4 text-lg rounded-xl"
            >
              Nous contacter
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-8"
          >
            {[
              { icon: CheckCircle2, text: "Mise en place en 24h" },
              { icon: CheckCircle2, text: "Support dédié" },
              { icon: CheckCircle2, text: "Données hébergées en France" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-[#64748b]"
              >
                <item.icon size={14} className="text-[#34d399]" />
                {item.text}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Main Page Component ─────────────────────────────────────────────────── */
export default function HRSolutionsPage() {
  return (
    <main className="min-h-screen bg-[#030712]">
      {/* Section Navigation */}
      <SectionNavigation />

      {/* Hero */}
      <HeroSection />

      {/* Video Demo Section */}
      <VideoDemoSection />

      {/* Trusted By */}
      <TrustedBySection />

      {/* Certifications */}
      <CertificationsSection />

      {/* Stats Marquee */}
      <StatsMarquee />

      {/* Key Benefits */}
      <BenefitsSection />

      {/* Quick Features Grid */}
      <QuickFeatures />

      {/* Employee Journey Timeline */}
      <JourneyTimeline
        steps={journeySteps}
        title="Parcours de l'Employé"
        subtitle="Employee Journey"
      />

      <SectionDivider color="#357AB7" />

      {/* Business Function Sections */}
      {businessFunctions.map((bf, index) => (
        <BusinessFunctionSection
          key={bf.id}
          sectionId={bf.id}
          tabs={bf.tabs}
          title={bf.title}
          subtitle={bf.subtitle}
          description={bf.description}
          color={bf.color}
          glow={bf.glow}
          autoAdvanceInterval={7000 + index * 500}
        />
      ))}

      <SectionDivider color="#a78bfa" />

      {/* Workflows */}
      <WorkflowCard
        workflows={workflows}
        title="Workflows Détaillés"
        subtitle="Detailed Workflows"
      />

      <SectionDivider color="#34d399" />

      {/* Compliance */}
      <ComplianceChecklist
        items={complianceItems}
        statusColors={statusColors}
        statusLabels={statusLabels}
        title="Conformité Réglementaire"
        subtitle="Regulatory Compliance"
      />

      <SectionDivider color="#fb923c" />

      {/* Integration Ecosystem */}
      <IntegrationEcosystem
        modules={integrationModules}
        title="Écosystème d'Intégration"
        subtitle="Integration Ecosystem"
      />

      {/* FAQ */}
      <FAQSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA */}
      <CTASection />

      {/* Floating Back to Top */}
      <FloatingBackToTop />
    </main>
  );
}
