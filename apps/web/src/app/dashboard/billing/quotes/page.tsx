"use client";

import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Send } from "lucide-react";
import {
  mockBillingQuotes,
  BillingQuote,
  QuoteLine,
} from "@/data/billing-quotes";
import { useBillingClients } from "@/hooks/billing";
import { mockBillingServices, computePriceTTC } from "@/data/billing-services";
import Link from "next/link";
import { useListePersistante } from "@/hooks/fiscal/use-liste-persistante";

function formatCurrency(value: number) {
  return `${(Math.round(value * 100) / 100).toLocaleString("fr-FR")} €`;
}

function generateQuoteNumber(index: number) {
  const year = new Date().getFullYear();
  return `DEV-${year}-${String(index).padStart(3, "0")}`;
}

function createEmptyLine(): QuoteLine {
  const today = new Date().toISOString().split("T")[0];
  return {
    id: `QL-${Date.now()}`,
    description: "",
    date: today,
    qty: 1,
    unit: "h",
    priceHT: 0,
    vatRate: 20,
    amountHT: 0,
    amountTTC: 0,
  };
}

type QuoteFormData = Partial<BillingQuote> & { quoteType?: string };

export default function BillingQuotesPage() {
  const mockBillingClients = useBillingClients();
  // Enregistré en base : la liste ne vivait que dans le navigateur.
  const [quotes, setQuotes] = useListePersistante<BillingQuote>("devis");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<BillingQuote | null>(null);
  const [formData, setFormData] = useState<QuoteFormData>({});

  const columns: ColumnDef<BillingQuote>[] = [
    { key: "quoteNumber", label: "N° Devis", sortable: true },
    { key: "clientName", label: "Client", sortable: true },
    {
      key: "date",
      label: "Date",
      render: (q) => new Date(q.date).toLocaleDateString("fr-FR"),
    },
    {
      key: "validUntil",
      label: "Validité",
      render: (q) => new Date(q.validUntil).toLocaleDateString("fr-FR"),
    },
    {
      key: "total",
      label: "Montant TTC",
      render: (q) => (
        <span className="font-semibold">{formatCurrency(q.total)}</span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (q) => {
        const variants: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          Brouillon: "outline",
          Envoyé: "secondary",
          Accepté: "default",
          Refusé: "destructive",
        };
        return (
          <Badge variant={variants[q.status] || "outline"}>{q.status}</Badge>
        );
      },
    },
  ];

  const updateLine = (index: number, patch: Partial<QuoteLine>) => {
    const lines = [...(formData.lines || [])];
    const existing = lines[index];
    if (!existing) return;
    const updated: QuoteLine = { ...existing, ...patch };
    // Recompute amounts
    const amountHT = Math.round(updated.qty * updated.priceHT * 100) / 100;
    const amountTTC =
      Math.round(computePriceTTC(amountHT, updated.vatRate) * 100) / 100;
    updated.amountHT = amountHT;
    updated.amountTTC = amountTTC;
    lines[index] = updated;
    setFormData({ ...formData, lines });
  };

  const addLine = () => {
    const lines = [...(formData.lines || []), createEmptyLine()];
    setFormData({ ...formData, lines });
  };

  const removeLine = (index: number) => {
    const lines = [...(formData.lines || [])];
    lines.splice(index, 1);
    setFormData({ ...formData, lines });
  };

  const handleServiceSelect = (index: number, serviceId: string) => {
    const service = mockBillingServices.find((s) => s.id === serviceId);
    if (!service) return;
    updateLine(index, {
      description: service.name,
      priceHT: service.priceHT,
      vatRate: service.vatRate,
      unit: service.unit,
    });
  };

  const totals = useMemo(() => {
    const lines = formData.lines || [];
    const subtotal = lines.reduce((s, l) => s + (l.qty * l.priceHT || 0), 0);
    const roundedSubtotal = Math.round(subtotal * 100) / 100;
    const vatAmount = lines.reduce(
      (s, l) => s + ((l.qty * l.priceHT * l.vatRate) / 100 || 0),
      0,
    );
    const roundedVat = Math.round(vatAmount * 100) / 100;
    const total = Math.round((roundedSubtotal + roundedVat) * 100) / 100;
    return { subtotal: roundedSubtotal, vatAmount: roundedVat, total };
  }, [formData.lines]);

  const handleSave = () => {
    const lines = formData.lines || [];
    const computed = totals;
    const now = new Date().toISOString();
    if (formData.id) {
      setQuotes(
        quotes.map((q) =>
          q.id === formData.id
            ? ({
                ...q,
                ...formData,
                lines: lines as QuoteLine[],
                subtotal: computed.subtotal,
                vatAmount: computed.vatAmount,
                total: computed.total,
                updatedAt: now,
              } as BillingQuote)
            : q,
        ),
      );
    } else {
      const newQuote: BillingQuote = {
        id: `Q-${Date.now()}`,
        quoteNumber: generateQuoteNumber(quotes.length + 1),
        clientId: formData.clientId || "",
        clientName:
          mockBillingClients.find((c) => c.id === formData.clientId)?.name ||
          formData.clientName ||
          "",
        date: formData.date || new Date().toISOString().split("T")[0],
        validUntil:
          formData.validUntil || new Date().toISOString().split("T")[0],
        message: formData.message || "",
        lines: lines as QuoteLine[],
        subtotal: computed.subtotal,
        vatAmount: computed.vatAmount,
        total: computed.total,
        status: (formData.status as BillingQuote["status"]) || "Brouillon",
        createdAt: now,
        updatedAt: now,
      };
      setQuotes([...quotes, newQuote]);
    }
    setIsCreateModalOpen(false);
    setFormData({});
  };

  const handleRowClick = (quote: BillingQuote) => {
    setSelectedQuote(quote);
    setIsViewModalOpen(true);
  };

  const handleSend = (quote: BillingQuote) => {
    setQuotes(
      quotes.map((q) =>
        q.id === quote.id
          ? { ...q, status: "Envoyé", updatedAt: new Date().toISOString() }
          : q,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devis</h1>
          <p className="text-muted-foreground">
            Création et gestion des devis (propositions commerciales)
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/billing/quotes/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau devis
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        data={quotes}
        columns={columns}
        searchKey="quoteNumber"
        searchPlaceholder="Rechercher un devis..."
        onRowClick={handleRowClick}
        actions={(q) => (
          <RowActionsMenu
            onView={() => {
              setSelectedQuote(q);
              setIsViewModalOpen(true);
            }}
            extraItems={
              q.status === "Brouillon"
                ? [
                    {
                      label: "Envoyer le devis",
                      icon: Send,
                      tone: "send" as const,
                      onClick: () => handleSend(q),
                    },
                  ]
                : []
            }
          />
        )}
      />

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={formData.id ? "Modifier le devis" : "Nouveau devis"}
        size="lg"
        actions={{
          primary: {
            label: formData.id ? "Modifier" : "Créer",
            onClick: handleSave,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Type de devis</Label>
              <Select
                value={formData.quoteType || "base"}
                onValueChange={(value) =>
                  setFormData({ ...formData, quoteType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">
                    Devis de base — Forfait mensuel par type de poste
                  </SelectItem>
                  <SelectItem value="complet">
                    Devis complet — Base + majorations nuit / dimanche / fériés
                  </SelectItem>
                  <SelectItem value="detaille">
                    Devis détaillé — Liste jour par jour sur la période
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {(formData.quoteType || "base") === "base" &&
                  "Une ligne par type de poste (ADS, SSIAP…) avec un forfait mensuel."}
                {formData.quoteType === "complet" &&
                  "Forfait de base + détail des majorations (nuit, dimanche, jours fériés) par poste."}
                {formData.quoteType === "detaille" &&
                  "Listing complet jour par jour de tous les shifts sur la période du devis."}
              </p>
            </div>

            <div className="col-span-2">
              <Label>Client</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => {
                  const client = mockBillingClients.find((c) => c.id === value);
                  setFormData({
                    ...formData,
                    clientId: value,
                    clientName: client?.name,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner ou créer un client" />
                </SelectTrigger>
                <SelectContent>
                  {mockBillingClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Numéro de devis</Label>
              <Input
                value={formData.quoteNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, quoteNumber: e.target.value })
                }
                placeholder={generateQuoteNumber(quotes.length + 1)}
              />
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date || new Date().toISOString().split("T")[0]}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Date de validité</Label>
              <Input
                type="date"
                value={
                  formData.validUntil || new Date().toISOString().split("T")[0]
                }
                onChange={(e) =>
                  setFormData({ ...formData, validUntil: e.target.value })
                }
              />
            </div>

            <div className="col-span-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Message au client (optionnel)"
                value={formData.message || ""}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="col-span-2 border-t pt-4">
              <Label className="text-base font-semibold mb-2 block">
                Lignes
              </Label>

              {(formData.lines || []).map((line, idx) => (
                <div
                  key={line.id}
                  className="grid grid-cols-12 gap-2 items-end mb-2"
                >
                  <div className="col-span-5">
                    <Label>Descr./Service</Label>
                    <Input
                      value={line.description}
                      onChange={(e) =>
                        updateLine(idx, { description: e.target.value })
                      }
                      placeholder="Entrez une description ou choisissez un service"
                    />
                    <Select
                      value={line.serviceId}
                      onValueChange={(value) => handleServiceSelect(idx, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un service..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mockBillingServices.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} • {s.unit} •{" "}
                            {s.priceHT.toLocaleString("fr-FR")} €
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={line.date}
                      onChange={(e) =>
                        updateLine(idx, { date: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Qté</Label>
                    <Input
                      type="number"
                      value={String(line.qty)}
                      onChange={(e) =>
                        updateLine(idx, {
                          qty: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Unité</Label>
                    <Select
                      value={line.unit}
                      onValueChange={(value) =>
                        updateLine(idx, { unit: value as "h" | "Nbre" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h">h</SelectItem>
                        <SelectItem value="Nbre">Nbre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Prix HT</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={String(line.priceHT)}
                      onChange={(e) =>
                        updateLine(idx, {
                          priceHT: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>TVA</Label>
                    <Select
                      value={String(line.vatRate)}
                      onValueChange={(value) =>
                        updateLine(idx, { vatRate: parseFloat(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20 %</SelectItem>
                        <SelectItem value="10">10 %</SelectItem>
                        <SelectItem value="5.5">5.5 %</SelectItem>
                        <SelectItem value="0">0 %</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-1">
                    <Label>Montant</Label>
                    <div className="text-sm font-medium">
                      {formatCurrency(line.amountTTC)}
                    </div>
                    <div className="mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeLine(idx)}
                      >
                        Suppr.
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-2">
                <Button onClick={addLine}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </div>
            </div>

            <div className="col-span-2 flex justify-end gap-6">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Total HT</span>
                  <span className="font-medium">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>TVA</span>
                  <span className="font-medium">
                    {formatCurrency(totals.vatAmount)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total TTC</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails du devis"
        size="lg"
        actions={{
          primary: {
            label: "Envoyer",
            onClick: () => {
              if (selectedQuote) handleSend(selectedQuote);
              setIsViewModalOpen(false);
            },
          },
          secondary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {selectedQuote && (
          <div className="space-y-4">
            <div className="border rounded-lg p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">DEVIS</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedQuote.quoteNumber}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Client</h3>
                  <p className="text-sm">{selectedQuote.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    <strong>Date:</strong>{" "}
                    {new Date(selectedQuote.date).toLocaleDateString("fr-FR")}
                  </p>
                  <p className="text-sm">
                    <strong>Validité:</strong>{" "}
                    {new Date(selectedQuote.validUntil).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Qté</th>
                      <th className="text-right py-2">Unité</th>
                      <th className="text-right py-2">Prix unitaire HT</th>
                      <th className="text-right py-2">Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuote.lines.map((line) => (
                      <tr key={line.id}>
                        <td className="py-2">{line.description}</td>
                        <td className="text-right py-2">{line.qty}</td>
                        <td className="text-right py-2">{line.unit}</td>
                        <td className="text-right py-2">
                          {formatCurrency(line.priceHT)}
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(line.amountHT)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Total HT:</span>
                      <span>{formatCurrency(selectedQuote.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA:</span>
                      <span>{formatCurrency(selectedQuote.vatAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total TTC:</span>
                      <span>{formatCurrency(selectedQuote.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedQuote.message && (
                <div className="mt-4">
                  <Label>Message</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedQuote.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
