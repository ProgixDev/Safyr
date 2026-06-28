"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
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

function EmployeeStatsWidget({ isLoading }: { isLoading: boolean }) {
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
          Effectif Total
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <span className="text-4xl font-light tracking-tight">247</span>
            <span className="ml-2 text-sm text-muted-foreground">salariés</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">CDI</p>
              <p className="text-xl font-light">189</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CDD</p>
              <p className="text-xl font-light">58</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400">+12 ce mois</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AbsenceWidget({ isLoading }: { isLoading: boolean }) {
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
          <Calendar className="h-4 w-4 text-orange-500" />
          Taux d&apos;Absentéisme
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <RadialGauge
            value={3.2}
            max={5}
            color="#fb923c"
            display="3.2%"
            caption="Objectif 2.5%"
          />
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Congés</p>
              <p className="text-lg font-light">24</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Maladie</p>
              <p className="text-lg font-light">8</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TurnoverWidget({ isLoading }: { isLoading: boolean }) {
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
          <TrendingUp className="h-4 w-4 text-blue-500" />
          Turnover
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <span className="text-4xl font-light tracking-tight">8.5%</span>
            <span className="ml-2 text-sm text-muted-foreground">annuel</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Entrées</p>
              <p className="text-lg font-light text-emerald-400">+18</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sorties</p>
              <p className="text-lg font-light text-red-400">-12</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplianceWidget({ isLoading }: { isLoading: boolean }) {
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
          <Shield className="h-4 w-4 text-emerald-500" />
          Conformité CNAPS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <span className="text-4xl font-light tracking-tight">98.2%</span>
            <span className="ml-2 text-sm text-muted-foreground">conforme</span>
          </div>
          <div className="space-y-2">
            <Progress value={98.2} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">À jour</p>
              <p className="text-lg font-light text-emerald-400">243</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">À renouveler</p>
              <p className="text-lg font-light text-orange-400">4</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrainingWidget({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const trainings = [
    { type: "SSIAP", valid: 198, expiring: 12, expired: 3 },
    { type: "SST", valid: 187, expiring: 18, expired: 5 },
    { type: "H0B0", valid: 156, expiring: 8, expired: 2 },
    { type: "Carte PRO", valid: 143, expiring: 15, expired: 7 },
  ];

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Formations & Habilitations
          </CardTitle>
          <Link
            href="/dashboard/hr/safety-health-training/authorizations-matrix/ssiap"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Voir tout
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trainings.map((training) => (
            <div key={training.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{training.type}</span>
                <span className="text-xs text-muted-foreground">
                  {training.valid + training.expiring + training.expired} total
                </span>
              </div>
              <div className="flex gap-1 h-2">
                <div
                  className="bg-emerald-500 rounded-l-lg"
                  style={{
                    width: `${(training.valid / (training.valid + training.expiring + training.expired)) * 100}%`,
                  }}
                />
                <div
                  className="bg-orange-500"
                  style={{
                    width: `${(training.expiring / (training.valid + training.expiring + training.expired)) * 100}%`,
                  }}
                />
                <div
                  className="bg-red-500 rounded-r-lg"
                  style={{
                    width: `${(training.expired / (training.valid + training.expiring + training.expired)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-emerald-400">
                  {training.valid} à jour
                </span>
                <span className="text-orange-400">
                  {training.expiring} expirant
                </span>
                <span className="text-red-400">{training.expired} expirés</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsWidget({ isLoading }: { isLoading: boolean }) {
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

  const alerts = [
    {
      type: "critical",
      icon: AlertTriangle,
      label: "Documents expirés",
      count: 8,
      color: "text-red-500",
    },
    {
      type: "warning",
      icon: Clock,
      label: "Expirations < 30j",
      count: 24,
      color: "text-orange-500",
    },
    {
      type: "info",
      icon: FileText,
      label: "Contrats à renouveler",
      count: 6,
      color: "text-blue-500",
    },
  ];

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Alertes RH
          </CardTitle>
          <Link
            href="/dashboard/hr/hr-services/communication/notifications"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Voir tout
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div
                key={alert.type}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4", alert.color)} />
                  <span className="text-sm">{alert.label}</span>
                </div>
                <span className={cn("text-lg font-light", alert.color)}>
                  {alert.count}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PendingRequestsWidget({ isLoading }: { isLoading: boolean }) {
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

  const requests = [
    { type: "Congés", count: 12, color: "text-blue-500" },
    { type: "Absences", count: 5, color: "text-orange-500" },
    { type: "CSE", count: 3, color: "text-purple-500" },
  ];

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Demandes en attente
          </CardTitle>
          <Link
            href="/dashboard/hr/time-activity/absences"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Traiter
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.type}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm">{request.type}</span>
              <span className={cn("text-lg font-light", request.color)}>
                {request.count}
              </span>
            </div>
          ))}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-xl font-light text-primary">20</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PayrollWidget({ isLoading }: { isLoading: boolean }) {
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
          <Briefcase className="h-4 w-4 text-primary" />
          Masse Salariale
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <span className="text-4xl font-light tracking-tight">687K€</span>
            <span className="ml-2 text-sm text-muted-foreground">ce mois</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400">+3.2%</span>
            <span className="text-muted-foreground">vs mois dernier</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Coût/heure moy.</p>
              <p className="text-lg font-light">18.50€</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Budget annuel</p>
              <p className="text-lg font-light">8.2M€</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DelegationHoursWidget({ isLoading }: { isLoading: boolean }) {
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
          <Clock className="h-4 w-4 text-blue-500" />
          Heures de délégation CSE
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <RadialGauge
            value={78}
            color="#3b82f6"
            display="156h"
            caption="sur 200h · 78%"
          />
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Allouées</p>
              <p className="text-lg font-light">200h</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Restantes</p>
              <p className="text-lg font-light text-emerald-400">44h</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CostPerEmployeeWidget({ isLoading }: { isLoading: boolean }) {
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
          <DollarSign className="h-4 w-4 text-green-500" />
          Coût par employé
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <MiniDonut
            data={[
              { name: "Salaire brut", value: 2150, color: "#34d399" },
              { name: "Charges", value: 700, color: "#fb923c" },
            ]}
            centerValue="2 850€"
            centerCaption="moy./mois"
          />
          <div className="flex items-center justify-center gap-2 text-sm pt-1">
            <TrendingUp className="h-4 w-4 text-red-400" />
            <span className="text-red-400">+4.2%</span>
            <span className="text-muted-foreground">vs mois dernier</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmployerChargesWidget({ isLoading }: { isLoading: boolean }) {
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
          <Briefcase className="h-4 w-4 text-purple-500" />
          Charges patronales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <RadialGauge
            value={28.5}
            color="#a855f7"
            display="28.5%"
            caption="du salaire brut"
          />
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Total mensuel</p>
              <p className="text-lg font-light">81K€</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Par employé</p>
              <p className="text-lg font-light">700€</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GenderEqualityWidget({ isLoading }: { isLoading: boolean }) {
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
          <Scale className="h-4 w-4 text-pink-500" />
          Index égalité H/F
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <RadialGauge
            value={87}
            color="#ec4899"
            display="87/100"
            caption="Objectif 85"
          />
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Femmes</p>
              <p className="text-lg font-light">42%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Écart salarial</p>
              <p className="text-lg font-light text-emerald-400">2.1%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HRForecastWidget({ isLoading }: { isLoading: boolean }) {
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
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          Prévisions RH
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <MiniDonut
            data={[
              { name: "Embauches", value: 8, color: "#34d399" },
              { name: "Départs", value: 3, color: "#ef4444" },
            ]}
            centerValue="+5"
            centerCaption="solde net"
          />
          <div className="flex items-center justify-center gap-2 text-sm pt-1">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400">Croissance +2.7%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SalaryMaintenanceWidget({ isLoading }: { isLoading: boolean }) {
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
          <Target className="h-4 w-4 text-orange-500" />
          Maintien salaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <MiniDonut
            data={[
              { name: "Maladie", value: 8, color: "#fb923c" },
              { name: "AT/MP", value: 4, color: "#ef4444" },
            ]}
            centerValue="12"
            centerCaption="cas actifs"
          />
          <div className="flex items-center justify-center gap-2 text-sm pt-1">
            <TrendingUp className="h-4 w-4 text-red-400" />
            <span className="text-red-400">Coût: 28K€/mois</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecruitmentKPIsWidget({ isLoading }: { isLoading: boolean }) {
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
          <UserPlus className="h-4 w-4 text-teal-500" />
          KPIs Recrutement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <RadialGauge
            value={78}
            color="#14b8a6"
            display="78%"
            caption="taux de succès"
          />
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Délai moyen</p>
              <p className="text-lg font-light">24 jours</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Coût/embauche</p>
              <p className="text-lg font-light">3,200€</p>
            </div>
          </div>
        </div>
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
      label: "Nouveau salarié",
      href: "/dashboard/hr/collaborators",
      icon: UserCheck,
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
    visible: true,
  },
  {
    id: "turnover",
    name: "Turnover",
    component: TurnoverWidget,
    visible: true,
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
    visible: true,
  },
  {
    id: "costPerEmployee",
    name: "Coût par employé",
    component: CostPerEmployeeWidget,
    visible: true,
  },
  {
    id: "employerCharges",
    name: "Charges patronales",
    component: EmployerChargesWidget,
    visible: true,
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
    visible: true,
  },
  {
    id: "hrForecast",
    name: "Prévisions RH",
    component: HRForecastWidget,
    visible: true,
  },
  {
    id: "salaryMaintenance",
    name: "Maintien salaire",
    component: SalaryMaintenanceWidget,
    visible: true,
  },
  {
    id: "recruitmentKPIs",
    name: "KPIs Recrutement",
    component: RecruitmentKPIsWidget,
    visible: true,
  },
  {
    id: "payroll",
    name: "Masse Salariale",
    component: PayrollWidget,
    visible: true,
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
