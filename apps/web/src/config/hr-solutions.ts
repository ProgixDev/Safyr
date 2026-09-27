/**
 * HR Solutions - Configuration data for the HR solutions page
 * Organized by business function areas as per the redesign plan
 */

import type { LucideIcon } from "lucide-react";
import {
  Users,
  UserPlus,
  LogOut,
  ClipboardCheck,
  Stethoscope,
  FileText,
  Building2,
  GraduationCap,
  Calendar,
  AlertTriangle,
  DollarSign,
  Clock,
  Mail,
  Briefcase,
  BarChart3,
  Zap,
  PenTool,
  Folder,
  FileCheck,
  Search,
  CalendarClock,
  Award,
  TrendingUp,
  Building,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */

export interface HRFeature {
  title: string;
  description: string;
  stats?: string;
  modules?: string[];
}

export interface HRTab {
  id: string;
  title: string;
  shortTitle?: string;
  description: string;
  icon: LucideIcon;
  color: string;
  glow: string;
  kpis: { value: string; label: string }[];
  features: string[];
  video?: string | null;
}

export interface BusinessFunction {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  glow: string;
  tabs: HRTab[];
}

export interface JourneyStep {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  modules: string[];
  icon: LucideIcon;
  color: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  duration?: string;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  modules: string[];
  color: string;
}

export interface ComplianceItem {
  title: string;
  description: string;
  status: "automatisé" | "inclus" | "alertes" | "tracking";
  modules: string[];
}

export interface IntegrationModule {
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export interface FAQ {
  question: string;
  answer: string;
  category: string;
}

/* ─── Business Functions Data ───────────────────────────────────────────── */

export const businessFunctions: BusinessFunction[] = [
  {
    id: "lifecycle",
    title: "Cycle de Vie Employé",
    subtitle: "Employee Lifecycle",
    description:
      "Gérez l'ensemble du parcours de vos agents, de leur candidature à leur départ",
    color: "#357AB7",
    glow: "rgba(53,122,183,0.18)",
    tabs: [
      {
        id: "recruitment",
        title: "Recrutement",
        shortTitle: "Recrut.",
        description:
          "Suivez vos candidats de la candidature à l'embauche. Pipeline structuré, entretiens, vérifications et onboarding.",
        icon: UserPlus,
        color: "#357AB7",
        glow: "rgba(53,122,183,0.18)",
        kpis: [
          { value: "50%", label: "temps recrut." },
          { value: "100%", label: "traçabilité" },
        ],
        features: [
          "Publication d'offres multi-plateformes",
          "Candidatures centralisées",
          "Suivi pipeline recrutement",
          "Entretiens planifiés",
          "Vérificationsbg, CNAPS, diplômes",
          "Contrats génération automatique",
        ],
        video: null,
      },
      {
        id: "employees",
        title: "Dossiers Agents",
        shortTitle: "Agents",
        description:
          "Profils complets avec documents, contrats, pièces identité, coordonnées bancaires, cartes CNAPS.",
        icon: Users,
        color: "#34d399",
        glow: "rgba(52,211,153,0.18)",
        kpis: [
          { value: "100%", label: "données centralisées" },
          { value: "0", label: "fichier papier" },
        ],
        features: [
          "Dossiers agents complets",
          "Documents et pièces jointes",
          "Suivi certifications/habilitations",
          "Historique complet",
          "Recherche et filtres avancés",
          "Export conformité RGPD",
        ],
        video: null,
      },
      {
        id: "offboarding",
        title: "Offboarding",
        shortTitle: "Départ",
        description:
          "Processus de départ dématérialisé : documents finaux, soldes tout compte, attestations, retours équipements.",
        icon: LogOut,
        color: "#818cf8",
        glow: "rgba(129,140,248,0.18)",
        kpis: [
          { value: "100%", label: "dématérialisé" },
          { value: "Conforme", label: "légalement" },
        ],
        features: [
          "Checklist départ automatisée",
          "Documents finaux générés",
          "Solde tout compte calculé",
          "Attestations employeur",
          "Retour équipements.trace",
          "Archivage légal",
        ],
        video: null,
      },
      {
        id: "discipline",
        title: "Discipline",
        shortTitle: "Discipline",
        description:
          "Gestion des sanctions, avertissements, procédures disciplinaires avec traçabilité complète.",
        icon: AlertTriangle,
        color: "#f472b6",
        glow: "rgba(244,114,182,0.18)",
        kpis: [
          { value: "Audit", label: "piste complète" },
          { value: "100%", label: "conforme" },
        ],
        features: [
          "Avertissements et sanctions",
          "Procédures disciplinaires",
          "Entretiens de recadrage",
          "Suivi des récidives",
          "Modèles de lettres",
          "Archivage sécurisé",
        ],
        video: null,
      },
    ],
  },
  {
    id: "compliance",
    title: "Conformité & Réglementaire",
    subtitle: "Compliance & Regulatory",
    description:
      "Respectez vos obligations légales et réglementaires en toute simplicité",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.18)",
    tabs: [
      {
        id: "registers",
        title: "Registres Légaux",
        shortTitle: "Registres",
        description:
          "Génération automatique DUERP, registre du personnel, registres accidents du travail. Exports conformes.",
        icon: ClipboardCheck,
        color: "#a78bfa",
        glow: "rgba(167,139,250,0.18)",
        kpis: [
          { value: "100%", label: "automatisé" },
          { value: "Conforme", label: "Code du travail" },
        ],
        features: [
          "DUERP génération auto",
          "Registre du personnel",
          "Registre accidents travail",
          "Registre SSE",
          "Exports conformes audit",
          "Mise à jour automatique",
        ],
        video: null,
      },
      {
        id: "medical",
        title: "Médecine du Travail",
        shortTitle: "Médecine",
        description:
          "Planification visites médicales, suivi aptitudes, alertes pour les renouvellements.",
        icon: Stethoscope,
        color: "#f87171",
        glow: "rgba(248,113,113,0.18)",
        kpis: [
          { value: "Alertes", label: "30/60/90 jours" },
          { value: "100%", label: "suivi" },
        ],
        features: [
          "Planification VS, VIP, reprise",
          "Suivi aptitudes",
          "Alertes renouvellement",
          "Historique médical",
          "Documents conformité",
          "Rapports annuels",
        ],
        video: null,
      },
      {
        id: "social",
        title: "Rapport Social",
        shortTitle: "Social",
        description:
          "Génération automatique du bilan social, indicateurs DSN, tableaux de synthèse conformité sociale.",
        icon: FileText,
        color: "#fb923c",
        glow: "rgba(251,146,60,0.18)",
        kpis: [
          { value: "1 clic", label: "génération" },
          { value: "DSN", label: "automatisée" },
        ],
        features: [
          "Bilan social généré",
          "Indicateurs DSN",
          "Tableaux synthèse",
          "Comparatif N/N-1",
          "Rapports obligatoires",
          "ExportsXML/JSON",
        ],
        video: null,
      },
      {
        id: "enterprise",
        title: "Entreprise",
        shortTitle: "Entreprise",
        description:
          "Documents entreprise, sous-traitants, organigramme et structure organisationnelle.",
        icon: Building2,
        color: "#60a5fa",
        glow: "rgba(96,165,250,0.18)",
        kpis: [
          { value: "Vue", label: "globale" },
          { value: "100%", label: "structuré" },
        ],
        features: [
          "Documents entreprise",
          "Sous-traitants",
          "Organigramme",
          "Structure organisationnelle",
          "Infos SIE",
          "Gestion documents",
        ],
        video: null,
      },
    ],
  },
  {
    id: "operations",
    title: "Opérations RH",
    subtitle: "HR Operations",
    description:
      "Pilotez votre activité RH au quotidien avec des outils intégrés",
    color: "#34d399",
    glow: "rgba(52,211,153,0.18)",
    tabs: [
      {
        id: "time",
        title: "Gestion du Temps",
        shortTitle: "Temps",
        description:
          "Demandes congés, heures supplémentaires, heures CSE, soldes et soldes. Workflows de validation.",
        icon: Calendar,
        color: "#34d399",
        glow: "rgba(52,211,153,0.18)",
        kpis: [
          { value: "Auto", label: "absences" },
          { value: "100%", label: "traçables" },
        ],
        features: [
          "Demandes congés",
          "Heures supplémentaires",
          "Solde counter",
          "Workflow validation",
          "Calendar sync",
          "Alertes提前",
        ],
        video: null,
      },
      {
        id: "training",
        title: "Formations",
        shortTitle: "Formations",
        description:
          "Suivi certifications SSIAP, SST, H0B0. Attestations automatiques, alertes expiry et plan de formation.",
        icon: GraduationCap,
        color: "#fbbf24",
        glow: "rgba(251,191,36,0.18)",
        kpis: [
          { value: "Temps réel", label: "suivi" },
          { value: "Alertes", label: "expiry" },
        ],
        features: [
          "Suivi SSIAP, SST, H0B0",
          "Attestations auto",
          "Alertes expiry",
          "Plan formation",
          "Catalogue formations",
          "Historique agent",
        ],
        video: null,
      },
      {
        id: "payroll",
        title: "Variables Paie",
        shortTitle: "Paie",
        description:
          "Variables automatiques vers le module paie. Détection anomalies, analyse coûts, comparatif N/N-1.",
        icon: DollarSign,
        color: "#357AB7",
        glow: "rgba(53,122,183,0.18)",
        kpis: [
          { value: "70%", label: "temps gagné" },
          { value: "0", label: "erreurs" },
        ],
        features: [
          "Saisie variables",
          "Import automatique",
          "Détection anomalies",
          "Analyse coûts",
          "Comparatif N/N-1",
          "Export comptable",
        ],
        video: null,
      },
      {
        id: "communication",
        title: "Communication",
        shortTitle: "Com.",
        description:
          "Notifications, emails, modèles de lettres et communications internes.",
        icon: Mail,
        color: "#ec4899",
        glow: "rgba(236,72,153,0.18)",
        kpis: [
          { value: "100%", label: "dématérialisé" },
          { value: "Traçable", label: "juridiquement" },
        ],
        features: [
          "Notifications",
          "Emails automatisés",
          "Modèles lettres",
          "Communications",
          "Suivi envoi",
          "Archives",
        ],
        video: null,
      },
    ],
  },
  {
    id: "automation",
    title: "Automatisation & Pilotage",
    subtitle: "Automation & Steering",
    description:
      "Automatisez vos processus RH et pilotez avec des tableaux de bord",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.18)",
    tabs: [
      {
        id: "workflows",
        title: "Workflows",
        shortTitle: "Workflows",
        description:
          "Signatures numériques, automatisations, notifications et approbations dématérialisées.",
        icon: Zap,
        color: "#fb923c",
        glow: "rgba(251,146,60,0.18)",
        kpis: [
          { value: "100%", label: "dématérialisé" },
          { value: "0", label: "papier" },
        ],
        features: [
          "Signatures numériques",
          "Automatisations",
          "Notifications",
          "Approvals",
          "Workflows custom",
          "Suivi temps réel",
        ],
        video: null,
      },
      {
        id: "tenders",
        title: "Appels d'Offres",
        shortTitle: "AO",
        description:
          "Gestion des appels d'offres RH. Candidatures, documents, suivi des réponses.",
        icon: FileCheck,
        color: "#8b5cf6",
        glow: "rgba(139,92,246,0.18)",
        kpis: [
          { value: "Centralisé", label: "documents" },
          { value: "Suivi", label: "complet" },
        ],
        features: [
          "Appels d'offres",
          "Candidatures",
          "Documents",
          "Suivi réponses",
          "Modèles",
          "Archive",
        ],
        video: null,
      },
      {
        id: "dashboards",
        title: "Tableaux de Bord",
        shortTitle: "KPIs",
        description:
          "KPIs RH personnalisés : effectif, absentéisme, turnover, masse salariale, conformité.",
        icon: BarChart3,
        color: "#295F8E",
        glow: "rgba(41,95,142,0.18)",
        kpis: [
          { value: "Temps réel", label: " KPIs" },
          { value: "Custom", label: "widgets" },
        ],
        features: [
          "Effectif",
          "Absentéisme",
          "Turnover",
          "Masse salariale",
          "Conformité",
          "Widgets custom",
        ],
        video: null,
      },
      {
        id: "documents",
        title: "Documents & Signatures",
        shortTitle: "Docs",
        description:
          "Génération automatique de documents, signatures électroniques, gestion des modèles.",
        icon: PenTool,
        color: "#14b8a6",
        glow: "rgba(20,184,166,0.18)",
        kpis: [
          { value: "Auto", label: "génération" },
          { value: "Légal", label: "signature" },
        ],
        features: [
          "Génération auto",
          "Signatures électroniques",
          "Modèles paramétrables",
          "Archivage",
          "Versioning",
          "Search",
        ],
        video: null,
      },
    ],
  },
];

/* ─── Employee Journey Timeline ───────────────────────────────────────────── */

export const journeySteps: JourneyStep[] = [
  {
    id: "candidature",
    title: "Candidature",
    shortTitle: "Candidature",
    description: "Réception et screening des candidatures",
    modules: ["Recrutement"],
    icon: Search,
    color: "#357AB7",
  },
  {
    id: "entretien",
    title: "Entretien",
    shortTitle: "Entretien",
    description: "Entretiens et évaluations",
    modules: ["Recrutement", "Entretiens"],
    icon: Users,
    color: "#34d399",
  },
  {
    id: "contrat",
    title: "Contrat",
    shortTitle: "Contrat",
    description: "Rédaction et signature du contrat",
    modules: ["Recrutement", "Workflows"],
    icon: FileCheck,
    color: "#a78bfa",
  },
  {
    id: "integration",
    title: "Intégration",
    shortTitle: "Intégration",
    description: "Onboarding et formations initiales",
    modules: ["Formations", "Dossiers"],
    icon: Briefcase,
    color: "#fb923c",
  },
  {
    id: "poste",
    title: "En Poste",
    shortTitle: "Poste",
    description: "Gestion quotidienne et suivi",
    modules: ["Planning", "Paie", "Temps"],
    icon: Clock,
    color: "#f472b6",
  },
  {
    id: "formation",
    title: "Formation Continue",
    shortTitle: "Formation",
    description: "Formations et certifications",
    modules: ["Formations", "Médecine"],
    icon: Award,
    color: "#fbbf24",
  },
  {
    id: "discipline",
    title: "Discipline",
    shortTitle: "Discipline",
    description: "Suivi disciplinaire si nécessaire",
    modules: ["Discipline"],
    icon: AlertTriangle,
    color: "#ef4444",
  },
  {
    id: "depart",
    title: "Départ",
    shortTitle: "Départ",
    description: "Offboarding et archivage",
    modules: ["Offboarding", "Archives"],
    icon: LogOut,
    color: "#818cf8",
  },
];

/* ─── Workflows ───────────────────────────────────────────────────────────── */

export const workflows: Workflow[] = [
  {
    id: "recruitment",
    title: "Processus de Recrutement",
    description: "Du premier contact à la signature du contrat",
    steps: [
      {
        id: "1",
        title: "Publication offre",
        description: "Diffusion multi-canaux",
        duration: "1 jour",
      },
      {
        id: "2",
        title: "Candidatures",
        description: "Réception et screening",
        duration: "Variable",
      },
      {
        id: "3",
        title: "Entretiens",
        description: "Planification et realisation",
        duration: "1-2 semaines",
      },
      {
        id: "4",
        title: "Vérifications",
        description: "CNAPS, diplômes, refs",
        duration: "3-5 jours",
      },
      {
        id: "5",
        title: "Proposition",
        description: "Rédaction contrat",
        duration: "2 jours",
      },
      {
        id: "6",
        title: "Signature",
        description: "Contrat signé",
        duration: "1 jour",
      },
    ],
    modules: ["Recrutement", "Dossiers Agents", "Workflows"],
    color: "#357AB7",
  },
  {
    id: "onboarding",
    title: "Parcours d'Intégration",
    description: "De la signature à la prise de poste",
    steps: [
      {
        id: "1",
        title: "Dossier agent",
        description: "Création profil complet",
        duration: "1 jour",
      },
      {
        id: "2",
        title: "Documents",
        description: "Collecte pièces légales",
        duration: "2 jours",
      },
      {
        id: "3",
        title: "Formations",
        description: "SSIAP, SST, tutorat",
        duration: "1-2 semaines",
      },
      {
        id: "4",
        title: "Équipements",
        description: "Distribution uniformes",
        duration: "1 jour",
      },
      {
        id: "5",
        title: "Planning",
        description: "Affectation sites",
        duration: "1 jour",
      },
      {
        id: "6",
        title: "Poste",
        description: "Prise de fonction",
        duration: "1 jour",
      },
    ],
    modules: ["Dossiers Agents", "Formations", "Planning", "Workflows"],
    color: "#34d399",
  },
  {
    id: "training",
    title: "Gestion des Formations",
    description: "Du besoin à la certification",
    steps: [
      {
        id: "1",
        title: "Identification",
        description: "Needs analysis",
        duration: "Variable",
      },
      {
        id: "2",
        title: "Planification",
        description: "Inscription formation",
        duration: "1 semaine",
      },
      {
        id: "3",
        title: "Réalisation",
        description: "Formation effectuée",
        duration: "Variable",
      },
      {
        id: "4",
        title: "Certification",
        description: "Attestation délivrée",
        duration: "2 jours",
      },
      {
        id: "5",
        title: "Suivi",
        description: "Tracking expiry",
        duration: "Ongoing",
      },
    ],
    modules: ["Formations", "Médecine du Travail", "Dossiers"],
    color: "#fbbf24",
  },
  {
    id: "leave",
    title: "Demande de Congé",
    description: "De la demande au下 payroll",
    steps: [
      {
        id: "1",
        title: "Demande",
        description: "Soumission congé",
        duration: "5 min",
      },
      {
        id: "2",
        title: "Validation",
        description: "Manager approval",
        duration: "1-2 jours",
      },
      {
        id: "3",
        title: "Planning",
        description: "Mise à jour calendrier",
        duration: "Auto",
      },
      {
        id: "4",
        title: "Absence",
        description: "Tracked in system",
        duration: "Auto",
      },
      {
        id: "5",
        title: "Retour",
        description: "Fin absence",
        duration: "1 jour",
      },
      {
        id: "6",
        title: "Paie",
        description: "Solde deducted",
        duration: "Auto",
      },
    ],
    modules: ["Temps", "Planning", "Paie"],
    color: "#a78bfa",
  },
  {
    id: "discipline",
    title: "Procédure Disciplinaire",
    description: "De l'incident à la résolution",
    steps: [
      {
        id: "1",
        title: "Signalement",
        description: "Incident report",
        duration: "1 jour",
      },
      {
        id: "2",
        title: "Investigation",
        description: "Faits établis",
        duration: "3-5 jours",
      },
      {
        id: "3",
        title: "Entretiens",
        description: "Échange avec agent",
        duration: "1-2 jours",
      },
      {
        id: "4",
        title: "Décision",
        description: "Sanction ou pas",
        duration: "2 jours",
      },
      {
        id: "5",
        title: "Notification",
        description: "Lettre recommandée",
        duration: "1 jour",
      },
      {
        id: "6",
        title: "Suivi",
        description: "Archivage + suivi",
        duration: "Ongoing",
      },
    ],
    modules: ["Discipline", "Dossiers", "Workflows"],
    color: "#f472b6",
  },
];

/* ─── Compliance Checklist ───────────────────────────────────────────────── */

export const complianceItems: ComplianceItem[] = [
  {
    title: "Carte professionnelle CNAPS",
    description: "Suivi automatisé des habilitations et renouvellements",
    status: "automatisé",
    modules: ["Dossiers Agents", "Conformité"],
  },
  {
    title: "DUERP",
    description: "Génération et mise à jour du document unique",
    status: "inclus",
    modules: ["Registres"],
  },
  {
    title: "Registre du personnel",
    description: "Tenue à jour automatique conforme au Code du travail",
    status: "automatisé",
    modules: ["Registres", "Dossiers"],
  },
  {
    title: "Visites médicales",
    description: "Planification et suivi des visites obligatoires",
    status: "alertes",
    modules: ["Médecine du Travail"],
  },
  {
    title: "Formations obligatoires",
    description: "Suivi SSIAP, SST, H0B0 et renouvellement",
    status: "tracking",
    modules: ["Formations"],
  },
  {
    title: "DSN",
    description: "Déclarations sociales nominatives automatiques",
    status: "automatisé",
    modules: ["Rapport Social", "Paie"],
  },
  {
    title: "Contrats de travail",
    description: "Modèles conformes, signatures électroniques",
    status: "inclus",
    modules: ["Recrutement", "Workflows"],
  },
  {
    title: "Registre accidents du travail",
    description: "Suivi et déclaration des accidents",
    status: "automatisé",
    modules: ["Registres", "Médecine"],
  },
  {
    title: "Bilan social",
    description: "Génération annuelle automatique",
    status: "inclus",
    modules: ["Rapport Social"],
  },
  {
    title: "Formation professionnelle",
    description: "Plan de formation et suivi OPCA",
    status: "tracking",
    modules: ["Formations"],
  },
];

/* ─── Integration Modules ───────────────────────────────────────────────── */

export const integrationModules: IntegrationModule[] = [
  {
    name: "Paie",
    description: "Variables automatiques",
    icon: DollarSign,
    color: "#357AB7",
  },
  {
    name: "Planning",
    description: "Absences sync",
    icon: CalendarClock,
    color: "#34d399",
  },
  {
    name: "Facturation",
    description: "Heures réalisées",
    icon: TrendingUp,
    color: "#fb923c",
  },
  {
    name: "Comptabilité",
    description: "Salaires automatisés",
    icon: BarChart3,
    color: "#818cf8",
  },
  {
    name: "Banque",
    description: "Virements salaire",
    icon: Building,
    color: "#a78bfa",
  },
  {
    name: "Stock",
    description: "Équipements agents",
    icon: Folder,
    color: "#f472b6",
  },
];

/* ─── FAQs ───────────────────────────────────────────────────────────────── */

export const faqs: FAQ[] = [
  {
    question: "Comment Safyr simplifie-t-il le recrutement ?",
    answer:
      "Safyr centralise toutes vos candidatures, automatise le suivi du pipeline, planifie les entretiens et génère les contrats automatiquement. Vous gagnez 50% de temps sur chaque recrutement.",
    category: "Recrutement",
  },
  {
    question: "Le module RH est-il conforme à la réglementation CNAPS ?",
    answer:
      "Oui, Safyr suit automatiquement les habilitations CNAPS, alerte pour les renouvellements et génère les documents conformes. La conformité est à 100% garantie.",
    category: "Conformité",
  },
  {
    question: "Comment sont gérées les formations obligatoires ?",
    answer:
      "Le module formations suit SSIAP, SST, H0B0 et autres certifications. Les alertes de renouvellement sont envoyées 30/60/90 jours avant expiration. Les attestations sont générées automatiquement.",
    category: "Formations",
  },
  {
    question: "Puis-je suivre les visites médicales de mes agents ?",
    answer:
      "Absolument. Safyr planifie les visites médicales (VS, VIP, reprise), suit les aptitudes et envoie des alertes automatiques pour les renouvellements obligatoires.",
    category: "Médecine",
  },
  {
    question: "Comment fonctionne l'intégration avec la paie ?",
    answer:
      "Les variables de paie (heures, primes, indemnités) sont automatiquement transmises au module paie. Les anomalies sont détectées et signalées avant validation.",
    category: "Paie",
  },
  {
    question: "Les documents sont-ils signés électriquement ?",
    answer:
      "Oui, Safyr intègre la signature électronique légalement conformité pour tous vos documents RH : contrats, avenants, avertissements, etc.",
    category: "Workflows",
  },
  {
    question: "Puis-je générer le bilan social automatiquement ?",
    answer:
      "Oui, le rapport social est généré en un clic avec tous les indicateurs obligatoires. Le comparatif N/N-1 et les exports DSN sont également disponibles.",
    category: "Rapport Social",
  },
  {
    question: "Comment suivre l'absentéisme et le turnover ?",
    answer:
      "Les tableaux de bord RH affichent en temps réel les KPIs : absentéisme, turnover, masse salariale, pyramide des ages, etc. Les widgets sont personnalisables.",
    category: "Analytics",
  },
];

/* ─── Hero KPIs ──────────────────────────────────────────────────────────── */

export const heroKpis = [
  { value: "70%", label: "Temps de traitement RH", suffix: "%" },
  { value: "0", label: "Erreurs de calcul", suffix: "" },
  { value: "100", label: "Conformité CNAPS", suffix: "%" },
  { value: "Temps réel", label: "Tableau de bord", suffix: "" },
];

/* ─── Status Colors ───────────────────────────────────────────────────────── */

export const statusColors: Record<ComplianceItem["status"], string> = {
  automatisé: "#34d399",
  inclus: "#357AB7",
  alertes: "#fbbf24",
  tracking: "#a78bfa",
};

export const statusLabels: Record<ComplianceItem["status"], string> = {
  automatisé: "Automatisé",
  inclus: "Inclus",
  alertes: "Alertes",
  tracking: "Tracking",
};
