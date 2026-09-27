"use client";

import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const shouldReduce = useReducedMotion();

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faq" className="relative py-28 bg-[#1e293b] overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#357AB7]/20 to-transparent" />

      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-175 h-100 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(53,122,183,0.04) 0%, transparent 65%)",
        }}
      />

      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-14 flex flex-col items-center gap-4"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#f1f5f9] leading-tight font-display">
            Questions <span className="text-[#357AB7]">fréquemment posées</span>
          </h2>
          <p className="text-[#94a3b8] text-base max-w-md">
            Tout ce que vous devez savoir avant de prendre une décision.
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="flex flex-col gap-2">
          {siteConfig.faq.map((item, i) => {
            const isOpen = openIndex === i;

            return (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.07,
                  ease: EASE,
                }}
                className={cn(
                  "relative rounded-xl border transition-colors duration-250 overflow-hidden",
                  isOpen
                    ? "border-[#357AB7]/35 bg-[#0f172a]/70"
                    : "border-[#2d4160]/60 bg-[#1a2d45]/30 hover:border-[#2d4160] hover:bg-[#1a2d45]/50",
                )}
              >
                {/* Left border accent — slides in when open */}
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-0.75 rounded-l-xl bg-linear-to-b from-[#357AB7]/80 via-[#357AB7] to-[#357AB7]/40"
                  initial={false}
                  animate={
                    shouldReduce
                      ? { opacity: isOpen ? 1 : 0 }
                      : {
                          scaleY: isOpen ? 1 : 0,
                          opacity: isOpen ? 1 : 0,
                          originY: 0,
                        }
                  }
                  transition={{ duration: 0.3, ease: EASE }}
                />

                {/* Glow when open */}
                <div
                  className={cn(
                    "absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-xl",
                    isOpen ? "opacity-100" : "opacity-0",
                  )}
                  style={{
                    background:
                      "radial-gradient(ellipse at left center, rgba(53,122,183,0.05) 0%, transparent 60%)",
                  }}
                />

                {/* Question button */}
                <button
                  onClick={() => toggle(i)}
                  className="relative w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer group"
                  aria-expanded={isOpen}
                >
                  <span
                    className={cn(
                      "font-medium text-base transition-colors duration-200",
                      isOpen
                        ? "text-[#f1f5f9]"
                        : "text-[#94a3b8] group-hover:text-[#e2e8f0]",
                    )}
                  >
                    {item.question}
                  </span>

                  {/* Icon */}
                  <span
                    className={cn(
                      "shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300",
                      isOpen
                        ? "border-[#357AB7]/50 bg-[#357AB7]/10 text-[#357AB7]"
                        : "border-[#2d4160] bg-transparent text-[#64748b] group-hover:border-[#3d5170] group-hover:text-[#94a3b8]",
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isOpen ? (
                        <motion.span
                          key="minus"
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Minus size={14} />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="plus"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Plus size={14} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </button>

                {/* Answer */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
                        opacity: { duration: 0.22, ease: "easeOut" },
                      }}
                    >
                      <div className="px-6 pb-5 pl-7">
                        <p className="text-sm text-[#94a3b8] leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA below accordion */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-[#64748b]">
            Vous avez d&apos;autres questions ?{" "}
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector("#contact")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-[#357AB7] hover:text-[#295F8E] underline underline-offset-2 transition-colors duration-200 cursor-pointer"
            >
              Contactez notre équipe
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
