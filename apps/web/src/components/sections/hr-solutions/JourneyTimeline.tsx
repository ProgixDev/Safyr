"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ChevronRight, FolderOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

interface JourneyStep {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  modules: string[];
  icon: LucideIcon;
  color: string;
}

interface JourneyTimelineProps {
  steps: JourneyStep[];
  title?: string;
  subtitle?: string;
}

export default function JourneyTimeline({
  steps,
  title = "Parcours de l'Employé",
  subtitle = "Employee Journey",
}: JourneyTimelineProps) {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const step = steps[activeStep];
  const Icon = step.icon;

  return (
    <section
      ref={sectionRef}
      id="employee-journey"
      className="relative py-24 bg-[#060c14] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute top-0 left-0 w-[50%] h-[50%] rounded-full blur-[100px]"
            style={{
              background:
                "radial-gradient(circle, rgba(53,122,183,0.12) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full blur-[80px]"
            style={{
              background:
                "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)",
            }}
          />
        </div>
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(#357AB7 1px, transparent 1px), linear-gradient(to right, #357AB7 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-14"
        >
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#357AB7] block mb-3">
            {subtitle}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f5f9] font-display">
            {title}
          </h2>
          <p className="text-sm text-[#64748b] mt-3 max-w-sm mx-auto">
            Chaque étape du cycle de vie de l&apos;agent, gérée dans Safyr
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[340px_1fr] gap-6 lg:gap-10 items-start">
          {/* LEFT — step list */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="flex flex-col gap-1"
          >
            {steps.map((s, index) => {
              const StepIcon = s.icon;
              const isActive = index === activeStep;
              const isPast = index < activeStep;

              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(index)}
                  className={`
                    relative w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-300 group
                    ${
                      isActive
                        ? "border-white/10 bg-white/[0.04]"
                        : "border-transparent hover:border-white/6 hover:bg-white/[0.02]"
                    }
                  `}
                >
                  {/* Active background glow */}
                  {isActive && (
                    <motion.div
                      layoutId="journeyGlow"
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse at left center, ${s.color}12 0%, transparent 70%)`,
                      }}
                    />
                  )}

                  {/* Step number + icon */}
                  <div className="relative shrink-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor:
                          isActive || isPast ? `${s.color}18` : "#0f172a",
                        border: `1.5px solid ${isActive || isPast ? s.color : "#2d4160"}`,
                        boxShadow: isActive ? `0 0 14px ${s.color}40` : "none",
                      }}
                    >
                      <StepIcon
                        size={15}
                        style={{
                          color: isActive || isPast ? s.color : "#475569",
                        }}
                      />
                    </div>
                    {/* Connector */}
                    {index < steps.length - 1 && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-0.5 w-px h-2"
                        style={{
                          backgroundColor: isPast ? s.color : "#1e293b",
                        }}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 relative">
                    <span
                      className="text-[9px] font-bold tracking-[0.14em] uppercase block mb-0.5"
                      style={{
                        color: isActive || isPast ? s.color : "#3d5170",
                      }}
                    >
                      Étape {index + 1}
                    </span>
                    <p
                      className={`text-sm font-medium leading-tight transition-colors duration-300 truncate ${
                        isActive
                          ? "text-[#f1f5f9]"
                          : "text-[#64748b] group-hover:text-[#94a3b8]"
                      }`}
                    >
                      {s.title}
                    </p>
                  </div>

                  <ChevronRight
                    size={13}
                    className="shrink-0 transition-all duration-300"
                    style={{
                      color: isActive ? s.color : "#2d4160",
                      transform: isActive ? "translateX(2px)" : "none",
                    }}
                  />
                </button>
              );
            })}

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 px-4 pt-3">
              {steps.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(index)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: index === activeStep ? 20 : 6,
                    height: 6,
                    backgroundColor: index <= activeStep ? s.color : "#1e293b",
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* RIGHT — detail panel */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="sticky top-20"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: EASE }}
                className="relative rounded-2xl border border-white/10 bg-[#0b1220]/80 backdrop-blur-xl overflow-hidden"
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 inset-x-0 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${step.color}, transparent)`,
                  }}
                />

                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-px"
                  style={{
                    background: `linear-gradient(180deg, ${step.color}, transparent)`,
                  }}
                />

                {/* Glow behind panel */}
                <div
                  className="absolute top-0 left-0 w-[60%] h-[60%] pointer-events-none rounded-full blur-[80px]"
                  style={{
                    background: `radial-gradient(circle, ${step.color}18 0%, transparent 70%)`,
                  }}
                />

                <div className="relative p-7 sm:p-9">
                  {/* Header */}
                  <div className="flex items-start gap-5 mb-7">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${step.color}15`,
                        border: `1px solid ${step.color}30`,
                        boxShadow: `0 0 20px ${step.color}20`,
                      }}
                    >
                      <Icon size={26} style={{ color: step.color }} />
                    </div>
                    <div>
                      <span
                        className="text-[10px] font-bold tracking-[0.16em] uppercase block mb-1.5"
                        style={{ color: step.color }}
                      >
                        Étape {activeStep + 1} / {steps.length}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#f1f5f9] leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-sm text-[#64748b] mt-1.5 leading-relaxed max-w-lg">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/5 mb-7" />

                  {/* Modules */}
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#475569] mb-4">
                      Modules liés
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {step.modules.map((module, i) => (
                        <motion.div
                          key={module}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05, ease: EASE }}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all duration-200 hover:scale-[1.03]"
                          style={{
                            backgroundColor: `${step.color}08`,
                            borderColor: `${step.color}22`,
                          }}
                        >
                          <FolderOpen size={12} style={{ color: step.color }} />
                          <span
                            className="text-xs font-medium"
                            style={{ color: step.color }}
                          >
                            {module}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation arrows */}
                  <div className="flex items-center gap-3 mt-8">
                    <button
                      disabled={activeStep === 0}
                      onClick={() => setActiveStep((p) => p - 1)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/8 text-xs text-[#64748b] hover:text-white hover:border-white/16 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ChevronRight size={13} className="rotate-180" />
                      Précédent
                    </button>
                    <button
                      disabled={activeStep === steps.length - 1}
                      onClick={() => setActiveStep((p) => p + 1)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                      style={{
                        borderColor: `${step.color}40`,
                        color: step.color,
                        backgroundColor: `${step.color}08`,
                      }}
                    >
                      Suivant
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
