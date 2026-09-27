"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

interface IntegrationModule {
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

interface IntegrationEcosystemProps {
  modules: IntegrationModule[];
  title?: string;
  subtitle?: string;
}

/* ─── Integration Module Card ─────────────────────────────────────────────── */
function ModuleCard({
  module,
  index,
  isCenter,
}: {
  module: IntegrationModule;
  index: number;
  isCenter: boolean;
}) {
  const Icon = module.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: EASE }}
      className={`
        relative p-5 rounded-2xl border transition-all duration-300 group
        ${
          isCenter
            ? "border-white/12 bg-white/[0.03]"
            : "border-white/6 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]"
        }
      `}
    >
      {/* Glow effect for center module */}
      {isCenter && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${module.color}15 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="relative flex flex-col items-center text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${module.color}15`,
            border: `1px solid ${module.color}30`,
          }}
        >
          <Icon size={26} style={{ color: module.color }} />
        </div>
        <h3 className="text-base font-bold text-[#f1f5f9] mb-1">
          {module.name}
        </h3>
        <p className="text-xs text-[#64748b]">{module.description}</p>

        {/* Connection points for center module */}
        {isCenter && (
          <>
            {/* Top connector */}
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3"
              style={{ backgroundColor: module.color }}
            />
            {/* Right connector */}
            <div
              className="absolute top-1/2 -right-3 w-3 h-px"
              style={{ backgroundColor: module.color }}
            />
            {/* Bottom connector */}
            <div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-px h-3"
              style={{ backgroundColor: module.color }}
            />
            {/* Left connector */}
            <div
              className="absolute top-1/2 -left-3 w-3 h-px"
              style={{ backgroundColor: module.color }}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function IntegrationEcosystem({
  modules,
  title = "Écosystème d'Intégration",
}: IntegrationEcosystemProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  // Find center module (first one with highest importance)
  const centerIndex = 0;

  return (
    <section
      ref={sectionRef}
      id="integrations"
      className="relative py-28 bg-[#030712] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient mesh */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px]"
            style={{
              background:
                "radial-gradient(circle, rgba(251,146,60,0.2) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[80px]"
            style={{
              background:
                "radial-gradient(circle, rgba(53,122,183,0.15) 0%, transparent 70%)",
            }}
          />
        </div>

        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(#357AB7 1px, transparent 1px), linear-gradient(to right, #357AB7 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#f1f5f9] font-display mb-4">
            {title}
          </h2>
          <p className="text-lg text-[#94a3b8] max-w-lg mx-auto">
            Le module RH communique parfaitement avec tous les autres modules
            Safyr
          </p>
        </motion.div>

        {/* Integration grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {modules.map((module, index) => (
            <ModuleCard
              key={module.name}
              module={module}
              index={index}
              isCenter={index === centerIndex}
            />
          ))}
        </motion.div>

        {/* Connection lines visualization */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          <div className="flex items-center gap-2 text-xs text-[#64748b]">
            <CheckCircle2 size={14} className="text-[#34d399]" />
            <span>Synchronisation automatique des données</span>
          </div>
          <div className="w-px h-4 bg-[#2d4160] hidden sm:block" />
          <div className="flex items-center gap-2 text-xs text-[#64748b]">
            <CheckCircle2 size={14} className="text-[#34d399]" />
            <span>Mise à jour en temps réel</span>
          </div>
          <div className="w-px h-4 bg-[#2d4160] hidden sm:block" />
          <div className="flex items-center gap-2 text-xs text-[#64748b]">
            <CheckCircle2 size={14} className="text-[#34d399]" />
            <span>API ouverte disponible</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
