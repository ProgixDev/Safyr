"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Shield,
  FileBarChart,
  FileText,
  ChevronRight,
  BarChart3,
  Activity,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  WidgetConfig,
  useWidgetSystem,
  CustomizerModal,
  WidgetGrid,
  PersonnaliserButton,
} from "@/components/ui/widget-customizer";
import { useLogbookEvents } from "@/hooks/logbook";
import { mockAlerts } from "@/data/logbook-alerts";
import { EventFeedWidget } from "@/components/logbook/dashboard/EventFeedWidget";
import { ActiveAlertsPanel } from "@/components/logbook/dashboard/ActiveAlertsPanel";
import {
  SecurityIncidentsWidget,
  CriticalEventsWidget,
  ResolutionRateWidget,
  PatrolRoundsWidget,
  RHImpactWidget,
  ClientPerformanceWidget,
  TrendChartWidget,
  SeverityDistributionWidget,
  EventTypesWidget,
  TopZonesWidget,
  CriticalSplitWidget,
  SiteComparisonWidget,
  AgentActivityHeatmapWidget,
  ResolutionTrendWidget,
} from "@/components/logbook/dashboard/LogbookKpiWidgets";
import { type DateFilterPreset } from "@/lib/date-range";

type LogbookWidgetConfig = WidgetConfig & {
  component: React.ComponentType<{ isLoading: boolean }>;
};

function OverviewWidget({ isLoading }: { isLoading: boolean }) {
  // Compteurs calcules sur les evenements reellement enregistres.
  const { data: evenements = [], isLoading: chargement } = useLogbookEvents({});
  const totalEvents = evenements.length;
  const criticalEvents = evenements.filter(
    (e) => e.severity === "critical",
  ).length;
  const pendingValidation = evenements.filter(
    (e) => e.status === "open",
  ).length;
  const resolvedToday = evenements.filter(
    (e) => e.status === "validated" || e.status === "closed",
  ).length;

  isLoading = isLoading || chargement;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass-card border-border/40 h-full">
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total événements",
      value: totalEvents,
      subtext: "sur la période active",
      icon: BookOpen,
      badge: "info",
      badgeLabel: "Live",
    },
    {
      title: "Événements critiques",
      value: criticalEvents,
      subtext: "prioritaires",
      icon: AlertTriangle,
      badge: "destructive",
      badgeLabel: "Urgent",
    },
    {
      title: "En attente validation",
      value: pendingValidation,
      subtext: "à traiter",
      icon: Clock,
      badge: "warning",
      badgeLabel: "Action",
    },
    {
      title: "Résolus",
      value: resolvedToday,
      subtext: "incidents fermés",
      icon: CheckCircle,
      badge: "success",
      badgeLabel: "OK",
    },
  ] as const;

  return (
    <Card className="glass-card border-border/40 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Vue d&apos;ensemble
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="border-border/40 hover:border-primary/30 transition-all h-full"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {stat.title}
                    </CardTitle>
                    <Badge variant={stat.badge}>{stat.badgeLabel}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <span className="text-3xl font-light tracking-tight">
                      {stat.value}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.subtext}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ReportsFilterWidget({ isLoading }: { isLoading: boolean }) {
  const { data: evenements = [] } = useLogbookEvents({});
  const [dateFilter] = useState<DateFilterPreset>("week");
  const [customStartDate] = useState<string>("");
  const [customEndDate] = useState<string>("");

  const incidentsCount = useMemo(
    () => evenements.filter((e) => e.type === "incident").length,
    [],
  );

  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Incidents filtrés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Incidents actifs</p>
          <p className="text-2xl font-light">{incidentsCount}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Période de référence</p>
          <p className="text-sm text-muted-foreground">
            {dateFilter} {customStartDate ? `- ${customStartDate}` : ""}
            {customEndDate ? ` / ${customEndDate}` : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveFeedWidget({ isLoading }: { isLoading: boolean }) {
  const { data: evenements = [] } = useLogbookEvents({});
  return <EventFeedWidget isLoading={isLoading} />;
}

function AlertsWidget({ isLoading }: { isLoading: boolean }) {
  const { data: evenements = [] } = useLogbookEvents({});
  return <ActiveAlertsPanel isLoading={isLoading} />;
}

function ValidationWidget({ isLoading }: { isLoading: boolean }) {
  const { data: evenements = [] } = useLogbookEvents({});
  const pending = evenements.filter((e) => e.status === "open").length;
  const inProgress = evenements.filter((e) => e.status === "open").length;
  const resolved = evenements.filter(
    (e) => e.status === "validated" || e.status === "closed",
  ).length;

  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Validation
          </CardTitle>
          <Link
            href="/dashboard/logbook/validation"
            className="text-xs text-primary hover:underline"
          >
            Voir tout
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">En attente</p>
            <p className="text-lg font-light">{pending}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">En cours</p>
            <p className="text-lg font-light">{inProgress}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Résolus</p>
            <p className="text-lg font-light">{resolved}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PortalsWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Portails
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link
          href="/dashboard/logbook/client-portal"
          className="flex items-center justify-between rounded-lg bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm">Portail Clients</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          href="/dashboard/logbook/agent-portal"
          className="flex items-center justify-between rounded-lg bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm">Portail Agents</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  );
}

function PlanningWidget({ isLoading }: { isLoading: boolean }) {
  const { data: evenements = [] } = useLogbookEvents({});
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Agent affecté
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Link
          href="/dashboard/logbook/agent-affecte"
          className="flex items-center justify-between rounded-lg bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm">
            Configurer les règles d&apos;affectation
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  );
}

function SecurityWidget({ isLoading }: { isLoading: boolean }) {
  const { data: evenements = [] } = useLogbookEvents({});
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const securityEvents = evenements.filter((e) =>
    ["critical", "high"].includes(e.severity),
  ).length;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Sécurité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Événements sensibles</p>
          <p className="text-2xl font-light">{securityEvents}</p>
        </div>
        <Link
          href="/dashboard/logbook/security"
          className="flex items-center justify-between rounded-lg bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm">Voir la page sécurité</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
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
      label: "Événements",
      href: "/dashboard/logbook/events",
      icon: BookOpen,
    },
    {
      label: "Validation",
      href: "/dashboard/logbook/validation",
      icon: CheckCircle,
    },
    {
      label: "Alertes",
      href: "/dashboard/logbook/alerts",
      icon: AlertTriangle,
    },
    {
      label: "Portail Clients",
      href: "/dashboard/logbook/client-portal",
      icon: Users,
    },
    {
      label: "Portail Agents",
      href: "/dashboard/logbook/agent-portal",
      icon: Users,
    },
    {
      label: "Fiches d'Interpellation",
      href: "/dashboard/logbook/interpellation-archives",
      icon: FileText,
    },
    {
      label: "Agent affecté",
      href: "/dashboard/logbook/agent-affecte",
      icon: Shield,
    },
    {
      label: "Rapports",
      href: "/dashboard/logbook/exports",
      icon: FileBarChart,
    },
    {
      label: "Sécurité",
      href: "/dashboard/logbook/security",
      icon: Shield,
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

function ModuleHighlightsWidget({ isLoading }: { isLoading: boolean }) {
  const { data: evenements = [] } = useLogbookEvents({});
  const activeAlerts = mockAlerts.filter(
    (a) => a.status === "active" || a.status === "acknowledged",
  ).length;
  const reportsReady = evenements.filter(
    (e) => e.status === "validated" || e.status === "closed",
  ).length;

  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Synthèse module
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Alertes actives</p>
            <p className="text-2xl font-light">{activeAlerts}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Rapports exploitables
            </p>
            <p className="text-2xl font-light">{reportsReady}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Couverture site</p>
            <p className="text-2xl font-light">100%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const defaultWidgetConfigs: LogbookWidgetConfig[] = [
  {
    id: "overview",
    name: "Vue d'ensemble",
    component: OverviewWidget,
    visible: true,
    span: "lg:col-span-4",
  },
  {
    id: "chartTrend",
    name: "Graphique Tendance",
    component: TrendChartWidget,
    visible: true,
    span: "lg:col-span-2",
  },
  {
    id: "chartResolutionTrend",
    name: "Tendance taux de résolution",
    component: ResolutionTrendWidget,
    visible: true,
    span: "lg:col-span-2",
  },
  {
    id: "chartSiteComparison",
    name: "Comparaison par site",
    component: SiteComparisonWidget,
    visible: true,
    span: "lg:col-span-2",
  },
  {
    id: "chartTypes",
    name: "Graphique Types",
    component: EventTypesWidget,
    visible: true,
    span: "lg:col-span-2",
  },
  {
    id: "chartHeatmap",
    name: "Activité agents (heatmap)",
    component: AgentActivityHeatmapWidget,
    visible: true,
    span: "lg:col-span-4",
  },
  {
    id: "chartSeverity",
    name: "Graphique Gravité",
    component: SeverityDistributionWidget,
    visible: true,
    span: "lg:col-span-2",
  },
  {
    id: "zones",
    name: "Zones impactées",
    component: TopZonesWidget,
    visible: true,
    span: "lg:col-span-2",
  },
  {
    id: "liveFeed",
    name: "Fil live",
    component: LiveFeedWidget,
    visible: true,
    span: "lg:col-span-2",
  },
  {
    id: "alerts",
    name: "Alertes actives",
    component: AlertsWidget,
    visible: true,
    span: "lg:col-span-2",
  },
  {
    id: "kpiRH",
    name: "KPI RH",
    component: RHImpactWidget,
    visible: true,
  },
  {
    id: "kpiClient",
    name: "KPI Client",
    component: ClientPerformanceWidget,
    visible: true,
  },
  {
    id: "kpiSecurityIncidents",
    name: "KPI Incidents",
    component: SecurityIncidentsWidget,
    visible: false,
  },
  {
    id: "kpiCritical",
    name: "KPI Critiques",
    component: CriticalEventsWidget,
    visible: false,
  },
  {
    id: "kpiResolution",
    name: "KPI Résolution",
    component: ResolutionRateWidget,
    visible: false,
  },
  {
    id: "kpiPatrols",
    name: "KPI Rondes",
    component: PatrolRoundsWidget,
    visible: false,
  },
  {
    id: "criticalSplit",
    name: "Critiques vs mineurs",
    component: CriticalSplitWidget,
    visible: false,
  },
  {
    id: "validation",
    name: "Validation",
    component: ValidationWidget,
    visible: true,
  },
  {
    id: "portals",
    name: "Portails",
    component: PortalsWidget,
    visible: true,
  },
  {
    id: "planning",
    name: "Agent affecté",
    component: PlanningWidget,
    visible: true,
  },
  {
    id: "security",
    name: "Sécurité",
    component: SecurityWidget,
    visible: true,
  },
  {
    id: "reportsFilter",
    name: "Incidents filtrés",
    component: ReportsFilterWidget,
    visible: true,
    span: "lg:col-span-2",
  },
  {
    id: "moduleHighlights",
    name: "Synthèse module",
    component: ModuleHighlightsWidget,
    visible: true,
    span: "lg:col-span-2",
  },
  {
    id: "quickActions",
    name: "Actions rapides",
    component: QuickActionsWidget,
    visible: true,
    span: "lg:col-span-4",
  },
];

const logbookWidgetMap = new Map<string, LogbookWidgetConfig>(
  defaultWidgetConfigs.map((c) => [c.id, c]),
);

export default function LogbookDashboardPage() {
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
  } = useWidgetSystem("logbook", defaultWidgetConfigs);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const renderWidget = (config: WidgetConfig) => {
    const logbookConfig = logbookWidgetMap.get(config.id);
    if (!logbookConfig) return null;
    const Component = logbookConfig.component;
    return <Component isLoading={isLoading} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Tableau de bord Main Courante
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Vue consolidée opérations, alertes et KPI sécurité
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleWidgets
              .filter((config) =>
                [
                  "overview",
                  "kpiSecurityIncidents",
                  "kpiCritical",
                  "kpiResolution",
                  "kpiPatrols",
                  "kpiRH",
                  "kpiClient",
                  "chartTrend",
                  "chartSeverity",
                  "chartTypes",
                  "zones",
                  "criticalSplit",
                  "liveFeed",
                  "alerts",
                  "validation",
                  "portals",
                  "planning",
                  "security",
                  "reportsFilter",
                  "moduleHighlights",
                  "quickActions",
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
        </div>
      )}
    </div>
  );
}
