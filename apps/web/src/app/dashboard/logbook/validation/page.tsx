"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ShieldCheck,
  Search,
} from "lucide-react";
import { useLogbookEvents, useValidateLogbookEvent } from "@/hooks/logbook";
import type { LogbookEvent, Severity } from "@safyr/api-client";

const SEVERITE_LABELS: Record<Severity, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
  critical: "Critique",
};

const SEVERITE_COULEURS: Record<Severity, string> = {
  low: "bg-muted-foreground/40",
  medium: "bg-sky-500",
  high: "bg-orange-500",
  critical: "bg-red-600",
};

const TYPE_LABELS: Record<LogbookEvent["type"], string> = {
  event: "Événement",
  incident: "Incident",
  action: "Action",
  control: "Contrôle",
};

function nomAgent(e: LogbookEvent) {
  if (!e.member) return "—";
  return `${e.member.firstName ?? ""} ${e.member.lastName ?? ""}`.trim() || "—";
}

/**
 * Validation des saisies de la main courante.
 *
 * L'écran travaillait sur des événements de démonstration : il restait vide et
 * ne validait rien. Il lit désormais les événements réels et appelle
 * l'endpoint de validation, qui existait déjà côté serveur.
 */
export default function LogbookValidationPage() {
  const { data: evenements = [], isLoading } = useLogbookEvents({});
  const valider = useValidateLogbookEvent();

  const [recherche, setRecherche] = useState("");
  const [aRefuser, setARefuser] = useState<LogbookEvent | null>(null);
  const [motif, setMotif] = useState("");

  const aValider = useMemo(
    () => evenements.filter((e) => e.status === "open"),
    [evenements],
  );

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return aValider;
    return aValider.filter((e) =>
      `${e.title} ${e.description ?? ""} ${nomAgent(e)} ${e.site?.name ?? ""}`
        .toLowerCase()
        .includes(terme),
    );
  }, [aValider, recherche]);

  const traiter = async (
    evenement: LogbookEvent,
    status: "validated" | "rejected",
    commentaire?: string,
  ) => {
    try {
      await valider.mutateAsync({
        eventId: evenement.id,
        data: { status, ...(commentaire ? { comment: commentaire } : {}) },
      });
    } catch (e) {
      alert(`Échec : ${e instanceof Error ? e.message : "erreur inconnue"}`);
    }
  };

  const colonnes: ColumnDef<LogbookEvent>[] = [
    {
      key: "severity",
      label: "Gravité",
      render: (e) => (
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              SEVERITE_COULEURS[e.severity],
            )}
          />
          <Badge variant="outline">{SEVERITE_LABELS[e.severity]}</Badge>
        </span>
      ),
    },
    {
      key: "title",
      label: "Événement",
      sortable: true,
      render: (e) => (
        <div className="min-w-0">
          <p className="font-medium">{e.title}</p>
          {e.description && (
            <p className="truncate text-sm text-muted-foreground">
              {e.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (e) => <Badge variant="outline">{TYPE_LABELS[e.type]}</Badge>,
    },
    { key: "agent", label: "Agent", render: (e) => nomAgent(e) },
    {
      key: "site",
      label: "Site",
      render: (e) => (
        <span className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          {e.site?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "occurredAt",
      label: "Survenu",
      sortable: true,
      render: (e) => new Date(e.occurredAt).toLocaleString("fr-FR"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Validation des saisies</h1>
        <p className="text-muted-foreground">
          Événements en attente de contrôle par un superviseur
        </p>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={Clock}
          title="À valider"
          value={aValider.length}
          color="orange"
        />
        <InfoCard
          icon={CheckCircle2}
          title="Validés"
          value={evenements.filter((e) => e.status === "validated").length}
          color="green"
        />
        <InfoCard
          icon={XCircle}
          title="Refusés"
          value={evenements.filter((e) => e.status === "rejected").length}
          color="red"
        />
        <InfoCard
          icon={ShieldCheck}
          title="Total"
          value={evenements.length}
          color="gray"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader>
          <CardTitle>File de validation</CardTitle>
          <div className="relative mt-2 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un événement, un agent, un site…"
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={visibles}
            isLoading={isLoading}
            columns={colonnes}
            searchKey="title"
            actions={(e) => (
              <RowActionsMenu
                disabled={valider.isPending}
                extraItems={[
                  {
                    label: "Valider",
                    icon: CheckCircle2,
                    tone: "validate" as const,
                    onClick: () => void traiter(e, "validated"),
                  },
                  {
                    label: "Refuser",
                    icon: XCircle,
                    tone: "delete" as const,
                    destructive: true,
                    onClick: () => {
                      setARefuser(e);
                      setMotif("");
                    },
                  },
                ]}
              />
            )}
          />
        </CardContent>
      </Card>

      <Modal
        open={!!aRefuser}
        onOpenChange={(open) => !open && setARefuser(null)}
        type="form"
        size="md"
        title="Refuser l'événement"
        actions={{
          primary: {
            label: "Refuser",
            variant: "destructive" as const,
            onClick: () => {
              if (aRefuser) void traiter(aRefuser, "rejected", motif);
              setARefuser(null);
            },
          },
          secondary: {
            label: "Annuler",
            variant: "outline" as const,
            onClick: () => setARefuser(null),
          },
        }}
      >
        <div className="space-y-3">
          <p className="text-sm">
            <span className="font-medium">{aRefuser?.title}</span> — indiquez le
            motif du refus, il sera conservé avec l&apos;événement.
          </p>
          <Textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Motif du refus"
          />
        </div>
      </Modal>
    </div>
  );
}
