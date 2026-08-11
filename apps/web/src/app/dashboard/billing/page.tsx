"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  FilePlus,
  DollarSign,
  Clock,
  CheckCircle,
  Send,
  AlertCircle,
  Receipt,
  FileX,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useClients } from "@/hooks/clients";
import { useSites } from "@/hooks/sites";
import { useInvoices } from "@/hooks/billing";
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

const COULEUR_STATUT: Record<InvoiceStatus, string> = {
  draft: "#f97316",
  sent: "#3b82f6",
  paid: "#22c55e",
  cancelled: "#ef4444",
};

const MOIS_COURTS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

function euros(montant: number): string {
  return `${Math.round(montant).toLocaleString("fr-FR")} €`;
}

/** CA des six derniers mois, calculé sur les factures réellement émises. */
function caParMois(factures: Invoice[]) {
  const reference = new Date();
  const mois: { cle: string; month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    mois.push({
      cle: `${d.getFullYear()}-${d.getMonth()}`,
      month: MOIS_COURTS[d.getMonth()],
      revenue: 0,
    });
  }
  for (const facture of factures) {
    if (facture.status === "cancelled") continue;
    const d = new Date(facture.issuedAt ?? facture.createdAt);
    const cle = `${d.getFullYear()}-${d.getMonth()}`;
    const case_ = mois.find((m) => m.cle === cle);
    if (case_) case_.revenue += facture.total;
  }
  return mois;
}

export default function BillingDashboard() {
  const { data: clients = [] } = useClients();
  const { data: sites = [] } = useSites();
  const { data: factures = [], isLoading } = useInvoices();

  const stats = useMemo(() => {
    const maintenant = new Date();
    const duMois = factures.filter((f) => {
      const d = new Date(f.issuedAt ?? f.createdAt);
      return (
        d.getMonth() === maintenant.getMonth() &&
        d.getFullYear() === maintenant.getFullYear()
      );
    });
    const parStatut = (statut: InvoiceStatus) =>
      factures.filter((f) => f.status === statut);

    return {
      duMois,
      caDuMois: duMois.reduce((s, f) => s + f.total, 0),
      caTotal: factures
        .filter((f) => f.status !== "cancelled")
        .reduce((s, f) => s + f.total, 0),
      encaisse: parStatut("paid").reduce((s, f) => s + f.total, 0),
      aEncaisser: parStatut("sent").reduce((s, f) => s + f.total, 0),
      brouillons: parStatut("draft").length,
      envoyees: parStatut("sent").length,
      payees: parStatut("paid").length,
      heures: factures
        .filter((f) => f.status !== "cancelled")
        .reduce((s, f) => s + f.planningHours, 0),
    };
  }, [factures]);

  const donneesCA = useMemo(() => caParMois(factures), [factures]);

  const repartitionStatuts = useMemo(() => {
    const statuts: InvoiceStatus[] = ["draft", "sent", "paid", "cancelled"];
    return statuts
      .map((s) => ({
        name: LIBELLE_STATUT[s],
        value: factures.filter((f) => f.status === s).length,
        color: COULEUR_STATUT[s],
      }))
      .filter((entree) => entree.value > 0);
  }, [factures]);

  const facturesRecentes = useMemo(
    () =>
      [...factures]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [factures],
  );

  const aucuneFacture = !isLoading && factures.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord Facturation</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de la facturation et des contrats clients
        </p>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={Users}
          title="Clients"
          value={clients.length}
          subtext={`${sites.length} site${sites.length > 1 ? "s" : ""} rattaché${
            sites.length > 1 ? "s" : ""
          }`}
          color="green"
        />

        <InfoCard
          icon={FileText}
          title="Factures ce mois"
          value={stats.duMois.length}
          subtext={`${factures.length} au total`}
          color="blue"
        />

        <InfoCard
          icon={DollarSign}
          title="CA ce mois"
          value={euros(stats.caDuMois)}
          subtext={`${euros(stats.caTotal)} depuis le début`}
          color="orange"
        />

        <InfoCard
          icon={Clock}
          title="Heures facturées"
          value={`${stats.heures} h`}
          subtext="Issues des vacations planifiées"
          color="green"
        />
      </InfoCardContainer>

      <InfoCardContainer>
        <InfoCard
          icon={FileText}
          title="Brouillons"
          value={stats.brouillons}
          subtext="À vérifier puis envoyer"
          color="orange"
        />

        <InfoCard
          icon={Send}
          title="Envoyées"
          value={stats.envoyees}
          subtext={`${euros(stats.aEncaisser)} en attente de règlement`}
          color="blue"
        />

        <InfoCard
          icon={CheckCircle}
          title="Payées"
          value={stats.payees}
          subtext={`${euros(stats.encaisse)} encaissés`}
          color="green"
        />

        <InfoCard
          icon={TrendingUp}
          title="Panier moyen"
          value={
            factures.length > 0
              ? euros(stats.caTotal / Math.max(1, factures.length))
              : "—"
          }
          subtext="Montant TTC moyen par facture"
          color="blue"
        />
      </InfoCardContainer>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chiffre d&apos;affaires des 6 derniers mois</CardTitle>
          </CardHeader>
          <CardContent>
            {aucuneFacture ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Aucune facture émise : le graphique se remplira dès la première
                facture générée.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={donneesCA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) =>
                      `${Number(value || 0).toLocaleString("fr-FR")} €`
                    }
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des factures</CardTitle>
          </CardHeader>
          <CardContent>
            {repartitionStatuts.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Aucune facture à répartir pour le moment.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={repartitionStatuts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {repartitionStatuts.map((entree) => (
                      <Cell key={entree.name} fill={entree.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Factures récentes</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/billing/invoices">Voir tout</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {facturesRecentes.length > 0 ? (
            <div className="space-y-3">
              {facturesRecentes.map((facture) => (
                <Link
                  key={facture.id}
                  href="/dashboard/billing/invoices"
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        {facture.invoiceNumber}
                      </span>
                      <Badge variant={VARIANTE_STATUT[facture.status]}>
                        {LIBELLE_STATUT[facture.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {facture.clientName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{euros(facture.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(facture.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isLoading
                ? "Chargement des factures…"
                : "Aucune facture. Générez-en une depuis le planning."}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/billing/invoices">
                  <FileText className="h-4 w-4 mr-2" />
                  Générer une facture
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/entreprise/clients">
                  <Users className="h-4 w-4 mr-2" />
                  Ajouter un client
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/billing/quotes">
                  <FilePlus className="h-4 w-4 mr-2" />
                  Nouveau devis
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/billing/credits">
                  <FileX className="h-4 w-4 mr-2" />
                  Nouvel avoir
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/billing/purchase-orders">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Bon de commande
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/billing/services">
                  <Receipt className="h-4 w-4 mr-2" />
                  Services
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.brouillons > 0 && (
                <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950 rounded">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">
                    {stats.brouillons} facture
                    {stats.brouillons > 1 ? "s" : ""} en brouillon à envoyer
                  </span>
                </div>
              )}
              {stats.envoyees > 0 && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                  <Send className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    {stats.envoyees} facture{stats.envoyees > 1 ? "s" : ""} en
                    attente de règlement ({euros(stats.aEncaisser)})
                  </span>
                </div>
              )}
              {stats.brouillons === 0 && stats.envoyees === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Aucune alerte
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
