"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { CalendarClock, CheckCircle, Send } from "lucide-react";
import { useClients } from "@/hooks/clients";
import { useSites } from "@/hooks/sites";
import {
  useInvoices,
  useGenerateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
} from "@/hooks/billing";
import type { Invoice, InvoiceStatus } from "@safyr/api-client";

const LIBELLE_STATUT: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  cancelled: "Annulée",
};

const VARIANTE_STATUT: Record<
  InvoiceStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  sent: "secondary",
  paid: "default",
  cancelled: "destructive",
};

function euros(montant: number): string {
  return `${montant.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

function jour(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/** Premier et dernier jour du mois précédent, au format AAAA-MM-JJ. */
function moisPrecedent(): { debut: string; fin: string } {
  const maintenant = new Date();
  const debut = new Date(
    maintenant.getFullYear(),
    maintenant.getMonth() - 1,
    1,
  );
  const fin = new Date(maintenant.getFullYear(), maintenant.getMonth(), 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  return { debut: iso(debut), fin: iso(fin) };
}

export default function BillingInvoicesPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: fichesClients = [] } = useClients();
  const { data: sites = [] } = useSites();

  // Le client à facturer est celui porté par les sites : on propose donc les
  // fiches clients et les noms saisis sur les sites, pour ne rien manquer.
  const clients = useMemo(() => {
    const noms = new Set<string>();
    for (const fiche of fichesClients) noms.add(fiche.name);
    for (const site of sites) if (site.clientName) noms.add(site.clientName);
    return [...noms].sort((a, b) => a.localeCompare(b, "fr"));
  }, [fichesClients, sites]);
  const generer = useGenerateInvoice();
  const modifier = useUpdateInvoice();
  const supprimer = useDeleteInvoice();

  const [generationOuverte, setGenerationOuverte] = useState(false);
  const [detailOuvert, setDetailOuvert] = useState(false);
  const [facture, setFacture] = useState<Invoice | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const periode = moisPrecedent();
  const [clientName, setClientName] = useState("");
  const [periodStart, setPeriodStart] = useState(periode.debut);
  const [periodEnd, setPeriodEnd] = useState(periode.fin);
  const [hourlyRate, setHourlyRate] = useState("22");
  const [vatRate, setVatRate] = useState("20");

  const columns: ColumnDef<Invoice>[] = [
    { key: "invoiceNumber", label: "N° Facture", sortable: true },
    { key: "clientName", label: "Client", sortable: true },
    {
      key: "periodStart",
      label: "Période",
      render: (f) => (
        <span className="text-sm">
          {jour(f.periodStart)} – {jour(f.periodEnd)}
        </span>
      ),
    },
    {
      key: "planningHours",
      label: "Heures planning",
      render: (f) => <span className="text-sm">{f.planningHours} h</span>,
    },
    {
      key: "total",
      label: "Montant TTC",
      render: (f) => <span className="font-semibold">{euros(f.total)}</span>,
    },
    {
      key: "status",
      label: "Statut",
      render: (f) => (
        <Badge variant={VARIANTE_STATUT[f.status]}>
          {LIBELLE_STATUT[f.status]}
        </Badge>
      ),
    },
  ];

  const lancerGeneration = async () => {
    setErreur(null);
    if (!clientName) {
      setErreur("Sélectionnez un client.");
      return;
    }
    try {
      const creee = await generer.mutateAsync({
        clientName,
        periodStart,
        periodEnd,
        hourlyRate: Number(hourlyRate) || 0,
        vatRate: Number(vatRate) || 0,
      });
      setGenerationOuverte(false);
      setFacture(creee);
      setDetailOuvert(true);
    } catch (e) {
      setErreur(
        e instanceof Error
          ? e.message
          : "La génération a échoué. Vérifiez la période et le planning du client.",
      );
    }
  };

  const changerStatut = (f: Invoice, status: InvoiceStatus) => {
    modifier.mutate({
      invoiceId: f.id,
      payload:
        status === "paid"
          ? { status, paidAt: new Date().toISOString() }
          : { status },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Factures</h1>
          <p className="text-muted-foreground">
            Factures générées à partir des vacations réellement planifiées.
          </p>
        </div>
        <Button onClick={() => setGenerationOuverte(true)}>
          <CalendarClock className="h-4 w-4 mr-2" />
          Générer depuis le planning
        </Button>
      </div>

      <DataTable
        data={invoices}
        columns={columns}
        searchKey="invoiceNumber"
        searchPlaceholder="Rechercher une facture..."
        onRowClick={(f) => {
          setFacture(f);
          setDetailOuvert(true);
        }}
        isLoading={isLoading}
        actions={(f) => (
          <RowActionsMenu
            onView={() => {
              setFacture(f);
              setDetailOuvert(true);
            }}
            onDelete={() => supprimer.mutate(f.id)}
            extraItems={[
              ...(f.status === "draft"
                ? [
                    {
                      label: "Marquer comme envoyée",
                      icon: Send,
                      tone: "send" as const,
                      onClick: () => changerStatut(f, "sent"),
                    },
                  ]
                : []),
              ...(f.status !== "paid" && f.status !== "cancelled"
                ? [
                    {
                      label: "Marquer comme payée",
                      icon: CheckCircle,
                      tone: "validate" as const,
                      onClick: () => changerStatut(f, "paid"),
                    },
                  ]
                : []),
            ]}
          />
        )}
      />

      <Modal
        open={generationOuverte}
        onOpenChange={setGenerationOuverte}
        type="form"
        title="Générer une facture depuis le planning"
        size="lg"
        actions={{
          primary: {
            label: generer.isPending ? "Génération…" : "Générer",
            onClick: lancerGeneration,
            disabled: generer.isPending,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setGenerationOuverte(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Les heures sont calculées à partir des vacations affectées aux
            postes des sites du client sur la période. Au-delà de 35 h par
            semaine, les heures sont facturées en majoration de 25 %.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="client">Client</Label>
              <Select value={clientName} onValueChange={setClientName}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((nom) => (
                    <SelectItem key={nom} value={nom}>
                      {nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clients.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Aucun client enregistré — créez-en un dans Entreprise ›
                  Clients, puis renseignez-le sur la fiche du site.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="debut">Début de période</Label>
              <Input
                id="debut"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fin">Fin de période</Label>
              <Input
                id="fin"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="taux">Taux horaire (€ HT)</Label>
              <Input
                id="taux"
                type="number"
                min="0"
                step="0.5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tva">TVA (%)</Label>
              <Input
                id="tva"
                type="number"
                min="0"
                step="0.1"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
              />
            </div>
          </div>

          {erreur && <p className="text-sm text-red-500">{erreur}</p>}
        </div>
      </Modal>

      <Modal
        open={detailOuvert}
        onOpenChange={setDetailOuvert}
        type="form"
        title={facture ? `Facture ${facture.invoiceNumber}` : "Facture"}
        size="lg"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setDetailOuvert(false),
            variant: "outline",
          },
        }}
      >
        {facture && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-medium">{facture.clientName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Période</p>
                <p className="font-medium">
                  {jour(facture.periodStart)} – {jour(facture.periodEnd)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Heures planifiées</p>
                <p className="font-medium">
                  {facture.planningHours} h ({facture.normalHours} h normales,{" "}
                  {facture.overtimeHours} h majorées)
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Statut</p>
                <Badge variant={VARIANTE_STATUT[facture.status]}>
                  {LIBELLE_STATUT[facture.status]}
                </Badge>
              </div>
            </div>

            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left font-medium">Désignation</th>
                    <th className="p-2 text-right font-medium">Quantité</th>
                    <th className="p-2 text-right font-medium">P.U. HT</th>
                    <th className="p-2 text-right font-medium">Montant HT</th>
                  </tr>
                </thead>
                <tbody>
                  {facture.lines.map((ligne) => (
                    <tr key={ligne.id} className="border-t">
                      <td className="p-2">{ligne.label}</td>
                      <td className="p-2 text-right">{ligne.quantity} h</td>
                      <td className="p-2 text-right">
                        {euros(ligne.unitPrice)}
                      </td>
                      <td className="p-2 text-right">{euros(ligne.amount)}</td>
                    </tr>
                  ))}
                  {facture.lines.length === 0 && (
                    <tr className="border-t">
                      <td
                        className="p-3 text-center text-muted-foreground"
                        colSpan={4}
                      >
                        Aucune ligne sur cette facture.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span>{euros(facture.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  TVA {facture.vatRate} %
                </span>
                <span>{euros(facture.vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span>Total TTC</span>
                <span>{euros(facture.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
