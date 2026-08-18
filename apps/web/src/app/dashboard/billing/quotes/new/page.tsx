"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Save, Eye, Plus, Trash2 } from "lucide-react";
import { useBillingClients } from "@/hooks/billing";
import { mockBillingServices, computePriceTTC } from "@/data/billing-services";
import { QuoteLine } from "@/data/billing-quotes";

function createEmptyLine(): QuoteLine {
  const today = new Date().toISOString().split("T")[0];
  return {
    id: `QL-${Date.now()}-${Math.random()}`,
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

export default function NewQuotePage() {
  const mockBillingClients = useBillingClients();
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + 14);
  const validUntil = validUntilDate.toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    clientId: "",
    clientName: "",
    quoteNumber: "",
    date: today,
    validUntil: validUntil,
    message: "",
    lines: [createEmptyLine()],
  });

  const updateLine = (index: number, patch: Partial<QuoteLine>) => {
    const lines = [...formData.lines];
    const existing = lines[index];
    if (!existing) return;
    const updated: QuoteLine = { ...existing, ...patch };
    const amountHT = Math.round(updated.qty * updated.priceHT * 100) / 100;
    const amountTTC =
      Math.round(computePriceTTC(amountHT, updated.vatRate) * 100) / 100;
    updated.amountHT = amountHT;
    updated.amountTTC = amountTTC;
    lines[index] = updated;
    setFormData({ ...formData, lines });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, createEmptyLine()],
    });
  };

  const removeLine = (index: number) => {
    if (formData.lines.length <= 1) return;
    const lines = [...formData.lines];
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
    if (!formData.clientId || !formData.date) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const newQuote = {
      id: `Q-${Date.now()}`,
      quoteNumber: `DEV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      clientId: formData.clientId,
      clientName:
        mockBillingClients.find((c) => c.id === formData.clientId)?.name ||
        formData.clientName,
      date: formData.date,
      validUntil: formData.validUntil,
      message: formData.message,
      lines: formData.lines,
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      total: totals.total,
      status: "Brouillon" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("Nouveau devis:", newQuote);
    alert("Devis enregistré avec succès");
    router.push("/dashboard/billing/quotes");
  };

  const handlePreview = () => {
    alert("Aperçu du devis (à implémenter)");
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/billing/quotes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nouveau Devis</h1>
            <p className="text-muted-foreground">
              Création d&apos;un nouveau devis client
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
                <Label htmlFor="date">Date du devis *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="validUntil">Valide jusqu&apos;au</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validUntil: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="message">Message (optionnel)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      message: e.target.value,
                    })
                  }
                  placeholder="Message ou conditions particulières..."
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lignes du devis</CardTitle>
              <Button onClick={addLine} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.lines.map((line, index) => (
                <Card key={line.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12">
                        <Label>Service prédéfini (optionnel)</Label>
                        <Select
                          onValueChange={(value) =>
                            handleServiceSelect(index, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir un service" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockBillingServices.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} - {service.priceHT} € HT
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-6">
                        <Label>Description *</Label>
                        <Textarea
                          value={line.description}
                          onChange={(e) =>
                            updateLine(index, { description: e.target.value })
                          }
                          placeholder="Description de la prestation..."
                          rows={3}
                        />
                      </div>

                      <div className="col-span-6 grid grid-cols-2 gap-4">
                        <div>
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={line.date}
                            onChange={(e) =>
                              updateLine(index, { date: e.target.value })
                            }
                          />
                        </div>

                        <div>
                          <Label>Quantité *</Label>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={line.qty}
                            onChange={(e) =>
                              updateLine(index, {
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
                              updateLine(index, { unit: value as "h" | "Nbre" })
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
                          <Label>Prix HT (€) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.priceHT}
                            onChange={(e) =>
                              updateLine(index, {
                                priceHT: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>TVA (%)</Label>
                          <Select
                            value={String(line.vatRate)}
                            onValueChange={(value) =>
                              updateLine(index, {
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

                        <div>
                          <Label>Montant TTC (€)</Label>
                          <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-semibold">
                            {line.amountTTC.toLocaleString("fr-FR")}
                          </div>
                        </div>
                      </div>

                      {formData.lines.length > 1 && (
                        <div className="col-span-12 flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer cette ligne
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                  {totals.subtotal.toLocaleString("fr-FR")} €
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">TVA</span>
                <span className="text-lg font-semibold">
                  {totals.vatAmount.toLocaleString("fr-FR")} €
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">Total TTC</span>
                  <span className="text-2xl font-bold text-primary">
                    {totals.total.toLocaleString("fr-FR")} €
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
