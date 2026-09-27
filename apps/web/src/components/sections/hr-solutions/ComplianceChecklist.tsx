"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock,
  FolderOpen,
  Zap,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

interface ComplianceItem {
  title: string;
  description: string;
  status: "automatisé" | "inclus" | "alertes" | "tracking";
  modules: string[];
}

interface ComplianceChecklistProps {
  items: ComplianceItem[];
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  title?: string;
  subtitle?: string;
}

/* ─── Status Badge ─────────────────────────────────────────────────────────── */
function StatusBadge({
  status,
  color,
  label,
}: {
  status: string;
  color: string;
  label: string;
}) {
  const icons: Record<string, LucideIcon> = {
    automatisé: Zap,
    inclus: CheckCircle2,
    alertes: Clock,
    tracking: Info,
  };

  const Icon = icons[status] || Info;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border"
      style={{
        backgroundColor: `${color}12`,
        borderColor: `${color}30`,
        color: color,
      }}
    >
      <Icon size={10} />
      {label}
    </div>
  );
}

/* ─── Compliance Item ───────────────────────────────────────────────────── */
function ComplianceItemRow({
  item,
  index,
  statusColor,
  statusLabel,
}: {
  item: ComplianceItem;
  index: number;
  statusColor: string;
  statusLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: EASE }}
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors"
    >
      {/* Status indicator */}
      <div className="shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${statusColor}15` }}
        >
          {statusColor === "#34d399" ? (
            <CheckCircle2 size={16} style={{ color: statusColor }} />
          ) : statusColor === "#357AB7" ? (
            <CheckCircle2 size={16} style={{ color: statusColor }} />
          ) : (
            <Circle size={16} style={{ color: statusColor }} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#f1f5f9]">{item.title}</h3>
          <StatusBadge
            status={item.status}
            color={statusColor}
            label={statusLabel}
          />
        </div>
        <p className="text-xs text-[#64748b] mt-1">{item.description}</p>
      </div>

      {/* Modules */}
      <div className="flex flex-wrap gap-1.5 sm:shrink-0 sm:ml-4">
        {item.modules.slice(0, 2).map((module) => (
          <div
            key={module}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5"
          >
            <FolderOpen size={9} className="text-[#475569]" />
            <span className="text-[10px] text-[#64748b]">{module}</span>
          </div>
        ))}
        {item.modules.length > 2 && (
          <span className="text-[10px] text-[#475569] self-center">
            +{item.modules.length - 2}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function ComplianceChecklist({
  items,
  statusColors,
  statusLabels,
  title = "Conformité Réglementaire",
}: ComplianceChecklistProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  // Calculate stats
  const stats = {
    automatisé: items.filter((i) => i.status === "automatisé").length,
    inclus: items.filter((i) => i.status === "inclus").length,
    alertes: items.filter((i) => i.status === "alertes").length,
    tracking: items.filter((i) => i.status === "tracking").length,
  };

  return (
    <section
      ref={sectionRef}
      id="compliance"
      className="relative py-28 bg-[#030712] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient mesh */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px]"
            style={{
              background:
                "radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[80px]"
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
            Tous vos obligations légales suivies et automatisées
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          {Object.entries(stats).map(([status, count]) => (
            <div
              key={status}
              className="flex flex-col items-center p-4 rounded-xl border"
              style={{
                backgroundColor: `${statusColors[status]}08`,
                borderColor: `${statusColors[status]}20`,
              }}
            >
              <p
                className="text-2xl font-bold"
                style={{ color: statusColors[status] }}
              >
                {count}
              </p>
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider mt-1">
                {statusLabels[status]}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Items list */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <ComplianceItemRow
              key={item.title}
              item={item}
              index={index}
              statusColor={statusColors[item.status]}
              statusLabel={statusLabels[item.status]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
