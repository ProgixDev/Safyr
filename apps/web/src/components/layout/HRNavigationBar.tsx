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
    // Menu demandé tel quel par le client : exactement ces six écrans, dans
    // cet ordre. "Vérifications réglementaires" et "Parcours d'intégration"
    // (qui vivaient dans l'ancien menu "Cycle de vie", supprimé) n'en font
    // pas partie — voir la note dans la conversation avec Wissem : leurs
    // pages existent toujours (/dashboard/hr/lifecycle/verifications et
    // /onboarding) mais ne sont plus reliées à aucun menu, en attendant de
    // savoir où le client veut les voir.
    //
    // Pas de shortLabel ici : au-delà de 1700px de large, ModuleNavigationBar
    // affiche "label" et masque "shortLabel" (voir son rendu de libellé) ;
    // le client voyait donc "Collaborateurs" en grand écran et "Salariés"
    // seulement une fois la fenêtre réduite. Un seul et même libellé règle
    // le problème plutôt que d'ajuster le seuil de largeur.
    label: "Salariés",
    icon: Users,
    children: [
      {
        label: "Candidature",
        href: "/dashboard/hr/lifecycle/applications",
      },
      {
        label: "Dossiers salariés",
        href: "/dashboard/hr/collaborators",
      },
      {
        label: "Entretiens et évaluations",
        href: "/dashboard/hr/collaborators/interviews",
      },
      {
        label: "Discipline et Sanctions",
        href: "/dashboard/hr/collaborators/discipline",
      },
      {
        label: "Sortie salariés",
        href: "/dashboard/hr/lifecycle/offboarding",
      },
      {
        label: "Registre Unique du Personnel",
        href: "/dashboard/hr/collaborators/personnel-register",
      },
    ],
  },
  {
    label: "Temps & Activités",
    shortLabel: "Temps",
    icon: Calendar,
    children: [
      {
        label: "Relevé des Heures & Sup.",
        href: "/dashboard/hr/time-activity/worked-hours",
      },
      {
        // Fusionne l'ancien menu "Compteur Heures Sup." (onglet "Vue globale").
        label: "Suivi Compteur Heures Sup.",
        href: "/dashboard/hr/time-activity/track-overtime-counter",
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
    shortLabel: "Paie",
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
    shortLabel: "Formation",
    icon: ShieldCheck,
    children: [
      {
        label: "Habilitations",
        href: "/dashboard/hr/safety-health-training/authorizations-matrix",
      },
      {
        label: "Plan de formation",
        href: "/dashboard/hr/safety-health-training/training-plan",
      },
      {
        label: "AKTO et OPCO",
        href: "/dashboard/hr/safety-health-training/training-plan/akto",
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
