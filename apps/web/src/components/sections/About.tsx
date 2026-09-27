"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import type { Variants } from "framer-motion";
import Image from "next/image";
import { Shield, Zap, Users, BarChart3 } from "lucide-react";
import { siteConfig } from "@/config/site";
import { assets } from "@/config/assets";

const iconMap: Record<string, React.ElementType> = {
  Shield,
  Zap,
  Users,
  BarChart3,
};

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: i * 0.1,
      ease: EASE,
    },
  }),
};

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-28 bg-[#1e293b] overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute right-0 top-0 w-150 h-150"
          style={{
            background:
              "radial-gradient(circle at 80% 20%, rgba(53,122,183,0.05) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute left-0 bottom-0 w-100 h-100"
          style={{
            background:
              "radial-gradient(circle at 20% 80%, rgba(53,122,183,0.03) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — image with parallax */}
          <motion.div
            initial={{ opacity: 0, x: -48, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="relative"
          >
            <motion.div
              style={shouldReduce ? {} : { y: imageY }}
              className="relative rounded-2xl overflow-hidden border border-[#2d4160]/60 shadow-[0_16px_56px_rgba(0,0,0,0.55)]"
            >
              <Image
                src={assets.images.team}
                alt="Équipe de sécurité privée au travail"
                width={800}
                height={420}
                className="w-full h-105 object-cover"
                loading="lazy"
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-linear-to-t from-[#1e293b]/80 via-transparent to-transparent" />

              {/* Floating stat badge */}
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                className="absolute bottom-5 left-5 bg-[#0f172a]/90 backdrop-blur-sm border border-[#2d4160] rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-[#357AB7]/10 flex items-center justify-center">
                  <Zap size={22} className="text-[#357AB7]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#f1f5f9]">3×</p>
                  <p className="text-xs text-[#64748b]">
                    Traitement RH plus rapide
                  </p>
                </div>
              </motion.div>

              {/* Top-right corner accent */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.55, duration: 0.4 }}
                className="absolute top-4 right-4 bg-[#0f172a]/80 backdrop-blur-sm border border-[#357AB7]/30 rounded-lg px-3 py-1.5 flex items-center gap-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
                </span>
                <span className="text-xs text-[#94a3b8] font-medium">
                  Plateforme en direct
                </span>
              </motion.div>
            </motion.div>

            {/* Dot grid accent */}
            <div
              className="absolute -bottom-8 -left-8 w-40 h-40 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #357AB7 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />

            {/* Vertical accent line */}
            <div className="absolute -right-1 top-8 bottom-8 w-px bg-linear-to-b from-transparent via-[#357AB7]/20 to-transparent hidden lg:block" />
          </motion.div>

          {/* Right — content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="flex flex-col gap-6"
          >
            <motion.h2
              variants={itemVariants}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#f1f5f9] leading-tight font-display"
            >
              {siteConfig.about.headline}
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-base text-[#94a3b8] leading-relaxed"
            >
              {siteConfig.about.body}
            </motion.p>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="h-px bg-linear-to-r from-[#357AB7]/20 via-[#357AB7]/10 to-transparent"
            />

            {/* Values grid */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 gap-3"
            >
              {siteConfig.about.values.map((v, i) => {
                const Icon = iconMap[v.icon] || Shield;
                return (
                  <motion.div
                    key={v.label}
                    custom={i}
                    variants={cardVariants}
                    whileHover={
                      shouldReduce
                        ? {}
                        : { y: -3, transition: { duration: 0.2 } }
                    }
                    className="flex items-center gap-3 p-4 rounded-xl bg-[#0f172a]/60 border border-[#2d4160]/60 hover:border-[#357AB7]/30 hover:bg-[#0f172a]/80 transition-colors group cursor-default"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#357AB7]/10 flex items-center justify-center shrink-0 group-hover:bg-[#357AB7]/20 transition-colors">
                      <Icon size={18} className="text-[#357AB7]" />
                    </div>
                    <span className="text-sm text-[#94a3b8] group-hover:text-[#f1f5f9] transition-colors font-medium leading-tight">
                      {v.label}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
