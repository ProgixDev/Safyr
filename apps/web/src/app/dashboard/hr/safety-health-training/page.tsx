"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Award,
  Clock,
  Calculator,
  Plus,
  Calendar,
} from "lucide-react";
import type { TrainingStats, TrainingCertification } from "@/lib/types";

// Mock data - in real app this would come from API
const mockTrainingStats: TrainingStats = {
  totalCertifications: 156,
  validCertifications: 142,
  expiredCertifications: 8,
  expiringSoon: 6,
  complianceRate: 91.0,
  totalTrainingHours: 2450,
  totalTrainingCost: 45000,
  currency: "EUR",
};

const mockExpiringCertifications: TrainingCertification[] = [];

function CertificationOverviewWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Total des certifications
        </CardTitle>
        <Award className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {mockTrainingStats.totalCertifications}
        </div>
        <p className="text-xs text-muted-foreground">
          {mockTrainingStats.validCertifications} valides
        </p>
      </CardContent>
    </Card>
  );
}

function ComplianceRateWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Taux de conformité
        </CardTitle>
        <CheckCircle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {mockTrainingStats.complianceRate}%
        </div>
        <p className="text-xs text-muted-foreground">
          <TrendingUp className="inline h-3 w-3 text-green-600 mr-1" />
          +2.1% par rapport au trimestre dernier
        </p>
      </CardContent>
    </Card>
  );
}

function ExpiringSoonWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Expirent bientôt</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-orange-600">
          {mockTrainingStats.expiringSoon}
        </div>
        <p className="text-xs text-muted-foreground">
          Certifications à renouveler
        </p>
        <div className="mt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/hr/safety-health-training/training-register/alerts">
              Voir les alertes
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TrainingBudgetWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Budget formation 2024
        </CardTitle>
        <Calculator className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {mockTrainingStats.totalTrainingCost.toLocaleString("fr-FR")} €
        </div>
        <p className="text-xs text-muted-foreground">
          {mockTrainingStats.totalTrainingHours} heures de formation
        </p>
      </CardContent>
    </Card>
  );
}

function ExpiringCertificationsWidget() {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">
          Certifications expirant bientôt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockExpiringCertifications.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Award className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{cert.employeeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {cert.type} {cert.level ? `Niveau ${cert.level}` : ""} -
                    Expire le {cert.expiryDate.toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">{cert.type}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/hr/safety-health-training/training-register/alerts">
              Voir toutes les alertes
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full justify-start gap-2" asChild>
          <Link href="/dashboard/hr/safety-health-training/authorizations-matrix/ssiap">
            <Plus className="h-4 w-4" />
            Ajouter certification SSIAP
          </Link>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          asChild
        >
          <Link href="/dashboard/hr/safety-health-training/authorizations-matrix/sst">
            <Plus className="h-4 w-4" />
            Gérer SST & recyclages
          </Link>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          asChild
        >
          <Link href="/dashboard/hr/safety-health-training/training-plan/plan">
            <Calendar className="h-4 w-4" />
            Planifier une formation
          </Link>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          asChild
        >
          <Link href="/dashboard/hr/safety-health-training/training-register/alerts">
            <AlertTriangle className="h-4 w-4" />
            Voir les alertes
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ExpiredCertificationsWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Certifications expirées
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-600">
          {mockTrainingStats.expiredCertifications}
        </div>
        <p className="text-xs text-muted-foreground">
          Nécessitent un renouvellement immédiat
        </p>
        <div className="mt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/hr/safety-health-training/training-register/alerts">
              Voir les expirées
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrainingPage() {
  // Simulate loading (removed unused isLoading state)
  useEffect(() => {
    // Loading simulation if needed in future
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-light tracking-tight">
          Formations & Certifications
        </h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          Gestion des formations, certifications et habilitations du personnel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CertificationOverviewWidget />
        <ComplianceRateWidget />
        <ExpiringSoonWidget />
        <TrainingBudgetWidget />

        <div className="md:col-span-2">
          <ExpiringCertificationsWidget />
        </div>
        <QuickActionsWidget />
        <ExpiredCertificationsWidget />
      </div>
    </div>
  );
}
