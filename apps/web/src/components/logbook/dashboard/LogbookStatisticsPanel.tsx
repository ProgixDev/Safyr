"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  Download,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { useEvenementsMainCourante } from "./evenements-reels";
import {
  buildDateRange,
  isDateInRange,
  type DateFilterPreset,
} from "@/lib/date-range";

const DARK_TOOLTIP_STYLE = {
  contentStyle: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#f1f5f9",
    fontSize: 12,
  },
  labelStyle: { color: "#94a3b8" },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22d3ee",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critique",
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

const TYPE_LABELS: Record<string, string> = {
  routine: "Routine",
  incident: "Incident",
  action: "Action",
  control: "Contrôle",
  critical: "Critique",
};

interface LogbookStatisticsPanelProps {
  isLoading?: boolean;
}

export function LogbookStatisticsPanel({
  isLoading = false,
}: LogbookStatisticsPanelProps) {
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>("month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const dateRange = buildDateRange(dateFilter, customStartDate, customEndDate);

  const evenements = useEvenementsMainCourante();
  const filteredEvents = evenements.filter((event) =>
    isDateInRange(event.timestamp, dateRange),
  );

  const totalIncidents = filteredEvents.filter(
    (e) => e.type === "incident",
  ).length;
  const criticalIncidents = filteredEvents.filter(
    (e) => e.severity === "critical",
  ).length;
  const resolvedIncidents = filteredEvents.filter(
    (e) => e.status === "resolved",
  ).length;
  const resolutionRate =
    totalIncidents > 0
      ? ((resolvedIncidents / totalIncidents) * 100).toFixed(1)
      : "0";
  const avgResolutionTime = "2.5h";
  const totalRounds = filteredEvents.filter(
    (e) => e.type === "action" && e.title.toLowerCase().includes("ronde"),
  ).length;
  const avgRoundInterval = "45 min";
  const agentsInvolved = new Set(filteredEvents.map((e) => e.agentId)).size;
  const hseIncidents = filteredEvents.filter(
    (e) => e.tags?.includes("hse") || e.tags?.includes("sst"),
  ).length;

  const zoneData = filteredEvents.reduce(
    (acc, e) => {
      const zone = e.zone || e.site;
      acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const topZones = Object.entries(zoneData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const dayBuckets: Record<string, number> = {};
  for (const e of filteredEvents) {
    const d = new Date(e.timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
    dayBuckets[d] = (dayBuckets[d] || 0) + 1;
  }
  const trendData = Object.entries(dayBuckets)
    .sort((a, b) => {
      const [da, ma] = a[0].split("/").map(Number);
      const [db, mb] = b[0].split("/").map(Number);
      return ma !== mb ? ma - mb : da - db;
    })
    .map(([date, count]) => ({ date, evenements: count }));

  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const e of filteredEvents) {
    if (e.severity in severityCounts) {
      severityCounts[e.severity] += 1;
    }
  }
  const pieData = Object.entries(severityCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: SEVERITY_LABELS[k] ?? k,
      value: v,
      color: SEVERITY_COLORS[k] ?? "#94a3b8",
    }));

  const typeCounts: Record<string, number> = {
    routine: 0,
    incident: 0,
    action: 0,
    control: 0,
    critical: 0,
  };
  for (const e of filteredEvents) {
    if (e.type in typeCounts) {
      typeCounts[e.type] += 1;
    }
  }
  const typeData = Object.entries(typeCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ type: TYPE_LABELS[k] ?? k, count: v }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="glass-card border-border/40">
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-light tracking-tight">Rapports et KPI</h2>
          <p className="text-sm text-muted-foreground">
            Analyse consolidée des événements de main courante
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <DateRangeFilter
            label="Date"
            preset={dateFilter}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onPresetChange={setDateFilter}
            onCustomStartDateChange={setCustomStartDate}
            onCustomEndDateChange={setCustomEndDate}
          />
          <Button variant="outline" className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-light mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          KPI Sécurité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Incidents / période
              </CardTitle>
              <AlertTriangle className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalIncidents}</div>
              <p className="text-xs text-muted-foreground">Total incidents</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Incidents critiques
              </CardTitle>
              <BarChart3 className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalIncidents}</div>
              <p className="text-xs text-muted-foreground">Critiques</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Temps moyen résolution
              </CardTitle>
              <Clock className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgResolutionTime}</div>
              <p className="text-xs text-muted-foreground">Moyenne</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taux résolution
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolutionRate}%</div>
              <p className="text-xs text-muted-foreground">Incidents résolus</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Nombre de visiteurs
              </CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredEvents.length > 0 ? 1247 : 0}
              </div>
              <p className="text-xs text-muted-foreground">Total période</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rondes effectuées
              </CardTitle>
              <MapPin className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRounds}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Temps entre rondes
              </CardTitle>
              <Clock className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRoundInterval}</div>
              <p className="text-xs text-muted-foreground">Intervalle moyen</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Zones impactées
              </CardTitle>
              <MapPin className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topZones.length}</div>
              <p className="text-xs text-muted-foreground">Zones critiques</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-light mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          KPI RH
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Agents impliqués
              </CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentsInvolved}</div>
              <p className="text-xs text-muted-foreground">Dans incidents</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Incidents HSE / SST
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hseIncidents}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Historique par agent
              </CardTitle>
              <BarChart3 className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Disponible</div>
              <p className="text-xs text-muted-foreground">Consultation</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Indicateurs qualité
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">Performance</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-light mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          KPI Client
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Performance sécurité
              </CardTitle>
              <Shield className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">
                Taux de conformité
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Qualité service
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8/5</div>
              <p className="text-xs text-muted-foreground">Satisfaction</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pics incidents
              </CardTitle>
              <BarChart3 className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">14h-18h</div>
              <p className="text-xs text-muted-foreground">Période critique</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Comparaison N/N-1
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">-15%</div>
              <p className="text-xs text-muted-foreground">
                Réduction incidents
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass-card border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light text-muted-foreground">
              Tendance des événements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Aucun événement sur cette période
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={trendData}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#22d3ee"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    {...DARK_TOOLTIP_STYLE}
                    formatter={(value) => [value, "Événements"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="evenements"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    fill="url(#colorTrend)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light text-muted-foreground">
              Répartition par gravité
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Aucun événement sur cette période
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      {...DARK_TOOLTIP_STYLE}
                      formatter={(value, name) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: entry.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {entry.name} ({entry.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light text-muted-foreground">
              Types d&apos;événements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Aucun événement sur cette période
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={typeData}
                  layout="vertical"
                  margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="type"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    {...DARK_TOOLTIP_STYLE}
                    formatter={(value) => [value, "Événements"]}
                  />
                  <Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-border/40">
        <CardHeader>
          <CardTitle className="text-lg font-light flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Zones les plus impactées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topZones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune zone sur cette période
            </p>
          ) : (
            <div className="space-y-2">
              {topZones.map(([zone, count], index) => (
                <div
                  key={zone}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-medium">{zone}</span>
                  </div>
                  <Badge variant="secondary">
                    {count} événement{count > 1 ? "s" : ""}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-border/40">
        <CardHeader>
          <CardTitle className="text-lg font-light flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Incidents critiques vs incidents mineurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Critiques</Label>
              <div className="text-3xl font-bold text-red-500">
                {criticalIncidents}
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Mineurs</Label>
              <div className="text-3xl font-bold text-green-500">
                {totalIncidents - criticalIncidents}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
