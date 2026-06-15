"use client";

import {
  ModuleNavigationBar,
  NavItem,
} from "@/components/ui/module-navigation-bar";
import {
  Building2,
  Users,
  Calendar,
  Wallet,
  UserCog,
  ShieldCheck,
  Workflow,
  Briefcase,
} from "lucide-react";

const navItems: NavItem[] = [
  {
    label: "Entreprise",
    icon: Building2,
    children: [
      { label: "Mon entreprise", href: "/dashboard/hr/entreprise" },
      { label: "Sites & Postes", href: "/dashboard/hr/sites" },
      { label: "Clients", href: "/dashboard/hr/entreprise/clients" },
      {
        label: "Sous-traitants",
        href: "/dashboard/hr/entreprise/sous-traitants",
      },
      { label: "Impôts (SIE)", href: "/dashboard/hr/entreprise/impot-sie" },
      {
        label: "Divers documents",
        href: "/dashboard/hr/entreprise/divers-documents",
      },
      { label: "Alertes", href: "/dashboard/hr/entreprise/alertes" },
    ],
  },
  {
    label: "Collaborateurs",
    icon: Users,
    children: [
      {
        label: "Registre Unique du Personnel",
        href: "/dashboard/hr/collaborators/personnel-register",
      },
      {
        label: "Dossiers salariés",
        href: "/dashboard/hr/collaborators",
      },
      {
        label: "Entretiens & Évaluations",
        href: "/dashboard/hr/collaborators/interviews",
      },
      {
        label: "Discipline & Sanctions",
        href: "/dashboard/hr/collaborators/discipline",
      },
    ],
  },
  {
    label: "Cycle de vie",
    icon: UserCog,
    children: [
      {
        label: "Candidatures",
        href: "/dashboard/hr/lifecycle/applications",
      },
      {
        label: "Vérifications réglementaires",
        href: "/dashboard/hr/lifecycle/verifications",
      },
      {
        label: "Parcours d'intégration",
        href: "/dashboard/hr/lifecycle/onboarding",
      },
      { label: "Offboarding", href: "/dashboard/hr/lifecycle/offboarding" },
    ],
  },
  {
    label: "Temps & Activités",
    icon: Calendar,
    children: [
      {
        label: "Relevé des Heures & Sup.",
        href: "/dashboard/hr/time-activity/worked-hours",
      },
      {
        label: "Compteur Heures Sup.",
        href: "/dashboard/hr/time-activity/overtime-counter",
      },
      {
        label: "Gestion des Absences & Congés",
        href: "/dashboard/hr/time-activity/absences",
      },
      {
        label: "Heures de délégation (CSE)",
        href: "/dashboard/hr/time-activity/cse-hours",
      },
    ],
  },
  {
    label: "Rémunération & Paie",
    icon: Wallet,
    children: [
      {
        label: "Variables de paie",
        href: "/dashboard/hr/payroll-remuneration/variables",
      },
      {
        label: "Contrôles & Maintien de salaire",
        href: "/dashboard/hr/payroll-remuneration/control",
      },
      {
        label: "Notes de frais",
        href: "/dashboard/hr/payroll-remuneration/expenses",
      },
      {
        label: "Analyse des coûts",
        href: "/dashboard/hr/payroll-remuneration/cost-per-hour",
      },
      {
        label: "Archives des Bulletins (BS)",
        href: "/dashboard/hr/payroll-remuneration/archives",
      },
      {
        label: "Export logiciel Paie",
        href: "/dashboard/hr/payroll-remuneration/export-config",
      },
    ],
  },
  {
    label: "Santé & Formation",
    icon: ShieldCheck,
    children: [
      {
        label: "Matrice des Habilitations",
        href: "/dashboard/hr/safety-health-training/authorizations-matrix",
      },
      {
        label: "Plan de formation",
        href: "/dashboard/hr/safety-health-training/training-plan",
      },
      {
        label: "Registre de formation & Alertes",
        href: "/dashboard/hr/safety-health-training/training-register",
      },
      {
        label: "Médecine de travail",
        href: "/dashboard/hr/safety-health-training/occupational-medicine",
      },
      {
        label: "DUERP & Accidents du travail",
        href: "/dashboard/hr/safety-health-training/duerp-accidents",
      },
    ],
  },
  {
    label: "Services RH",
    icon: Workflow,
    children: [
      {
        label: "Boîte de réception RH",
        href: "/dashboard/hr/hr-services/inbox",
      },
      {
        label: "Parapheur Électronique",
        href: "/dashboard/hr/hr-services/signatures",
      },
      {
        label: "Automatisation RH",
        href: "/dashboard/hr/hr-services/automation",
      },
      {
        label: "Centre de Communication",
        href: "/dashboard/hr/hr-services/communication",
      },
      {
        label: "Bilan Social Automatisé",
        href: "/dashboard/hr/hr-services/social-audit",
      },
    ],
  },
  {
    label: "Business",
    icon: Briefcase,
    children: [
      {
        label: "Marketing RH & CRM",
        href: "/dashboard/hr/business/marketing",
      },
      {
        label: "Appels d'offres (Tenders)",
        href: "/dashboard/hr/business/tenders",
      },
    ],
  },
];

interface HRNavigationBarProps {
  showNav?: boolean;
}

export function HRNavigationBar({ showNav = true }: HRNavigationBarProps) {
  return (
    <ModuleNavigationBar
      moduleIcon={Users}
      dashboardHref="/dashboard/hr"
      navItems={navItems}
      showNav={showNav}
    />
  );
}
