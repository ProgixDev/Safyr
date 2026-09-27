"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { siteConfig } from "@/config/site";

function useCountUp(target: string, isActive: boolean) {
  const shouldReduce = useReducedMotion();

  const getInitial = () => {
    if (!isActive || shouldReduce) return target;
    const match = target.match(/^[\d.]+(.*)$/);
    return match ? `0${match[1]}` : target;
  };

  const [display, setDisplay] = useState(getInitial);

  useEffect(() => {
    if (!isActive) return;

    if (shouldReduce) {
      const id = requestAnimationFrame(() => setDisplay(target));
      return () => cancelAnimationFrame(id);
    }

    const match = target.match(/^([\d.]+)(.*)$/);
    if (!match) {
      const id = requestAnimationFrame(() => setDisplay(target));
      return () => cancelAnimationFrame(id);
    }

    const end = parseFloat(match[1]);
    const suffix = match[2];
    const duration = 1400;
    const startTime = performance.now();
    let raf: number;

    function easeOutExpo(t: number) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = end * eased;

      const formatted = Number.isInteger(end)
        ? Math.round(current).toString()
        : current.toFixed(1);

      setDisplay(`${formatted}${suffix}`);

      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isActive, target, shouldReduce]);

  return display;
}

function StatCard({
  stat,
  index,
}: {
  stat: (typeof siteConfig.stats)[number];
  index: number;
}) {
  const [active, setActive] = useState(false);
  const displayed = useCountUp(stat.value, active);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: "easeOut" }}
      onAnimationComplete={() => setActive(true)}
      className="group relative flex flex-col items-center text-center px-6 py-6 rounded-xl border border-transparent hover:border-[#357AB7]/20 hover:bg-[#357AB7]/3 transition-all duration-300 cursor-default"
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(53,122,183,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Animated top border line on hover */}
      <div className="absolute top-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-[#357AB7]/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-400 rounded-full" />

      <span
        className="relative text-3xl sm:text-4xl font-bold text-[#357AB7] tabular-nums tracking-tight transition-all duration-300"
        style={{
          textShadow: "0 0 28px rgba(53,122,183,0.3)",
        }}
      >
        {displayed}
        <span
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            textShadow: "0 0 40px rgba(53,122,183,0.55)",
            color: "transparent",
          }}
          aria-hidden
        >
          {displayed}
        </span>
      </span>

      <span className="mt-2 text-sm text-[#64748b] group-hover:text-[#94a3b8] transition-colors duration-200 leading-snug max-w-30">
        {stat.label}
      </span>
    </motion.div>
  );
}

export default function Stats() {
  return (
    <section className="relative py-20 bg-[#0f172a] overflow-hidden">
      {/* Accent lines */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#357AB7]/40 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#357AB7]/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:divide-x lg:divide-[#2d4160]/60">
          {siteConfig.stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
