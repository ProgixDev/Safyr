"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BeamsBackground } from "@/components/ui/beams-background";
import { siteConfig } from "@/config/site";

import type { Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, x: 48, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const HEADLINE_HIGHLIGHT = [
  "RH",
  "Main",
  "courante",
  "digitale",
  "Gardiennage",
];

const PARTICLES = [
  { x: "12%", y: "22%", size: 3, delay: 0 },
  { x: "88%", y: "18%", size: 2, delay: 0.8 },
  { x: "6%", y: "68%", size: 2.5, delay: 1.4 },
  { x: "92%", y: "72%", size: 3, delay: 0.4 },
  { x: "50%", y: "8%", size: 2, delay: 1.1 },
  { x: "75%", y: "88%", size: 2.5, delay: 0.6 },
  { x: "20%", y: "90%", size: 2, delay: 1.7 },
  { x: "60%", y: "15%", size: 1.5, delay: 2.0 },
];

export default function Hero() {
  const shouldReduce = useReducedMotion();

  const handleScroll = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-linear-to-b from-[#0f172a] via-[#0f172a] to-[#1e293b]"
    >
      {/* Animated beam background */}
      <BeamsBackground className="absolute inset-0" intensity="subtle" />

      {/* Radial center glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-225 h-150"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(34,211,238,0.09) 0%, transparent 68%)",
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(to right, #22d3ee 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Floating particles */}
      {!shouldReduce &&
        PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#22d3ee] pointer-events-none"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.8, 1.4, 0.8],
              y: [0, -12, 0],
            }}
            transition={{
              duration: 4 + i * 0.5,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6 text-left"
          >
            {/* Headline with shimmer highlight */}
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#f1f5f9] leading-[1.15] font-display"
            >
              {siteConfig.hero.headline
                .split(" ")
                .reduce<React.ReactNode[]>((acc, word, i, arr) => {
                  const isHighlighted =
                    HEADLINE_HIGHLIGHT.includes(word) ||
                    HEADLINE_HIGHLIGHT.some((h) => word.startsWith(h));
                  acc.push(
                    isHighlighted ? (
                      <span
                        key={i}
                        className="relative inline-block text-[#22d3ee]"
                        style={{
                          textShadow: "0 0 32px rgba(34,211,238,0.45)",
                        }}
                      >
                        {word}
                        {/* shimmer sweep */}
                        {!shouldReduce && (
                          <motion.span
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background:
                                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)",
                              backgroundSize: "200% 100%",
                            }}
                            animate={{
                              backgroundPosition: ["-100% 0", "200% 0"],
                            }}
                            transition={{
                              duration: 2.4,
                              delay: 1.2 + i * 0.08,
                              ease: "linear",
                            }}
                          />
                        )}
                        {i < arr.length - 1 ? " " : ""}
                      </span>
                    ) : (
                      <span key={i}>
                        {word}
                        {i < arr.length - 1 ? " " : ""}
                      </span>
                    ),
                  );
                  return acc;
                }, [])}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-[#94a3b8] leading-relaxed max-w-xl"
            >
              {siteConfig.hero.subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 mt-2"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleScroll(siteConfig.hero.ctaHref)}
                className="group"
              >
                {siteConfig.hero.cta}
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleScroll(siteConfig.hero.secondaryCtaHref)}
                className="group border border-[#2d4160] hover:border-[#22d3ee]/40 bg-transparent text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#22d3ee]/5 transition-all"
              >
                <ChevronDown
                  size={16}
                  className="group-hover:translate-y-0.5 transition-transform duration-200"
                />
                {siteConfig.hero.secondaryCta}
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3 mt-2"
            >
              <div className="flex -space-x-2.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-[#1e293b]"
                    style={{
                      backgroundImage: `url(https://i.pravatar.cc/32?img=${10 + i})`,
                      backgroundSize: "cover",
                    }}
                  />
                ))}
              </div>
              <p className="text-sm text-[#94a3b8]">
                Approuvé par{" "}
                <span className="text-[#f1f5f9] font-semibold">
                  plus de 200 sociétés
                </span>{" "}
                de sécurité privée en France
              </p>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-1"
            >
              {[
                "SOC 2 Type II",
                "Données hébergées en France",
                "Support 24/7",
              ].map((label) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 text-xs text-[#64748b]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]/60 shrink-0" />
                  {label}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right column — dashboard + mobile app */}
          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-4xl">
              {/* Glow behind the entire composition */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.15) 0%, transparent 65%)",
                  filter: "blur(32px)",
                  transform: "scale(1.1)",
                }}
              />

              {/* Dashboard preview — RH module video */}
              <div className="relative rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10">
                {/* Top accent line */}
                <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#22d3ee]/60 to-transparent z-10" />
                <video
                  src="https://res.cloudinary.com/dpo7sqgyg/video/upload/rh_f6xn0n.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Mobile phone mockup — real app video */}
              <motion.div
                initial={{ opacity: 0, x: 32, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                className="absolute -right-10 sm:-right-16 bottom-16 w-40 sm:w-52"
              >
                {/* Phone frame */}
                <div className="relative rounded-[2rem] overflow-hidden border-4 border-[#1e293b] shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-[#0f172a]">
                  {/* Phone notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#1e293b] rounded-b-2xl z-10" />
                  {/* Video screen */}
                  <video
                    src="https://res.cloudinary.com/dpo7sqgyg/video/upload/demo_mg9dxg.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-auto object-cover"
                  />
                </div>
              </motion.div>

              {/* Bottom gradient fade */}
              <div className="absolute bottom-0 inset-x-0 h-24 bg-linear-to-t from-[#0f172a] to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      {!shouldReduce && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 cursor-pointer"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.5 }}
          onClick={() => handleScroll("#about")}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#3d5170]">
            Découvrir
          </span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          >
            <ChevronDown size={16} className="text-[#3d5170]" />
          </motion.div>
        </motion.div>
      )}

      {/* Bottom section fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-linear-to-t from-[#0f172a] to-transparent pointer-events-none" />
    </section>
  );
}
