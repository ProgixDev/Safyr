"use client";

import Link from "next/link";
import {
  Home,
  Users,
  ClipboardList,
  Wallet,
  Shield,
  Mail,
  Calendar,
  Clock,
  FileText,
  UserCheck,
  AlertTriangle,
  MessageSquare,
  Briefcase,
  Stethoscope,
  BookOpen,
  FileCheck,
  GitBranch,
  CalendarRange,
  FileSearch,
  GraduationCap,
  BarChart3,
  Bell,
  Wrench,
  Package,
  TrendingUp,
  Award,
  Scale,
  FilePenLine,
  CreditCard,
  PenTool,
} from "lucide-react";

import { GenericSidebar, MenuSection } from "@/components/ui/generic-sidebar";
import Image from "next/image";

const navigationSections: MenuSection[] = [
  {
    label: "RH",
    items: [
      {
        title: "Vue d'ensemble",
        url: "/dashboard/hr",
        icon: Home,
      },
    ],
  },
  {
    label: "Salariés",
    items: [
      {
        title: "Dossiers salariés",
        url: "/dashboard/hr/employees",
        icon: Users,
      },
      {
        title: "Contrats & avenants",
        url: "/dashboard/hr/contracts",
        icon: FileText,
        disabled: true,
      },
      {
        title: "Documents réglementaires",
        url: "/dashboard/hr/regulatory-documents",
        icon: Shield,
        disabled: true,
      },
      {
        title: "Matériel & EPI",
        url: "/dashboard/hr/equipment",
        icon: Package,
        disabled: true,
      },
    ],
  },
  {
    label: "Temps & Absences",
    items: [
      {
        title: "Congés",
        url: "/dashboard/hr/time-management/leaves",
        icon: Calendar,
      },
      {
        title: "Absences",
        url: "/dashboard/hr/time-management",
        icon: CalendarRange,
      },
      {
        title: "Arrêts maladie",
        url: "/dashboard/hr/time-management/sick-leaves",
        icon: Stethoscope,
        disabled: true,
      },
      {
        title: "Heures travaillées",
        url: "/dashboard/hr/time-management/worked-hours",
        icon: Clock,
      },
      {
        title: "Heures CSE",
        url: "/dashboard/hr/time-management/cse-hours",
        icon: Users,
      },
    ],
  },
  {
    label: "Paie & Coûts",
    items: [
      {
        title: "Variables de paie",
        url: "/dashboard/hr/payroll/variables",
        icon: Wallet,
        disabled: true,
      },
      {
        title: "Mes notes de frais",
        url: "/dashboard/hr/payroll/expenses",
        icon: FileText,
        disabled: false,
      },
      {
        title: "Validation frais",
        url: "/dashboard/hr/payroll/expenses/validation",
        icon: FileCheck,
        disabled: false,
      },
      {
        title: "Historique frais",
        url: "/dashboard/hr/payroll/expenses/history",
        icon: Calendar,
        disabled: false,
      },
      {
        title: "Contrôle paie",
        url: "/dashboard/hr/payroll/control",
        icon: FileCheck,
        disabled: true,
      },
      {
        title: "Coût salarié / heure",
        url: "/dashboard/hr/payroll/cost-per-hour",
        icon: TrendingUp,
        disabled: true,
      },
      {
        title: "Exports paie",
        url: "/dashboard/hr/payroll/exports",
        icon: FileSearch,
        disabled: true,
      },
    ],
  },
  {
    label: "Formations & Habilitations",
    items: [
      {
        title: "SSIAP",
        url: "/dashboard/hr/training/ssiap",
        icon: Shield,
        disabled: true,
      },
      {
        title: "SST & recyclages",
        url: "/dashboard/hr/training/sst",
        icon: Briefcase,
        disabled: true,
      },
      {
        title: "Habilitations",
        url: "/dashboard/hr/training/certifications",
        icon: Award,
        disabled: true,
      },
      {
        title: "Plan & budget de formation",
        url: "/dashboard/hr/training/plan",
        icon: BookOpen,
        disabled: true,
      },
      {
        title: "Alertes d'expiration",
        url: "/dashboard/hr/training/alerts",
        icon: AlertTriangle,
        disabled: true,
      },
    ],
  },
  {
    label: "Recrutement & Intégration",
    items: [
      {
        title: "Candidatures",
        url: "/dashboard/hr/lifecycle/recruitment/applications",
        icon: Users,
        disabled: true,
      },
      {
        title: "Vérifications réglementaires",
        url: "/dashboard/hr/lifecycle/recruitment/verifications",
        icon: FileCheck,
        disabled: true,
      },
      {
        title: "Création & signature",
        url: "/dashboard/hr/lifecycle/recruitment/contracts",
        icon: FilePenLine,
        disabled: true,
      },
      {
        title: "Parcours d'intégration",
        url: "/dashboard/hr/lifecycle/recruitment/onboarding",
        icon: UserCheck,
        disabled: true,
      },
    ],
  },
  {
    label: "Discipline & Juridique",
    items: [
      {
        title: "Avertissements",
        url: "/dashboard/hr/lifecycle/discipline/warnings",
        icon: AlertTriangle,
        disabled: true,
      },
      {
        title: "Sanctions",
        url: "/dashboard/hr/lifecycle/discipline/sanctions",
        icon: Scale,
        disabled: true,
      },
      {
        title: "Procédures disciplinaires",
        url: "/dashboard/hr/lifecycle/discipline/procedures",
        icon: FileText,
        disabled: true,
      },
      {
        title: "Registre des sanctions",
        url: "/dashboard/hr/lifecycle/discipline/register",
        icon: BookOpen,
        disabled: true,
      },
    ],
  },
  {
    label: "Entretiens & Performance",
    items: [
      {
        title: "Entretiens annuels",
        url: "/dashboard/hr/lifecycle/interviews/annual",
        icon: MessageSquare,
        disabled: false,
      },
      {
        title: "Entretiens professionnels",
        url: "/dashboard/hr/lifecycle/interviews/professional",
        icon: Briefcase,
        disabled: false,
      },
      {
        title: "Objectifs",
        url: "/dashboard/hr/lifecycle/interviews/objectives",
        icon: TrendingUp,
        disabled: false,
      },
    ],
  },
  {
    label: "Médecine du travail",
    items: [
      {
        title: "Visites médicales",
        url: "/dashboard/hr/occupational-health/visits",
        icon: Stethoscope,
        disabled: true,
      },
      {
        title: "Fiches d'aptitude",
        url: "/dashboard/hr/occupational-health/aptitude",
        icon: FileCheck,
        disabled: true,
      },
      {
        title: "Alertes",
        url: "/dashboard/hr/occupational-health/alerts",
        icon: Bell,
        disabled: true,
      },
    ],
  },
  {
    label: "Offboarding",
    items: [
      {
        title: "Préavis",
        url: "/dashboard/hr/lifecycle/offboarding/notice",
        icon: Calendar,
        disabled: true,
      },
      {
        title: "Restitution matériel",
        url: "/dashboard/hr/lifecycle/offboarding/equipment",
        icon: Package,
        disabled: true,
      },
      {
        title: "Documents de fin",
        url: "/dashboard/hr/lifecycle/offboarding/documents",
        icon: FileText,
        disabled: true,
      },
      {
        title: "Archivage",
        url: "/dashboard/hr/lifecycle/offboarding/archive",
        icon: BookOpen,
        disabled: true,
      },
    ],
  },
  {
    label: "Registres légaux",
    items: [
      {
        title: "Registre du personnel",
        url: "/dashboard/hr/employees/personnel-register",
        icon: Users,
      },
      {
        title: "Accidents du travail",
        url: "/dashboard/hr/compliance/work-accidents",
        icon: AlertTriangle,
      },
      {
        title: "Formations",
        url: "/dashboard/hr/training/history",
        icon: GraduationCap,
      },
      {
        title: "Entrées/Sorties CDD",
        url: "/dashboard/hr/compliance/cdd",
        icon: CalendarRange,
      },
      {
        title: "Exports réglementaires",
        url: "/dashboard/hr/compliance",
        icon: FileSearch,
      },
    ],
  },
  {
    label: "Workflows & Demandes RH",
    items: [
      {
        title: "Vue d'ensemble",
        url: "/dashboard/hr/workflows/requests",
        icon: GitBranch,
        disabled: false,
      },
      {
        title: "Demandes de certificats",
        url: "/dashboard/hr/workflows/certificate",
        icon: Award,
        disabled: false,
      },
      {
        title: "Demandes de documents",
        url: "/dashboard/hr/workflows/document",
        icon: FileText,
        disabled: false,
      },
      {
        title: "Changements d'informations",
        url: "/dashboard/hr/workflows/bank-details",
        icon: CreditCard,
        disabled: false,
      },
      {
        title: "Signatures électroniques",
        url: "/dashboard/hr/workflows/signatures",
        icon: PenTool,
        disabled: false,
      },
      {
        title: "Gestion des signatures",
        url: "/dashboard/hr/workflows/signatures/all",
        icon: FilePenLine,
        disabled: false,
      },
    ],
  },
  {
    label: "Exploitation",
    items: [
      {
        title: "Planning agents",
        url: "/dashboard/hr/operations/planning",
        icon: Calendar,
        disabled: true,
      },
      {
        title: "Affectations sites",
        url: "/dashboard/hr/operations/assignments",
        icon: Users,
        disabled: true,
      },
      {
        title: "Heures terrain",
        url: "/dashboard/hr/operations/field-hours",
        icon: Clock,
        disabled: true,
      },
      {
        title: "Liaison paie",
        url: "/dashboard/hr/operations/payroll-link",
        icon: Wallet,
        disabled: true,
      },
    ],
  },
  {
    label: "Appels d'Offres",
    items: [
      {
        title: "Accès plateformes AO",
        url: "/dashboard/hr/business/tenders/platforms",
        icon: FileSearch,
        disabled: true,
      },
      {
        title: "Veille appels d'offres",
        url: "/dashboard/hr/business/tenders/monitoring",
        icon: Bell,
        disabled: true,
      },
      {
        title: "Dossiers de réponse",
        url: "/dashboard/hr/business/tenders/responses",
        icon: FileText,
        disabled: true,
      },
      {
        title: "Modèles de dossiers",
        url: "/dashboard/hr/business/tenders/templates",
        icon: ClipboardList,
        disabled: true,
      },
      {
        title: "Suivi & historique",
        url: "/dashboard/hr/business/tenders/tracking",
        icon: BarChart3,
        disabled: true,
      },
    ],
  },
  {
    label: "Formation & Financement",
    items: [
      {
        title: "Plan de formation",
        url: "/dashboard/hr/training-finance/plan",
        icon: BookOpen,
        disabled: true,
      },
      {
        title: "Dossiers AKTO / OPCO",
        url: "/dashboard/hr/training-finance/akto",
        icon: FileText,
        disabled: true,
      },
      {
        title: "Suivi des financements",
        url: "/dashboard/hr/training-finance/funding",
        icon: Wallet,
        disabled: true,
      },
      {
        title: "Historique",
        url: "/dashboard/hr/training-finance/history",
        icon: Clock,
        disabled: true,
      },
    ],
  },
  {
    label: "Pilotage",
    items: [
      {
        title: "KPI RH",
        url: "/dashboard/hr/kpi/hr",
        icon: BarChart3,
        disabled: true,
      },
      {
        title: "Conformité CNAPS",
        url: "/dashboard/hr/kpi/cnaps",
        icon: Shield,
        disabled: true,
      },
      {
        title: "Turnover",
        url: "/dashboard/hr/kpi/turnover",
        icon: TrendingUp,
        disabled: true,
      },
      {
        title: "Absentéisme",
        url: "/dashboard/hr/kpi/absenteeism",
        icon: CalendarRange,
        disabled: true,
      },
      {
        title: "Masse salariale",
        url: "/dashboard/hr/kpi/payroll-mass",
        icon: Wallet,
        disabled: true,
      },
      {
        title: "Prévisionnel RH",
        url: "/dashboard/hr/kpi/forecast",
        icon: TrendingUp,
        disabled: true,
      },
    ],
  },
  {
    label: "Notifications",
    items: [
      {
        title: "Alertes réglementaires",
        url: "/dashboard/hr/notifications/regulatory",
        icon: AlertTriangle,
        disabled: true,
      },
      {
        title: "Alertes RH",
        url: "/dashboard/hr/notifications/hr",
        icon: Bell,
        disabled: true,
      },
      {
        title: "Alertes Appels d'Offres",
        url: "/dashboard/hr/notifications/tenders",
        icon: FileSearch,
        disabled: true,
      },
      {
        title: "Historique",
        url: "/dashboard/hr/notifications/history",
        icon: Clock,
        disabled: true,
      },
    ],
  },
  {
    label: "Communication RH",
    items: [
      {
        title: "Modèles d'emails",
        url: "/dashboard/hr/pilotage/communication/templates",
        icon: Mail,
      },
    ],
  },
  {
    label: "Paramètres",
    items: [
      {
        title: "Utilisateurs & rôles",
        url: "/dashboard/hr/settings/users",
        icon: Users,
        disabled: true,
      },
      {
        title: "Droits d'accès",
        url: "/dashboard/hr/settings/access",
        icon: Shield,
        disabled: true,
      },
      {
        title: "Modèles",
        url: "/dashboard/hr/settings/templates",
        icon: FileText,
        disabled: true,
      },
      {
        title: "Connecteurs",
        url: "/dashboard/hr/settings/connectors",
        icon: Wrench,
        disabled: true,
      },
      {
        title: "Automatisations",
        url: "/dashboard/hr/settings/automations",
        icon: GitBranch,
        disabled: true,
      },
      {
        title: "Archivage légal",
        url: "/dashboard/hr/settings/archiving",
        icon: BookOpen,
        disabled: true,
      },
    ],
  },
];

const logoContent = (
  <Link href="/dashboard">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg">
      <Image src="/favicon.png" alt="Safyr Logo" width={256} height={256} />
    </div>
  </Link>
);

const headerContent = (
  <Link
    href="/dashboard"
    className="flex items-center gap-2 transition-all duration-200"
  >
    <Image
      src="/logo.png"
      className="w-12"
      alt="Safyr Logo"
      width={256}
      height={256}
    />
  </Link>
);

export function AdminSidebar() {
  const handleLogout = () => {
    // Logout logic here
    console.log("Logout clicked");
  };

  return (
    <GenericSidebar
      logo={logoContent}
      headerContent={headerContent}
      menuSections={navigationSections}
      onLogout={handleLogout}
    />
  );
}
