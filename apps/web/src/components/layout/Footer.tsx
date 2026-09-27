"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Linkedin, Twitter, Github, Youtube } from "lucide-react";
import { siteConfig } from "@/config/site";
import { assets } from "@/config/assets";

function AnimatedContainer({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const shouldReduce = useReducedMotion();
  if (shouldReduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const socialLinks = [
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Twitter, href: "#", label: "Twitter / X" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#0f172a] border-t border-[#2d4160]/60">
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#357AB7]/30 to-transparent" />

      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-175 h-75 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(53,122,183,0.03) 0%, transparent 65%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <AnimatedContainer delay={0} className="lg:col-span-1">
            <div className="mb-5">
              <Image
                src={assets.logo.src}
                alt={assets.logo.alt}
                width={assets.logo.footerWidth}
                height={assets.logo.footerHeight}
                className="h-52 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-[#64748b] leading-relaxed mb-6 max-w-xs">
              {siteConfig.footer.tagline}
            </p>
            <div className="flex gap-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg border border-[#2d4160] flex items-center justify-center text-[#64748b] hover:text-[#357AB7] hover:border-[#357AB7]/40 hover:bg-[#357AB7]/5 transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </AnimatedContainer>

          {/* Link columns */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {siteConfig.footer.links.map((col, i) => (
              <AnimatedContainer key={col.label} delay={0.1 + i * 0.09}>
                <h4 className="text-xs font-semibold text-[#f1f5f9] uppercase tracking-widest mb-4">
                  {col.label}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {col.items.map((item) => (
                    <li key={item.title}>
                      <a
                        href={item.href}
                        className="text-sm text-[#64748b] hover:text-[#94a3b8] hover:translate-x-0.5 inline-block transition-all duration-200"
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </AnimatedContainer>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-14 pt-6 border-t border-[#2d4160]/40 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <p className="text-xs text-[#64748b]">
            © {new Date().getFullYear()}{" "}
            <span className="text-[#94a3b8] font-medium">
              {siteConfig.name}
            </span>
            . Tous droits réservés.
          </p>
          <div className="flex gap-5">
            <a
              href="#"
              className="text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors duration-200"
            >
              Politique de confidentialité
            </a>
            <a
              href="#"
              className="text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors duration-200"
            >
              Conditions d&apos;utilisation
            </a>
            <a
              href="#"
              className="text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors duration-200"
            >
              Politique des cookies
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
