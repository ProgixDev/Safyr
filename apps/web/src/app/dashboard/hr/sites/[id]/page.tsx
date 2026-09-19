"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Plus,
  MapPin,
  Trash2,
  Pencil,
  Eye,
  MoreVertical,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useDeletePost, useSite } from "@/hooks/sites";
import { PostFormDialog } from "@/components/sites/PostFormDialog";
import type { Post } from "@safyr/api-client";
import {
  CLASSES_POSTE,
  couleurCertification,
  couleurPoste,
} from "@/components/sites/post-colors";
import { cn } from "@/lib/utils";

const CERT_LABELS: Record<string, string> = {
  CQP_APS: "CQP/APS",
  CNAPS: "CNAPS",
  SSIAP1: "SSIAP 1",
  SSIAP2: "SSIAP 2",
  SSIAP3: "SSIAP 3",
  SST: "SST",
  VM: "VM",
  H0B0: "H0B0",
  FIRE: "Incendie",
};

/**
 * Teinte des cadres : en style en ligne car `Card` porte déjà ses propres
 * classes de bordure et de fond, qui écrasent celles passées par l'appelant.
 */
const TEINTES_CADRE = {
  emerald: {
    hex: "#10b981",
    pastille: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    titre: "text-emerald-700 dark:text-emerald-300",
  },
  amber: {
    hex: "#f59e0b",
    pastille: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    titre: "text-amber-700 dark:text-amber-300",
  },
  indigo: {
    hex: "#6366f1",
    pastille: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    titre: "text-indigo-700 dark:text-indigo-300",
  },
} as const;

type TeinteCadre = keyof typeof TEINTES_CADRE;

function styleCadre(teinte: TeinteCadre): React.CSSProperties {
  const { hex } = TEINTES_CADRE[teinte];
  return {
    borderColor: `${hex}55`,
    borderTopColor: hex,
    borderTopWidth: 4,
    backgroundImage: `linear-gradient(180deg, ${hex}14, transparent 140px)`,
  };
}

function TitreCadre({
  teinte,
  icone: Icone,
  children,
}: {
  teinte: TeinteCadre;
  icone: React.ElementType;
  children: React.ReactNode;
}) {
  const t = TEINTES_CADRE[teinte];
  return (
    <CardTitle className={cn("flex items-center gap-2 text-lg", t.titre)}>
      <span className={cn("rounded-lg p-1.5", t.pastille)}>
        <Icone className="h-5 w-5" />
      </span>
      {children}
    </CardTitle>
  );
}

export default function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data: site, isLoading } = useSite(id);
  const deletePostMutation = useDeletePost(id);

  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postEditing, setPostEditing] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Chargement du site…</div>;
  }

  if (!site) {
    return (
      <div className="p-6 space-y-2">
        <h1 className="text-2xl font-bold">Site introuvable</h1>
        <Button asChild>
          <Link href="/dashboard/hr/sites">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/hr/sites">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            {site.name}
          </h1>
          <p className="text-muted-foreground">
            {site.clientName ?? "Sans client"} ·{" "}
            {[site.postalCode, site.city, site.country]
              .filter(Boolean)
              .join(" · ") || "Adresse non renseignée"}
          </p>
        </div>
        {site.active ? (
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          >
            Actif
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300"
          >
            Inactif
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card style={styleCadre("emerald")}>
          <CardHeader>
            <TitreCadre teinte="emerald" icone={MapPin}>
              Adresse &amp; géolocalisation
            </TitreCadre>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Adresse" value={site.address ?? "—"} />
            <Row label="Code postal" value={site.postalCode ?? "—"} />
            <Row label="Ville" value={site.city ?? "—"} />
            <Row label="Pays" value={site.country} />
            <Row
              label="GPS"
              value={
                site.latitude != null && site.longitude != null
                  ? `${site.latitude.toFixed(5)}, ${site.longitude.toFixed(5)}`
                  : "—"
              }
            />
            <Row
              label="Rayon géofencé"
              value={
                site.geofenceRadiusMeters
                  ? `${site.geofenceRadiusMeters} m`
                  : "—"
              }
            />
          </CardContent>
        </Card>

        <Card style={styleCadre("amber")}>
          <CardHeader>
            <TitreCadre teinte="amber" icone={StickyNote}>
              Notes
            </TitreCadre>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {site.notes || (
                <span className="text-muted-foreground italic">
                  Aucune note.
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card style={styleCadre("indigo")}>
        <CardHeader className="flex flex-row items-center justify-between">
          <TitreCadre teinte="indigo" icone={Briefcase}>
            Postes ({site.posts.length})
          </TitreCadre>
          <Button
            onClick={() => {
              setPostEditing(null);
              setPostDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau poste
          </Button>
        </CardHeader>
        <CardContent>
          {site.posts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucun poste défini sur ce site.
            </p>
          ) : (
            <div className="space-y-2">
              {site.posts.map((p) => {
                const couleur =
                  CLASSES_POSTE[couleurPoste(p.name, p.requiredCertifications)];
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border border-l-4 p-3",
                      couleur.ligne,
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-semibold", couleur.nom)}>
                          {p.name}
                        </p>
                        {!p.active && <Badge variant="outline">Inactif</Badge>}
                      </div>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.defaultStartTime && p.defaultEndTime && (
                          <Badge
                            variant="secondary"
                            className="border-slate-500/30 bg-slate-500/10 font-mono text-xs text-slate-700 dark:text-slate-300"
                          >
                            {p.defaultStartTime} → {p.defaultEndTime}
                          </Badge>
                        )}
                        {p.requiredCertifications.map((c) => (
                          <Badge
                            key={c}
                            variant="outline"
                            className={cn(
                              "text-xs",
                              CLASSES_POSTE[couleurCertification(c)].pastille,
                            )}
                          >
                            {CERT_LABELS[c] ?? c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setPostEditing(p);
                            setPostDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4 text-green-600" />
                          Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setPostEditing(p);
                            setPostDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4 text-orange-500" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setPostToDelete(p)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <PostFormDialog
        open={postDialogOpen}
        onOpenChange={(o) => {
          setPostDialogOpen(o);
          if (!o) setPostEditing(null);
        }}
        siteId={id}
        existing={postEditing}
      />

      <Modal
        open={!!postToDelete}
        onOpenChange={(o) => !o && setPostToDelete(null)}
        type="warning"
        title="Supprimer ce poste"
        description="Cette action est irréversible."
        closable={false}
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setPostToDelete(null),
            variant: "outline",
          },
          primary: {
            label: deletePostMutation.isPending
              ? "Suppression..."
              : "Supprimer",
            variant: "destructive",
            disabled: deletePostMutation.isPending,
            onClick: async () => {
              if (!postToDelete) return;
              await deletePostMutation.mutateAsync(postToDelete.id);
              setPostToDelete(null);
            },
          },
        }}
      >
        {postToDelete && (
          <p className="text-sm">
            <span className="font-medium">{postToDelete.name}</span>
          </p>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
