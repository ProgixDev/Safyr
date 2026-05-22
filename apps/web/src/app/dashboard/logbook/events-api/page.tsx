"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import {
  useLogbookEvents,
  useValidateLogbookEvent,
} from "@/hooks/logbook";
import type { LogbookEvent, Severity } from "@safyr/api-client";

const TYPE_LABELS: Record<LogbookEvent["type"], string> = {
  event: "Événement",
  incident: "Incident",
  action: "Action",
  control: "Contrôle",
};

const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; badge: "default" | "secondary" | "destructive" | "outline" }
> = {
  low: { label: "Faible", color: "bg-green-500", badge: "secondary" },
  medium: { label: "Moyenne", color: "bg-yellow-500", badge: "secondary" },
  high: { label: "Élevée", color: "bg-orange-500", badge: "default" },
  critical: { label: "Critique", color: "bg-red-500", badge: "destructive" },
};

const STATUS_LABELS: Record<LogbookEvent["status"], string> = {
  open: "À valider",
  validated: "Validé",
  closed: "Clôturé",
  rejected: "Refusé",
};

const STATUS_VARIANT: Record<
  LogbookEvent["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "secondary",
  validated: "default",
  closed: "outline",
  rejected: "destructive",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function agentName(e: LogbookEvent): string {
  if (!e.member) return "—";
  const full = [e.member.firstName, e.member.lastName].filter(Boolean).join(" ");
  return full || e.member.employeeNumber || "—";
}

export default function LogbookEventsApiPage() {
  const { data, isLoading } = useLogbookEvents({});
  const events = useMemo<LogbookEvent[]>(() => data ?? [], [data]);

  const validateMutation = useValidateLogbookEvent();

  const [validating, setValidating] = useState<LogbookEvent | null>(null);
  const [validationStatus, setValidationStatus] = useState<
    "validated" | "rejected" | "closed"
  >("validated");
  const [validationComment, setValidationComment] = useState("");

  const counts = useMemo(() => {
    const result = { open: 0, validated: 0, critical: 0, today: 0 };
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    for (const e of events) {
      if (e.status === "open") result.open += 1;
      if (e.status === "validated" || e.status === "closed") result.validated += 1;
      if (e.severity === "critical") result.critical += 1;
      if (new Date(e.occurredAt) >= todayStart) result.today += 1;
    }
    return result;
  }, [events]);

  function openValidation(e: LogbookEvent, status: typeof validationStatus) {
    setValidating(e);
    setValidationStatus(status);
    setValidationComment("");
  }

  async function submitValidation() {
    if (!validating) return;
    await validateMutation.mutateAsync({
      eventId: validating.id,
      data: {
        status: validationStatus,
        comment: validationComment.trim() || undefined,
      },
    });
    setValidating(null);
    setValidationComment("");
  }

  const columns: ColumnDef<LogbookEvent>[] = [
    {
      key: "severity",
      label: "Gravité",
      render: (e) => {
        const meta = SEVERITY_META[e.severity];
        return (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${meta.color}`} />
            <Badge variant={meta.badge}>{meta.label}</Badge>
          </div>
        );
      },
    },
    {
      key: "title",
      label: "Événement",
      sortable: true,
      sortValue: (e) => e.title,
      render: (e) => (
        <div>
          <div className="font-medium">{e.title}</div>
          {e.description && (
            <div className="text-xs text-muted-foreground line-clamp-2 max-w-md">
              {e.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (e) => <Badge variant="outline">{TYPE_LABELS[e.type]}</Badge>,
    },
    {
      key: "agent",
      label: "Agent",
      render: (e) => <span className="text-sm">{agentName(e)}</span>,
    },
    {
      key: "site",
      label: "Site",
      render: (e) => (
        <div className="flex items-center gap-1 text-sm">
          {e.site ? (
            <>
              <MapPin className="h-3 w-3 text-muted-foreground" />
              {e.site.name}
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      key: "occurredAt",
      label: "Survenu",
      sortable: true,
      sortValue: (e) => e.occurredAt,
      render: (e) => (
        <span className="text-sm">
          <Clock className="h-3 w-3 inline mr-1 text-muted-foreground" />
          {formatDateTime(e.occurredAt)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (e) => (
        <Badge variant={STATUS_VARIANT[e.status]}>
          {STATUS_LABELS[e.status]}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="h-7 w-7" />
          Main courante — Événements
        </h1>
        <p className="text-muted-foreground">
          Saisies des agents en temps réel, validation par les superviseurs
        </p>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={ClipboardList}
          title="Total"
          value={events.length}
          subtext="événements enregistrés"
          color="gray"
        />
        <InfoCard
          icon={Clock}
          title="À valider"
          value={counts.open}
          subtext="en attente de superviseur"
          color="orange"
        />
        <InfoCard
          icon={CheckCircle2}
          title="Validés / clôturés"
          value={counts.validated}
          subtext="traités"
          color="green"
        />
        <InfoCard
          icon={AlertTriangle}
          title="Critiques"
          value={counts.critical}
          subtext="toutes périodes"
          color="orange"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Événements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={events}
            isLoading={isLoading}
            columns={columns}
            searchKeys={["title", "description"]}
            getSearchValue={(e) =>
              `${e.title} ${e.description ?? ""} ${agentName(e)} ${e.site?.name ?? ""}`
            }
            searchPlaceholder="Rechercher par titre, description, agent, site…"
            filters={[
              {
                key: "status",
                label: "Statut",
                options: [
                  { value: "all", label: "Tous" },
                  { value: "open", label: "À valider" },
                  { value: "validated", label: "Validés" },
                  { value: "closed", label: "Clôturés" },
                  { value: "rejected", label: "Refusés" },
                ],
              },
              {
                key: "severity",
                label: "Gravité",
                options: [
                  { value: "all", label: "Toutes" },
                  { value: "low", label: "Faible" },
                  { value: "medium", label: "Moyenne" },
                  { value: "high", label: "Élevée" },
                  { value: "critical", label: "Critique" },
                ],
              },
              {
                key: "type",
                label: "Type",
                options: [
                  { value: "all", label: "Tous" },
                  { value: "event", label: "Événement" },
                  { value: "incident", label: "Incident" },
                  { value: "action", label: "Action" },
                  { value: "control", label: "Contrôle" },
                ],
              },
            ]}
            actions={(e) =>
              e.status === "open" ? (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600"
                    onClick={() => openValidation(e, "validated")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Valider
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => openValidation(e, "rejected")}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Refuser
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openValidation(e, "closed")}
                >
                  Clôturer
                </Button>
              )
            }
          />
        </CardContent>
      </Card>

      <Modal
        open={!!validating}
        onOpenChange={(o) => !o && setValidating(null)}
        type="form"
        size="md"
        title={
          validationStatus === "validated"
            ? "Valider l'événement"
            : validationStatus === "rejected"
              ? "Refuser l'événement"
              : "Clôturer l'événement"
        }
        description={
          validating
            ? `${TYPE_LABELS[validating.type]} · ${formatDateTime(
                validating.occurredAt,
              )}`
            : undefined
        }
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setValidating(null),
            variant: "outline",
          },
          primary: {
            label: validateMutation.isPending ? "Envoi..." : "Confirmer",
            disabled: validateMutation.isPending,
            onClick: submitValidation,
            variant:
              validationStatus === "rejected" ? "destructive" : "default",
          },
        }}
      >
        {validating && (
          <div className="space-y-3">
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="font-medium text-sm">{validating.title}</p>
              {validating.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {validating.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Par {agentName(validating)}
                {validating.site && ` · ${validating.site.name}`}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Commentaire (optionnel)
              </label>
              <Textarea
                value={validationComment}
                onChange={(e) => setValidationComment(e.target.value)}
                placeholder="Commentaire du superviseur…"
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
