"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import Image from "next/image";
import { Quote, Star } from "lucide-react";
import { siteConfig } from "@/config/site";
import { assets } from "@/config/assets";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE },
  },
};

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} className="fill-[#f59e0b] text-[#f59e0b]" />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const shouldReduce = useReducedMotion();

  return (
    <section
      id="testimonials"
      className="relative py-28 bg-[#0f172a] overflow-hidden"
    >
      {/* Background radials */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-200 h-100"
          style={{
            background:
              "radial-gradient(ellipse at bottom, rgba(53,122,183,0.05) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-0 right-0 w-125 h-100"
          style={{
            background:
              "radial-gradient(circle at 90% 10%, rgba(53,122,183,0.03) 0%, transparent 60%)",
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
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#f1f5f9] leading-tight font-display">
            Ce que disent nos <span className="text-[#357AB7]">clients</span>
          </h2>
          <p className="text-base text-[#94a3b8] max-w-xl">
            Des centaines de sociétés de sécurité privée font confiance à Safyr
            pour gérer leurs équipes d&apos;agents de sécurité au quotidien.
          </p>

          {/* Aggregate rating */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className="fill-[#f59e0b] text-[#f59e0b]"
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-[#f1f5f9]">4.9</span>
            <span className="text-sm text-[#64748b]">· basé sur 200+ avis</span>
          </div>
        </motion.div>

        {/* Testimonials grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {siteConfig.testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={cardVariants}
              whileHover={
                shouldReduce
                  ? {}
                  : { y: -6, transition: { duration: 0.22, ease: "easeOut" } }
              }
              className="relative p-6 rounded-2xl border border-[#2d4160]/60 bg-[#1a2d45]/40 hover:border-[#357AB7]/30 hover:bg-[#1a2d45]/70 transition-colors duration-300 flex flex-col group cursor-default overflow-hidden"
            >
              {/* Corner glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-2xl"
                style={{
                  background:
                    "radial-gradient(circle at top left, rgba(53,122,183,0.06) 0%, transparent 55%)",
                }}
              />

              {/* Top: quote icon + stars */}
              <div className="flex items-center justify-between mb-4">
                <Quote
                  size={20}
                  className="text-[#357AB7]/40 group-hover:text-[#357AB7]/70 transition-colors duration-200 shrink-0"
                />
                <StarRating />
              </div>

              {/* Quote text */}
              <p className="text-sm text-[#94a3b8] leading-relaxed flex-1 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-[#2d4160]/60">
                <div className="relative shrink-0">
                  <Image
                    src={assets.avatars[t.avatar]}
                    alt={t.name}
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover border border-[#2d4160]"
                    loading="lazy"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10b981] border-2 border-[#1a2d45]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#f1f5f9] leading-tight">
                    {t.name}
                  </p>
                  <p className="text-xs text-[#64748b] leading-tight mt-0.5">
                    {t.title}
                  </p>
                </div>
              </div>

              {/* Animated bottom accent */}
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-linear-to-r from-transparent via-[#357AB7]/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-center" />
            </motion.div>
          ))}
        </motion.div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-16 flex flex-col items-center gap-5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#3d5170]">
            Ils nous font confiance
          </p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {[
              "Sécurité Gardiennage Pro",
              "Gardiennage Sécuritas",
              "Protection & Surveillance",
              "Gardiennage Express",
            ].map((name) => (
              <span
                key={name}
                className="text-sm font-medium text-[#2d4160] hover:text-[#64748b] transition-colors duration-200 cursor-default"
              >
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
