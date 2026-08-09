"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import {
  Inbox,
  FileText,
  Award,
  CreditCard,
  MapPin,
  Heart,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Settings,
  UserRound,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { HRRequest, HRRequestStatus } from "@/lib/types";

const mockRequests: HRRequest[] = [
  {
    id: "1",
    employeeId: "1",
    employeeName: "Marie Dupont",
    employeeNumber: "EMP-001",
    department: "Sécurité",
    type: "certificate",
    status: "pending",
    submittedAt: new Date("2024-12-20T10:30:00"),
    priority: "normal",
    history: [],
    createdAt: new Date("2024-12-20T10:30:00"),
    updatedAt: new Date("2024-12-20T10:30:00"),
  },
  {
    id: "2",
    employeeId: "2",
    employeeName: "Jean Martin",
    employeeNumber: "EMP-002",
    department: "Surveillance",
    type: "document",
    status: "in_progress",
    submittedAt: new Date("2024-12-19T14:15:00"),
    assignedTo: "hr-manager",
    assignedToName: "Alice Dubois",
    priority: "high",
    history: [],
    createdAt: new Date("2024-12-19T14:15:00"),
    updatedAt: new Date("2024-12-20T09:00:00"),
  },
  {
    id: "3",
    employeeId: "3",
    employeeName: "Sophie Leroy",
    employeeNumber: "EMP-003",
    department: "Administration",
    type: "bank_details",
    status: "validated",
    submittedAt: new Date("2024-12-18T11:00:00"),
    processedAt: new Date("2024-12-19T16:30:00"),
    processedBy: "hr-manager",
    processedByName: "Alice Dubois",
    priority: "normal",
    history: [],
    createdAt: new Date("2024-12-18T11:00:00"),
    updatedAt: new Date("2024-12-19T16:30:00"),
  },
  {
    id: "4",
    employeeId: "4",
    employeeName: "Pierre Durand",
    employeeNumber: "EMP-004",
    department: "Sécurité",
    type: "address",
    status: "pending",
    submittedAt: new Date("2024-12-17T09:45:00"),
    priority: "low",
    history: [],
    createdAt: new Date("2024-12-17T09:45:00"),
    updatedAt: new Date("2024-12-17T09:45:00"),
  },
];

const statusLabels: Record<HRRequestStatus, string> = {
  pending: "En attente",
  in_progress: "En cours",
  validated: "Validée",
  refused: "Refusée",
  cancelled: "Annulée",
};

const requestTypeLabels: Record<string, string> = {
  certificate: "Demande d'attestation",
  document: "Demande de document",
  bank_details: "Changement de coordonnées bancaires",
  address: "Changement d'adresse",
  civil_status: "Changement de situation familiale",
};

const requestTypeIcons: Record<string, React.ElementType> = {
  certificate: Award,
  document: FileText,
  bank_details: CreditCard,
  address: MapPin,
  civil_status: Heart,
};

/** Priorité : un point coloré vaut mieux qu'un badge de plus dans la liste. */
const priorityDot: Record<string, string> = {
  low: "bg-muted-foreground/40",
  normal: "bg-sky-500",
  high: "bg-orange-500",
  urgent: "bg-red-600",
};

const priorityLabels: Record<string, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente",
};

/**
 * Dossiers de la boîte de réception. Ils remplacent les tuiles de statistiques
 * de l'ancienne page : le client ne savait pas à quoi correspondaient les
 * chiffres. Ici le compteur est le nombre de demandes du dossier, comme dans
 * une messagerie.
 */
const FOLDERS = [
  { key: "todo", label: "À traiter", icon: Inbox },
  { key: "in_progress", label: "En cours", icon: Loader2 },
  { key: "validated", label: "Validées", icon: CheckCircle },
  { key: "refused", label: "Refusées", icon: XCircle },
  { key: "all", label: "Toutes", icon: FileText },
] as const;

type FolderKey = (typeof FOLDERS)[number]["key"];

function matchesFolder(request: HRRequest, folder: FolderKey): boolean {
  switch (folder) {
    case "todo":
      return request.status === "pending";
    case "in_progress":
      return request.status === "in_progress";
    case "validated":
      return request.status === "validated";
    case "refused":
      return request.status === "refused" || request.status === "cancelled";
    case "all":
      return true;
  }
}

/** Date lisible façon messagerie : heure aujourd'hui, sinon jour court. */
function formatWhen(date: Date, now: number): string {
  const jours = Math.floor((now - date.getTime()) / 86_400_000);
  if (jours <= 0)
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (jours === 1) return "Hier";
  if (jours < 7) return `Il y a ${jours} jours`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Contenu du volet de lecture, partagé entre la colonne de droite et la modale. */
function RequestDetail({
  request,
  onStatusChange,
}: {
  request: HRRequest;
  onStatusChange: (id: string, status: HRRequestStatus) => void;
}) {
  const Icon = requestTypeIcons[request.type];
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials(request.employeeName)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight">
            {requestTypeLabels[request.type]}
          </h2>
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/dashboard/hr/collaborators/${request.employeeId}`}
              className="font-medium text-foreground hover:underline"
            >
              {request.employeeName}
            </Link>{" "}
            · {request.employeeNumber} · {request.department}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline" className="gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {statusLabels[request.status]}
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              priorityDot[request.priority],
            )}
          />
          Priorité {priorityLabels[request.priority].toLowerCase()}
        </Badge>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Reçue le</dt>
          <dd className="font-medium">
            {request.submittedAt.toLocaleDateString("fr-FR")} à{" "}
            {request.submittedAt.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Prise en charge par</dt>
          <dd className="font-medium">
            {request.assignedToName ?? "Personne pour l'instant"}
          </dd>
        </div>
        {request.processedAt && (
          <div>
            <dt className="text-muted-foreground">Traitée le</dt>
            <dd className="font-medium">
              {request.processedAt.toLocaleDateString("fr-FR")}
              {request.processedByName ? ` par ${request.processedByName}` : ""}
            </dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        {request.status === "pending" && (
          <Button
            variant="outline"
            onClick={() => onStatusChange(request.id, "in_progress")}
            className="gap-2"
          >
            <Clock className="h-4 w-4 text-orange-500" />
            Prendre en charge
          </Button>
        )}
        {request.status !== "validated" && (
          <Button
            onClick={() => onStatusChange(request.id, "validated")}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Valider
          </Button>
        )}
        {request.status !== "refused" && (
          <Button
            variant="outline"
            onClick={() => onStatusChange(request.id, "refused")}
            className="gap-2"
          >
            <XCircle className="h-4 w-4 text-red-600" />
            Refuser
          </Button>
        )}
        <Button variant="ghost" asChild className="gap-2">
          <Link href={`/dashboard/hr/collaborators/${request.employeeId}`}>
            <UserRound className="h-4 w-4 text-green-600" />
            Dossier salarié
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function HRInboxPage() {
  const [requests, setRequests] = useState<HRRequest[]>(mockRequests);
  const [folder, setFolder] = useState<FolderKey>("todo");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const now = useMemo(() => new Date().getTime(), []);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FOLDERS.map((f) => [
          f.key,
          requests.filter((r) => matchesFolder(r, f.key)).length,
        ]),
      ) as Record<FolderKey, number>,
    [requests],
  );

  const visible = useMemo(() => {
    const terme = search.trim().toLowerCase();
    return requests
      .filter((r) => matchesFolder(r, folder))
      .filter((r) =>
        terme
          ? `${r.employeeName} ${r.employeeNumber} ${r.department} ${
              requestTypeLabels[r.type]
            }`
              .toLowerCase()
              .includes(terme)
          : true,
      )
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }, [requests, folder, search]);

  const selected = visible.find((r) => r.id === selectedId) ?? null;

  const handleStatusChange = (id: string, status: HRRequestStatus) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              assignedToName:
                status === "in_progress"
                  ? (r.assignedToName ?? "Vous")
                  : r.assignedToName,
              processedAt:
                status === "validated" || status === "refused"
                  ? new Date()
                  : r.processedAt,
              updatedAt: new Date(),
            }
          : r,
      ),
    );
    setMobileOpen(false);
  };

  const openRequest = (request: HRRequest) => {
    setSelectedId(request.id);
    setMobileOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Boîte de réception RH</h1>
          <p className="text-muted-foreground">
            Les demandes de vos salariés, comme des messages : à traiter, en
            cours, puis classées.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => alert("Export PDF des demandes RH en cours...")}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/hr/hr-services/automation">
              <Settings className="mr-2 h-4 w-4" />
              Automatisation
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-[210px_minmax(0,1fr)_380px]">
        {/* Dossiers */}
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {FOLDERS.map((f) => {
            const Icon = f.icon;
            const actif = folder === f.key;
            return (
              <button
                key={f.key}
                onClick={() => {
                  setFolder(f.key);
                  setSelectedId(null);
                }}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors lg:w-full",
                  actif
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{f.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    actif ? "bg-primary-foreground/20" : "bg-muted",
                  )}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Liste des demandes */}
        <Card className="overflow-hidden py-0">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un salarié, un service, un type de demande…"
                className="pl-8"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <Inbox className="h-8 w-8" />
              <p className="text-sm">
                Aucune demande dans ce dossier
                {search ? " pour cette recherche" : ""}.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {visible.map((r) => {
                const Icon = requestTypeIcons[r.type];
                const aTraiter = r.status === "pending";
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => openRequest(r)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                        selectedId === r.id && "bg-accent",
                      )}
                    >
                      {/* Pastille de priorité, comme la pastille "non lu" */}
                      <span
                        className={cn(
                          "mt-2 h-2 w-2 shrink-0 rounded-full",
                          aTraiter
                            ? priorityDot[r.priority]
                            : "bg-transparent border border-muted-foreground/30",
                        )}
                        title={`Priorité ${priorityLabels[r.priority].toLowerCase()}`}
                      />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {initials(r.employeeName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span
                            className={cn(
                              "truncate",
                              aTraiter ? "font-semibold" : "font-medium",
                            )}
                          >
                            {r.employeeName}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatWhen(r.submittedAt, now)}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {requestTypeLabels[r.type]}
                          </span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{r.department}</span>
                          {r.assignedToName && (
                            <span>· suivi par {r.assignedToName}</span>
                          )}
                          {!aTraiter && (
                            <Badge variant="outline" className="text-[10px]">
                              {statusLabels[r.status]}
                            </Badge>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Volet de lecture (grand écran) */}
        <Card className="hidden xl:block">
          <CardContent className="pt-6">
            {selected ? (
              <RequestDetail
                request={selected}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <Inbox className="h-8 w-8" />
                <p className="text-sm">
                  Sélectionnez une demande pour en voir le détail.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volet de lecture (petits écrans) */}
      <div className="xl:hidden">
        <Modal
          open={mobileOpen && !!selected}
          onOpenChange={(open) => !open && setMobileOpen(false)}
          type="details"
          size="md"
          title="Détail de la demande"
          icon={null}
          actions={{
            primary: { label: "Fermer", onClick: () => setMobileOpen(false) },
          }}
        >
          {selected ? (
            <RequestDetail
              request={selected}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Aucune demande.</p>
          )}
        </Modal>
      </div>
    </div>
  );
}
