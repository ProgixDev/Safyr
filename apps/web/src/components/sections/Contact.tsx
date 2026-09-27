"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useUiStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils";

import type { Variants } from "framer-motion";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE },
  },
};

function FormField({
  id,
  name,
  label,
  type = "text",
  required = false,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-[#94a3b8]">
        {label} {required && <span className="text-[#357AB7]">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full h-10 px-3 rounded-lg bg-[#0f172a] border text-[#f1f5f9] text-sm placeholder:text-[#3d5170] focus:outline-none transition-all duration-200"
          style={{
            borderColor: focused ? "rgba(53,122,183,0.55)" : "rgba(45,65,96,1)",
            boxShadow: focused
              ? "0 0 0 3px rgba(53,122,183,0.08), inset 0 1px 2px rgba(0,0,0,0.2)"
              : "inset 0 1px 2px rgba(0,0,0,0.2)",
          }}
        />
        {/* Animated bottom highlight */}
        <motion.div
          className="absolute bottom-0 left-3 right-3 h-px bg-linear-to-r from-transparent via-[#357AB7] to-transparent rounded-full"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={
            focused ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }
          }
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function TextAreaField({
  id,
  name,
  label,
  required = false,
  placeholder,
  value,
  rows = 4,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  rows?: number;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-[#94a3b8]">
        {label} {required && <span className="text-[#357AB7]">*</span>}
      </label>
      <div className="relative">
        <textarea
          id={id}
          name={name}
          required={required}
          rows={rows}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-lg bg-[#0f172a] border text-[#f1f5f9] text-sm placeholder:text-[#3d5170] focus:outline-none transition-all duration-200 resize-none"
          style={{
            borderColor: focused ? "rgba(53,122,183,0.55)" : "rgba(45,65,96,1)",
            boxShadow: focused
              ? "0 0 0 3px rgba(53,122,183,0.08), inset 0 1px 2px rgba(0,0,0,0.2)"
              : "inset 0 1px 2px rgba(0,0,0,0.2)",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-3 right-3 h-px bg-linear-to-r from-transparent via-[#357AB7] to-transparent rounded-full"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={
            focused ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }
          }
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function Contact() {
  const shouldReduce = useReducedMotion();
  const { contactFormSubmitted: submitted, setContactFormSubmitted } =
    useUiStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setContactFormSubmitted(true);
    setLoading(false);
  };

  const contactDetails = [
    {
      icon: Mail,
      label: "Envoyez-nous un e-mail",
      value: siteConfig.contact.email,
      href: `mailto:${siteConfig.contact.email}`,
    },
    {
      icon: Phone,
      label: "Appelez-nous",
      value: siteConfig.contact.phone,
      href: `tel:${siteConfig.contact.phone}`,
    },
    {
      icon: MapPin,
      label: "Visitez-nous",
      value: siteConfig.contact.address,
      href: "#",
    },
  ];

  const perks = [
    { icon: Zap, text: "Réponse sous 24h" },
    { icon: Clock, text: "Démo en 30 minutes" },
  ];

  return (
    <section
      id="contact"
      className="relative py-28 bg-[#0f172a] overflow-hidden"
    >
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-175 h-112.5"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(53,122,183,0.07) 0%, transparent 68%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-100 h-100"
          style={{
            background:
              "radial-gradient(circle at 90% 90%, rgba(53,122,183,0.03) 0%, transparent 60%)",
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
            {siteConfig.contact.headline}
          </h2>
          <p className="text-base text-[#94a3b8] max-w-xl">
            {siteConfig.contact.subheadline}
          </p>

          {/* Perks row */}
          <div className="flex flex-wrap justify-center gap-4 mt-1">
            {perks.map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-1.5 text-sm text-[#64748b]"
              >
                <Icon size={14} className="text-[#357AB7]/70 shrink-0" />
                {text}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10 items-start">
          {/* Left — contact info */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="lg:col-span-2 flex flex-col gap-4"
          >
            {contactDetails.map((detail) => (
              <motion.a
                key={detail.label}
                variants={itemVariants}
                href={detail.href}
                whileHover={
                  shouldReduce ? {} : { x: 4, transition: { duration: 0.2 } }
                }
                className="flex items-start gap-4 p-5 rounded-xl border border-[#2d4160]/60 bg-[#1a2d45]/40 hover:border-[#357AB7]/40 hover:bg-[#1a2d45]/70 transition-colors duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#357AB7]/10 flex items-center justify-center shrink-0 group-hover:bg-[#357AB7]/20 transition-colors duration-200 mt-0.5">
                  <detail.icon size={18} className="text-[#357AB7]" />
                </div>
                <div>
                  <p className="text-xs text-[#64748b] mb-0.5">
                    {detail.label}
                  </p>
                  <p className="text-sm text-[#94a3b8] group-hover:text-[#f1f5f9] transition-colors duration-200 leading-relaxed">
                    {detail.value}
                  </p>
                </div>
              </motion.a>
            ))}

            {/* Trust note */}
            <motion.div
              variants={itemVariants}
              className="mt-2 p-5 rounded-xl border border-[#357AB7]/15 bg-[#357AB7]/3"
            >
              <p className="text-xs text-[#64748b] leading-relaxed">
                🔒{" "}
                <span className="text-[#94a3b8] font-medium">
                  Vos données sont protégées.
                </span>{" "}
                Nous ne partageons jamais vos informations avec des tiers et ne
                vous enverrons jamais de spam.
              </p>
            </motion.div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, x: 36, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.75, delay: 0.2, ease: EASE }}
            className="lg:col-span-3"
          >
            {/* CTA highlight banner */}
            {!submitted && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-[#357AB7]/25 bg-[#357AB7]/5"
              >
                <div className="relative shrink-0">
                  <span className="absolute inset-0 rounded-full bg-[#10b981] animate-ping opacity-60" />
                  <span className="relative flex w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                </div>
                <p className="text-sm text-[#94a3b8]">
                  <span className="text-[#357AB7] font-medium">
                    Nous répondons en moins de 24h
                  </span>{" "}
                  — réservez votre démo personnalisée dès maintenant.
                </p>
              </motion.div>
            )}

            <div className="p-8 rounded-2xl border border-[#2d4160]/60 bg-[#1a2d45]/40 relative overflow-hidden">
              {/* Subtle top glow inside card */}
              <div
                className="absolute top-0 inset-x-0 h-px"
                style={{
                  background:
                    "linear-gradient(to right, transparent, rgba(53,122,183,0.3), transparent)",
                }}
              />

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -12 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="flex flex-col items-center justify-center gap-5 py-12 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.1,
                        duration: 0.5,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                    >
                      <CheckCircle2 size={52} className="text-[#10b981]" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#f1f5f9] mb-2">
                        Message envoyé !
                      </h3>
                      <p className="text-[#94a3b8] text-sm max-w-sm">
                        Merci de nous avoir contactés. Notre équipe vous
                        répondra dans un délai d&apos;un jour ouvrable.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setContactFormSubmitted(false)}
                      className="border border-[#2d4160] bg-transparent text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#3d5170]"
                    >
                      Envoyer un autre message
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4"
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        id="name"
                        name="name"
                        label="Nom complet"
                        required
                        placeholder="Jean Dupont"
                        value={form.name}
                        onChange={handleChange}
                      />
                      <FormField
                        id="email"
                        name="email"
                        label="E-mail professionnel"
                        type="email"
                        required
                        placeholder="jean@entreprise.com"
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>

                    <FormField
                      id="company"
                      name="company"
                      label="Nom de l'entreprise"
                      placeholder="Acme Corp"
                      value={form.company}
                      onChange={handleChange}
                    />

                    <TextAreaField
                      id="message"
                      name="message"
                      label="Message"
                      required
                      rows={4}
                      placeholder="Parlez-nous de la taille de votre équipe et de ce que vous souhaitez résoudre..."
                      value={form.message}
                      onChange={handleChange}
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading}
                      className={cn(
                        "mt-2 w-full justify-center transition-all duration-200",
                        loading && "opacity-70 cursor-not-allowed",
                      )}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="animate-spin w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Envoi en cours...
                        </span>
                      ) : (
                        <>
                          <Send size={16} />
                          Envoyer le message
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-[#64748b] text-center">
                      Nous répondons dans un délai d&apos;un jour ouvrable.
                      Jamais de spam.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
