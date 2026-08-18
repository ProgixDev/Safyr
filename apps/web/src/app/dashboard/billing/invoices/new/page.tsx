"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoursInput } from "@/components/ui/hours-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Eye, Plus, Trash2 } from "lucide-react";
import { QuoteLine } from "@/data/billing-quotes";
import { computePriceTTC } from "@/data/billing-services";
import { useBillingClients } from "@/hooks/billing";
import { mockBillingInvoices } from "@/data/billing-invoices";

const round2 = (n: number) => Math.round(n * 100) / 100;

function linesSubtotalHT(lines: QuoteLine[]): number {
  return lines.reduce((s, l) => s + l.qty * l.priceHT, 0);
}

function linesVatAmount(lines: QuoteLine[]): number {
  return lines.reduce((s, l) => s + (l.qty * l.priceHT * l.vatRate) / 100, 0);
}

function computeInvoiceTotals(args: {
  hourlyRate: number;
  normalHours: number;
  lines: QuoteLine[];
  vatRate: number;
}) {
  const hoursHT = args.normalHours * args.hourlyRate;
  const linesHT = linesSubtotalHT(args.lines);
  const subtotal = round2(hoursHT + linesHT);
  // Hours portion uses the invoice-level vatRate; lines carry their own.
  const hoursVat = (hoursHT * args.vatRate) / 100;
  const vatAmount = round2(hoursVat + linesVatAmount(args.lines));
  const total = round2(subtotal + vatAmount);
  return { subtotal, vatAmount, total };
}

let nextInvoiceLineId = 0;
function createEmptyLine(): QuoteLine {
  return {
    id: `QL-${++nextInvoiceLineId}`,
    description: "",
    date: "",
    qty: 1,
    unit: "h",
    priceHT: 0,
    vatRate: 20,
    amountHT: 0,
    amountTTC: 0,
  };
}

export default function NewInvoicePage() {
  const mockBillingClients = useBillingClients();
  const router = useRouter();

  const [formData, setFormData] = useState({
    clientId: "",
    clientName: "",
    period: {
      start: "",
      end: "",
    },
    planningHours: 0,
    realizedHours: 0,
    validatedHours: 0,
    normalHours: 0,
    overtimeHours: 0,
    replacements: 0,
    vatRate: 20,
    subtotal: 0,
    vatAmount: 0,
    total: 0,
    lines: [createEmptyLine()],
  });

  const handleGenerate = () => {
    if (!formData.clientId || !formData.period.start || !formData.period.end) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const client = mockBillingClients.find((c) => c.id === formData.clientId);
    if (!client) return;

    const normalHours =
      formData.normalHours ||
      formData.validatedHours ||
      formData.realizedHours ||
      formData.planningHours;

    const totals = computeInvoiceTotals({
      hourlyRate: client.hourlyRate || 25,
      normalHours,
      lines: formData.lines,
      vatRate: formData.vatRate,
    });

    setFormData({
      ...formData,
      normalHours,
      ...totals,
    });

    alert("Facture générée avec succès");
  };

  const updateLine = (index: number, patch: Partial<QuoteLine>) => {
    const lines = [...((formData.lines as QuoteLine[]) || [])];
    const existing = lines[index];
    if (!existing) return;
    const updated: QuoteLine = { ...existing, ...patch } as QuoteLine;
    const amountHT = Math.round(updated.qty * updated.priceHT * 100) / 100;
    const amountTTC =
      Math.round(computePriceTTC(amountHT, updated.vatRate) * 100) / 100;
    updated.amountHT = amountHT;
    updated.amountTTC = amountTTC;
    lines[index] = updated;
    setFormData({ ...formData, lines });
  };

  const addLine = () => {
    const lines = [
      ...((formData.lines as QuoteLine[]) || []),
      createEmptyLine(),
    ];
    setFormData({ ...formData, lines });
  };

  const removeLine = (index: number) => {
    const lines = [...((formData.lines as QuoteLine[]) || [])];
    if (lines.length <= 1) return;
    lines.splice(index, 1);
    setFormData({ ...formData, lines });
  };

  const handleSave = () => {
    const client = mockBillingClients.find((c) => c.id === formData.clientId);
    const totals = computeInvoiceTotals({
      hourlyRate: client?.hourlyRate || 25,
      normalHours: formData.normalHours,
      lines: formData.lines,
      vatRate: formData.vatRate,
    });
    const newInvoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: `FAC-${new Date().getFullYear()}-${String(mockBillingInvoices.length + 1).padStart(4, "0")}`,
      clientId: formData.clientId,
      clientName: client?.name || formData.clientName,
      period: {
        start: formData.period.start,
        end: formData.period.end,
      },
      status: "Brouillon" as const,
      planningHours: formData.planningHours,
      realizedHours: formData.realizedHours,
      validatedHours: formData.validatedHours,
      normalHours: formData.normalHours,
      overtimeHours: formData.overtimeHours,
      replacements: formData.replacements,
      lines: formData.lines,
      subtotal: totals.subtotal,
      vatRate: formData.vatRate,
      vatAmount: totals.vatAmount,
      total: totals.total,
      previewed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("Nouvelle facture:", newInvoice);
    alert("Facture enregistrée avec succès");
    router.push("/dashboard/billing/invoices");
  };

  const handlePreview = () => {
    alert("Aperçu de la facture (à implémenter)");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/billing/invoices")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nouvelle Facture</h1>
            <p className="text-muted-foreground">
              Création d&apos;une nouvelle facture client
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="clientId">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => {
                    const client = mockBillingClients.find(
                      (c) => c.id === value,
                    );
                    setFormData({
                      ...formData,
                      clientId: value,
                      clientName: client?.name || "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockBillingClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.siret}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="periodStart">Date début période *</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={formData.period.start}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      period: {
                        ...formData.period,
                        start: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="periodEnd">Date fin période *</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={formData.period.end}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      period: {
                        ...formData.period,
                        end: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services (saisie manuelle)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(formData.lines || []).map((line: QuoteLine, index: number) => (
                <div
                  key={line.id}
                  className="grid grid-cols-12 gap-2 items-end"
                >
                  <div className="col-span-4">
                    <Label>Description</Label>
                    <Input
                      value={line.description}
                      onChange={(e) =>
                        updateLine(index, { description: e.target.value })
                      }
                      placeholder="Nom du service"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      value={String(line.qty)}
                      onChange={(e) =>
                        updateLine(index, {
                          qty: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Prix HT</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={String(line.priceHT)}
                      onChange={(e) =>
                        updateLine(index, {
                          priceHT: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>TVA %</Label>
                    <Input
                      type="number"
                      value={String(line.vatRate)}
                      onChange={(e) =>
                        updateLine(index, {
                          vatRate: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-1">
                    <Label>Total HT</Label>
                    <p className="text-sm font-medium">
                      {(line.amountHT || 0).toFixed(2)} €
                    </p>
                  </div>

                  <div className="col-span-1 text-right">
                    <Button variant="ghost" onClick={() => removeLine(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <Button onClick={addLine} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un service
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sources de données</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const dataSources = [
                {
                  key: "planningHours",
                  label: "Planning",
                  value: formData.planningHours,
                  shortLabel: "Heures planifiées",
                  detail:
                    "Données issues du planning prévisionnel du mois sélectionné.",
                  origin: "Module Planning",
                  badge: "Prévisionnel",
                },
                {
                  key: "realizedHours",
                  label: "Géolocalisation / Main courante",
                  value: formData.realizedHours,
                  shortLabel: "Heures réalisées",
                  detail:
                    "Pointages terrain consolidés depuis la géolocalisation et la main courante.",
                  origin: "Modules Géolocalisation et Main Courante",
                  badge: "Terrain",
                },
                {
                  key: "validatedHours",
                  label: "Paie",
                  value: formData.validatedHours,
                  shortLabel: "Heures validées",
                  detail:
                    "Heures contrôlées et validées par l'équipe paie avant facturation.",
                  origin: "Module Paie",
                  badge: "Validé",
                },
              ];

              return (
                <div className="grid gap-4 md:grid-cols-3">
                  {dataSources.map((source) => {
                    const hasValue = (source.value || 0) > 0;

                    return (
                      <div
                        key={source.key}
                        className="rounded-lg border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Label htmlFor={source.key}>
                              {source.shortLabel}
                            </Label>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {source.label}
                            </p>
                          </div>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            {source.badge}
                          </span>
                        </div>

                        <div className="mt-3">
                          <HoursInput
                            value={source.value || 0}
                            onChange={(value) =>
                              setFormData({
                                ...formData,
                                [source.key]: value,
                              })
                            }
                            step={0.5}
                          />
                        </div>

                        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                          <p>{source.detail}</p>
                          <p>
                            <span className="font-medium text-foreground/80">
                              Origine :
                            </span>{" "}
                            {source.origin}
                          </p>
                          <p>
                            <span className="font-medium text-foreground/80">
                              Valeur retenue :
                            </span>{" "}
                            {hasValue ? `${source.value} h` : "Aucune donnée"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Information :</strong> chaque source affiche désormais
                son détail complet, son origine et sa valeur retenue. Les heures
                restent modifiables manuellement si nécessaire.
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleGenerate} variant="secondary">
                Générer les montants
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détails de facturation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="normalHours">Heures normales</Label>
                <HoursInput
                  value={formData.normalHours}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      normalHours: value,
                    })
                  }
                  step={0.5}
                />
              </div>

              <div>
                <Label htmlFor="overtimeHours">Heures supplémentaires</Label>
                <HoursInput
                  value={formData.overtimeHours}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      overtimeHours: value,
                    })
                  }
                  step={0.5}
                />
              </div>

              <div>
                <Label htmlFor="replacements">Remplacements</Label>
                <Input
                  id="replacements"
                  type="number"
                  value={formData.replacements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      replacements: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="vatRate">Taux de TVA (%)</Label>
                <Select
                  value={String(formData.vatRate)}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      vatRate: parseFloat(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="0">0%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Montants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Sous-total HT</span>
                <span className="text-lg font-semibold">
                  {formData.subtotal.toLocaleString("fr-FR")} €
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  TVA ({formData.vatRate}%)
                </span>
                <span className="text-lg font-semibold">
                  {formData.vatAmount.toLocaleString("fr-FR")} €
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">Total TTC</span>
                  <span className="text-2xl font-bold text-primary">
                    {formData.total.toLocaleString("fr-FR")} €
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
