"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { mockBillingServices, computePriceTTC } from "@/data/billing-services";
import { useSubcontractors } from "@/hooks/clients";
import { QuoteLine } from "@/data/billing-quotes";
import { useListePersistante } from "@/hooks/fiscal/use-liste-persistante";

interface PurchaseOrder {
  id: string;
  number: string;
  subcontractorId: string;
  subcontractor: string;
  amount: number;
  status: string;
  date?: string;
  lines?: QuoteLine[];
}

let nextPoLineId = 0;
function createEmptyLine(): QuoteLine {
  return {
    id: `QL-${++nextPoLineId}`,
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

export default function BillingPurchaseOrdersPage() {
  const { data: mockSubcontractors = [] } = useSubcontractors();
  // Enregistré en base : la liste ne vivait que dans le navigateur.
  const [data, setData] = useListePersistante<PurchaseOrder>("bon_commande");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<{
    subcontractorId: string;
    date: string;
    lines: QuoteLine[];
  }>({
    subcontractorId: "",
    date: new Date().toISOString().split("T")[0],
    lines: [createEmptyLine()],
  });

  const columns = [
    {
      key: "number",
      label: "N° Bon de commande",
      sortable: true,
    },
    {
      key: "subcontractor",
      label: "Sous-traitant",
    },
    {
      key: "amount",
      label: "Montant",
    },
    {
      key: "status",
      label: "Statut",
    },
  ];

  const updateLine = (index: number, patch: Partial<QuoteLine>) => {
    const lines = [...(formData.lines || [])];
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

  const addLine = () =>
    setFormData({
      ...formData,
      lines: [...(formData.lines || []), createEmptyLine()],
    });
  const removeLine = (index: number) => {
    const lines = [...(formData.lines || [])];
    if (lines.length <= 1) return;
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
    const subcontractor = mockSubcontractors.find(
      (s) => s.id === formData.subcontractorId,
    );
    const newPO: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      number: `BC-${new Date().getFullYear()}-${String(data.length + 1).padStart(4, "0")}`,
      subcontractorId: formData.subcontractorId,
      subcontractor: subcontractor?.name ?? "",
      amount: totals.total,
      status: "Brouillon",
      date: formData.date,
      lines: formData.lines,
    };
    setData([...data, newPO]);
    setIsCreateOpen(false);
    setFormData({
      subcontractorId: "",
      date: new Date().toISOString().split("T")[0],
      lines: [createEmptyLine()],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Bons de commande</h1>
          <p className="text-muted-foreground">
            Bons de commande pour les sous-traitants
          </p>
        </div>
        <div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau BC
          </Button>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        searchKey="number"
        searchPlaceholder="Rechercher un bon de commande..."
      />

      <Modal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        type="form"
        title="Nouveau bon de commande"
        size="lg"
        actions={{
          primary: { label: "Enregistrer", onClick: handleSave },
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Destinataire (Sous-traitant)</Label>
              <Select
                value={formData.subcontractorId}
                onValueChange={(v) =>
                  setFormData({ ...formData, subcontractorId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un sous-traitant" />
                </SelectTrigger>
                <SelectContent>
                  {mockSubcontractors.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name} {st.siret ? `- ${st.siret}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            {/* Removed client select: recipient is subcontractor (see above) */}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Besoins de service</CardTitle>
                <Button onClick={addLine} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(formData.lines || []).map((line, index) => (
                  <Card key={line.id} className="border-2">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12">
                          <Label>Service prédéfini (optionnel)</Label>
                          <Select
                            onValueChange={(v) => handleServiceSelect(index, v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir un service" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockBillingServices.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name} - {s.priceHT} € HT
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-6">
                          <Label>Description</Label>
                          <Input
                            value={line.description}
                            onChange={(e) =>
                              updateLine(index, { description: e.target.value })
                            }
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

                        <div className="col-span-1">
                          <Label>Total HT</Label>
                          <p className="text-sm font-medium">
                            {(line.amountHT || 0).toFixed(2)} €
                          </p>
                        </div>

                        <div className="col-span-1 text-right">
                          <Button
                            variant="ghost"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sous-total HT</span>
                  <strong>{totals.subtotal.toLocaleString("fr-FR")} €</strong>
                </div>
                <div className="flex justify-between">
                  <span>TVA</span>
                  <strong>{totals.vatAmount.toLocaleString("fr-FR")} €</strong>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total TTC</span>
                  <span>{totals.total.toLocaleString("fr-FR")} €</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Modal>
    </div>
  );
}
