"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  Building2,
  Users,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { assets } from "@/config/assets";

const companySizes = [
  { value: "1-10", label: "1-10 agents" },
  { value: "11-50", label: "11-50 agents" },
  { value: "51-100", label: "51-100 agents" },
  { value: "101-500", label: "101-500 agents" },
  { value: "500+", label: "500+ agents" },
];

const subjects = [
  { value: "demo", label: "Demander une démo" },
  { value: "info", label: "Informations sur la plateforme" },
  { value: "pricing", label: "Devis / Tarification" },
  { value: "support", label: "Support technique" },
  { value: "partnership", label: "Partenariat" },
  { value: "autre", label: "Autre" },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    companySize: "",
    subject: "",
    message: "",
    consent: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", form);
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={assets.images.team}
            alt=""
            fill
            className="object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-linear-to-b from-[#0f172a] via-[#0f172a]/90 to-[#0f172a]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#f1f5f9] mb-6 font-display">
            Parlons de vos <span className="text-[#357AB7]">besoins</span>
          </h1>
          <p className="text-xl text-[#94a3b8] max-w-2xl mx-auto">
            Réservez un appel avec notre équipe etirez découvrir comment Safyr
            s&apos;adapte à votre organisation. Sans pression, sans jargon —
            juste une conversation honnête.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl border border-[#2d4160]/60 bg-[#1a2d45]/40">
                <h2 className="text-xl font-semibold text-[#f1f5f9] mb-6">
                  Nos coordonnées
                </h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#357AB7]/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[#357AB7]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#64748b]">Email</p>
                      <p className="text-[#f1f5f9] font-medium">
                        hello@safyr.com
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#357AB7]/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-[#357AB7]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#64748b]">Téléphone</p>
                      <p className="text-[#f1f5f9] font-medium">
                        +33 1 23 45 67 89
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#357AB7]/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[#357AB7]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#64748b]">Adresse</p>
                      <p className="text-[#f1f5f9] font-medium">
                        Paris, France
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#357AB7]/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-[#357AB7]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#64748b]">Disponibilité</p>
                      <p className="text-[#f1f5f9] font-medium">
                        Lun-Ven: 9h-18h
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why Contact Us */}
              <div className="p-6 rounded-2xl border border-[#2d4160]/60 bg-[#1a2d45]/40">
                <h2 className="text-xl font-semibold text-[#f1f5f9] mb-4">
                  Pourquoi nous contacter ?
                </h2>
                <ul className="space-y-3">
                  {[
                    "Démo personnalisée de la plateforme",
                    "Analyse de vos besoins spécifiques",
                    "Devis adapté à votre structure",
                    "Accompagnement à la migration",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#357AB7] shrink-0 mt-0.5" />
                      <span className="text-[#94a3b8] text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="p-8 rounded-2xl border border-[#2d4160]/60 bg-[#1a2d45]/40">
                <h2 className="text-xl font-semibold text-[#f1f5f9] mb-6">
                  Envoyez-nous un message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#94a3b8] mb-2">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.firstName}
                        onChange={(e) =>
                          setForm({ ...form, firstName: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-lg bg-[#0f172a] border border-[#2d4160] text-white focus:border-[#357AB7] focus:outline-none transition-colors"
                        placeholder="Jean"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#94a3b8] mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.lastName}
                        onChange={(e) =>
                          setForm({ ...form, lastName: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-lg bg-[#0f172a] border border-[#2d4160] text-white focus:border-[#357AB7] focus:outline-none transition-colors"
                        placeholder="Dupont"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#94a3b8] mb-2">
                        Email professionnel *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-lg bg-[#0f172a] border border-[#2d4160] text-white focus:border-[#357AB7] focus:outline-none transition-colors"
                        placeholder="jean@entreprise.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#94a3b8] mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-lg bg-[#0f172a] border border-[#2d4160] text-white focus:border-[#357AB7] focus:outline-none transition-colors"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#94a3b8] mb-2">
                        <Building2 className="w-4 h-4 inline mr-1" />
                        Nom de l&apos;entreprise *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.companyName}
                        onChange={(e) =>
                          setForm({ ...form, companyName: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-lg bg-[#0f172a] border border-[#2d4160] text-white focus:border-[#357AB7] focus:outline-none transition-colors"
                        placeholder="Mon entreprise"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#94a3b8] mb-2">
                        <Users className="w-4 h-4 inline mr-1" />
                        Nombre d&apos;agents
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-full h-10 px-3 rounded-lg bg-[#0f172a] border border-[#2d4160] text-sm flex items-center justify-between hover:border-[#357AB7]/50 focus:outline-none focus:border-[#357AB7] transition-all duration-200"
                          >
                            <span
                              className={
                                form.companySize
                                  ? "text-white"
                                  : "text-[#475569]"
                              }
                            >
                              {companySizes.find(
                                (s) => s.value === form.companySize,
                              )?.label || "Sélectionner..."}
                            </span>
                            <ChevronDown size={16} className="text-[#64748b]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="bg-[#1e293b] border-[#2d4160]"
                          style={{
                            width: "var(--radix-dropdown-menu-trigger-width)",
                          }}
                          align="start"
                        >
                          {companySizes.map((size) => (
                            <DropdownMenuItem
                              key={size.value}
                              onClick={() =>
                                setForm({ ...form, companySize: size.value })
                              }
                              className="text-sm text-[#94a3b8] focus:bg-[#2d4160] focus:text-white cursor-pointer"
                            >
                              <span className="flex-1">{size.label}</span>
                              {form.companySize === size.value && (
                                <CheckCircle2
                                  size={14}
                                  className="text-[#357AB7]"
                                />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2">
                      Sujet *
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full h-10 px-3 rounded-lg bg-[#0f172a] border border-[#2d4160] text-sm flex items-center justify-between hover:border-[#357AB7]/50 focus:outline-none focus:border-[#357AB7] transition-all duration-200"
                        >
                          <span
                            className={
                              form.subject ? "text-white" : "text-[#475569]"
                            }
                          >
                            {subjects.find((s) => s.value === form.subject)
                              ?.label || "Sélectionner un sujet..."}
                          </span>
                          <ChevronDown size={16} className="text-[#64748b]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="bg-[#1e293b] border-[#2d4160]"
                        style={{
                          width: "var(--radix-dropdown-menu-trigger-width)",
                        }}
                        align="start"
                      >
                        {subjects.map((subject) => (
                          <DropdownMenuItem
                            key={subject.value}
                            onClick={() =>
                              setForm({ ...form, subject: subject.value })
                            }
                            className="text-sm text-[#94a3b8] focus:bg-[#2d4160] focus:text-white cursor-pointer"
                          >
                            <span className="flex-1">{subject.label}</span>
                            {form.subject === subject.value && (
                              <CheckCircle2
                                size={14}
                                className="text-[#357AB7]"
                              />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-[#0f172a] border border-[#2d4160] text-white focus:border-[#357AB7] focus:outline-none transition-colors resize-none"
                      placeholder="Décrivez votre projet, vos besoins ou posez vos questions..."
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="consent"
                      required
                      checked={form.consent}
                      onChange={(e) =>
                        setForm({ ...form, consent: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 rounded border-[#2d4160] bg-[#0f172a] text-[#357AB7] focus:ring-[#357AB7]"
                    />
                    <label htmlFor="consent" className="text-sm text-[#94a3b8]">
                      J&apos;accepte que Safyr traite mes données personnelles
                      pour répondre à ma demande. Voir notre Politique de
                      confidentialité.
                    </label>
                  </div>

                  <Button variant="primary" size="lg" className="w-full">
                    Envoyer le message
                    <Send size={18} />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
