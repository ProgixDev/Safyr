"use client";

import { useMemo, useState, useEffect } from "react";
import { useSites } from "@/hooks/sites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getKPIData,
  SITES,
  PERIOD_OPTIONS,
  CHART_COLORS,
  type KPIPeriod,
  type SiteFilter,
  type KPIData,
} from "@/data/geolocation-kpis";
import { Route, CheckCircle, Bell, ShieldAlert } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  WidgetConfig,
  useWidgetSystem,
  CustomizerModal,
  WidgetGrid,
  PersonnaliserButton,
} from "@/components/ui/widget-customizer";

// ── Custom Tooltip ────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/40 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="ml-auto font-medium tabular-nums">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-border/40 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span className="text-muted-foreground">{entry.name}</span>
        <span className="ml-2 font-medium tabular-nums">{entry.value}</span>
      </div>
    </div>
  );
}

function ChartLegend({
  payload,
}: {
  payload?: { value: string; color: string }[];
}) {
  if (!payload?.length) return null;
  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      {payload.map((entry, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </div>
      ))}
    </div>
  );
}

// ── Widget type ───────────────────────────────────────────────────

type GeoWidgetConfig = WidgetConfig & {
  component: React.ComponentType<{ data: KPIData; isLoading: boolean }>;
};

// ── Widget Components ─────────────────────────────────────────────

function PatrolsCountWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardContent className="p-5">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
            <Route className="h-4 w-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Rondes effectuées</p>
            <p className="text-2xl font-light tracking-tight">
              {data.security.patrolsCompleted}
              <span className="text-sm text-muted-foreground">
                {" "}
                / {data.security.patrolsPlanned}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PatrolsConformityWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardContent className="p-5">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Conformité rondes</p>
            <p
              className={`text-2xl font-light tracking-tight ${data.security.conformityRate >= 80 ? "text-emerald-400" : "text-amber-400"}`}
            >
              {data.security.conformityRate}%
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
          <div
            className={`h-full rounded-full transition-all ${data.security.conformityRate >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}
            style={{ width: `${data.security.conformityRate}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ZoneEventsWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardContent className="p-5">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
            <Bell className="h-4 w-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Événements zone</p>
            <p className="text-2xl font-light tracking-tight">
              {data.security.zoneEvents}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SosAlertsWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardContent className="p-5">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card
      className={`glass-card border-border/40 hover:border-primary/30 transition-all h-full ${data.security.sosActive > 0 ? "border-red-500/30" : ""}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${data.security.sosActive > 0 ? "bg-red-500/15" : "bg-muted/30"}`}
          >
            <ShieldAlert
              className={`h-4 w-4 ${data.security.sosActive > 0 ? "text-red-400" : "text-muted-foreground"}`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Alertes SOS</p>
            <p
              className={`text-2xl font-light tracking-tight ${data.security.sosActive > 0 ? "text-red-400" : ""}`}
            >
              {data.security.sosActive}
              <span className="text-sm text-muted-foreground"> actives</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {data.security.sosResolved} résolues
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PresenceChartWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-0">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="pt-4">
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-card border-border/40 h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium">
          Présence vs Absences
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div
          role="img"
          aria-label="Graphique : évolution des présences et absences"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.trendData}>
              <defs>
                <linearGradient id="gradPresence" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={CHART_COLORS.green}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS.green}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="gradAbsence" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={CHART_COLORS.red}
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS.red}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#94a3b8"
                strokeOpacity={0.08}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                dx={-8}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend content={<ChartLegend />} />
              <Area
                type="monotone"
                dataKey="presences"
                name="Présences"
                stroke={CHART_COLORS.green}
                strokeWidth={2}
                fill="url(#gradPresence)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="absences"
                name="Absences"
                stroke={CHART_COLORS.red}
                strokeWidth={2}
                fill="url(#gradAbsence)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentStatusChartWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-0">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="pt-4">
          <Skeleton className="h-[200px] w-full" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-card border-border/40 h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium">Statuts agents</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div role="img" aria-label="Répartition des agents par statut">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.agentStatusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="count"
                nameKey="status"
                strokeWidth={0}
              >
                {data.agentStatusDistribution.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 px-2">
            {data.agentStatusDistribution.map((entry) => (
              <div
                key={entry.status}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.status}</span>
                </div>
                <span className="font-medium tabular-nums">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PresenceRateWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardContent className="p-5">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <StatsCard
      title="Taux de présence"
      value={`${data.operational.presenceRate}%`}
      trend={{
        value: Math.abs(data.trends.presenceDelta),
        direction: data.trends.presenceDelta >= 0 ? "up" : "down",
      }}
      variant={data.operational.presenceRate >= 90 ? "success" : "warning"}
      subtext="Agents en poste / planifiés"
    />
  );
}

function TardinessRateWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardContent className="p-5">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <StatsCard
      title="Taux de retard"
      value={`${data.operational.tardinessRate}%`}
      trend={{
        value: Math.abs(data.trends.tardinessDelta),
        direction: data.trends.tardinessDelta >= 0 ? "up" : "down",
      }}
      variant={data.operational.tardinessRate <= 5 ? "success" : "warning"}
      subtext="Retards signalés"
    />
  );
}

function InterventionTimeWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardContent className="p-5">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <StatsCard
      title="Temps d'intervention moy."
      value={`${data.operational.avgInterventionMinutes} min`}
      trend={{
        value: Math.abs(data.trends.interventionDelta),
        direction: data.trends.interventionDelta <= 0 ? "up" : "down",
      }}
      subtext="Délai moyen d'arrivée"
    />
  );
}

function TravelDistanceWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardContent className="p-5">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <StatsCard
      title="Déplacement moy. / site"
      value={
        data.operational.avgTravelMetersPerSite >= 1000
          ? `${(data.operational.avgTravelMetersPerSite / 1000).toFixed(1)} km`
          : `${data.operational.avgTravelMetersPerSite} m`
      }
      trend={{
        value: Math.abs(data.trends.travelDelta),
        direction: data.trends.travelDelta >= 0 ? "up" : "down",
      }}
      subtext="Distance parcourue"
    />
  );
}

function PatrolsBySiteChartWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-0">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="pt-4">
          <Skeleton className="h-[260px] w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-card border-border/40 h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium">Rondes par site</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div role="img" aria-label="Rondes planifiées vs réalisées par site">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.patrolsBySite} barGap={4} barSize={20}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#94a3b8"
                strokeOpacity={0.08}
              />
              <XAxis
                dataKey="site"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                dx={-8}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend content={<ChartLegend />} />
              <Bar
                dataKey="planned"
                name="Planifiées"
                fill={CHART_COLORS.blue}
                radius={[4, 4, 0, 0]}
                opacity={0.6}
              />
              <Bar
                dataKey="actual"
                name="Réalisées"
                fill={CHART_COLORS.cyan}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ZoneActivityChartWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-0">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-card border-border/40 h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium">Activité par zone</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {data.zoneActivity.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucune activité pour cette période
          </p>
        ) : (
          <div role="img" aria-label="Événements par zone géographique">
            <div className="space-y-3">
              {data.zoneActivity
                .sort((a, b) => b.events - a.events)
                .map((zone) => {
                  const max = Math.max(
                    ...data.zoneActivity.map((z) => z.events),
                  );
                  const pct = max > 0 ? (zone.events / max) * 100 : 0;
                  return (
                    <div key={zone.zone}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="truncate text-muted-foreground">
                          {zone.zone}
                        </span>
                        <span className="ml-2 shrink-0 font-medium tabular-nums">
                          {zone.events}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: zone.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopAgentsWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-card border-border/40 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Agents les plus sollicités
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.hr.topAgents.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucune donnée pour cette période
          </p>
        ) : (
          <div className="space-y-2">
            {data.hr.topAgents.map((agent, i) => (
              <div
                key={agent.agentId}
                className="flex items-center gap-3 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{agent.agentName}</p>
                  <p className="text-xs text-muted-foreground">{agent.site}</p>
                </div>
                <div className="flex items-center gap-4 text-sm tabular-nums">
                  <div className="text-right">
                    <p className="font-medium">{agent.missionsCount}</p>
                    <p className="text-xs text-muted-foreground">missions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{agent.hoursWorked}h</p>
                    <p className="text-xs text-muted-foreground">heures</p>
                  </div>
                  {agent.incidentCount > 0 && (
                    <div className="text-right">
                      <p className="font-medium text-amber-400">
                        {agent.incidentCount}
                      </p>
                      <p className="text-xs text-muted-foreground">incidents</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HrAbsencesWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardContent className="p-5">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardContent className="flex h-full flex-col justify-center p-5">
        <p className="text-xs text-muted-foreground">Absences géolocalisées</p>
        <p
          className={`text-3xl font-light tracking-tight ${data.hr.absenceCount > 5 ? "text-red-400" : ""}`}
        >
          {data.hr.absenceCount}
        </p>
        <p className="text-xs text-muted-foreground">Signalées par GPS</p>
      </CardContent>
    </Card>
  );
}

function HrSosWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardContent className="p-5">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardContent className="flex h-full flex-col justify-center p-5">
        <p className="text-xs text-muted-foreground">Incidents SOS</p>
        <p
          className={`text-3xl font-light tracking-tight ${data.hr.sosHistoryCount > 3 ? "text-amber-400" : ""}`}
        >
          {data.hr.sosHistoryCount}
        </p>
        <p className="text-xs text-muted-foreground">Historique période</p>
      </CardContent>
    </Card>
  );
}

function HrFatigueWidget({
  data,
  isLoading,
}: {
  data: KPIData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardContent className="p-5">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardContent className="flex h-full flex-col justify-center p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Indice fatigue</p>
            <p
              className={`text-3xl font-light tracking-tight ${data.hr.fatigueIndex > 60 ? "text-red-400" : data.hr.fatigueIndex > 40 ? "text-amber-400" : "text-emerald-400"}`}
            >
              {data.hr.fatigueIndex}
              <span className="text-sm text-muted-foreground">/100</span>
            </p>
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
          <div
            className={`h-full rounded-full transition-all ${data.hr.fatigueIndex > 60 ? "bg-red-500" : data.hr.fatigueIndex > 40 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${data.hr.fatigueIndex}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Widget Config ─────────────────────────────────────────────────

const defaultWidgetConfigs: GeoWidgetConfig[] = [
  {
    id: "patrolsCount",
    name: "Rondes effectuées",
    component: PatrolsCountWidget,
    visible: true,
  },
  {
    id: "patrolsConformity",
    name: "Conformité rondes",
    component: PatrolsConformityWidget,
    visible: true,
  },
  {
    id: "zoneEvents",
    name: "Événements zone",
    component: ZoneEventsWidget,
    visible: true,
  },
  {
    id: "sosAlerts",
    name: "Alertes SOS",
    component: SosAlertsWidget,
    visible: true,
  },
  {
    id: "presenceChart",
    name: "Présence vs Absences",
    component: PresenceChartWidget,
    visible: true,
    span: "lg:col-span-2",
  },
  {
    id: "agentStatusChart",
    name: "Statuts agents",
    component: AgentStatusChartWidget,
    visible: true,
  },
  {
    id: "presenceRate",
    name: "Taux de présence",
    component: PresenceRateWidget,
    visible: true,
  },
  {
    id: "tardinessRate",
    name: "Taux de retard",
    component: TardinessRateWidget,
    visible: true,
  },
  {
    id: "interventionTime",
    name: "Temps d'intervention moy.",
    component: InterventionTimeWidget,
    visible: true,
  },
  {
    id: "travelDistance",
    name: "Déplacement moy. / site",
    component: TravelDistanceWidget,
    visible: true,
  },
  {
    id: "patrolsBySiteChart",
    name: "Rondes par site",
    component: PatrolsBySiteChartWidget,
    visible: true,
  },
  {
    id: "zoneActivityChart",
    name: "Activité par zone",
    component: ZoneActivityChartWidget,
    visible: true,
  },
  {
    id: "topAgents",
    name: "Agents les plus sollicités",
    component: TopAgentsWidget,
    visible: true,
    span: "md:col-span-2",
  },
  {
    id: "hrAbsences",
    name: "Absences géolocalisées",
    component: HrAbsencesWidget,
    visible: true,
  },
  {
    id: "hrSos",
    name: "Incidents SOS",
    component: HrSosWidget,
    visible: true,
  },
  {
    id: "hrFatigue",
    name: "Indice fatigue",
    component: HrFatigueWidget,
    visible: true,
  },
];

const geoWidgetMap = new Map<string, GeoWidgetConfig>(
  defaultWidgetConfigs.map((c) => [c.id, c]),
);

// ── Row ID Sets ───────────────────────────────────────────────────

const ROW_SECURITE = [
  "patrolsCount",
  "patrolsConformity",
  "zoneEvents",
  "sosAlerts",
];
const ROW_CHARTS = ["presenceChart", "agentStatusChart"];
const ROW_OPERATIONNEL = [
  "presenceRate",
  "tardinessRate",
  "interventionTime",
  "travelDistance",
];
const ROW_CHARTS_RONDES = ["patrolsBySiteChart", "zoneActivityChart"];
const ROW_RH_MICRO = ["hrAbsences", "hrSos", "hrFatigue"];

// ── Main Component ────────────────────────────────────────────────

export default function GeolocationDashboard() {
  const { data: sitesReels = [] } = useSites();
  const nomsDesSites = sitesReels.map((site) => site.name);
  const [selectedPeriod, setSelectedPeriod] = useState<KPIPeriod>("today");
  const [selectedSite, setSelectedSite] = useState<SiteFilter>("all");
  const [isLoading, setIsLoading] = useState(true);

  const data = useMemo(
    () => getKPIData(selectedPeriod, selectedSite),
    [selectedPeriod, selectedSite],
  );

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
  } = useWidgetSystem("geolocation", defaultWidgetConfigs);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const renderWidget = (config: WidgetConfig) => {
    const geoConfig = geoWidgetMap.get(config.id);
    if (!geoConfig) return null;
    const Component = geoConfig.component;
    return <Component data={data} isLoading={isLoading} />;
  };

  return (
    <div className="space-y-8 p-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-light">
            Tableau de bord Géolocalisation
          </h1>
          <p className="text-sm text-muted-foreground">
            Indicateurs clés de performance — suivi terrain
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedPeriod}
            onValueChange={(v) => setSelectedPeriod(v as KPIPeriod)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedSite}
            onValueChange={(v) => setSelectedSite(v as SiteFilter)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sites</SelectItem>
              {nomsDesSites.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
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
        <div className="space-y-8">
          {/* ── Row 1 — Sécurité ──────────────────────────────── */}
          {visibleWidgets.some((c) => ROW_SECURITE.includes(c.id)) && (
            <section aria-labelledby="kpi-securite">
              <h2
                id="kpi-securite"
                className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground"
              >
                Sécurité
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {visibleWidgets
                  .filter((c) => ROW_SECURITE.includes(c.id))
                  .map((c) => (
                    <div key={c.id} className="h-full">
                      {renderWidget(c)}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* ── Row 2 — Charts présence ───────────────────────── */}
          {visibleWidgets.some((c) => ROW_CHARTS.includes(c.id)) && (
            <div className="grid gap-4 lg:grid-cols-3">
              {visibleWidgets
                .filter((c) => ROW_CHARTS.includes(c.id))
                .map((c) => (
                  <div key={c.id} className={cn(c.span ?? "", "h-full")}>
                    {renderWidget(c)}
                  </div>
                ))}
            </div>
          )}

          {/* ── Row 3 — Opérationnel ──────────────────────────── */}
          {visibleWidgets.some((c) => ROW_OPERATIONNEL.includes(c.id)) && (
            <section aria-labelledby="kpi-operationnels">
              <h2
                id="kpi-operationnels"
                className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground"
              >
                Opérationnel
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {visibleWidgets
                  .filter((c) => ROW_OPERATIONNEL.includes(c.id))
                  .map((c) => (
                    <div key={c.id} className="h-full">
                      {renderWidget(c)}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* ── Row 4 — Charts rondes ─────────────────────────── */}
          {visibleWidgets.some((c) => ROW_CHARTS_RONDES.includes(c.id)) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleWidgets
                .filter((c) => ROW_CHARTS_RONDES.includes(c.id))
                .map((c) => (
                  <div key={c.id} className="h-full">
                    {renderWidget(c)}
                  </div>
                ))}
            </div>
          )}

          {/* ── Row 5 — RH ────────────────────────────────────── */}
          {(() => {
            const showTopAgents = visibleWidgets.some(
              (c) => c.id === "topAgents",
            );
            const visibleMicro = visibleWidgets.filter((c) =>
              ROW_RH_MICRO.includes(c.id),
            );
            if (!showTopAgents && visibleMicro.length === 0) return null;
            return (
              <section aria-labelledby="kpi-rh">
                <h2
                  id="kpi-rh"
                  className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Ressources humaines
                </h2>
                {showTopAgents ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      {renderWidget(
                        visibleWidgets.find((c) => c.id === "topAgents")!,
                      )}
                    </div>
                    {visibleMicro.length > 0 && (
                      <div className="flex flex-col gap-4">
                        {visibleMicro.map((c) => (
                          <div key={c.id} className="flex-1">
                            {renderWidget(c)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {visibleMicro.map((c) => (
                      <div key={c.id}>{renderWidget(c)}</div>
                    ))}
                  </div>
                )}
              </section>
            );
          })()}
        </div>
      )}
    </div>
  );
}
