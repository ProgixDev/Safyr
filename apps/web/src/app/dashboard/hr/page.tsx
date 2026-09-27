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
  Zap,
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
} from "@/components/hr/HRDashboardCharts";

// ── Widget type with component ────────────────────────────────────────

type HRWidgetConfig = WidgetConfig & {
  component: React.ComponentType<{ isLoading: boolean }>;
};

// ── Couleurs des cartes ───────────────────────────────────────────────

/**
 * Une teinte par carte. Classes écrites en entier (Tailwind ne détecte pas
 * les noms assemblés) : nuance 600/700 en clair pour un texte foncé lisible,
 * nuance 300/400 en sombre. `hex` sert aux styles en ligne (liseré, dégradé),
 * car `Card` et `.glass-card` posent déjà leur propre bordure et leur fond.
 */
const TEINTES = {
  blue: {
    hex: "#3b82f6",
    pastille: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    valeur: "text-blue-700 dark:text-blue-300",
    barre: "bg-blue-500/20 [&>div]:bg-blue-500",
    bouton:
      "border-blue-500/30 bg-blue-500/10 hover:border-blue-500/60 hover:bg-blue-500/20",
  },
  orange: {
    hex: "#f97316",
    pastille: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    valeur: "text-orange-700 dark:text-orange-300",
    barre: "bg-orange-500/20 [&>div]:bg-orange-500",
    bouton:
      "border-orange-500/30 bg-orange-500/10 hover:border-orange-500/60 hover:bg-orange-500/20",
  },
  rose: {
    hex: "#f43f5e",
    pastille: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    valeur: "text-rose-700 dark:text-rose-300",
    barre: "bg-rose-500/20 [&>div]:bg-rose-500",
    bouton:
      "border-rose-500/30 bg-rose-500/10 hover:border-rose-500/60 hover:bg-rose-500/20",
  },
  emerald: {
    hex: "#10b981",
    pastille: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    valeur: "text-emerald-700 dark:text-emerald-300",
    barre: "bg-emerald-500/20 [&>div]:bg-emerald-500",
    bouton:
      "border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/60 hover:bg-emerald-500/20",
  },
  violet: {
    hex: "#8b5cf6",
    pastille: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    valeur: "text-violet-700 dark:text-violet-300",
    barre: "bg-violet-500/20 [&>div]:bg-violet-500",
    bouton:
      "border-violet-500/30 bg-violet-500/10 hover:border-violet-500/60 hover:bg-violet-500/20",
  },
  teal: {
    hex: "#14b8a6",
    pastille: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    valeur: "text-teal-700 dark:text-teal-300",
    barre: "bg-teal-500/20 [&>div]:bg-teal-500",
    bouton:
      "border-teal-500/30 bg-teal-500/10 hover:border-teal-500/60 hover:bg-teal-500/20",
  },
  amber: {
    hex: "#f59e0b",
    pastille: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    valeur: "text-amber-700 dark:text-amber-300",
    barre: "bg-amber-500/20 [&>div]:bg-amber-500",
    bouton:
      "border-amber-500/30 bg-amber-500/10 hover:border-amber-500/60 hover:bg-amber-500/20",
  },
  fuchsia: {
    hex: "#d946ef",
    pastille: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
    valeur: "text-fuchsia-700 dark:text-fuchsia-300",
    barre: "bg-fuchsia-500/20 [&>div]:bg-fuchsia-500",
    bouton:
      "border-fuchsia-500/30 bg-fuchsia-500/10 hover:border-fuchsia-500/60 hover:bg-fuchsia-500/20",
  },
  indigo: {
    hex: "#6366f1",
    pastille: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    valeur: "text-indigo-700 dark:text-indigo-300",
    barre: "bg-indigo-500/20 [&>div]:bg-indigo-500",
    bouton:
      "border-indigo-500/30 bg-indigo-500/10 hover:border-indigo-500/60 hover:bg-indigo-500/20",
  },
  red: {
    hex: "#ef4444",
    pastille: "bg-red-500/15 text-red-600 dark:text-red-400",
    valeur: "text-red-700 dark:text-red-300",
    barre: "bg-red-500/20 [&>div]:bg-red-500",
    bouton:
      "border-red-500/30 bg-red-500/10 hover:border-red-500/60 hover:bg-red-500/20",
  },
  sky: {
    hex: "#0ea5e9",
    pastille: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    valeur: "text-sky-700 dark:text-sky-300",
    barre: "bg-sky-500/20 [&>div]:bg-sky-500",
    bouton:
      "border-sky-500/30 bg-sky-500/10 hover:border-sky-500/60 hover:bg-sky-500/20",
  },
  cyan: {
    hex: "#295F8E",
    pastille: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    valeur: "text-cyan-700 dark:text-cyan-300",
    barre: "bg-cyan-500/20 [&>div]:bg-cyan-500",
    bouton:
      "border-cyan-500/30 bg-cyan-500/10 hover:border-cyan-500/60 hover:bg-cyan-500/20",
  },
  lime: {
    hex: "#84cc16",
    pastille: "bg-lime-500/15 text-lime-700 dark:text-lime-400",
    valeur: "text-lime-700 dark:text-lime-300",
    barre: "bg-lime-500/20 [&>div]:bg-lime-500",
    bouton:
      "border-lime-500/30 bg-lime-500/10 hover:border-lime-500/60 hover:bg-lime-500/20",
  },
  pink: {
    hex: "#ec4899",
    pastille: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
    valeur: "text-pink-700 dark:text-pink-300",
    barre: "bg-pink-500/20 [&>div]:bg-pink-500",
    bouton:
      "border-pink-500/30 bg-pink-500/10 hover:border-pink-500/60 hover:bg-pink-500/20",
  },
  green: {
    hex: "#22c55e",
    pastille: "bg-green-500/15 text-green-600 dark:text-green-400",
    valeur: "text-green-700 dark:text-green-300",
    barre: "bg-green-500/20 [&>div]:bg-green-500",
    bouton:
      "border-green-500/30 bg-green-500/10 hover:border-green-500/60 hover:bg-green-500/20",
  },
} as const;

type Teinte = keyof typeof TEINTES;

const TEXTE_SECONDAIRE = "text-slate-600 dark:text-slate-400";

// Paddings resserrés (Card en pose 24 px) pour que tout tienne sur un écran.
const ENTETE = "px-4 pt-3 pb-1";
const CORPS = "px-4 pt-0 pb-3";

/** Carte d'indicateur : liseré coloré à gauche, léger dégradé teinté. */
function CarteKpi({
  teinte,
  className,
  children,
}: {
  teinte: Teinte;
  className?: string;
  children: React.ReactNode;
}) {
  const { hex } = TEINTES[teinte];
  return (
    <Card
      className={cn(
        "glass-card flex h-full flex-col transition-all hover:shadow-md",
        className,
      )}
      style={{
        borderColor: `${hex}59`,
        borderLeftColor: hex,
        borderLeftWidth: 4,
        backgroundImage: `linear-gradient(135deg, ${hex}1f, transparent 65%)`,
      }}
    >
      {children}
    </Card>
  );
}

function TitreKpi({
  teinte,
  icone: Icone,
  children,
}: {
  teinte: Teinte;
  icone: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className={cn("shrink-0 rounded-lg p-1", TEINTES[teinte].pastille)}>
        <Icone className="h-4 w-4" />
      </span>
      <span className="truncate">{children}</span>
    </CardTitle>
  );
}

// ── Widget Components ─────────────────────────────────────────────────

/**
 * Tuile « Non disponible » : utilisee pour les indicateurs dont la source
 * n'existe pas encore (paie, absences, recrutement...). On prefere l'afficher
 * explicitement plutot que d'inventer un chiffre.
 */
function WidgetIndisponible({
  titre,
  icone,
  raison,
  teinte,
}: {
  titre: string;
  icone: React.ElementType;
  raison: string;
  teinte: Teinte;
}) {
  return (
    <CarteKpi teinte={teinte}>
      <CardHeader className={ENTETE}>
        <TitreKpi teinte={teinte} icone={icone}>
          {titre}
        </TitreKpi>
      </CardHeader>
      <CardContent className={CORPS}>
        <div className="space-y-1">
          <span
            className={cn(
              "text-3xl font-semibold tracking-tight opacity-60",
              TEINTES[teinte].valeur,
            )}
          >
            —
          </span>
          <p className={cn("text-xs", TEXTE_SECONDAIRE)}>{raison}</p>
        </div>
      </CardContent>
    </CarteKpi>
  );
}

function ChargementWidget() {
  return (
    <Card className="glass-card border-border/40 h-full">
      <CardHeader className={ENTETE}>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className={CORPS}>
        <Skeleton className="h-8 w-40 mb-3" />
        <Skeleton className="h-16 w-full" />
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
    <CarteKpi teinte="blue">
      <CardHeader className={ENTETE}>
        <TitreKpi teinte="blue" icone={Users}>
          Effectif Total
        </TitreKpi>
      </CardHeader>
      <CardContent className={CORPS}>
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span
                className={cn(
                  "text-3xl font-semibold tracking-tight",
                  TEINTES.blue.valeur,
                )}
              >
                {total}
              </span>
              <span className={cn("ml-2 text-xs", TEXTE_SECONDAIRE)}>
                salarié{total > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1 pb-1 text-xs font-medium">
              <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300">
                {actifs} actif{actifs > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 border-t border-blue-500/20 pt-2">
            <p className={cn("text-xs", TEXTE_SECONDAIRE)}>
              CDI{" "}
              <span className="text-base font-semibold text-emerald-700 dark:text-emerald-300">
                {cdi}
              </span>
            </p>
            <p className={cn("text-xs", TEXTE_SECONDAIRE)}>
              CDD{" "}
              <span className="text-base font-semibold text-orange-700 dark:text-orange-300">
                {cdd}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </CarteKpi>
  );
}

function AbsenceWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="Taux d'absentéisme"
      icone={Calendar}
      teinte="orange"
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
      teinte="rose"
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
    <CarteKpi teinte="emerald">
      <CardHeader className={ENTETE}>
        <TitreKpi teinte="emerald" icone={Shield}>
          Conformité documentaire
        </TitreKpi>
      </CardHeader>
      <CardContent className={CORPS}>
        {total === 0 ? (
          <p className={cn("text-sm", TEXTE_SECONDAIRE)}>
            Aucun document exigé n&apos;est encore configuré.
          </p>
        ) : (
          <div className="space-y-2">
            <div>
              <span
                className={cn(
                  "text-3xl font-semibold tracking-tight",
                  TEINTES.emerald.valeur,
                )}
              >
                {taux}%
              </span>
              <span className={cn("ml-2 text-xs", TEXTE_SECONDAIRE)}>
                conforme
              </span>
            </div>
            <Progress
              value={taux}
              className={cn("h-1.5", TEINTES.emerald.barre)}
            />
            <div className="flex items-center gap-6 border-t border-emerald-500/20 pt-2">
              <p className={cn("text-xs", TEXTE_SECONDAIRE)}>
                À jour{" "}
                <span className="text-base font-semibold text-emerald-700 dark:text-emerald-300">
                  {conformes}
                </span>
              </p>
              <p className={cn("text-xs", TEXTE_SECONDAIRE)}>
                À fournir{" "}
                <span className="text-base font-semibold text-orange-700 dark:text-orange-300">
                  {aRenouveler}
                </span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </CarteKpi>
  );
}

const GROUPES_HABILITATION: {
  label: string;
  types: string[];
  teinte: Teinte;
}[] = [
  { label: "SSIAP", types: ["SSIAP1", "SSIAP2", "SSIAP3"], teinte: "blue" },
  { label: "SST", types: ["SST"], teinte: "rose" },
  { label: "H0B0", types: ["H0B0"], teinte: "amber" },
  { label: "Carte pro", types: ["CNAPS", "CQP_APS"], teinte: "emerald" },
];

function TrainingWidget({ isLoading }: { isLoading: boolean }) {
  const { data: employees = [], isLoading: chargement } = useEmployees();

  // Habilitations réelles des salariés, réparties par échéance.
  const groupes = useMemo(() => {
    const maintenant = new Date().getTime();
    const dans60Jours = maintenant + 60 * 86_400_000;
    return GROUPES_HABILITATION.map(({ label, types, teinte }) => {
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
        teinte,
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
    <CarteKpi teinte="indigo">
      <CardHeader className={ENTETE}>
        <div className="flex items-center justify-between">
          <TitreKpi teinte="indigo" icone={Award}>
            Formations & Habilitations
          </TitreKpi>
          <Link
            href="/dashboard/hr/safety-health-training/authorizations-matrix"
            className="text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1"
          >
            Voir tout
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className={CORPS}>
        {totalGeneral === 0 ? (
          <p className={cn("text-sm", TEXTE_SECONDAIRE)}>
            Aucune habilitation enregistrée sur les dossiers salariés.
          </p>
        ) : (
          <div className="space-y-1.5">
            {groupes
              .filter((g) => g.total > 0)
              .map((g) => (
                <div
                  key={g.label}
                  className="flex items-center gap-2"
                  title={`${g.total} au total : ${g.valides} valides, ${g.bientot} à renouveler, ${g.expirees} expirées`}
                >
                  <span
                    className={cn(
                      "w-16 shrink-0 truncate text-xs font-semibold",
                      TEINTES[g.teinte].valeur,
                    )}
                  >
                    {g.label}
                  </span>
                  <div className="flex h-2 min-w-0 flex-1 gap-0.5">
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
                  <span className="shrink-0 text-xs font-semibold tabular-nums">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {g.valides}
                    </span>
                    <span className={TEXTE_SECONDAIRE}>/</span>
                    <span className="text-orange-700 dark:text-orange-400">
                      {g.bientot}
                    </span>
                    <span className={TEXTE_SECONDAIRE}>/</span>
                    <span className="text-red-700 dark:text-red-400">
                      {g.expirees}
                    </span>
                  </span>
                </div>
              ))}
            <div className="flex gap-3 pt-0.5 text-[11px] font-medium">
              <span className="text-emerald-700 dark:text-emerald-400">
                valides
              </span>
              <span className="text-orange-700 dark:text-orange-400">
                à renouveler
              </span>
              <span className="text-red-700 dark:text-red-400">expirées</span>
            </div>
          </div>
        )}
      </CardContent>
    </CarteKpi>
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
        teinte: "red" as Teinte,
        href: "/dashboard/hr/safety-health-training/authorizations-matrix",
      },
      {
        icon: Clock,
        label: "Expirations sous 30 j",
        count: habilitationsBientot,
        teinte: "orange" as Teinte,
        href: "/dashboard/hr/safety-health-training/authorizations-matrix",
      },
      {
        icon: FileText,
        label: "Documents obligatoires manquants",
        count: docsManquants,
        teinte: "blue" as Teinte,
        href: "/dashboard/hr/entreprise",
      },
    ];
  }, [compliance, employees]);

  if (isLoading || chargeConf || chargeSal) return <ChargementWidget />;

  const total = alertes.reduce((s, a) => s + a.count, 0);

  return (
    <CarteKpi teinte="red">
      <CardHeader className={ENTETE}>
        <div className="flex items-center justify-between">
          <TitreKpi teinte="red" icone={AlertTriangle}>
            Alertes RH
          </TitreKpi>
          <span
            className={cn(
              "text-xs font-medium",
              total === 0
                ? "text-emerald-700 dark:text-emerald-400"
                : TEINTES.red.valeur,
            )}
          >
            {total === 0 ? "Rien à signaler" : `${total} au total`}
          </span>
        </div>
      </CardHeader>
      <CardContent className={CORPS}>
        <div className="space-y-1.5">
          {alertes.map((a) => {
            const Icone = a.icon;
            const t = TEINTES[a.teinte];
            return (
              <Link
                key={a.label}
                href={a.href}
                title={a.label}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1 transition-colors",
                  t.bouton,
                )}
              >
                <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-foreground">
                  <Icone className={cn("h-3.5 w-3.5 shrink-0", t.valeur)} />
                  <span className="truncate">{a.label}</span>
                </span>
                <span
                  className={cn(
                    "text-base font-semibold",
                    a.count > 0 ? t.valeur : TEXTE_SECONDAIRE,
                  )}
                >
                  {a.count}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </CarteKpi>
  );
}

function PendingRequestsWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="Demandes en attente"
      icone={Mail}
      teinte="sky"
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
      teinte="green"
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
      teinte="violet"
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
      teinte="teal"
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
      teinte="amber"
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
    <CarteKpi teinte="fuchsia">
      <CardHeader
        className={ENTETE}
        title="L'index d'égalité professionnelle exige les rémunérations : il sera calculé une fois la paie reliée."
      >
        <TitreKpi teinte="fuchsia" icone={Scale}>
          Répartition femmes / hommes
        </TitreKpi>
      </CardHeader>
      <CardContent className={CORPS}>
        {renseignes === 0 ? (
          <p className={cn("text-sm", TEXTE_SECONDAIRE)}>
            Le genre n&apos;est renseigné sur aucun dossier salarié.
          </p>
        ) : (
          <div className="space-y-2">
            <div>
              <span
                className={cn(
                  "text-3xl font-semibold tracking-tight",
                  TEINTES.fuchsia.valeur,
                )}
              >
                {partFemmes}%
              </span>
              <span className={cn("ml-2 text-xs", TEXTE_SECONDAIRE)}>
                de femmes
              </span>
            </div>
            <Progress
              value={partFemmes}
              className={cn("h-1.5", TEINTES.fuchsia.barre)}
            />
            <div className="flex items-center gap-6 border-t border-fuchsia-500/20 pt-2">
              <p className={cn("text-xs", TEXTE_SECONDAIRE)}>
                Femmes{" "}
                <span className="text-base font-semibold text-fuchsia-700 dark:text-fuchsia-300">
                  {femmes}
                </span>
              </p>
              <p className={cn("text-xs", TEXTE_SECONDAIRE)}>
                Hommes{" "}
                <span className="text-base font-semibold text-blue-700 dark:text-blue-300">
                  {hommes}
                </span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </CarteKpi>
  );
}

function HRForecastWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ChargementWidget />;
  return (
    <WidgetIndisponible
      titre="Prévisions RH"
      icone={Target}
      teinte="cyan"
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
      teinte="lime"
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
      teinte="pink"
      raison="Nécessite le suivi des candidatures en base."
    />
  );
}

function QuickActionsWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className={ENTETE}>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className={CORPS}>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const actions: {
    label: string;
    href: string;
    icon: React.ElementType;
    teinte: Teinte;
  }[] = [
    {
      label: "Nouveau salarié",
      href: "/dashboard/hr/collaborators",
      icon: UserCheck,
      teinte: "blue",
    },
    {
      label: "Nouveau client",
      href: "/dashboard/hr/entreprise/clients?new=1",
      icon: Building2,
      teinte: "emerald",
    },
    {
      label: "Nouveau site",
      href: "/dashboard/hr/sites?new=1",
      icon: MapPin,
      teinte: "teal",
    },
    {
      label: "Voir congés",
      href: "/dashboard/hr/time-activity/conges",
      icon: Calendar,
      teinte: "orange",
    },
    {
      label: "Bilan social",
      href: "/dashboard/hr/hr-services/social-audit",
      icon: BarChart3,
      teinte: "violet",
    },
    {
      label: "Marketing",
      href: "/dashboard/hr/business/marketing",
      icon: Megaphone,
      teinte: "pink",
    },
    {
      label: "Appels d'offre",
      href: "/dashboard/hr/business/tenders",
      icon: FileText,
      teinte: "amber",
    },
    {
      label: "AKTO & OPCO",
      href: "/dashboard/hr/safety-health-training/training-plan/akto",
      icon: GraduationCap,
      teinte: "indigo",
    },
    {
      label: "Fin de contrat",
      href: "/dashboard/hr/lifecycle/offboarding",
      icon: UserX,
      teinte: "red",
    },
    {
      label: "Communication",
      href: "/dashboard/hr/hr-services/communication",
      icon: Mail,
      teinte: "sky",
    },
  ];

  return (
    <CarteKpi teinte="cyan">
      <div className="flex flex-col gap-2 px-4 py-3 xl:flex-row xl:items-center xl:gap-4">
        <CardTitle className="shrink-0 text-sm font-semibold text-foreground">
          <span className="flex items-center gap-2">
            <span className={cn("rounded-lg p-1", TEINTES.cyan.pastille)}>
              <Zap className="h-4 w-4" />
            </span>
            Actions rapides
          </span>
        </CardTitle>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-5 2xl:grid-cols-10">
          {actions.map((action) => {
            const Icon = action.icon;
            const t = TEINTES[action.teinte];
            return (
              <Link
                key={action.label}
                href={action.href}
                title={action.label}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-all hover:-translate-y-0.5 hover:shadow-md",
                  t.bouton,
                )}
              >
                <span className={cn("rounded-md p-1 shrink-0", t.pastille)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </CarteKpi>
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

/** Camemberts : cartes étroites empilées à gauche de la zone graphiques. */
const ANNEAU_IDS = ["contractTypePie", "employeeStatusPie"];

const CARTES_PAR_RANGEE = 5;

/** Grille d'une rangée de cartes ; la dernière carte impaire prend la largeur. */
const GRILLE_RANGEE =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2 xl:[&>*:last-child:nth-child(odd)]:col-span-1";

function decouper<T>(liste: T[], taille: number): T[][] {
  const rangees: T[][] = [];
  for (let i = 0; i < liste.length; i += taille) {
    rangees.push(liste.slice(i, i + taille));
  }
  return rangees;
}

function CelluleGraphique({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] min-w-0 xl:min-h-0 [&>*]:min-w-0 [&>*]:flex-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

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

  // Vue normale : cartes d'indicateurs, graphiques, actions rapides.
  const cartes = visibleWidgets.filter(
    (c) => c.id !== "quickActions" && !CHART_WIDGET_IDS.includes(c.id),
  );
  const rangeesCartes = decouper(cartes, CARTES_PAR_RANGEE);
  const graphiques = visibleWidgets.filter((c) =>
    CHART_WIDGET_IDS.includes(c.id),
  );
  const anneaux = graphiques.filter((c) => ANNEAU_IDS.includes(c.id));
  const autresGraphiques = graphiques.filter((c) => !ANNEAU_IDS.includes(c.id));
  const lignesAutres = autresGraphiques.length > 1 ? 2 : 1;
  const colonnesAutres = Math.ceil(autresGraphiques.length / lignesAutres);
  const actionsRapides = visibleWidgets.find((c) => c.id === "quickActions");

  return (
    // min-h-full : la page remplit la hauteur de <main> (les rangées
    // s'étirent) et ne défile que si le contenu dépasse vraiment.
    <div className="flex min-h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-light tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs font-light text-muted-foreground">
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
        <>
          {/* Indicateurs : une rangée par tranche de 5 cartes, chaque rangée
              prend toute la largeur (pas de case vide). */}
          {rangeesCartes.map((rangee) => (
            <div
              key={rangee.map((c) => c.id).join("+")}
              className={cn(GRILLE_RANGEE, "xl:grid-cols-(--colonnes)")}
              style={
                {
                  "--colonnes": `repeat(${rangee.length}, minmax(0, 1fr))`,
                } as React.CSSProperties
              }
            >
              {rangee.map((config) => (
                <div
                  key={config.id}
                  className="flex min-w-0 [&>*]:min-w-0 [&>*]:flex-1"
                >
                  {renderWidget(config)}
                </div>
              ))}
            </div>
          ))}

          {/* Graphiques : anneaux compacts empilés à gauche, autres graphiques
              en grille 2 lignes à droite. La zone prend toute la hauteur
              restante de l'écran (xl et plus). */}
          {graphiques.length > 0 && (
            <div
              className="grid grid-cols-1 gap-3 xl:min-h-[300px] xl:flex-1 xl:grid-cols-(--repartition) xl:grid-rows-[minmax(0,1fr)]"
              style={
                {
                  "--repartition":
                    anneaux.length > 0 && autresGraphiques.length > 0
                      ? "minmax(0, 1fr) minmax(0, 3fr)"
                      : "minmax(0, 1fr)",
                } as React.CSSProperties
              }
            >
              {anneaux.length > 0 && (
                <div
                  className="grid grid-cols-1 gap-3 xl:grid-rows-(--lignes)"
                  style={
                    {
                      "--lignes": `repeat(${anneaux.length}, minmax(0, 1fr))`,
                    } as React.CSSProperties
                  }
                >
                  {anneaux.map((config) => (
                    <CelluleGraphique key={config.id}>
                      {renderWidget(config)}
                    </CelluleGraphique>
                  ))}
                </div>
              )}
              {autresGraphiques.length > 0 && (
                <div
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-(--colonnes) xl:grid-rows-(--lignes)"
                  style={
                    {
                      "--colonnes": `repeat(${colonnesAutres}, minmax(0, 1fr))`,
                      "--lignes": `repeat(${lignesAutres}, minmax(0, 1fr))`,
                    } as React.CSSProperties
                  }
                >
                  {autresGraphiques.map((config, i) => (
                    <CelluleGraphique
                      key={config.id}
                      // Nombre impair : la dernière carte occupe deux colonnes.
                      className={
                        autresGraphiques.length % 2 === 1 &&
                        autresGraphiques.length > 1 &&
                        i === autresGraphiques.length - 1
                          ? "sm:col-span-2"
                          : undefined
                      }
                    >
                      {renderWidget(config)}
                    </CelluleGraphique>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions rapides */}
          {actionsRapides && renderWidget(actionsRapides)}
        </>
      )}
    </div>
  );
}
