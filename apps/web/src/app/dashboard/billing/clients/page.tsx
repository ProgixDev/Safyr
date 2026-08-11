"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, CalendarClock, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useClients } from "@/hooks/clients";
import { useSites } from "@/hooks/sites";
import { useInvoices } from "@/hooks/billing";
import type { Client } from "@safyr/api-client";

interface LigneClient extends Client {
  nbSites: number;
  nbFactures: number;
  caFacture: number;
  derniereFacture: string | null;
}

function euros(montant: number): string {
  return `${Math.round(montant).toLocaleString("fr-FR")} €`;
}

/**
 * Référentiel de facturation : mêmes clients que « Entreprise › Clients »
 * (une seule fiche client dans toute l'application), enrichis des sites
 * rattachés et de l'historique de facturation.
 */
export default function BillingClientsPage() {
  const router = useRouter();
  const { data: clients = [], isLoading } = useClients();
  const { data: sites = [] } = useSites();
  const { data: factures = [] } = useInvoices();

  const lignes = useMemo<LigneClient[]>(
    () =>
      clients.map((client) => {
        const facturesClient = factures.filter(
          (f) => f.clientName === client.name && f.status !== "cancelled",
        );
        const derniere = facturesClient
          .map((f) => f.issuedAt ?? f.createdAt)
          .sort()
          .at(-1);
        return {
          ...client,
          nbSites: sites.filter((s) => s.clientName === client.name).length,
          nbFactures: facturesClient.length,
          caFacture: facturesClient.reduce((s, f) => s + f.total, 0),
          derniereFacture: derniere ?? null,
        };
      }),
    [clients, sites, factures],
  );

  const columns: ColumnDef<LigneClient>[] = [
    { key: "name", label: "Client", sortable: true },
    {
      key: "siret",
      label: "SIRET",
      render: (c) => (
        <span className="font-mono text-xs">{c.siret || "—"}</span>
      ),
    },
    {
      key: "city",
      label: "Ville",
      render: (c) => c.city || "—",
    },
    {
      key: "nbSites",
      label: "Sites",
      sortable: true,
      render: (c) => (
        <Badge variant={c.nbSites > 0 ? "secondary" : "outline"}>
          {c.nbSites}
        </Badge>
      ),
    },
    {
      key: "nbFactures",
      label: "Factures",
      sortable: true,
      render: (c) => c.nbFactures,
    },
    {
      key: "caFacture",
      label: "CA facturé",
      sortable: true,
      sortValue: (c) => c.caFacture,
      render: (c) => (
        <span className="font-semibold">{euros(c.caFacture)}</span>
      ),
    },
    {
      key: "derniereFacture",
      label: "Dernière facture",
      render: (c) =>
        c.derniereFacture
          ? new Date(c.derniereFacture).toLocaleDateString("fr-FR")
          : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Référentiel Clients</h1>
          <p className="text-muted-foreground">
            Clients facturables, sites rattachés et historique de facturation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/billing/invoices">
              <CalendarClock className="h-4 w-4 mr-2" />
              Générer une facture
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/hr/entreprise/clients">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau client
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 py-4 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            La fiche client est unique dans Safyr : elle se crée et se modifie
            dans{" "}
            <Link
              href="/dashboard/hr/entreprise/clients"
              className="underline underline-offset-2"
            >
              Entreprise › Clients
            </Link>
            . Les heures facturées proviennent des vacations planifiées sur les
            sites du client.
          </p>
        </CardContent>
      </Card>

      <DataTable
        data={lignes}
        columns={columns}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Rechercher un client..."
        onRowClick={(c) =>
          router.push(`/dashboard/hr/entreprise/clients/${c.id}`)
        }
        actions={(c) => (
          <RowActionsMenu
            onView={() =>
              router.push(`/dashboard/hr/entreprise/clients/${c.id}`)
            }
            extraItems={[
              {
                label: "Facturer la période",
                icon: CalendarClock,
                tone: "send",
                onClick: () => router.push("/dashboard/billing/invoices"),
              },
            ]}
          />
        )}
      />
    </div>
  );
}
