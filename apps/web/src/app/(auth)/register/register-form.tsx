"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Users,
  Building2,
  ClipboardList,
  Calendar,
  MapPin,
  Receipt,
  BarChart3,
  Package,
  ScanLine,
  Star,
  ArrowRight,
} from "lucide-react";

import { PhoneInput } from "@/components/ui/phone-input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const steps = [
  { id: 1, title: "Vos identifiants", description: "Créez votre compte" },
  {
    id: 2,
    title: "Votre entreprise",
    description: "Informations sur votre société",
  },
  {
    id: 3,
    title: "Modules souhaités",
    description: "Sélectionnez vos besoins",
  },
  { id: 4, title: "Finalisation", description: "Dernière étape" },
];

const companySizes = [
  { value: "1-10", label: "1 à 10 agents", description: "TPE / Start-up" },
  { value: "11-50", label: "11 à 50 agents", description: "Petite entreprise" },
  { value: "51-200", label: "51 à 200 agents", description: "PME" },
  { value: "201-500", label: "201 à 500 agents", description: "ETI" },
  {
    value: "500+",
    label: "Plus de 500 agents",
    description: "Grande entreprise",
  },
];

const companyTypes = [
  { value: "security", label: "Société de sécurité privée" },
  { value: "gardiennage", label: "Entreprise de gardiennage" },
  { value: "surveillance", label: "Agence de surveillance" },
  { value: "intervention", label: "Société d'intervention" },
  { value: "formation", label: "Centre de formation sécurité" },
  { value: "autre", label: "Autre" },
];

const modules = [
  {
    id: "rh",
    label: "Gestion RH",
    description:
      "Gestion complète des ressources humaines pour votre société de sécurité",
    features: [
      "Dossiers agents complets",
      "Contrats de travail",
      "Gestion des certifications",
      "Suivi des postes",
    ],
    icon: Users,
    color: "#357AB7",
    core: true,
  },
  {
    id: "main_courante",
    label: "Main courante digitale",
    description:
      "Digitalisation complète de la main courante pour une meilleure traçabilité",
    features: [
      "Journaux d'activité",
      "Rapports d'incidents",
      "Suivi des rondes",
      "Archivage automatique",
    ],
    icon: ClipboardList,
    color: "#a78bfa",
    core: true,
  },
  {
    id: "paie",
    label: "Paie & Bulletins",
    description:
      "Calcul automatique des bulletins de paie avec intégration DSN",
    features: [
      "Calcul automatique",
      "Export DSN",
      "Gestion des primes",
      "Bulletins dématérialisés",
    ],
    icon: Receipt,
    color: "#34d399",
    core: true,
  },
  {
    id: "planning",
    label: "Planning & Affectations",
    description:
      "Planification intelligente des agents et gestion des vacations",
    features: [
      "Gestion des vacations",
      "Affectation par site",
      "Planning récurrents",
      "Contrôle des heures",
    ],
    icon: Calendar,
    color: "#fb923c",
    core: true,
  },
  {
    id: "geolocation",
    label: "Géolocalisation",
    description: "Suivi en temps réel des agents sur le terrain",
    features: [
      "Suivi temps réel",
      "Géofencing",
      "Historique des positions",
      "Alertes de zone",
    ],
    icon: MapPin,
    color: "#f472b6",
    core: false,
  },
  {
    id: "facturation",
    label: "Facturation & Devis",
    description: "Gestion complète de la relation commerciale",
    features: [
      "Devis dynamiques",
      "Suivi des paiements",
      "Facturation automatique",
      "Relances",
    ],
    icon: BarChart3,
    color: "#818cf8",
    core: false,
  },
  {
    id: "comptabilite",
    label: "Comptabilité",
    description: "Suivi financier et déclaratif pour votre société",
    features: [
      "Trésorerie",
      "Export FEC",
      "Déclarations",
      "Suivi des dépenses",
    ],
    icon: Building2,
    color: "#60a5fa",
    core: false,
  },
  {
    id: "stock",
    label: "Gestion de stock",
    description: "Gestion des équipements et dotations agents",
    features: ["Inventaire", "Équipements", "Uniformes", "Alertes stock"],
    icon: Package,
    color: "#2dd4bf",
    core: false,
  },
  {
    id: "ocr",
    label: "OCR & Documents",
    description: "Numérisation et extraction automatique de documents",
    features: [
      "Numérisation",
      "Extraction automatique",
      "Classement intelligent",
      "Recherche",
    ],
    icon: ScanLine,
    color: "#e879f9",
    core: false,
  },
];

const howHeardOptions = [
  { value: "google", label: "Google / Moteur de recherche" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "recommendation", label: "Recommandation / Bouche à oreille" },
  { value: "event", label: "Salon / Événement professionnel" },
  { value: "press", label: "Presse spécialisée" },
  { value: "autre", label: "Autre" },
];

const roleOptions = [
  { value: "dirigeant", label: "Dirigeant / Gérant" },
  { value: "dg", label: "Directeur Général (DG)" },
  { value: "drh", label: "Directeur RH" },
  { value: "responsable_rh", label: "Responsable RH" },
  { value: "responsable_planning", label: "Responsable Planning" },
  { value: "responsable_operations", label: "Responsable Opérations" },
  { value: "comptable", label: "Comptable" },
  { value: "assistant_rh", label: "Assistant(e) RH" },
  { value: "chef_poste", label: "Chef de Poste" },
  { value: "autre", label: "Autre" },
];

export function RegisterForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [form, setForm] = useState({
    // Step 1: Account
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
    // Step 2: Company
    companyName: "",
    companySize: "",
    companyType: "",
    address: "",
    postalCode: "",
    city: "",
    siret: "",
    // Step 3: Modules
    selectedModules: ["rh", "main_courante", "paie", "planning"] as string[], // Core modules included by default
    // Step 4: Additional
    phone: "",
    role: "",
    howHeard: "",
    notes: "",
  });

  const passwordStrength = () => {
    let strength = 0;
    if (form.password.length >= 8) strength++;
    if (/[A-Z]/.test(form.password)) strength++;
    if (/[0-9]/.test(form.password)) strength++;
    if (/[^A-Za-z0-9]/.test(form.password)) strength++;
    return strength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/dashboard");
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleModule = (moduleId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(moduleId)
        ? prev.selectedModules.filter((id) => id !== moduleId)
        : [...prev.selectedModules, moduleId],
    }));
  };

  const toggleExpand = (moduleId: string) => {
    setExpandedModule((prev) => (prev === moduleId ? null : moduleId));
  };

  const strength = passwordStrength();
  const strengthLabels = ["Faible", "Moyen", "Bon", "Fort"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          form.firstName &&
          form.lastName &&
          form.email &&
          form.password &&
          form.confirmPassword &&
          form.password === form.confirmPassword &&
          form.terms
        );
      case 2:
        return form.companyName && form.companySize && form.companyType;
      case 3:
        return true; // Core modules are always included by default
      case 4:
        return form.phone && form.role;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label
                  htmlFor="firstName"
                  className="block text-xs font-medium text-[#94a3b8]"
                >
                  Prénom *
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  placeholder="Jean"
                  className="w-full h-9 px-3 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#a78bfa]/50 focus:ring-1 focus:ring-[#a78bfa]/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="lastName"
                  className="block text-xs font-medium text-[#94a3b8]"
                >
                  Nom *
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  placeholder="Dupont"
                  className="w-full h-9 px-3 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#a78bfa]/50 focus:ring-1 focus:ring-[#a78bfa]/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#94a3b8]"
              >
                E-mail professionnel *
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vous@entreprise.com"
                className="w-full h-9 px-3 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#a78bfa]/50 focus:ring-1 focus:ring-[#a78bfa]/20 transition-all duration-200"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#94a3b8]"
              >
                Mot de passe *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Créer un mot de passe"
                  className="w-full h-9 px-3 pr-10 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#a78bfa]/50 focus:ring-1 focus:ring-[#a78bfa]/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {form.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i <= strength
                            ? strengthColors[strength - 1]
                            : "bg-[#2d4160]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-[#64748b]">
                    Force:{" "}
                    <span
                      className={
                        strength >= 3
                          ? "text-green-400"
                          : strength >= 2
                            ? "text-yellow-400"
                            : "text-red-400"
                      }
                    >
                      {strengthLabels[strength] || "Trop court"}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium text-[#94a3b8]"
              >
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  placeholder="Confirmer le mot de passe"
                  className="w-full h-9 px-3 pr-10 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#a78bfa]/50 focus:ring-1 focus:ring-[#a78bfa]/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {form.confirmPassword &&
                form.password !== form.confirmPassword && (
                  <p className="text-[10px] text-red-400">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
            </div>

            <label className="flex items-start gap-2 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  required
                  checked={form.terms}
                  onChange={(e) =>
                    setForm({ ...form, terms: e.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                    form.terms
                      ? "bg-[#a78bfa] border-[#a78bfa]"
                      : "border-[#2d4160] group-hover:border-[#3d5170]"
                  }`}
                >
                  {form.terms && <Check size={10} className="text-white" />}
                </div>
              </div>
              <span className="text-xs text-[#64748b] group-hover:text-[#94a3b8] transition-colors">
                J&apos;accepte les{" "}
                <Link href="#" className="text-[#a78bfa] hover:underline">
                  Conditions
                </Link>{" "}
                et la{" "}
                <Link href="#" className="text-[#a78bfa] hover:underline">
                  Politique
                </Link>
              </span>
            </label>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <label
                htmlFor="companyName"
                className="block text-xs font-medium text-[#94a3b8]"
              >
                Nom de l&apos;entreprise *
              </label>
              <input
                id="companyName"
                type="text"
                required
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
                placeholder="Sécurité Gardiennage Pro"
                className="w-full h-9 px-3 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#a78bfa]/50 focus:ring-1 focus:ring-[#a78bfa]/20 transition-all duration-200"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#94a3b8]">
                Taille de l&apos;entreprise *
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-9 px-3 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs flex items-center justify-between hover:border-[#a78bfa]/50 focus:outline-none focus:border-[#a78bfa]/50 transition-all duration-200"
                  >
                    <span
                      className={
                        form.companySize ? "text-white" : "text-[#475569]"
                      }
                    >
                      {companySizes.find((s) => s.value === form.companySize)
                        ?.label || "Sélectionnez..."}
                    </span>
                    <ChevronDown size={14} className="text-[#64748b]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-[#1e293b] border-[#2d4160]"
                  style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
                  align="start"
                >
                  {companySizes.map((size) => (
                    <DropdownMenuItem
                      key={size.value}
                      onClick={() =>
                        setForm({ ...form, companySize: size.value })
                      }
                      className="text-xs text-[#94a3b8] focus:bg-[#2d4160] focus:text-white cursor-pointer"
                    >
                      <span className="flex-1">{size.label}</span>
                      <span className="text-[10px] text-[#64748b] mr-2">
                        {size.description}
                      </span>
                      {form.companySize === size.value && (
                        <Check size={12} className="text-[#a78bfa]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#94a3b8]">
                Type d&apos;entreprise *
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-9 px-3 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs flex items-center justify-between hover:border-[#a78bfa]/50 focus:outline-none focus:border-[#a78bfa]/50 transition-all duration-200"
                  >
                    <span
                      className={
                        form.companyType ? "text-white" : "text-[#475569]"
                      }
                    >
                      {companyTypes.find((t) => t.value === form.companyType)
                        ?.label || "Sélectionnez..."}
                    </span>
                    <ChevronDown size={14} className="text-[#64748b]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-[#1e293b] border-[#2d4160]"
                  style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
                  align="start"
                >
                  {companyTypes.map((type) => (
                    <DropdownMenuItem
                      key={type.value}
                      onClick={() =>
                        setForm({ ...form, companyType: type.value })
                      }
                      className="text-xs text-[#94a3b8] focus:bg-[#2d4160] focus:text-white cursor-pointer"
                    >
                      <span className="flex-1">{type.label}</span>
                      {form.companyType === type.value && (
                        <Check size={12} className="text-[#a78bfa]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="address"
                className="block text-xs font-medium text-[#94a3b8]"
              >
                Adresse
              </label>
              <input
                id="address"
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 rue de la sécurité"
                className="w-full h-9 px-3 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#a78bfa]/50 focus:ring-1 focus:ring-[#a78bfa]/20 transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label
                  htmlFor="postalCode"
                  className="block text-xs font-medium text-[#94a3b8]"
                >
                  Code postal
                </label>
                <input
                  id="postalCode"
                  type="text"
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm({ ...form, postalCode: e.target.value })
                  }
                  placeholder="75001"
                  className="w-full h-9 px-3 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#a78bfa]/50 focus:ring-1 focus:ring-[#a78bfa]/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="city"
                  className="block text-xs font-medium text-[#94a3b8]"
                >
                  Ville
                </label>
                <input
                  id="city"
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Paris"
                  className="w-full h-9 px-3 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#a78bfa]/50 focus:ring-1 focus:ring-[#a78bfa]/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="siret"
                className="block text-xs font-medium text-[#94a3b8]"
              >
                Numéro SIRET
              </label>
              <input
                id="siret"
                type="text"
                value={form.siret}
                onChange={(e) => setForm({ ...form, siret: e.target.value })}
                placeholder="123 456 789 00012"
                className="w-full h-9 px-3 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#a78bfa]/50 focus:ring-1 focus:ring-[#a78bfa]/20 transition-all duration-200"
              />
            </div>
          </motion.div>
        );

      case 3:
        const coreModules = modules.filter((m) => m.core);
        const optionalModules = modules.filter((m) => !m.core);

        const renderModuleCard = (
          module: (typeof modules)[0],
          isCore: boolean,
        ) => {
          const isSelected = form.selectedModules.includes(module.id);
          const isExpanded = expandedModule === module.id;
          const Icon = module.icon;

          return (
            <motion.div
              key={module.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden"
            >
              <div
                className={`rounded-lg border transition-all duration-200 ${
                  isCore
                    ? "bg-[#357AB7]/5 border-[#357AB7]/30"
                    : isSelected
                      ? "bg-[#a78bfa]/10 border-[#a78bfa]/50"
                      : "bg-[#1e293b]/50 border-[#2d4160]/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(module.id)}
                  className="w-full p-2.5 text-left flex items-center gap-3"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${module.color}15` }}
                  >
                    <Icon size={14} style={{ color: module.color }} />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <span className="text-xs font-medium text-white">
                      {module.label}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[#64748b]"
                    >
                      <ChevronRight size={12} />
                    </motion.div>
                  </div>
                </button>

                {/* Selection checkbox for optional modules */}
                {!isCore && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleModule(module.id);
                    }}
                    className="w-full px-2.5 pb-2.5 text-left flex items-center gap-2"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#a78bfa] border-[#a78bfa]"
                          : "border-[#2d4160]"
                      }`}
                    >
                      {isSelected && <Check size={8} className="text-white" />}
                    </div>
                    <span className="text-xs text-[#64748b]">
                      {isSelected ? "Module sélectionné" : "Ajouter ce module"}
                    </span>
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 pb-1 px-1">
                      <p className="text-xs text-[#64748b] leading-relaxed">
                        {module.description}
                      </p>
                      {module.features && (
                        <ul className="mt-2 space-y-1">
                          {module.features.map((feature, i) => (
                            <li
                              key={i}
                              className="text-xs text-[#94a3b8] flex items-center gap-2"
                            >
                              <Check size={10} className="text-[#357AB7]" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        };

        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="text-center">
              <p className="text-xs text-[#64748b]">
                Les modules essentiels sont inclus. Cliquez pour découvrir.
                Ajoutez des modules optionnels.
              </p>
            </div>

            {/* Core modules - included by default */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-[#357AB7] uppercase tracking-wide">
                <Check size={10} />
                Inclus
              </div>
              <div className="flex flex-col gap-2">
                {coreModules.map((module) => renderModuleCard(module, true))}
              </div>
            </div>

            {/* Optional modules - user can select */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-[#a78bfa] uppercase tracking-wide">
                <Star size={10} />
                Optionnels
              </div>
              <div className="flex flex-col gap-2">
                {optionalModules.map((module) =>
                  renderModuleCard(module, false),
                )}
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#94a3b8]">
                Téléphone professionnel *
              </label>
              <PhoneInput
                value={form.phone}
                onChange={(value) => setForm({ ...form, phone: value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#94a3b8]">
                Votre fonction *
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-9 px-3 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs flex items-center justify-between hover:border-[#a78bfa]/50 focus:outline-none focus:border-[#a78bfa]/50 transition-all duration-200"
                  >
                    <span
                      className={form.role ? "text-white" : "text-[#475569]"}
                    >
                      {roleOptions.find((r) => r.value === form.role)?.label ||
                        "Sélectionnez..."}
                    </span>
                    <ChevronDown size={14} className="text-[#64748b]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-[#1e293b] border-[#2d4160]"
                  style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
                  align="start"
                >
                  {roleOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setForm({ ...form, role: option.value })}
                      className="text-xs text-[#94a3b8] focus:bg-[#2d4160] focus:text-white cursor-pointer"
                    >
                      <span className="flex-1">{option.label}</span>
                      {form.role === option.value && (
                        <Check size={12} className="text-[#a78bfa]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#94a3b8]">
                Comment avez-vous connu Safyr ?
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-9 px-3 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs flex items-center justify-between hover:border-[#a78bfa]/50 focus:outline-none focus:border-[#a78bfa]/50 transition-all duration-200"
                  >
                    <span
                      className={
                        form.howHeard ? "text-white" : "text-[#475569]"
                      }
                    >
                      {howHeardOptions.find((h) => h.value === form.howHeard)
                        ?.label || "Sélectionnez..."}
                    </span>
                    <ChevronDown size={14} className="text-[#64748b]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-[#1e293b] border-[#2d4160]"
                  style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
                  align="start"
                >
                  {howHeardOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() =>
                        setForm({ ...form, howHeard: option.value })
                      }
                      className="text-xs text-[#94a3b8] focus:bg-[#2d4160] focus:text-white cursor-pointer"
                    >
                      <span className="flex-1">{option.label}</span>
                      {form.howHeard === option.value && (
                        <Check size={12} className="text-[#a78bfa]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="notes"
                className="block text-xs font-medium text-[#94a3b8]"
              >
                Commentaires ou besoins spécifiques
              </label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Décrivez vos besoins..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-[#1e293b]/80 border border-[#2d4160]/60 text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#a78bfa]/50 focus:ring-1 focus:ring-[#a78bfa]/20 transition-all duration-200 resize-none"
              />
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl p-4 border border-[#2d4160]/60">
              <div className="flex items-center gap-2 mb-3">
                <Check size={14} className="text-[#a78bfa]" />
                <h4 className="text-xs font-medium text-white">
                  Récapitulatif
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-[#64748b] block">Entreprise</span>
                  <span className="text-white font-medium">
                    {form.companyName || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b] block">Taille</span>
                  <span className="text-white font-medium">
                    {companySizes.find((s) => s.value === form.companySize)
                      ?.label || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b] block">Type</span>
                  <span className="text-white font-medium">
                    {companyTypes.find((t) => t.value === form.companyType)
                      ?.label || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b] block">Contact</span>
                  <span className="text-white font-medium">
                    {form.email || "-"}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#2d4160]/60">
                <span className="text-[#64748b] text-xs block mb-1">
                  Modules sélectionnés
                </span>
                <div className="flex flex-wrap gap-1">
                  {modules
                    .filter((m) => form.selectedModules.includes(m.id))
                    .map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: `${m.color}15`,
                          color: m.color,
                        }}
                      >
                        {m.label}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  currentStep > step.id
                    ? "bg-[#a78bfa] text-white"
                    : currentStep === step.id
                      ? "bg-[#a78bfa]/20 border-2 border-[#a78bfa] text-[#a78bfa]"
                      : "bg-[#1e293b] border border-[#2d4160] text-[#64748b]"
                }`}
              >
                {currentStep > step.id ? <Check size={14} /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-0.5 mx-1 transition-all duration-300 ${
                    currentStep > step.id ? "bg-[#a78bfa]" : "bg-[#2d4160]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h3 className="text-white font-medium">
            {steps[currentStep - 1].title}
          </h3>
          <p className="text-xs text-[#64748b]">
            {steps[currentStep - 1].description}
          </p>
        </div>
      </div>

      {/* Form fields */}
      <AnimatePresence mode="wait">
        <div className="flex-1 overflow-y-auto">{renderStep()}</div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 h-12 rounded-xl border border-[#2d4160]/60 text-white font-medium flex items-center justify-center gap-2 hover:bg-[#1e293b] transition-all duration-200"
          >
            <ChevronLeft size={18} />
            Retour
          </button>
        )}
        <motion.button
          type="submit"
          disabled={loading || !canProceed()}
          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-white font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(167,139,250,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
          whileHover={{ scale: loading || !canProceed() ? 1 : 1.01 }}
          whileTap={{ scale: loading || !canProceed() ? 1 : 0.99 }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Création...
            </>
          ) : currentStep < 4 ? (
            <>
              Suivant
              <ChevronRight size={18} />
            </>
          ) : (
            <>
              Créer mon compte
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}
