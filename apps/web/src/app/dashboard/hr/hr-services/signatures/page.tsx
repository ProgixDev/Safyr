"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  FileText,
  Scale,
  Package,
  CheckSquare,
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  PenTool,
  Search,
  Send,
  Eye,
  Signature,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  SignatureWorkflow,
  SignatureStatus,
  SignatureParticipant,
} from "@/lib/types";

const mockSignatureWorkflows: SignatureWorkflow[] = [];

const statusLabels: Record<SignatureStatus, string> = {
  pending: "À envoyer",
  sent: "En attente de signature",
  signed: "Signé",
  refused: "Refusé",
  expired: "Expiré",
  cancelled: "Annulé",
};

const typeLabels: Record<string, string> = {
  contract: "Contrat",
  disciplinary_sanction: "Sanction disciplinaire",
  equipment_delivery: "Remise d'équipement",
  equipment_return: "Restitution d'équipement",
  acknowledgment: "Accusé de réception",
  hr_validation: "Validation RH",
};

const typeIcons: Record<string, React.ElementType> = {
  contract: FileText,
  disciplinary_sanction: Scale,
  equipment_delivery: Package,
  equipment_return: Package,
  acknowledgment: CheckSquare,
  hr_validation: FileCheck,
};

/**
 * Dossiers du parapheur. Comme pour la boîte de réception, ils remplacent les
 * huit tuiles de statistiques : le seul chiffre affiché est le nombre de
 * documents du dossier, ce qui se comprend sans explication.
 */
const FOLDERS = [
  { key: "to_send", label: "À envoyer", icon: Send },
  { key: "waiting", label: "En attente", icon: Clock },
  { key: "signed", label: "Signés", icon: CheckCircle },
  { key: "problem", label: "Refusés / expirés", icon: XCircle },
  { key: "all", label: "Tous", icon: FileText },
] as const;

type FolderKey = (typeof FOLDERS)[number]["key"];

function matchesFolder(w: SignatureWorkflow, folder: FolderKey): boolean {
  switch (folder) {
    case "to_send":
      return w.status === "pending";
    case "waiting":
      return w.status === "sent";
    case "signed":
      return w.status === "signed";
    case "problem":
      return (
        w.status === "refused" ||
        w.status === "expired" ||
        w.status === "cancelled"
      );
    case "all":
      return true;
  }
}

function signedCount(w: SignatureWorkflow) {
  return w.participants.filter((p) => p.status === "signed").length;
}

/** Jours restants avant expiration, null si pas de date limite. */
function daysLeft(date: Date | undefined, now: number): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - now) / 86_400_000);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ParticipantRow({ p }: { p: SignatureParticipant }) {
  const signe = p.status === "signed";
  return (
    <li className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          signe
            ? "bg-green-500/15 text-green-700 dark:text-green-400"
            : "bg-muted text-muted-foreground",
        )}
      >
        {initials(p.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{p.name}</p>
        <p className="truncate text-xs text-muted-foreground">{p.email}</p>
      </div>
      <div className="shrink-0 text-right">
        {signe ? (
          <>
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="h-3.5 w-3.5" />
              Signé
            </span>
            {p.signedAt && (
              <span className="text-xs text-muted-foreground">
                {p.signedAt.toLocaleDateString("fr-FR")}
              </span>
            )}
          </>
        ) : (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            En attente
          </span>
        )}
      </div>
    </li>
  );
}

/** Volet de lecture, partagé entre la colonne de droite et la modale. */
function WorkflowDetail({
  workflow,
  now,
  onSend,
  onCancel,
}: {
  workflow: SignatureWorkflow;
  now: number;
  onSend: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const Icon = typeIcons[workflow.type];
  const signes = signedCount(workflow);
  const total = workflow.participants.length;
  const restant = daysLeft(workflow.expiresAt, now);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight">
            {workflow.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {typeLabels[workflow.type]}
            {workflow.employeeName ? ` · ${workflow.employeeName}` : ""}
          </p>
        </div>
      </div>

      {/* Avancement : la phrase remplace le ratio brut « 1 / 2 » */}
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {signes === total
              ? "Toutes les signatures sont recueillies"
              : `${signes} signature${signes > 1 ? "s" : ""} sur ${total}`}
          </span>
          <Badge variant="outline">{statusLabels[workflow.status]}</Badge>
        </div>
        <Progress
          value={total > 0 ? (signes / total) * 100 : 0}
          className="mt-2 h-2"
        />
        {restant !== null && workflow.status !== "signed" && (
          <p
            className={cn(
              "mt-2 text-xs",
              restant <= 2 ? "text-red-600" : "text-muted-foreground",
            )}
          >
            {restant > 0
              ? `Expire dans ${restant} jour${restant > 1 ? "s" : ""}`
              : "Délai de signature dépassé"}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Signataires</h3>
        <ul className="space-y-2">
          {workflow.participants.map((p) => (
            <ParticipantRow key={p.id} p={p} />
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Documents</h3>
        <ul className="space-y-2">
          {workflow.documents.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{d.name}</span>
              </span>
              <span className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Eye className="h-4 w-4 text-green-600" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Download className="h-4 w-4 text-violet-500" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
        {workflow.requiresEidas && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <PenTool className="h-3.5 w-3.5" />
            Signature électronique qualifiée (eIDAS) requise
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        {workflow.status === "pending" && (
          <Button onClick={() => onSend(workflow.id)} className="gap-2">
            <Send className="h-4 w-4" />
            Envoyer à la signature
          </Button>
        )}
        {workflow.status === "sent" && (
          <Button
            variant="outline"
            onClick={() => onSend(workflow.id)}
            className="gap-2"
          >
            <Send className="h-4 w-4 text-sky-500" />
            Relancer les signataires
          </Button>
        )}
        {workflow.status !== "signed" && workflow.status !== "cancelled" && (
          <Button
            variant="outline"
            onClick={() => onCancel(workflow.id)}
            className="gap-2"
          >
            <XCircle className="h-4 w-4 text-red-600" />
            Annuler la demande
          </Button>
        )}
        {workflow.employeeId && (
          <Button variant="ghost" asChild className="gap-2">
            <Link href={`/dashboard/hr/collaborators/${workflow.employeeId}`}>
              <UserRound className="h-4 w-4 text-green-600" />
              Dossier salarié
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SignaturesPage() {
  const [workflows, setWorkflows] = useState<SignatureWorkflow[]>(
    mockSignatureWorkflows,
  );
  const [folder, setFolder] = useState<FolderKey>("waiting");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const now = useMemo(() => new Date().getTime(), []);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FOLDERS.map((f) => [
          f.key,
          workflows.filter((w) => matchesFolder(w, f.key)).length,
        ]),
      ) as Record<FolderKey, number>,
    [workflows],
  );

  const visible = useMemo(() => {
    const terme = search.trim().toLowerCase();
    return workflows
      .filter((w) => matchesFolder(w, folder))
      .filter((w) =>
        terme
          ? `${w.title} ${w.employeeName ?? ""} ${typeLabels[w.type]}`
              .toLowerCase()
              .includes(terme)
          : true,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [workflows, folder, search]);

  const selected = visible.find((w) => w.id === selectedId) ?? null;

  const handleSend = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: "sent", sentAt: new Date(), updatedAt: new Date() }
          : w,
      ),
    );
    setMobileOpen(false);
  };

  const handleCancel = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: "cancelled", updatedAt: new Date() } : w,
      ),
    );
    setMobileOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Parapheur électronique</h1>
          <p className="text-muted-foreground">
            Vos documents à faire signer, classés par état d&apos;avancement.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_400px]">
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

        {/* Liste */}
        <Card className="overflow-hidden py-0">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un document, un salarié…"
                className="pl-8"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <Signature className="h-8 w-8" />
              <p className="text-sm">
                Aucun document dans ce dossier
                {search ? " pour cette recherche" : ""}.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {visible.map((w) => {
                const Icon = typeIcons[w.type];
                const signes = signedCount(w);
                const total = w.participants.length;
                const restant = daysLeft(w.expiresAt, now);
                const aTraiter = w.status === "pending" || w.status === "sent";
                return (
                  <li key={w.id}>
                    <button
                      onClick={() => {
                        setSelectedId(w.id);
                        setMobileOpen(true);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                        selectedId === w.id && "bg-accent",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          w.status === "signed"
                            ? "bg-green-500/15 text-green-600"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span
                            className={cn(
                              "truncate",
                              aTraiter ? "font-semibold" : "font-medium",
                            )}
                          >
                            {w.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {w.createdAt.toLocaleDateString("fr-FR")}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {typeLabels[w.type]}
                        </span>
                        {/* Avancement en toutes lettres plutôt qu'un ratio */}
                        <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={cn(
                              "font-medium",
                              signes === total
                                ? "text-green-600"
                                : "text-muted-foreground",
                            )}
                          >
                            {signes === total
                              ? "Signé par tous"
                              : `${signes} signature${signes > 1 ? "s" : ""} sur ${total}`}
                          </span>
                          {w.requiresEidas && (
                            <Badge variant="outline" className="text-[10px]">
                              eIDAS
                            </Badge>
                          )}
                          {restant !== null &&
                            restant <= 3 &&
                            w.status !== "signed" && (
                              <span className="text-red-600">
                                {restant > 0
                                  ? `Expire dans ${restant} j`
                                  : "Délai dépassé"}
                              </span>
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
              <WorkflowDetail
                workflow={selected}
                now={now}
                onSend={handleSend}
                onCancel={handleCancel}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <Signature className="h-8 w-8" />
                <p className="text-sm">
                  Sélectionnez un document pour voir où en sont les signatures.
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
          title="Détail du document"
          icon={null}
          actions={{
            primary: { label: "Fermer", onClick: () => setMobileOpen(false) },
          }}
        >
          {selected ? (
            <WorkflowDetail
              workflow={selected}
              now={now}
              onSend={handleSend}
              onCancel={handleCancel}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Aucun document.</p>
          )}
        </Modal>
      </div>
    </div>
  );
}
