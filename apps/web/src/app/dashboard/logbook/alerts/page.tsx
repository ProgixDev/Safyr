"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Shield,
  Flame,
  UserX,
  Clock,
  Bell,
  Users,
  Mail,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { type Alert, type AlertType } from "@/data/logbook-alerts";
import { useLogbookEvents } from "@/hooks/logbook";
import { getSeverityLabel } from "@/lib/logbook-utils";

export default function AlertsPage() {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingAlert, setViewingAlert] = useState<Alert | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  /**
   * Les alertes sont derivees des evenements reels de gravite elevee ou
   * critique encore ouverts : la page lisait auparavant une liste de
   * demonstration et n'etait donc jamais alimentee par le terrain.
   */
  const { data: evenements = [] } = useLogbookEvents({});

  const alerts: Alert[] = evenements
    .filter(
      (e) =>
        (e.severity === "high" || e.severity === "critical") &&
        e.status === "open",
    )
    .map((e) => ({
      id: e.id,
      type: (e.category as AlertType) ?? "autre",
      title: e.title,
      description: e.description ?? "",
      timestamp: e.occurredAt,
      site: e.site?.name ?? "Site non renseigné",
      siteId: e.siteId ?? "",
      severity: e.severity === "critical" ? "critical" : "high",
      status: "active",
      notified: {
        pcSecurite: false,
        superviseur: false,
        client: false,
        pompiers: false,
        police: false,
        samu: false,
      },
    })) as unknown as Alert[];

  const filteredAlerts =
    filterType === "all" ? alerts : alerts.filter((a) => a.type === filterType);

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case "incendie":
        return Flame;
      case "effraction":
        return Shield;
      case "critique_medical":
        return UserX;
      case "absence_ronde":
      case "inactivite":
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  const getAlertTypeLabel = (type: AlertType): string => {
    const labels: Record<AlertType, string> = {
      grave_incident: "Incident grave",
      effraction: "Tentative d'effraction",
      incendie: "Détection incendie",
      critique_medical: "Événement critique (médical)",
      absence_ronde: "Absence de ronde",
      inactivite: "Inactivité prolongée",
      pc_securite: "Alerte PC Sécurité",
      superviseur: "Alerte superviseur",
      client: "Alerte client",
      rh: "Alerte RH",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Notifications & Alertes
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            {filteredAlerts.length} alerte(s) nécessitant votre attention
          </p>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="grave_incident">Incidents graves</SelectItem>
            <SelectItem value="effraction">
              Tentatives d&apos;effraction
            </SelectItem>
            <SelectItem value="incendie">Détection incendie</SelectItem>
            <SelectItem value="critique_medical">
              Événements critiques
            </SelectItem>
            <SelectItem value="absence_ronde">Absence de ronde</SelectItem>
            <SelectItem value="inactivite">Inactivité prolongée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAlerts.map((alert) => {
          const Icon = getAlertIcon(alert.type);
          return (
            <Card
              key={alert.id}
              className="glass-card border-border/40 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => {
                setViewingAlert(alert);
                setIsViewModalOpen(true);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-5 w-5 ${
                        alert.severity === "critical"
                          ? "text-red-500"
                          : alert.severity === "high"
                            ? "text-orange-500"
                            : "text-yellow-500"
                      }`}
                    />
                    <CardTitle className="text-xl font-light">
                      {alert.title}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        alert.severity === "critical"
                          ? "destructive"
                          : alert.severity === "high"
                            ? "destructive"
                            : "default"
                      }
                    >
                      {getSeverityLabel(alert.severity)}
                    </Badge>
                    <Badge variant="outline">
                      {getAlertTypeLabel(alert.type)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {alert.description}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{alert.site}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString("fr-FR")}
                  </span>
                </div>
                <div className="flex items-center gap-4 pt-2 border-t mt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Bell className="h-3 w-3" />
                    <span className="text-muted-foreground">Notifié:</span>
                    {alert.notified.pcSecurite && (
                      <Badge variant="outline" className="text-xs">
                        PC Sécurité
                      </Badge>
                    )}
                    {alert.notified.superviseur && (
                      <Badge variant="outline" className="text-xs">
                        Superviseur
                      </Badge>
                    )}
                    {alert.notified.client && (
                      <Badge variant="outline" className="text-xs">
                        Client
                      </Badge>
                    )}
                    {alert.notified.rh && (
                      <Badge variant="outline" className="text-xs">
                        RH
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View Alert Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de l'alerte"
        size="xl"
      >
        {viewingAlert && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Badge variant="outline">
                    {getAlertTypeLabel(viewingAlert.type)}
                  </Badge>
                </div>
                <div>
                  <Label>Gravité</Label>
                  <Badge
                    variant={
                      viewingAlert.severity === "critical"
                        ? "destructive"
                        : viewingAlert.severity === "high"
                          ? "destructive"
                          : "default"
                    }
                  >
                    {getSeverityLabel(viewingAlert.severity)}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-base font-semibold mb-3 block">
                  Notifications envoyées
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">PC Sécurité</span>
                    </div>
                    <Badge
                      variant={
                        viewingAlert.notified.pcSecurite ? "default" : "outline"
                      }
                    >
                      {viewingAlert.notified.pcSecurite ? "Oui" : "Non"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Superviseur</span>
                    </div>
                    <Badge
                      variant={
                        viewingAlert.notified.superviseur
                          ? "default"
                          : "outline"
                      }
                    >
                      {viewingAlert.notified.superviseur ? "Oui" : "Non"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">Client</span>
                    </div>
                    <Badge
                      variant={
                        viewingAlert.notified.client ? "default" : "outline"
                      }
                    >
                      {viewingAlert.notified.client ? "Oui" : "Non"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Responsable RH</span>
                    </div>
                    <Badge
                      variant={viewingAlert.notified.rh ? "default" : "outline"}
                    >
                      {viewingAlert.notified.rh ? "Oui" : "Non"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label>Date/Heure</Label>
                <p className="text-sm">
                  {new Date(viewingAlert.timestamp).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>

            <div>
              <Label>Titre</Label>
              <p className="text-sm font-medium">{viewingAlert.title}</p>
            </div>

            <div>
              <Label>Description</Label>
              <p className="text-sm">{viewingAlert.description}</p>
            </div>

            <div>
              <Label>Site</Label>
              <p className="text-sm">{viewingAlert.site}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
