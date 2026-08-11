"use client";

import { useState, useEffect, useReducer, useMemo } from "react";
import { rectSortingStrategy } from "@dnd-kit/sortable";
import {
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Award,
  MapPin,
  Settings,
  GripVertical,
  FileText,
  BarChart3,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Briefcase,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDashboardConfigStore,
  SavedWidgetConfig,
} from "@/lib/stores/dashboardConfigStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { usePlanningAgents, usePlanningSites } from "@/hooks/planning";
import { useShifts } from "@/hooks/shifts";
import { getSiteColorClasses } from "@/lib/site-colors";

/**
 * Statistiques des agents, calculees sur les dossiers salaries reels.
 * Elles partaient d'une liste de demonstration : le tableau de bord du
 * planning affichait donc des effectifs sans rapport avec l'entreprise.
 */
function useAgentStats() {
  const { agents } = usePlanningAgents();
  const disponibles = agents.filter(
    (a) => a.availabilityStatus === "Disponible",
  );

  return {
    total: agents.length,
    available: disponibles.length,
    onMission: agents.filter((a) => a.availabilityStatus === "En mission")
      .length,
    onLeave: agents.filter((a) => a.availabilityStatus === "Congé").length,
    cdi: agents.filter((a) => a.contractType === "CDI").length,
    cdd: agents.filter((a) => a.contractType === "CDD").length,
    interim: agents.filter((a) => a.contractType === "Intérim").length,
    qualified: agents.filter((a) => a.qualifications.length > 0).length,
  };
}

function AgentStatsWidget({ isLoading }: { isLoading: boolean }) {
  const stats = useAgentStats();

  if (isLoading) {
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

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Effectif Agents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <span className="text-4xl font-light tracking-tight">
              {stats.total}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">agents</span>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">CDI</p>
              <p className="text-xl font-light">{stats.cdi}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CDD</p>
              <p className="text-xl font-light">{stats.cdd}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sous traitants</p>
              <p className="text-xl font-light">{stats.interim}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AvailabilityWidget({ isLoading }: { isLoading: boolean }) {
  const stats = useAgentStats();

  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-48 mb-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          Disponibilité
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <span className="text-4xl font-light tracking-tight text-green-600">
              {stats.available}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">
              disponibles
            </span>
          </div>
          <Progress
            value={(stats.available / stats.total) * 100}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {((stats.available / stats.total) * 100).toFixed(0)}% de
            l&apos;effectif
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function MissionStatusWidget({ isLoading }: { isLoading: boolean }) {
  const stats = useAgentStats();
  const onMission = 45; // Mock data
  const missionRate = (onMission / stats.total) * 100;

  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          En Mission
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <span className="text-4xl font-light tracking-tight text-blue-600">
              {onMission}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">agents</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Taux d&apos;affectation
            </span>
            <span className="font-medium">{missionRate.toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QualificationsWidget({ isLoading }: { isLoading: boolean }) {
  const stats = useAgentStats();
  const qualifications = [
    { name: "CQP APS", count: 67, color: "bg-blue-500" },
    { name: "SSIAP", count: 34, color: "bg-green-500" },
    { name: "SST", count: 45, color: "bg-yellow-500" },
    { name: "Carte Pro", count: 72, color: "bg-purple-500" },
  ];

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

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Award className="h-4 w-4 text-teal-600" />
          Qualifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {qualifications.map((qual) => (
            <div key={qual.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{qual.name}</span>
                <span className="font-medium">{qual.count}</span>
              </div>
              <Progress
                value={(qual.count / stats.total) * 100}
                className={cn("h-1.5", qual.color)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContractTypesWidget({ isLoading }: { isLoading: boolean }) {
  const stats = useAgentStats();

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

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-600" />
          Types de Contrat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">CDI</span>
            </div>
            <span className="text-2xl font-light">{stats.cdi}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">CDD</span>
            </div>
            <span className="text-2xl font-light">{stats.cdd}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm">Sous traitants</span>
            </div>
            <span className="text-2xl font-light">{stats.interim}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyHoursWidget({ isLoading }: { isLoading: boolean }) {
  const totalHours = 1456; // Mock data
  const plannedHours = 1320;
  const utilizationRate = (plannedHours / totalHours) * 100;

  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          Heures Hebdomadaires
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <span className="text-4xl font-light tracking-tight">
              {plannedHours}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">
              / {totalHours}h
            </span>
          </div>
          <Progress value={utilizationRate} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Taux d&apos;utilisation: {utilizationRate.toFixed(0)}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingMissionsWidget({ isLoading }: { isLoading: boolean }) {
  const missions = [
    { site: "Centre Commercial Rosny", agents: 4, date: "Lun 23 Déc" },
    { site: "Tour La Défense", agents: 6, date: "Mar 24 Déc" },
    { site: "Hôpital Saint-Louis", agents: 3, date: "Mer 25 Déc" },
  ];

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

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 text-red-600" />
          Missions à Venir
        </CardTitle>
        <Link href="/dashboard/planning/missions">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            Voir tout
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {missions.map((mission, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">{mission.site}</p>
                <p className="text-xs text-muted-foreground">{mission.date}</p>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-3 w-3" />
                <span>{mission.agents}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const actions = [
    {
      label: "Nouvel Agent",
      href: "/dashboard/planning/agents?create=true",
      icon: Users,
    },
    {
      label: "Voir Planning",
      href: "/dashboard/planning/schedule",
      icon: Clock,
    },
    {
      label: "Nouveau Shift",
      href: "/dashboard/planning/shifts?create=true",
      icon: RotateCcw,
    },
    {
      label: "Nouveau Poste",
      href: "/dashboard/planning/postes?create=true",
      icon: Briefcase,
    },
    {
      label: "Nouveau Site",
      href: "/dashboard/planning/sites?create=true",
      icon: MapPin,
    },
  ];

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      type="form"
      title="Actions Rapides"
      size="md"
      actions={{
        secondary: {
          label: "Fermer",
          onClick: onClose,
          variant: "outline",
        },
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              onClick={onClose}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-border hover:bg-accent hover:border-primary/30 transition-all"
            >
              <Icon className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </Modal>
  );
}

function AlertsWidget({ isLoading }: { isLoading: boolean }) {
  const { agents } = usePlanningAgents();
  const { sites } = usePlanningSites();
  const { data: vacations = [] } = useShifts({});

  // Alertes calculées sur les données réelles de l'organisation.
  const alerts = useMemo(() => {
    const debutSemaine = new Date();
    debutSemaine.setDate(
      debutSemaine.getDate() - ((debutSemaine.getDay() + 6) % 7),
    );
    debutSemaine.setHours(0, 0, 0, 0);
    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(debutSemaine.getDate() + 7);

    const vacationsSemaine = vacations.filter((v) => {
      const debut = new Date(v.startAt);
      return debut >= debutSemaine && debut < finSemaine;
    });

    const sansQualification = agents.filter(
      (a) => a.qualifications.length === 0,
    ).length;
    const nonAffectees = vacationsSemaine.filter((v) => !v.memberId).length;
    const postes = sites.flatMap((s) => s.postes ?? []);
    const postesCouverts = new Set(
      vacationsSemaine.map((v) => v.postId).filter(Boolean),
    );
    const postesSansVacation = postes.filter(
      (p) => !postesCouverts.has(p.id),
    ).length;

    const liste: { type: string; message: string }[] = [];
    if (sansQualification > 0) {
      liste.push({
        type: "warning",
        message: `${sansQualification} agent${sansQualification > 1 ? "s" : ""} sans qualification enregistrée`,
      });
    }
    if (nonAffectees > 0) {
      liste.push({
        type: "urgent",
        message: `${nonAffectees} vacation${nonAffectees > 1 ? "s" : ""} sans agent cette semaine`,
      });
    }
    if (postesSansVacation > 0) {
      liste.push({
        type: "info",
        message: `${postesSansVacation} poste${postesSansVacation > 1 ? "s" : ""} sans vacation planifiée cette semaine`,
      });
    }
    return liste;
  }, [agents, sites, vacations]);

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

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          Alertes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              Aucune alerte sur le planning de la semaine.
            </p>
          )}
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-start gap-2 p-2 rounded-lg",
                alert.type === "urgent" && "bg-red-500/10",
                alert.type === "warning" && "bg-orange-500/10",
                alert.type === "info" && "bg-blue-500/10",
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-4 w-4 mt-0.5",
                  alert.type === "urgent" && "text-red-600",
                  alert.type === "warning" && "text-orange-600",
                  alert.type === "info" && "text-blue-600",
                )}
              />
              <p className="text-xs flex-1">{alert.message}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionsWidget({ isLoading }: { isLoading: boolean }) {
  const actions = [
    {
      label: "Nouvel Agent",
      href: "/dashboard/planning/agents",
      icon: Users,
    },
    {
      label: "Planifier Mission",
      href: "/dashboard/planning/missions",
      icon: Calendar,
    },
    {
      label: "Voir Planning",
      href: "/dashboard/planning/schedule",
      icon: Clock,
    },
    {
      label: "Rapports",
      href: "/dashboard/planning/reports",
      icon: BarChart3,
    },
    {
      label: "Nouveau Shift",
      href: "/dashboard/planning/shifts",
      icon: RotateCcw,
    },
    {
      label: "Nouveau Poste",
      href: "/dashboard/planning/postes",
      icon: Briefcase,
    },
    {
      label: "Nouveau Site",
      href: "/dashboard/planning/sites",
      icon: MapPin,
    },
  ];

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

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Actions Rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-center gap-2 p-4"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const getDateString = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
};

const formatDateFr = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const months = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
};

function PlanningOverviewWidget({ isLoading }: { isLoading: boolean }) {
  const { sites } = usePlanningSites();
  const { agents } = usePlanningAgents();
  const { data: vacations = [] } = useShifts({});

  const days = useMemo(() => {
    return [0, 1, 2].map((offset) => {
      const dateStr = getDateString(offset);
      const shiftsForDay = vacations
        .filter((v) => v.startAt.split("T")[0] === dateStr)
        .map((v) => {
          const debut = new Date(v.startAt);
          const fin = new Date(v.endAt);
          const hhmm = (d: Date) =>
            `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
          return {
            siteId: v.post?.site.id ?? "",
            agentId: v.memberId ?? "",
            startTime: hhmm(debut),
            endTime: hhmm(fin),
          };
        });

      const siteMap = new Map<
        string,
        {
          name: string;
          color: ReturnType<typeof getSiteColorClasses> | null;
          vacations: {
            agentName: string;
            startTime: string;
            endTime: string;
          }[];
        }
      >();
      for (const shift of shiftsForDay) {
        const site = sites.find((s) => s.id === shift.siteId);
        const siteName = site?.name || shift.siteId;
        const siteColor = site ? getSiteColorClasses(site.color) : null;
        const agentName =
          agents.find((a) => a.id === shift.agentId)?.name || shift.agentId;
        if (!siteMap.has(shift.siteId)) {
          siteMap.set(shift.siteId, {
            name: siteName,
            color: siteColor,
            vacations: [],
          });
        }
        siteMap.get(shift.siteId)!.vacations.push({
          agentName,
          startTime: shift.startTime,
          endTime: shift.endTime,
        });
      }

      const sitesDuJour = Array.from(siteMap.values());

      return {
        label: formatDateFr(offset),
        total: shiftsForDay.length,
        sites: sitesDuJour,
      };
    });
  }, [vacations, sites, agents]);

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

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-cyan-600" />
          Situation Planning (3 jours)
        </CardTitle>
        <Link href="/dashboard/planning/schedule">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            Voir planning
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="max-h-72 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            {days.map((day, idx) => (
              <div key={idx} className="space-y-3 p-2 rounded-lg bg-accent/30">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{day.label}</p>
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {day.total}
                  </span>
                </div>
                {day.sites.length > 0 ? (
                  day.sites.map((site) => (
                    <div key={site.name} className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {site.color && (
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${site.color.dot}`}
                          />
                        )}
                        <p
                          className={`text-xs font-medium truncate ${site.color ? site.color.text : "text-primary/80"}`}
                        >
                          {site.name}
                        </p>
                      </div>
                      {site.vacations.map((v, vIdx) => (
                        <div
                          key={vIdx}
                          className={`text-xs text-muted-foreground pl-2 border-l-2 ${site.color ? site.color.border + "/40" : "border-primary/20"}`}
                        >
                          {v.agentName} — {v.startTime} – {v.endTime}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Aucune vacation
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type WidgetConfig = {
  id: string;
  name: string;
  component: React.ComponentType<{ isLoading: boolean }>;
  visible: boolean;
  span?: number;
};

function SortableItem({
  config,
  index,
  toggleVisibility,
  moveUp,
  moveDown,
  total,
}: {
  config: WidgetConfig;
  index: number;
  toggleVisibility: (id: string) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  total: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between"
    >
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          {...attributes}
          {...listeners}
          className="cursor-grab"
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <Checkbox
          id={config.id}
          checked={config.visible}
          onCheckedChange={() => toggleVisibility(config.id)}
        />
        <label htmlFor={config.id} className="text-sm">
          {config.name}
        </label>
      </div>
      <div className="flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => moveUp(index)}
          disabled={index === 0}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => moveDown(index)}
          disabled={index === total - 1}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SortableWidget({
  config,
  isLoading,
  isEditMode,
  toggleVisibility,
}: {
  config: WidgetConfig;
  isLoading: boolean;
  isEditMode: boolean;
  toggleVisibility: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Component = config.component;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative group", config.span)}
    >
      {isEditMode && (
        <div className="absolute -top-2 -right-2 z-10 flex gap-1">
          <Button
            variant="secondary"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => toggleVisibility(config.id)}
          >
            ✕
          </Button>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing bg-primary text-primary-foreground rounded-md p-1 h-6 w-6 flex items-center justify-center"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
      )}
      <Component isLoading={isLoading} />
    </div>
  );
}

const defaultWidgetConfigs: WidgetConfig[] = [
  {
    id: "agent-stats",
    name: "Effectif Agents",
    component: AgentStatsWidget,
    visible: true,
  },
  {
    id: "availability",
    name: "Disponibilité",
    component: AvailabilityWidget,
    visible: true,
  },
  {
    id: "mission-status",
    name: "En Mission",
    component: MissionStatusWidget,
    visible: true,
  },
  {
    id: "planning-overview",
    name: "Situation Planning 3J",
    component: PlanningOverviewWidget,
    visible: true,
    span: 2,
  },
  {
    id: "qualifications",
    name: "Qualifications",
    component: QualificationsWidget,
    visible: true,
  },
  {
    id: "contract-types",
    name: "Types de Contrat",
    component: ContractTypesWidget,
    visible: true,
  },
  {
    id: "weekly-hours",
    name: "Heures Hebdomadaires",
    component: WeeklyHoursWidget,
    visible: true,
  },
  {
    id: "upcoming-missions",
    name: "Missions à Venir",
    component: UpcomingMissionsWidget,
    visible: true,
    span: 2,
  },
  {
    id: "alerts",
    name: "Alertes",
    component: AlertsWidget,
    visible: true,
  },
  {
    id: "quick-actions",
    name: "Actions Rapides",
    component: QuickActionsWidget,
    visible: true,
  },
];

type WidgetAction =
  | { type: "TOGGLE_VISIBILITY"; payload: string }
  | { type: "REORDER"; payload: { activeId: string; overId: string } }
  | { type: "LOAD"; payload: SavedWidgetConfig[] };

function widgetReducer(
  state: WidgetConfig[],
  action: WidgetAction,
): WidgetConfig[] {
  switch (action.type) {
    case "TOGGLE_VISIBILITY": {
      return state.map((widget) =>
        widget.id === action.payload
          ? { ...widget, visible: !widget.visible }
          : widget,
      );
    }
    case "REORDER": {
      const { activeId, overId } = action.payload;
      const oldIndex = state.findIndex((w) => w.id === activeId);
      const newIndex = state.findIndex((w) => w.id === overId);
      return arrayMove(state, oldIndex, newIndex);
    }
    case "LOAD": {
      const saved = action.payload as unknown as WidgetConfig[];
      return saved;
    }
    default:
      return state;
  }
}

export default function PlanningDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [widgetConfigs, dispatch] = useReducer(
    widgetReducer,
    defaultWidgetConfigs,
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const gridSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const savedConfigs = useDashboardConfigStore
      .getState()
      .getConfig("planning");
    if (savedConfigs) {
      try {
        let loadedConfigs = savedConfigs
          .map((saved: SavedWidgetConfig) => {
            const defaultConfig = defaultWidgetConfigs.find(
              (d: WidgetConfig) => d.id === saved.id,
            );
            return defaultConfig ? { ...defaultConfig, ...saved } : null;
          })
          .filter(Boolean) as WidgetConfig[];
        const missingDefaults = defaultWidgetConfigs.filter(
          (defaultConfig: WidgetConfig) =>
            savedConfigs.every(
              (saved: SavedWidgetConfig) => saved.id !== defaultConfig.id,
            ),
        );
        loadedConfigs = [...loadedConfigs, ...missingDefaults];
        dispatch({ type: "LOAD", payload: loadedConfigs });
      } catch (e) {
        console.error("Error loading dashboard config:", e);
      }
    }
  }, []);

  useEffect(() => {
    const toSave: SavedWidgetConfig[] = widgetConfigs.map((config) => ({
      id: config.id,
      name: config.name,
      visible: config.visible,
      span: config.span,
    }));
    useDashboardConfigStore.getState().setConfig("planning", toSave);
  }, [widgetConfigs]);

  const toggleVisibility = (id: string) => {
    dispatch({ type: "TOGGLE_VISIBILITY", payload: id });
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      const activeId = widgetConfigs[index].id;
      const overId = widgetConfigs[index - 1].id;
      dispatch({ type: "REORDER", payload: { activeId, overId } });
    }
  };

  const moveDown = (index: number) => {
    if (index < widgetConfigs.length - 1) {
      const activeId = widgetConfigs[index].id;
      const overId = widgetConfigs[index + 1].id;
      dispatch({ type: "REORDER", payload: { activeId, overId } });
    }
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      dispatch({
        type: "REORDER",
        payload: { activeId: active.id as string, overId: over.id as string },
      });
    }
  }

  function handleGridDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeConfig = widgetConfigs.find((w) => w.id === activeId);
    const overConfig = widgetConfigs.find((w) => w.id === overId);

    if (!activeConfig || !overConfig) return;

    const isActiveVisible = activeConfig.visible;
    const isOverVisible = overConfig.visible;

    if (isActiveVisible && isOverVisible) {
      dispatch({ type: "REORDER", payload: { activeId, overId } });
    } else if (isActiveVisible && !isOverVisible) {
      dispatch({ type: "REORDER", payload: { activeId, overId } });
    } else if (!isActiveVisible && isOverVisible) {
      dispatch({ type: "REORDER", payload: { activeId, overId } });
    }
  }

  const visibleWidgets = widgetConfigs.filter((w) => w.visible);
  const hiddenWidgets = widgetConfigs.filter((w) => !w.visible);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Tableau de bord Planning
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Gestion des agents, planification et affectations
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Personnaliser
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsQuickActionsOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Actions
          </Button>

          <QuickActionsModal
            isOpen={isQuickActionsOpen}
            onClose={() => setIsQuickActionsOpen(false)}
          />

          <Modal
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            type="form"
            title="Personnaliser le tableau de bord"
            size="md"
            actions={{
              primary: {
                label: "Fermer",
                onClick: () => setIsDialogOpen(false),
                variant: "outline",
              },
            }}
          >
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsEditMode(!isEditMode);
                setIsDialogOpen(false);
              }}
              className="mb-4"
            >
              <GripVertical className="h-4 w-4 mr-2" />
              {isEditMode ? "Quitter Édition" : "Mode Édition"}
            </Button>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={widgetConfigs.map((config) => config.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {widgetConfigs.map((config: WidgetConfig, index: number) => (
                    <SortableItem
                      key={config.id}
                      config={config}
                      index={index}
                      toggleVisibility={toggleVisibility}
                      moveUp={moveUp}
                      moveDown={moveDown}
                      total={widgetConfigs.length}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </Modal>
        </div>
      </div>

      {isEditMode ? (
        <DndContext
          sensors={gridSensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveId(event.active.id as string)}
          onDragEnd={(event) => {
            setActiveId(null);
            handleGridDragEnd(event);
          }}
        >
          <SortableContext
            items={visibleWidgets.map((config) => config.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleWidgets.map((config: WidgetConfig) => (
                <SortableWidget
                  key={config.id}
                  config={config}
                  isLoading={isLoading}
                  isEditMode={isEditMode}
                  toggleVisibility={toggleVisibility}
                />
              ))}
            </div>
          </SortableContext>

          {hiddenWidgets.length > 0 && (
            <>
              <Separator className="my-6" />
              <div>
                <h2 className="text-sm font-light text-muted-foreground mb-4">
                  Widgets masqués
                </h2>
                <SortableContext
                  items={hiddenWidgets.map((config) => config.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hiddenWidgets.map((config: WidgetConfig) => (
                      <SortableWidget
                        key={config.id}
                        config={config}
                        isLoading={isLoading}
                        isEditMode={isEditMode}
                        toggleVisibility={toggleVisibility}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            </>
          )}
          <DragOverlay>
            {activeId ? (
              <div className="rotate-3 opacity-90">
                <SortableWidget
                  config={widgetConfigs.find((c) => c.id === activeId)!}
                  isLoading={isLoading}
                  isEditMode={isEditMode}
                  toggleVisibility={toggleVisibility}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        // Single grid container for all widgets to enable proper row spanning
        // Layout: 2 columns
        // Row 1: agent-stats (col1), Alerts (col2, spans 3 rows)
        // Row 2: availability (col1), planning-overview (col1-2)
        // Row 3: mission-status (col1), qualifications (col2)
        // Row 4: contract-types (col1), weekly-hours (col2)
        // Row 5: upcoming-missions (spans 2)
        <div className="grid grid-cols-2 gap-4">
          {/* Row 1, Col 1: agent-stats */}
          {visibleWidgets
            .filter((config) => config.id === "agent-stats")
            .map((config: WidgetConfig) => {
              const Component = config.component;
              return (
                <div key={config.id} className="h-full">
                  <Component isLoading={isLoading} />
                </div>
              );
            })}

          {/* Row 1-3, Col 2: Alerts - spans 3 rows */}
          {visibleWidgets
            .filter((config) => config.id === "alerts")
            .map((config: WidgetConfig) => {
              const Component = config.component;
              return (
                <div key={config.id} className="h-full row-span-3">
                  <Component isLoading={isLoading} />
                </div>
              );
            })}

          {/* Row 2, Col 1: availability */}
          {visibleWidgets
            .filter((config) => config.id === "availability")
            .map((config: WidgetConfig) => {
              const Component = config.component;
              return (
                <div key={config.id} className="h-full">
                  <Component isLoading={isLoading} />
                </div>
              );
            })}

          {/* Row 3, Col 1: mission-status */}
          {visibleWidgets
            .filter((config) => config.id === "mission-status")
            .map((config: WidgetConfig) => {
              const Component = config.component;
              return (
                <div key={config.id} className="h-full">
                  <Component isLoading={isLoading} />
                </div>
              );
            })}

          {/* Row 3, Col 2: qualifications */}
          {visibleWidgets
            .filter((config) => config.id === "qualifications")
            .map((config: WidgetConfig) => {
              const Component = config.component;
              return (
                <div key={config.id} className="h-full">
                  <Component isLoading={isLoading} />
                </div>
              );
            })}

          {/* Row 4, Col 1: contract-types */}
          {visibleWidgets
            .filter((config) => config.id === "contract-types")
            .map((config: WidgetConfig) => {
              const Component = config.component;
              return (
                <div key={config.id} className="h-full">
                  <Component isLoading={isLoading} />
                </div>
              );
            })}

          {/* Row 4, Col 2: weekly-hours */}
          {visibleWidgets
            .filter((config) => config.id === "weekly-hours")
            .map((config: WidgetConfig) => {
              const Component = config.component;
              return (
                <div key={config.id} className="h-full">
                  <Component isLoading={isLoading} />
                </div>
              );
            })}

          {/* Row 2: planning-overview (spans 2 cols) */}
          {visibleWidgets
            .filter((config) => config.id === "planning-overview")
            .map((config: WidgetConfig) => {
              const Component = config.component;
              return (
                <div key={config.id} className="h-full col-span-2">
                  <Component isLoading={isLoading} />
                </div>
              );
            })}

          {/* Row 5: upcoming-missions (spans 2 cols) */}
          {visibleWidgets
            .filter((config) => config.id === "upcoming-missions")
            .map((config: WidgetConfig) => {
              const Component = config.component;
              return (
                <div key={config.id} className="h-full col-span-2">
                  <Component isLoading={isLoading} />
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
