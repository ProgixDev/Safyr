"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  Radar,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployees } from "@/hooks/employees";
import { useOrganizationCompliance } from "@/hooks/organization";
import type { Employee, ComplianceItem } from "@safyr/api-client";

// ── Thème partagé ─────────────────────────────────────────────────────

const DARK_TOOLTIP = {
  contentStyle: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#f1f5f9",
    fontSize: 12,
  },
  labelStyle: { color: "#94a3b8" },
  cursor: { fill: "rgba(148, 163, 184, 0.08)" },
};

type PieDatum = { name: string; value: number; color: string };

function ChartCard({
  title,
  isLoading,
  isEmpty,
  children,
}: {
  title: string;
  isLoading: boolean;
  isEmpty?: boolean;
  children: React.ReactNode;
}) {
  // La carte reste affichée même sans donnée : la retirer laissait un trou
  // dans la grille du tableau de bord.
  return (
    <Card className="glass-card border-border/40 flex h-full flex-col">
      <CardHeader className="px-4 pt-3 pb-1">
        <CardTitle className="truncate text-sm font-semibold text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-4 pt-0 pb-3">
        {isLoading ? (
          <Skeleton className="h-full min-h-[100px] w-full" />
        ) : isEmpty ? (
          <p className="flex flex-1 items-center justify-center text-center text-xs text-muted-foreground">
            Aucune donnée à afficher pour le moment.
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Zone de graphique qui remplit la hauteur restante de la carte. Le conteneur
 * absolu évite que ResponsiveContainer (height 100 %) s'effondre à 0 px quand
 * la hauteur du parent vient d'un flex/grid.
 */
function ChartArea({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100px] flex-1">
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

function PieLegend({ data }: { data: PieDatum[] }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      {data.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          <span className="truncate text-xs text-muted-foreground">
            {entry.name}
          </span>
          <span className="ml-auto pl-1 text-xs font-medium text-foreground/80">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Mini-graphiques réutilisables (pour les widgets KPI) ──────────────

export function RadialGauge({
  value,
  max = 100,
  color = "#357AB7",
  display,
  caption,
}: {
  value: number;
  max?: number;
  color?: string;
  display: string;
  caption?: string;
}) {
  const data = [{ name: "v", value }];
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={150}>
        <RadialBarChart
          innerRadius="68%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, max]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: "#1e293b" }}
            dataKey="value"
            cornerRadius={10}
            fill={color}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-light tracking-tight">{display}</span>
        {caption && (
          <span className="text-[11px] text-muted-foreground">{caption}</span>
        )}
      </div>
    </div>
  );
}

export function MiniDonut({
  data,
  centerValue,
  centerCaption,
  valueSuffix = "",
}: {
  data: PieDatum[];
  centerValue: string;
  centerCaption?: string;
  /** Unité affichée après chaque valeur (légende + infobulle), ex. " €". */
  valueSuffix?: string;
}) {
  const formatValue = (value: number | string) =>
    `${typeof value === "number" ? value.toLocaleString("fr-FR") : value}${valueSuffix}`;

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={64}
              paddingAngle={3}
              dataKey="value"
              stroke="transparent"
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              {...DARK_TOOLTIP}
              formatter={(value, name) => [
                formatValue(value as number | string),
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-light tracking-tight">
            {centerValue}
          </span>
          {centerCaption && (
            <span className="text-[11px] text-muted-foreground">
              {centerCaption}
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-[11px] text-muted-foreground">
              {entry.name}{" "}
              <span className="text-foreground/80 font-medium">
                {formatValue(entry.value)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data }: { data: PieDatum[] }) {
  // Animation dynamique : la tranche cliquée s'agrandit (et se réduit au re-clic).
  const [activeIndex, setActiveIndex] = useState(-1);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    // Anneau réduit (96 px) avec la légende à droite : la carte reste basse.
    <div className="flex flex-1 items-center gap-3">
      <div className="relative h-24 w-24 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={27}
              outerRadius={41}
              paddingAngle={3}
              dataKey="value"
              // Recharts 3 a retiré `activeIndex` de <Pie> : on pilote nous-mêmes
              // le rayon de chaque secteur via `shape`.
              shape={(props: PieSectorDataItem & { index?: number }) => (
                <Sector
                  {...props}
                  outerRadius={
                    props.index === activeIndex
                      ? (props.outerRadius ?? 41) + 6
                      : (props.outerRadius ?? 41)
                  }
                />
              )}
              onClick={(_, index) =>
                setActiveIndex((cur) => (cur === index ? -1 : index))
              }
              isAnimationActive
              animationDuration={700}
              className="cursor-pointer"
            >
              {data.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.color}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              {...DARK_TOOLTIP}
              formatter={(value, name) => [value, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg leading-none font-light">{total}</span>
          <span className="text-[10px] text-muted-foreground">total</span>
        </div>
      </div>
      <PieLegend data={data} />
    </div>
  );
}

// ── Helpers (agrégation sur données réelles) ──────────────────────────

const MONTHS_FR = [
  "Janv",
  "Févr",
  "Mars",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sept",
  "Oct",
  "Nov",
  "Déc",
];

function lastNMonths(n: number) {
  const now = new Date();
  const out: { label: string; year: number; month: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      label: MONTHS_FR[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return out;
}

const CONTRACT_META: Record<string, { label: string; color: string }> = {
  CDI: { label: "CDI", color: "#357AB7" },
  CDD: { label: "CDD", color: "#a78bfa" },
  INTERIM: { label: "Intérim", color: "#fb923c" },
  APPRENTICESHIP: { label: "Apprentissage", color: "#34d399" },
  INTERNSHIP: { label: "Stage", color: "#f472b6" },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: "Actif", color: "#34d399" },
  inactive: { label: "Inactif", color: "#64748b" },
  suspended: { label: "Suspendu", color: "#fb923c" },
  terminated: { label: "Sorti", color: "#ef4444" },
};

const CERT_GROUP: Record<string, string> = {
  SSIAP1: "SSIAP",
  SSIAP2: "SSIAP",
  SSIAP3: "SSIAP",
  SST: "SST",
  H0B0: "H0B0",
  CNAPS: "Carte pro",
  CQP_APS: "CQP APS",
  VM: "Visite méd.",
  FIRE: "Incendie",
};

const CATEGORY_LABEL: Record<string, string> = {
  dirigeant: "Dirigeant",
  entreprise: "Entreprise",
  attestations: "Attestations",
  bancaire: "Bancaire",
  juridique: "Juridique",
  identite: "Identité",
  contrat: "Contrat",
  recrutement: "Recrutement",
  certification: "Certification",
};

function countBy<T>(items: T[], key: (item: T) => string | null | undefined) {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

// ── Widgets (données réelles via hooks) ───────────────────────────────

export function ContractTypePieWidget({ isLoading }: { isLoading: boolean }) {
  const { data: employees, isLoading: q } = useEmployees();
  const data = useMemo<PieDatum[]>(() => {
    const counts = countBy(employees ?? [], (e: Employee) => e.contractType);
    return Array.from(counts.entries()).map(([key, value]) => ({
      name: CONTRACT_META[key]?.label ?? key,
      value,
      color: CONTRACT_META[key]?.color ?? "#64748b",
    }));
  }, [employees]);

  return (
    <ChartCard
      title="Répartition des contrats"
      isLoading={isLoading || q}
      isEmpty={data.length === 0}
    >
      <DonutChart data={data} />
    </ChartCard>
  );
}

export function EmployeeStatusPieWidget({ isLoading }: { isLoading: boolean }) {
  const { data: employees, isLoading: q } = useEmployees();
  const data = useMemo<PieDatum[]>(() => {
    const counts = countBy(employees ?? [], (e: Employee) => e.status);
    return Array.from(counts.entries()).map(([key, value]) => ({
      name: STATUS_META[key]?.label ?? key,
      value,
      color: STATUS_META[key]?.color ?? "#64748b",
    }));
  }, [employees]);

  return (
    <ChartCard
      title="Effectif par statut"
      isLoading={isLoading || q}
      isEmpty={data.length === 0}
    >
      <DonutChart data={data} />
    </ChartCard>
  );
}

export function TrainingStatusBarWidget({ isLoading }: { isLoading: boolean }) {
  const { data: employees, isLoading: q } = useEmployees();
  const data = useMemo(() => {
    const groups = new Map<
      string,
      { type: string; aJour: number; expirant: number; expires: number }
    >();
    for (const emp of employees ?? []) {
      for (const cert of emp.certifications ?? []) {
        const group = CERT_GROUP[cert.type] ?? cert.type;
        const row = groups.get(group) ?? {
          type: group,
          aJour: 0,
          expirant: 0,
          expires: 0,
        };
        if (cert.status === "expired") row.expires += 1;
        else if (
          cert.status === "expiring" ||
          cert.status === "pending-renewal"
        )
          row.expirant += 1;
        else row.aJour += 1;
        groups.set(group, row);
      }
    }
    return Array.from(groups.values());
  }, [employees]);

  return (
    <ChartCard
      title="Formations & habilitations — statut par type"
      isLoading={isLoading || q}
      isEmpty={data.length === 0}
    >
      <ChartArea>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />
            <XAxis
              dataKey="type"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              {...DARK_TOOLTIP}
              formatter={(value, name) => [
                value,
                name === "aJour"
                  ? "À jour"
                  : name === "expirant"
                    ? "Expirant"
                    : "Expirés",
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              iconType="circle"
              formatter={(value: string) =>
                value === "aJour"
                  ? "À jour"
                  : value === "expirant"
                    ? "Expirant"
                    : "Expirés"
              }
            />
            <Bar dataKey="aJour" stackId="s" fill="#34d399" maxBarSize={48} />
            <Bar
              dataKey="expirant"
              stackId="s"
              fill="#fb923c"
              maxBarSize={48}
            />
            <Bar
              dataKey="expires"
              stackId="s"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartArea>
    </ChartCard>
  );
}

export function StaffFlowBarWidget({ isLoading }: { isLoading: boolean }) {
  const { data: employees, isLoading: q } = useEmployees();
  const data = useMemo(() => {
    const months = lastNMonths(12);
    const rows = months.map((m) => ({
      mois: m.label,
      entrees: 0,
      sorties: 0,
    }));
    const idx = new Map(months.map((m, i) => [`${m.year}-${m.month}`, i]));
    for (const emp of employees ?? []) {
      if (emp.hireDate) {
        const d = new Date(emp.hireDate);
        const i = idx.get(`${d.getFullYear()}-${d.getMonth()}`);
        if (i !== undefined) rows[i].entrees += 1;
      }
      if (emp.terminatedAt) {
        const d = new Date(emp.terminatedAt);
        const i = idx.get(`${d.getFullYear()}-${d.getMonth()}`);
        if (i !== undefined) rows[i].sorties += 1;
      }
    }
    return rows;
  }, [employees]);

  const hasData = data.some((r) => r.entrees > 0 || r.sorties > 0);

  return (
    <ChartCard
      title="Embauches & départs — 12 mois"
      isLoading={isLoading || q}
      isEmpty={!hasData}
    >
      <ChartArea>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />
            <XAxis
              dataKey="mois"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip {...DARK_TOOLTIP} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              iconType="circle"
              formatter={(value) =>
                value === "entrees" ? "Embauches" : "Départs"
              }
            />
            <Bar
              dataKey="entrees"
              name="entrees"
              fill="#34d399"
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
            />
            <Bar
              dataKey="sorties"
              name="sorties"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartArea>
    </ChartCard>
  );
}

export function HeadcountTrendLineWidget({
  isLoading,
}: {
  isLoading: boolean;
}) {
  const { data: employees, isLoading: q } = useEmployees();
  const data = useMemo(() => {
    const months = lastNMonths(12);
    return months.map((m) => {
      // Borne = premier jour du mois suivant
      const boundary = new Date(m.year, m.month + 1, 1);
      let effectif = 0;
      for (const emp of employees ?? []) {
        if (!emp.hireDate) continue;
        const hired = new Date(emp.hireDate);
        if (hired >= boundary) continue;
        const left = emp.terminatedAt ? new Date(emp.terminatedAt) : null;
        if (left && left < boundary) continue;
        effectif += 1;
      }
      return { mois: m.label, effectif };
    });
  }, [employees]);

  const hasData = (employees ?? []).length > 0;

  return (
    <ChartCard
      title="Évolution de l'effectif — 12 mois"
      isLoading={isLoading || q}
      isEmpty={!hasData}
    >
      <ChartArea>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 0, left: -20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />
            <XAxis
              dataKey="mois"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              {...DARK_TOOLTIP}
              formatter={(value) => [value, "Effectif"]}
            />
            <Line
              type="monotone"
              dataKey="effectif"
              stroke="#357AB7"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#357AB7", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartArea>
    </ChartCard>
  );
}

export function ComplianceRadarWidget({ isLoading }: { isLoading: boolean }) {
  const { data: compliance, isLoading: q } = useOrganizationCompliance();
  const data = useMemo(() => {
    const cats = new Map<string, { total: number; valid: number }>();
    for (const item of (compliance ?? []) as ComplianceItem[]) {
      const cat = item.requirement.category;
      const row = cats.get(cat) ?? { total: 0, valid: 0 };
      row.total += 1;
      if (item.status === "valid") row.valid += 1;
      cats.set(cat, row);
    }
    return Array.from(cats.entries()).map(([cat, { total, valid }]) => ({
      categorie: CATEGORY_LABEL[cat] ?? cat,
      taux: total > 0 ? Math.round((valid / total) * 100) : 0,
    }));
  }, [compliance]);

  return (
    <ChartCard
      title="Conformité documentaire par catégorie (%)"
      isLoading={isLoading || q}
      isEmpty={data.length === 0}
    >
      <ChartArea>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis
              dataKey="categorie"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickCount={5}
            />
            <Tooltip
              {...DARK_TOOLTIP}
              formatter={(value) => [`${value}%`, "Conformité"]}
            />
            <Radar
              name="Conformité"
              dataKey="taux"
              stroke="#34d399"
              fill="#34d399"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </ChartArea>
    </ChartCard>
  );
}
