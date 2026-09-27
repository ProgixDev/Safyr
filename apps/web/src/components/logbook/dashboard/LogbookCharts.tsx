"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LogbookEvent } from "@/data/logbook-events";

interface LogbookChartsProps {
  events: LogbookEvent[];
  isLoading: boolean;
}

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
  low: "#357AB7",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critique",
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

export function LogbookCharts({ events, isLoading }: LogbookChartsProps) {
  // Group by hour of timestamp
  const hourBuckets: Record<number, { total: number; critiques: number }> = {};
  for (let h = 0; h < 24; h++) {
    hourBuckets[h] = { total: 0, critiques: 0 };
  }
  for (const event of events) {
    const h = new Date(event.timestamp).getHours();
    hourBuckets[h].total += 1;
    if (event.severity === "critical") {
      hourBuckets[h].critiques += 1;
    }
  }
  const hourlyData = Object.entries(hourBuckets).map(([h, v]) => ({
    heure: `${String(h).padStart(2, "0")}h`,
    total: v.total,
    critiques: v.critiques,
  }));

  // Group by severity
  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const event of events) {
    if (event.severity in severityCounts) {
      severityCounts[event.severity] += 1;
    }
  }
  const pieData = Object.entries(severityCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: SEVERITY_LABELS[k] ?? k,
      value: v,
      color: SEVERITY_COLORS[k] ?? "#94a3b8",
    }));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <Card key={i} className="glass-card border-border/40">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[220px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Activite par heure */}
      <Card className="glass-card border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground">
            Activite par heure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={hourlyData}
              margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#357AB7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#357AB7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCritiques" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="heure"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                {...DARK_TOOLTIP_STYLE}
                formatter={(value, name) => [
                  value,
                  name === "total" ? "Total" : "Critiques",
                ]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#357AB7"
                strokeWidth={2}
                fill="url(#colorTotal)"
                dot={false}
                name="total"
              />
              <Area
                type="monotone"
                dataKey="critiques"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#colorCritiques)"
                dot={false}
                name="critiques"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Repartition par gravite */}
      <Card className="glass-card border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground">
            Repartition par gravite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
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
          {/* Legend */}
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
        </CardContent>
      </Card>
    </div>
  );
}
