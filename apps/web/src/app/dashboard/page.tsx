"use client";

import type { ElementType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar,
  BookOpen,
  MapPin,
  Wallet,
  Landmark,
  Building2,
  Receipt,
  Package,
  ClipboardCheck,
  UserCircle,
  Eye,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardModule {
  title: string;
  description: string;
  icon: ElementType;
  href: string;
  color: string;
  bgColor: string;
  /** Module pas encore ouvert : carte grisée, non cliquable. */
  disabled?: boolean;
}

// Mêmes modules, dans le même ordre, que le menu latéral (dashboard/layout.tsx).
const modules: DashboardModule[] = [
  {
    title: "Ressources Humaines",
    description:
      "Gestion complète du personnel, paie, formations et conformité",
    icon: Users,
    href: "/dashboard/hr",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Planning",
    description: "Planification des vacations, sites et remplacements",
    icon: Calendar,
    href: "/dashboard/planning",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    title: "Main Courante Digitale",
    description: "Suivi des événements, incidents et validation en temps réel",
    icon: BookOpen,
    href: "/dashboard/logbook",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Géolocalisation",
    description: "Suivi des agents, zones de travail et rondes en direct",
    icon: MapPin,
    href: "/dashboard/geolocation",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    title: "Paie",
    description: "Variables, bulletins de salaire et exports vers la paie",
    icon: Wallet,
    href: "/dashboard/payroll",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Comptabilité",
    description: "Écritures, journaux et suivi comptable de l'entreprise",
    icon: Landmark,
    href: "/dashboard/accounting",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    title: "Banque",
    description: "Comptes bancaires, mouvements et rapprochements",
    icon: Building2,
    href: "/dashboard/banking",
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
  },
  {
    title: "Facturation",
    description: "Devis, factures, avoirs et relances clients",
    icon: Receipt,
    href: "/dashboard/billing",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    title: "Stock",
    description: "Équipements, dotations et inventaire du matériel",
    icon: Package,
    href: "/dashboard/stock",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
  {
    title: "OCR",
    description: "Lecture automatique des documents et justificatifs",
    icon: ClipboardCheck,
    href: "/dashboard/ocr",
    color: "text-fuchsia-500",
    bgColor: "bg-fuchsia-500/10",
  },
  {
    title: "Portail Agent",
    description: "Espace dédié aux agents : plannings, congés et bulletins",
    icon: UserCircle,
    href: "/dashboard/agent-portal",
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
    disabled: true,
  },
  {
    title: "Portail Client",
    description: "Espace dédié aux clients : prestations, rapports et factures",
    icon: Eye,
    href: "/dashboard/client-portal",
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
    disabled: true,
  },
];

function ModuleCard({ module }: { module: DashboardModule }) {
  const Icon = module.icon;
  return (
    <Card
      className={cn(
        "glass-card border-border/40 h-full transition-all",
        module.disabled
          ? "opacity-50"
          : "group cursor-pointer hover:border-primary/50",
      )}
    >
      <CardHeader>
        <div
          className={`${module.bgColor} w-16 h-16 rounded-lg flex items-center justify-center mb-4`}
        >
          <Icon className={`h-8 w-8 ${module.color}`} />
        </div>
        <CardTitle className="text-2xl font-light">{module.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">{module.description}</p>
        {module.disabled ? (
          <span className="text-sm font-medium text-muted-foreground">
            Bientôt disponible
          </span>
        ) : (
          <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
            <span className="text-sm font-medium">Accéder au module</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="h-screen overflow-y-auto p-6">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-center py-6">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-light tracking-tight mb-4">
            Tableau de bord
          </h1>
          <p className="text-lg font-light text-muted-foreground">
            Sélectionnez un module pour commencer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {modules.map((module) =>
            module.disabled ? (
              <div
                key={module.href}
                aria-disabled="true"
                className="cursor-not-allowed"
              >
                <ModuleCard module={module} />
              </div>
            ) : (
              <Link key={module.href} href={module.href}>
                <ModuleCard module={module} />
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
