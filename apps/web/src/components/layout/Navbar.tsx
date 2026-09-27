"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { assets } from "@/config/assets";
import { useUiStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils";

type NavItem = (typeof siteConfig.nav)[number];

function isDropdownItem(
  item: NavItem,
): item is Extract<NavItem, { isDropdown: true }> {
  return "isDropdown" in item && item.isDropdown === true;
}

export default function Navbar() {
  const pathname = usePathname();
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUiStore();
  const [scrolled, setScrolled] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSolutionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (href: string) => {
    closeMobileMenu();
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const renderDesktopNavItem = (item: NavItem) => {
    if (isDropdownItem(item)) {
      return (
        <div key={item.label} className="relative" ref={dropdownRef}>
          <button
            onClick={() => setSolutionsOpen(!solutionsOpen)}
            onMouseEnter={() => setSolutionsOpen(true)}
            className={cn(
              "px-4 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer flex items-center gap-1",
              solutionsOpen || pathname.startsWith("/solutions")
                ? "text-[#357AB7] bg-[rgba(53,122,183,0.1)]"
                : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.05)]",
            )}
          >
            {item.label}
            <ChevronDown
              size={14}
              className={cn(
                "transition-transform duration-200",
                solutionsOpen && "rotate-180",
              )}
            />
          </button>
          <AnimatePresence>
            {solutionsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-200 bg-[#0f172a]/98 backdrop-blur-xl border border-[#2d4160]/60 rounded-lg shadow-xl overflow-hidden"
                onMouseLeave={() => setSolutionsOpen(false)}
              >
                <div className="grid grid-cols-4 divide-x divide-[#2d4160]/60">
                  {siteConfig.solutions.map((group) => (
                    <div key={group.group} className="py-3">
                      <div className="px-4 pb-2 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                        {group.group}
                      </div>
                      {group.items.map((solution) =>
                        solution.disabled ? (
                          <div
                            key={solution.slug}
                            className="block px-4 py-2 opacity-50 cursor-not-allowed"
                          >
                            <div className="text-sm text-[#94a3b8] font-medium">
                              {solution.title}
                            </div>
                            <div className="text-xs text-[#64748b] mt-0.5">
                              {solution.description}
                            </div>
                          </div>
                        ) : (
                          <Link
                            key={solution.slug}
                            href={`/solutions/${solution.slug}`}
                            onClick={() => setSolutionsOpen(false)}
                            className="block px-4 py-2 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                          >
                            <div className="text-sm text-[#f1f5f9] font-medium">
                              {solution.title}
                            </div>
                            <div className="text-xs text-[#94a3b8] mt-0.5">
                              {solution.description}
                            </div>
                          </Link>
                        ),
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (item.href.startsWith("#")) {
      return (
        <button
          key={item.label}
          onClick={() => handleNavClick(item.href)}
          className={cn(
            "px-4 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer",
            pathname === "/" && item.href === "/#how-it-works"
              ? "text-[#357AB7] bg-[rgba(53,122,183,0.1)]"
              : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.05)]",
          )}
        >
          {item.label}
        </button>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className={cn(
          "px-4 py-2 text-sm rounded-md transition-all duration-200",
          pathname === item.href
            ? "text-[#357AB7] bg-[rgba(53,122,183,0.1)]"
            : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.05)]",
        )}
      >
        {item.label}
      </Link>
    );
  };

  const renderMobileNavItem = (item: NavItem) => {
    if (isDropdownItem(item)) {
      return (
        <div key={item.label}>
          <button
            onClick={() => setMobileSolutionsOpen(!mobileSolutionsOpen)}
            className={cn(
              "w-full text-left px-4 py-3 rounded-lg transition-all text-sm flex items-center justify-between cursor-pointer",
              mobileSolutionsOpen || pathname.startsWith("/solutions")
                ? "text-[#357AB7] bg-[rgba(53,122,183,0.1)]"
                : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.05)]",
            )}
          >
            {item.label}
            <ChevronDown
              size={16}
              className={cn(
                "transition-transform duration-200",
                mobileSolutionsOpen && "rotate-180",
              )}
            />
          </button>
          {mobileSolutionsOpen && (
            <div className="pl-4 flex flex-col gap-1 mt-1 border-l border-[#2d4160]/60 ml-4">
              {siteConfig.solutions.map((group) => (
                <div key={group.group}>
                  <div className="px-4 py-2 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                    {group.group}
                  </div>
                  {group.items.map((solution) =>
                    solution.disabled ? (
                      <div
                        key={solution.slug}
                        className="block px-4 py-2 text-[#64748b] opacity-50 cursor-not-allowed rounded-lg text-sm"
                      >
                        {solution.title}
                      </div>
                    ) : (
                      <Link
                        key={solution.slug}
                        href={`/solutions/${solution.slug}`}
                        onClick={() => {
                          closeMobileMenu();
                          setMobileSolutionsOpen(false);
                        }}
                        className="block px-4 py-2 text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-all text-sm"
                      >
                        {solution.title}
                      </Link>
                    ),
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (item.href.startsWith("#")) {
      return (
        <button
          key={item.label}
          onClick={() => handleNavClick(item.href)}
          className="text-left px-4 py-3 text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-all text-sm cursor-pointer"
        >
          {item.label}
        </button>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className={cn(
          "text-left px-4 py-3 rounded-lg transition-all text-sm",
          pathname === item.href
            ? "text-[#357AB7] bg-[rgba(53,122,183,0.1)]"
            : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[rgba(255,255,255,0.05)]",
        )}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 backdrop-blur-md",
          scrolled
            ? "bg-[#0f172a]/95 border-b border-[#2d4160]/60 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
            : "bg-transparent",
        )}
      >
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label={`${siteConfig.name} — retour en haut`}
          >
            <Image
              src={assets.logo.src}
              alt={assets.logo.alt}
              width={assets.logo.width}
              height={assets.logo.height}
              priority
              className="h-20 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {siteConfig.nav.map((item) => renderDesktopNavItem(item))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="primary" size="sm" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => toggleMobileMenu()}
            className="md:hidden text-[#94a3b8] hover:text-[#f1f5f9] p-2 rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-all"
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 inset-x-0 z-40 bg-[#0f172a]/95 backdrop-blur-xl border-b border-[#2d4160] md:hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
              {siteConfig.nav.map((item) => renderMobileNavItem(item))}
              <div className="pt-3 flex flex-col gap-2 border-t border-[#2d4160]">
                <Button
                  variant="primary"
                  asChild
                  className="w-full justify-center"
                >
                  <Link href="/login">Connexion</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
