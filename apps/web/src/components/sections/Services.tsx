"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
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
} from "lucide-react";
import { siteConfig } from "@/config/site";

const SERVICE_COLORS = [
  { color: "#22d3ee", glow: "rgba(34,211,238,0.18)" },
  { color: "#a78bfa", glow: "rgba(167,139,250,0.18)" },
  { color: "#818cf8", glow: "rgba(129,140,248,0.18)" },
  { color: "#38bdf8", glow: "rgba(56,189,248,0.18)" },
  { color: "#fb923c", glow: "rgba(251,146,60,0.18)" },
  { color: "#34d399", glow: "rgba(52,211,153,0.18)" },
  { color: "#2dd4bf", glow: "rgba(45,212,191,0.18)" },
  { color: "#60a5fa", glow: "rgba(96,165,250,0.18)" },
  { color: "#f472b6", glow: "rgba(244,114,182,0.18)" },
  { color: "#e879f9", glow: "rgba(232,121,249,0.18)" },
] as const;

const iconMap: Record<string, React.ElementType> = {
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
};

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE },
  },
};

function ServiceCard({
  service,
  index,
}: {
  service: (typeof siteConfig.services)[number];
  index: number;
}) {
  const shouldReduce = useReducedMotion();
  const Icon = iconMap[service.icon] || Users;
  const { color } = SERVICE_COLORS[index % SERVICE_COLORS.length];

  return (
    <motion.div
      variants={cardVariants}
      whileHover={
        shouldReduce
          ? {}
          : {
              y: -6,
              transition: { duration: 0.22, ease: "easeOut" },
            }
      }
      className="group relative p-6 rounded-2xl border border-[#2d4160]/60 bg-[#1a2d45]/40 hover:border-[#2d4160] hover:bg-[#1a2d45]/80 transition-colors duration-300 overflow-hidden flex flex-col gap-4 cursor-default"
      style={
        {
          "--tw-border-color": "transparent",
        } as React.CSSProperties
      }
    >
      {/* Corner glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top left, ${color}10 0%, transparent 55%)`,
        }}
      />

      {/* Icon with animated pulse ring */}
      <div className="relative w-11 h-11 shrink-0">
        <motion.div
          className="absolute inset-0 rounded-xl border border-[#2d4160] group-hover:border-opacity-30"
          style={{
            borderColor: color,
            opacity: 0.3,
          }}
          animate={
            shouldReduce
              ? {}
              : {
                  scale: [1, 1.28, 1],
                  opacity: [0, 0.5, 0],
                }
          }
          transition={{
            duration: 2.2,
            delay: index * 0.15,
            ease: "easeOut",
          }}
        />
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon
            size={20}
            className="transition-transform duration-200"
            style={{ color }}
          />
        </div>
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[#f1f5f9] font-semibold text-sm leading-snug">
          {service.title}
        </h3>
        <p className="text-sm text-[#64748b] group-hover:text-[#94a3b8] transition-colors duration-200 leading-relaxed">
          {service.description}
        </p>
      </div>

      {/* Bottom sliding accent */}
      <div
        className="absolute bottom-0 inset-x-0 h-0.5 bg-linear-to-r from-transparent to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-center"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}70, transparent)`,
        }}
      />
    </motion.div>
  );
}

export default function Services() {
  return (
    <section
      id="services"
      className="relative py-28 bg-[#0f172a] overflow-hidden"
    >
      {/* Background radial */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-225 h-150"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(34,211,238,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-16 flex flex-col items-center gap-4"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#f1f5f9] max-w-2xl leading-tight font-display">
            Tout ce dont votre société de sécurité privée a besoin pour piloter
          </h2>
          <p className="text-base text-[#94a3b8] max-w-2xl">
            De la gestion RH à la comptabilité, en passant par le pilotage, la
            géolocalisation, la facturation, le stock et la main courante
            digitale, Safyr couvre chaque flux de travail dans une plateforme
            unique et unifiée.
          </p>
        </motion.div>

        {/* Services grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {siteConfig.services.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
