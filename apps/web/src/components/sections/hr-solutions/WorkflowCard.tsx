"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ChevronDown, Clock, FolderOpen } from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  duration?: string;
}

interface Workflow {
  id: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  modules: string[];
  color: string;
}

interface WorkflowCardProps {
  workflows: Workflow[];
  title?: string;
  subtitle?: string;
}

/* ─── Single Workflow Item ───────────────────────────────────────────────── */
function WorkflowItem({
  workflow,
  isExpanded,
  onToggle,
}: {
  workflow: Workflow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-xl border border-white/6 bg-white/[0.02] overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${workflow.color}18` }}
          >
            <span
              className="text-sm font-bold"
              style={{ color: workflow.color }}
            >
              {workflow.steps.length}
            </span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#f1f5f9]">
              {workflow.title}
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              {workflow.description}
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className="shrink-0 text-[#475569] transition-transform duration-300"
          style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
        />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/6 pt-4">
              {/* Steps */}
              <div className="space-y-3 mb-5">
                {workflow.steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          backgroundColor: `${workflow.color}15`,
                          color: workflow.color,
                        }}
                      >
                        {index + 1}
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <div
                          className="w-px h-6"
                          style={{ backgroundColor: `${workflow.color}20` }}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#e2e8f0]">
                          {step.title}
                        </p>
                        {step.duration && (
                          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#64748b]">
                            <Clock size={9} />
                            {step.duration}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modules */}
              <div className="flex flex-wrap gap-2">
                {workflow.modules.map((module) => (
                  <div
                    key={module}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
                    style={{
                      backgroundColor: `${workflow.color}08`,
                      borderColor: `${workflow.color}20`,
                    }}
                  >
                    <FolderOpen size={11} style={{ color: workflow.color }} />
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: `${workflow.color}90` }}
                    >
                      {module}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function WorkflowCard({
  workflows,
  title = "Workflows Détaillés",
}: WorkflowCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    workflows[0]?.id || null,
  );
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      id="workflows"
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
                "radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[80px]"
            style={{
              background:
                "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)",
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
            Visualisez et comprenez les processus clés de la gestion RH
          </p>
        </motion.div>

        {/* Workflows list */}
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <WorkflowItem
              key={workflow.id}
              workflow={workflow}
              isExpanded={expandedId === workflow.id}
              onToggle={() =>
                setExpandedId(expandedId === workflow.id ? null : workflow.id)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
