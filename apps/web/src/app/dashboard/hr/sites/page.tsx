"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, MapPin, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { PostFormDialog } from "@/components/sites/PostFormDialog";
import { Modal } from "@/components/ui/modal";
import { useSites, useDeleteSite } from "@/hooks/sites";
import { SiteCreateDialog } from "@/components/sites/SiteCreateDialog";
import type { Site } from "@safyr/api-client";

export default function SitesPage() {
  const router = useRouter();
  const [sitePourPoste, setSitePourPoste] = useState<string | null>(null);
  const { data, isLoading } = useSites();
  const deleteMutation = useDeleteSite();
  const sites = useMemo<Site[]>(() => data ?? [], [data]);

  const [createOpen, setCreateOpen] = useState(false);
  const [toEdit, setToEdit] = useState<Site | null>(null);
  const [toDelete, setToDelete] = useState<Site | null>(null);

  const totalPosts = sites.reduce((acc, s) => acc + s.posts.length, 0);
  const activeSites = sites.filter((s) => s.active).length;
  const withGps = sites.filter(
    (s) => s.latitude != null && s.longitude != null,
  ).length;

  const columns: ColumnDef<Site>[] = [
    {
      key: "name",
      label: "Site",
      sortable: true,
      sortValue: (s) => s.name,
      render: (s) => (
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
              s.active
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div className="font-medium">{s.name}</div>
            {s.clientName && (
              <div className="text-xs text-sky-600 dark:text-sky-400">
                Client&nbsp;: {s.clientName}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "address",
      label: "Adresse",
      render: (s) => (
        <div className="text-sm">
          {s.address && <div>{s.address}</div>}
          <div className="text-muted-foreground">
            {[s.postalCode, s.city, s.country].filter(Boolean).join(" · ") ||
              "—"}
          </div>
        </div>
      ),
    },
    {
      key: "gps",
      label: "GPS",
      render: (s) =>
        s.latitude != null && s.longitude != null ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-violet-600 dark:text-violet-400">
            <MapPin className="h-3.5 w-3.5" />
            {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
            {s.geofenceRadiusMeters && ` · ${s.geofenceRadiusMeters} m`}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "posts",
      label: "Postes",
      render: (s) => (
        <Badge
          variant={s.posts.length > 0 ? "secondary" : "outline"}
          className={
            s.posts.length > 0
              ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
              : undefined
          }
        >
          {s.posts.length}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (s) =>
        s.active ? (
          <Badge variant="default">Actif</Badge>
        ) : (
          <Badge variant="outline">Inactif</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7" />
            Sites &amp; Postes
          </h1>
          <p className="text-muted-foreground">
            Référentiel des sites clients et des postes de garde
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau site
        </Button>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={Building2}
          title="Sites enregistrés"
          value={sites.length}
          subtext={`${activeSites} actifs`}
          color="blue"
        />
        <InfoCard
          icon={Briefcase}
          title="Postes de garde"
          value={totalPosts}
          subtext="toutes catégories"
          color="purple"
        />
        <InfoCard
          icon={MapPin}
          title="Géolocalisés"
          value={withGps}
          subtext="avec coordonnées GPS"
          color="green"
        />
        <InfoCard
          icon={Users}
          title="Clients distincts"
          value={
            new Set(sites.map((s) => s.clientName).filter(Boolean)).size || "—"
          }
          subtext="comptés sur les sites"
          color="gray"
        />
      </InfoCardContainer>

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={sites}
            isLoading={isLoading}
            columns={columns}
            searchKeys={["name", "clientName", "city"]}
            getSearchValue={(s) =>
              `${s.name} ${s.clientName ?? ""} ${s.city ?? ""}`
            }
            searchPlaceholder="Rechercher par site, client, ville…"
            actions={(s) => (
              <RowActionsMenu
                onView={() => router.push(`/dashboard/hr/sites/${s.id}`)}
                onEdit={() => setToEdit(s)}
                onDelete={() => setToDelete(s)}
                extraItems={[
                  {
                    label: "Ajouter un poste",
                    icon: Plus,
                    tone: "validate",
                    onClick: () => setSitePourPoste(s.id),
                  },
                ]}
              />
            )}
            onRowClick={(s) => router.push(`/dashboard/hr/sites/${s.id}`)}
            getRowId={(s) => s.id}
          />
        </CardContent>
      </Card>

      <SiteCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* La création d'un poste n'était accessible qu'après avoir ouvert le
          site : elle se fait maintenant directement depuis la liste. */}
      {sitePourPoste && (
        <PostFormDialog
          open
          onOpenChange={(ouvert) => !ouvert && setSitePourPoste(null)}
          siteId={sitePourPoste}
        />
      )}

      <SiteCreateDialog
        open={!!toEdit}
        existing={toEdit}
        onOpenChange={(o) => !o && setToEdit(null)}
      />

      <Modal
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        type="warning"
        title="Supprimer ce site"
        description="Cette action supprime aussi tous les postes liés."
        closable={false}
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setToDelete(null),
            variant: "outline",
          },
          primary: {
            label: deleteMutation.isPending ? "Suppression..." : "Supprimer",
            variant: "destructive",
            disabled: deleteMutation.isPending,
            onClick: async () => {
              if (!toDelete) return;
              await deleteMutation.mutateAsync(toDelete.id);
              setToDelete(null);
            },
          },
        }}
      >
        {toDelete && (
          <p className="text-sm">
            <span className="font-medium">{toDelete.name}</span>
            {toDelete.clientName && ` — ${toDelete.clientName}`}
            <br />
            <span className="text-muted-foreground">
              {toDelete.posts.length} poste(s) seront supprimés
            </span>
          </p>
        )}
      </Modal>
    </div>
  );
}
