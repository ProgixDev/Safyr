"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
  Shield,
  FileText,
  UserCheck,
  Award,
  Briefcase,
  ChevronRight,
  Target,
  DollarSign,
  Scale,
  BarChart3,
  Activity,
  UserPlus,
  Mail,
  Megaphone,
  GraduationCap,
  UserX,
  Building2,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/hooks/employees";
import { useOrganizationCompliance } from "@/hooks/organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  WidgetConfig,
  useWidgetSystem,
  CustomizerModal,
  WidgetGrid,
  PersonnaliserButton,
} from "@/components/ui/widget-customizer";
import {
  ContractTypePieWidget,
  EmployeeStatusPieWidget,
  TrainingStatusBarWidget,
  StaffFlowBarWidget,
  HeadcountTrendLineWidget,
  ComplianceRadarWidget,
  RadialGauge,
  MiniDonut,
} from "@/components/hr/HRDashboardCharts";

// ── Widget type with component ────────────────────────────────────────

type HRWidgetConfig = WidgetConfig & {
  component: React.ComponentType<{ isLoading: boolean }>;
};

// ── Widget Components ─────────────────────────────────────────────────

/**
 * Tuile « Non disponible » : utilisee pour les indicateurs dont la source
 * n'existe pas encore (paie, absences, recrutement...). On prefere l'afficher
 * explicitement plutot que d'inventer un chiffre.
 */
function WidgetIndisponible({
  titre,
  icone: Icone,
  raison,
}: {
  titre: string;
  icone: React.ElementType;
  raison: string;
}) {
  return (
    <Card className="glass-card border-border/40 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Icone className="h-4 w-4 text-muted-foreground" />
          {titre}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <span className="text-4xl font-light tracking-tight text-muted-foreground">
            —
          </span>
          <p className="text-xs text-muted-foreground">{raison}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ChargementWidget() {
  return (
    <Card className="glass-card border-border/40 h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

function EmployeeStatsWidget({ isLoading }: { isLoading: boolean }) {
  const { data: employees = [], isLoading: chargement } = useEmployees();

  const total = employees.length;
  const cdi = employees.filter((e) => e.contractType === "CDI").length;
  const cdd = employees.filter((e) => e.contractType === "CDD").length;
  const actifs = employees.filter((e) => e.status === "active").length;

  if (isLoading || chargement) return <ChargementWidget />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Effectif Total
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <span className="text-4xl font-light tracking-tight">{total}</span>
            <span className="ml-2 text-sm text-muted-foreground">
              salarié{total > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">CDI</p>
              <p className="text-xl font-light">{cdi}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CDD</p>
              <p className="text-xl font-light">{cdd}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400">
              {actifs} actif{actifs > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AbsenceWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="Taux d'absentéisme"
      icone={Calendar}
      raison="Disponible une fois le module Absences & Congés relié à la base."
    />
  );
}

function TurnoverWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="Turnover"
      icone={TrendingUp}
      raison="Nécessite l'historique des entrées et sorties, pas encore enregistré."
    />
  );
}

function ComplianceWidget({ isLoading }: { isLoading: boolean }) {
  const { data: compliance = [], isLoading: chargement } =
    useOrganizationCompliance();

  const total = compliance.length;
  const conformes = compliance.filter((c) => c.status === "valid").length;
  const aRenouveler = total - conformes;
  const taux = total > 0 ? Math.round((conformes / total) * 1000) / 10 : 0;

  if (isLoading || chargement) return <ChargementWidget />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-500" />
          Conformité documentaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun document exigé n'est encore configuré.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-4xl font-light tracking-tight">
                {taux}%
              </span>
              <span className="ml-2 text-sm text-muted-foreground">
                conforme
              </span>
            </div>
            <Progress value={taux} className="h-2" />
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">À jour</p>
                <p className="text-lg font-light text-emerald-400">
                  {conformes}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">À fournir</p>
                <p className="text-lg font-light text-orange-400">
                  {aRenouveler}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const GROUPES_HABILITATION: { label: string; types: string[] }[] = [
  { label: "SSIAP", types: ["SSIAP1", "SSIAP2", "SSIAP3"] },
  { label: "SST", types: ["SST"] },
  { label: "H0B0", types: ["H0B0"] },
  { label: "Carte pro", types: ["CNAPS", "CQP_APS"] },
];

function TrainingWidget({ isLoading }: { isLoading: boolean }) {
  const { data: employees = [], isLoading: chargement } = useEmployees();

  // Habilitations réelles des salariés, réparties par échéance.
  const groupes = useMemo(() => {
    const maintenant = new Date().getTime();
    const dans60Jours = maintenant + 60 * 86_400_000;
    return GROUPES_HABILITATION.map(({ label, types }) => {
      let valides = 0;
      let bientot = 0;
      let expirees = 0;
      for (const e of employees) {
        for (const c of e.certifications ?? []) {
          if (!types.includes(c.type)) continue;
          const fin = new Date(c.expiryDate).getTime();
          if (fin < maintenant) expirees += 1;
          else if (fin < dans60Jours) bientot += 1;
          else valides += 1;
        }
      }
      return {
        label,
        valides,
        bientot,
        expirees,
        total: valides + bientot + expirees,
      };
    });
  }, [employees]);

  const totalGeneral = groupes.reduce((s, g) => s + g.total, 0);

  if (isLoading || chargement) return <ChargementWidget />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Formations & Habilitations
          </CardTitle>
          <Link
            href="/dashboard/hr/safety-health-training/authorizations-matrix"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Voir tout
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {totalGeneral === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune habilitation enregistrée sur les dossiers salariés.
          </p>
        ) : (
          <div className="space-y-3">
            {groupes
              .filter((g) => g.total > 0)
              .map((g) => (
                <div key={g.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{g.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {g.total} au total
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div
                      className="bg-emerald-500 rounded-l-lg"
                      style={{ width: `${(g.valides / g.total) * 100}%` }}
                    />
                    <div
                      className="bg-orange-500"
                      style={{ width: `${(g.bientot / g.total) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 rounded-r-lg"
                      style={{ width: `${(g.expirees / g.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="text-emerald-400">
                      {g.valides} valides
                    </span>
                    <span className="text-orange-400">
                      {g.bientot} à renouveler
                    </span>
                    <span className="text-red-400">{g.expirees} expirées</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertsWidget({ isLoading }: { isLoading: boolean }) {
  const { data: compliance = [], isLoading: chargeConf } =
    useOrganizationCompliance();
  const { data: employees = [], isLoading: chargeSal } = useEmployees();

  // Alertes réelles : documents d'entreprise + habilitations des salariés.
  const alertes = useMemo(() => {
    const maintenant = new Date().getTime();
    const dans30Jours = maintenant + 30 * 86_400_000;

    const docsManquants = compliance.filter(
      (c) => c.requirement.isRequired && !c.document,
    ).length;

    let habilitationsExpirees = 0;
    let habilitationsBientot = 0;
    for (const e of employees) {
      for (const c of e.certifications ?? []) {
        const fin = new Date(c.expiryDate).getTime();
        if (fin < maintenant) habilitationsExpirees += 1;
        else if (fin < dans30Jours) habilitationsBientot += 1;
      }
    }

    return [
      {
        icon: AlertTriangle,
        label: "Habilitations expirées",
        count: habilitationsExpirees,
        color: "text-red-500",
        href: "/dashboard/hr/safety-health-training/authorizations-matrix",
      },
      {
        icon: Clock,
        label: "Expirations sous 30 j",
        count: habilitationsBientot,
        color: "text-orange-500",
        href: "/dashboard/hr/safety-health-training/authorizations-matrix",
      },
      {
        icon: FileText,
        label: "Documents obligatoires manquants",
        count: docsManquants,
        color: "text-blue-500",
        href: "/dashboard/hr/entreprise",
      },
    ];
  }, [compliance, employees]);

  if (isLoading || chargeConf || chargeSal) return <ChargementWidget />;

  const total = alertes.reduce((s, a) => s + a.count, 0);

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Alertes RH
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {total === 0 ? "Rien à signaler" : `${total} au total`}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alertes.map((a) => {
            const Icone = a.icon;
            return (
              <Link
                key={a.label}
                href={a.href}
                className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2 text-sm">
                  <Icone className={cn("h-4 w-4", a.color)} />
                  {a.label}
                </span>
                <span
                  className={cn(
                    "text-lg font-light",
                    a.count > 0 ? a.color : "text-muted-foreground",
                  )}
                >
                  {a.count}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PendingRequestsWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="Demandes en attente"
      icone={Mail}
      raison="Les demandes RH ne sont pas encore enregistrées en base."
    />
  );
}

function PayrollWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="Masse salariale"
      icone={DollarSign}
      raison="Nécessite le module Paie relié à la base."
    />
  );
}

function DelegationHoursWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="Heures de délégation CSE"
      icone={Scale}
      raison="Nécessite la saisie des heures de délégation."
    />
  );
}

function CostPerEmployeeWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="Coût par employé"
      icone={BarChart3}
      raison="Nécessite les salaires, pas encore enregistrés en base."
    />
  );
}

function EmployerChargesWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="Charges patronales"
      icone={Briefcase}
      raison="Nécessite le module Paie relié à la base."
    />
  );
}

function GenderEqualityWidget({ isLoading }: { isLoading: boolean }) {
  const { data: employees = [], isLoading: chargement } = useEmployees();

  const hommes = employees.filter((e) => e.gender === "male").length;
  const femmes = employees.filter((e) => e.gender === "female").length;
  const renseignes = hommes + femmes;
  const partFemmes =
    renseignes > 0 ? Math.round((femmes / renseignes) * 100) : 0;

  if (isLoading || chargement) return <ChargementWidget />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          Répartition femmes / hommes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renseignes === 0 ? (
          <p className="text-sm text-muted-foreground">
            Le genre n'est renseigné sur aucun dossier salarié.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-4xl font-light tracking-tight">
                {partFemmes}%
              </span>
              <span className="ml-2 text-sm text-muted-foreground">
                de femmes
              </span>
            </div>
            <Progress value={partFemmes} className="h-2" />
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Femmes</p>
                <p className="text-lg font-light">{femmes}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hommes</p>
                <p className="text-lg font-light">{hommes}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              L'index d'égalité professionnelle exige les rémunérations : il
              sera calculé une fois la paie reliée.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HRForecastWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="Prévisions RH"
      icone={Target}
      raison="Nécessite un historique d'effectif, pas encore constitué."
    />
  );
}

function SalaryMaintenanceWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="Maintien de salaire"
      icone={Activity}
      raison="Nécessite les arrêts de travail et le module Paie."
    />
  );
}

function RecruitmentKPIsWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="KPIs recrutement"
      icone={UserPlus}
      raison="Nécessite le suivi des candidatures en base."
    />
  );
}

function QuickActionsWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const actions = [
    {
      label: "Nouveau salarié",
      href: "/dashboard/hr/collaborators",
      icon: UserCheck,
    },
    {
      label: "Nouveau client",
      href: "/dashboard/hr/entreprise/clients?new=1",
      icon: Building2,
    },
    {
      label: "Nouveau site",
      href: "/dashboard/hr/sites?new=1",
      icon: MapPin,
    },
    {
      label: "Voir congés",
      href: "/dashboard/hr/time-activity/absences",
      icon: Calendar,
    },
    {
      label: "Bilan social",
      href: "/dashboard/hr/hr-services/social-audit",
      icon: BarChart3,
    },
    {
      label: "Marketing",
      href: "/dashboard/hr/business/marketing",
      icon: Megaphone,
    },
    {
      label: "Appels d'offre",
      href: "/dashboard/hr/business/tenders",
      icon: FileText,
    },
    {
      label: "AKTO & OPCO",
      href: "/dashboard/hr/safety-health-training/training-plan/akto",
      icon: GraduationCap,
    },
    {
      label: "Fin de contrat",
      href: "/dashboard/hr/lifecycle/offboarding",
      icon: UserX,
    },
    {
      label: "Communication",
      href: "/dashboard/hr/hr-services/communication",
      icon: Mail,
    },
  ];

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground">
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all group"
              >
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                <span className="text-sm flex-1">{action.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Widget Config ─────────────────────────────────────────────────────

const defaultWidgetConfigs: HRWidgetConfig[] = [
  {
    id: "employeeStats",
    name: "Effectif Total",
    component: EmployeeStatsWidget,
    visible: true,
  },
  {
    id: "absence",
    name: "Taux d'Absentéisme",
    component: AbsenceWidget,
    visible: false,
  },
  {
    id: "turnover",
    name: "Turnover",
    component: TurnoverWidget,
    visible: false,
  },
  {
    id: "compliance",
    name: "Conformité CNAPS",
    component: ComplianceWidget,
    visible: true,
  },
  {
    id: "delegationHours",
    name: "Heures de délégation CSE",
    component: DelegationHoursWidget,
    visible: false,
  },
  {
    id: "costPerEmployee",
    name: "Coût par employé",
    component: CostPerEmployeeWidget,
    visible: false,
  },
  {
    id: "employerCharges",
    name: "Charges patronales",
    component: EmployerChargesWidget,
    visible: false,
  },
  {
    id: "genderEquality",
    name: "Index égalité H/F",
    component: GenderEqualityWidget,
    visible: true,
  },
  {
    id: "training",
    name: "Formations & Habilitations",
    component: TrainingWidget,
    visible: true,
  },
  { id: "alerts", name: "Alertes RH", component: AlertsWidget, visible: true },
  {
    id: "pendingRequests",
    name: "Demandes en attente",
    component: PendingRequestsWidget,
    visible: false,
  },
  {
    id: "hrForecast",
    name: "Prévisions RH",
    component: HRForecastWidget,
    visible: false,
  },
  {
    id: "salaryMaintenance",
    name: "Maintien salaire",
    component: SalaryMaintenanceWidget,
    visible: false,
  },
  {
    id: "recruitmentKPIs",
    name: "KPIs Recrutement",
    component: RecruitmentKPIsWidget,
    visible: false,
  },
  {
    id: "payroll",
    name: "Masse Salariale",
    component: PayrollWidget,
    visible: false,
  },
  {
    id: "contractTypePie",
    name: "Graphique — Répartition des contrats",
    component: ContractTypePieWidget,
    visible: true,
    span: "md:col-span-2 lg:col-span-2",
  },
  {
    id: "employeeStatusPie",
    name: "Graphique — Effectif par statut",
    component: EmployeeStatusPieWidget,
    visible: true,
    span: "md:col-span-2 lg:col-span-2",
  },
  {
    id: "trainingStatusBar",
    name: "Graphique — Formations & habilitations",
    component: TrainingStatusBarWidget,
    visible: true,
    span: "md:col-span-2 lg:col-span-2",
  },
  {
    id: "staffFlowBar",
    name: "Graphique — Embauches & départs",
    component: StaffFlowBarWidget,
    visible: true,
    span: "md:col-span-2 lg:col-span-2",
  },
  {
    id: "headcountTrendLine",
    name: "Graphique — Évolution de l'effectif",
    component: HeadcountTrendLineWidget,
    visible: true,
    span: "md:col-span-2 lg:col-span-2",
  },
  {
    id: "complianceRadar",
    name: "Graphique — Radar conformité",
    component: ComplianceRadarWidget,
    visible: true,
    span: "md:col-span-2 lg:col-span-2",
  },
  {
    id: "quickActions",
    name: "Actions rapides",
    component: QuickActionsWidget,
    visible: true,
    span: "md:col-span-2 lg:col-span-4",
  },
];

const CHART_WIDGET_IDS = [
  "contractTypePie",
  "employeeStatusPie",
  "trainingStatusBar",
  "staffFlowBar",
  "headcountTrendLine",
  "complianceRadar",
];

const hrWidgetMap = new Map<string, HRWidgetConfig>(
  defaultWidgetConfigs.map((c) => [c.id, c]),
);

// ── Page ──────────────────────────────────────────────────────────────

export default function HRDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  const {
    widgetConfigs,
    visibleWidgets,
    isEditMode,
    setIsEditMode,
    isDialogOpen,
    setIsDialogOpen,
    toggleVisibility,
    moveUp,
    moveDown,
    handleDragEnd,
    handleGridDragEnd,
  } = useWidgetSystem("hr", defaultWidgetConfigs);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const renderWidget = (config: WidgetConfig) => {
    const hrConfig = hrWidgetMap.get(config.id);
    if (!hrConfig) return null;
    const Component = hrConfig.component;
    return <Component isLoading={isLoading} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Tableau de bord RH
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Vue d&apos;ensemble des indicateurs clés RH
          </p>
        </div>
        <div className="flex gap-2">
          {isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(false)}
            >
              Quitter Édition
            </Button>
          )}
          <PersonnaliserButton onClick={() => setIsDialogOpen(true)} />
          <CustomizerModal
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            configs={widgetConfigs}
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
            onDragEnd={handleDragEnd}
            onToggle={toggleVisibility}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
          />
        </div>
      </div>

      {isEditMode ? (
        <WidgetGrid
          configs={widgetConfigs}
          isEditMode={isEditMode}
          renderWidget={renderWidget}
          onToggle={toggleVisibility}
          onGridDragEnd={handleGridDragEnd}
        />
      ) : (
        <div className="space-y-6">
          {/* Top Row - Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleWidgets
              .filter((config) =>
                ["employeeStats", "turnover", "compliance", "payroll"].includes(
                  config.id,
                ),
              )
              .map((config) => (
                <div key={config.id} className="h-full">
                  {renderWidget(config)}
                </div>
              ))}
          </div>

          {/* Charts Row - Histogrammes & Camemberts */}
          {visibleWidgets.some((config) =>
            CHART_WIDGET_IDS.includes(config.id),
          ) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visibleWidgets
                .filter((config) => CHART_WIDGET_IDS.includes(config.id))
                .map((config) => (
                  <div key={config.id} className="h-full">
                    {renderWidget(config)}
                  </div>
                ))}
            </div>
          )}

          {/* Second Row - Training & Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleWidgets
              .filter((config) =>
                ["training", "alerts", "pendingRequests"].includes(config.id),
              )
              .map((config) => (
                <div key={config.id} className="h-full">
                  {renderWidget(config)}
                </div>
              ))}
          </div>

          {/* Third Row - Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleWidgets
              .filter(
                (config) =>
                  ![
                    "employeeStats",
                    "turnover",
                    "compliance",
                    "payroll",
                    "training",
                    "alerts",
                    "pendingRequests",
                    "quickActions",
                    ...CHART_WIDGET_IDS,
                  ].includes(config.id),
              )
              .map((config) => (
                <div
                  key={config.id}
                  className={cn(config.span || "", "h-full")}
                >
                  {renderWidget(config)}
                </div>
              ))}
          </div>

          {/* Bottom Row - Quick Actions */}
          {visibleWidgets.some((config) => config.id === "quickActions") && (
            <div className="grid grid-cols-1 gap-4">
              {visibleWidgets
                .filter((config) => config.id === "quickActions")
                .map((config) => (
                  <div key={config.id} className="h-full">
                    {renderWidget(config)}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
