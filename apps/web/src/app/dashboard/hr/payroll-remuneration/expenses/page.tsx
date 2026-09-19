"use client";

import { useState } from "react";
import { useEmployeeOptions } from "@/hooks/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Plus,
  CheckCircle,
  XCircle,
  Euro,
  Clock,
  FileText,
  Trash2,
  Send,
  Receipt,
} from "lucide-react";
import { ExpenseReport, ExpenseItem } from "@/lib/types";
import {
  useExpenseReports,
  useCreateExpenseReport,
  useUpdateAnyExpenseReport,
  useDeleteExpenseReport,
} from "@/hooks/payroll";
import type { ExpenseItem as ApiExpenseItem } from "@safyr/api-client";

const statusLabels = {
  draft: "Brouillon",
  submitted: "Soumis",
  approved: "Approuvé",
  rejected: "Rejeté",
  paid: "Payé",
};

const statusColors = {
  draft: "secondary",
  submitted: "default",
  approved: "secondary",
  rejected: "destructive",
  paid: "secondary",
} as const;

const categoryLabels = {
  travel: "Transport",
  meal: "Repas",
  accommodation: "Hébergement",
  fuel: "Carburant",
  parking: "Parking",
  other: "Autre",
};

// Article du formulaire : `originalId` relie une ligne à celle de la note
// modifiée, pour conserver son statut et ses notes d'approbation.
type FormItem = Omit<ExpenseItem, "id" | "status"> & { originalId?: string };

type TableItem = ExpenseItem & {
  index: number;
  reportId: string;
  employeeId: string;
  employeeName: string;
  reportTitle: string;
  reportStatus: string;
  approvalNotes?: string;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionNotes?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
};

export default function ExpenseReportsPage() {
  const salaries = useEmployeeOptions();
  const { data: rawExpenses = [] } = useExpenseReports();
  const createExpenseMutation = useCreateExpenseReport();
  const updateExpenseMutation = useUpdateAnyExpenseReport();
  const deleteExpenseMutation = useDeleteExpenseReport();

  const reviveDate = (value: unknown): Date | undefined =>
    value ? new Date(value as string) : undefined;

  const expenses: ExpenseReport[] = rawExpenses.map((r) => ({
    ...r,
    items: (r.items ?? []).map((item) => ({
      ...item,
      date: new Date(item.date),
    })) as unknown as ExpenseItem[],
    submittedAt: reviveDate(r.submittedAt),
    reviewedAt: reviveDate(r.reviewedAt),
    approvedAt: reviveDate(r.approvedAt),
    paymentDate: reviveDate(r.paymentDate),
    notes: r.notes ?? undefined,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  })) as unknown as ExpenseReport[];

  // Persiste les items modifiés d'un rapport (opérations au niveau ligne).
  const persistReportItems = (reportId: string, items: ExpenseItem[]) => {
    const totalAmount = items.reduce((sum, it) => sum + Number(it.amount), 0);
    updateExpenseMutation.mutate({
      id: reportId,
      data: {
        items: items as unknown as ApiExpenseItem[],
        totalAmount,
      },
    });
  };
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseReport | null>(
    null,
  );
  const [viewingItem, setViewingItem] = useState<TableItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<TableItem[]>([]);
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<
    "accept" | "refuse" | "delete" | null
  >(null);
  const [groupBy, setGroupBy] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState({
    employeeId: "",
    items: [] as FormItem[],
  });
  // Note dont la suppression attend une confirmation.
  const [reportToDelete, setReportToDelete] = useState<ExpenseReport | null>(
    null,
  );

  // Approval notes state
  const [approvalNotes, setApprovalNotes] = useState("");
  const [bulkApprovalNotes, setBulkApprovalNotes] = useState("");

  // Flatten items for table display
  const allItems: TableItem[] = expenses.flatMap((report, reportIndex) =>
    report.items.map((item, itemIndex) => ({
      ...item,
      index: reportIndex * 1000 + itemIndex, // Unique index across reports
      reportId: report.id,
      employeeId: report.employeeId,
      employeeName:
        salaries.find((e) => e.id === report.employeeId)?.name ??
        "Salarié inconnu",
      reportTitle: report.title,
      reportStatus: report.status,
    })),
  );

  const handleCreate = () => {
    setEditingExpense(null);
    setFormData({
      employeeId: "",
      items: [
        {
          category: "fuel",
          description: "",
          amount: 0,
          date: new Date(),
        },
      ],
    });
    setIsCreateModalOpen(true);
  };

  const handleViewItem = (item: TableItem) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleEdit = (expense: ExpenseReport) => {
    setEditingExpense(expense);
    setFormData({
      employeeId: expense.employeeId,
      items: expense.items.map((item) => ({
        originalId: item.id,
        category: item.category,
        description: item.description,
        amount: item.amount,
        date: item.date,
        notes: item.notes,
      })),
    });
    setIsCreateModalOpen(true);
  };

  const handleEditReport = (reportId: string) => {
    const report = expenses.find((r) => r.id === reportId);
    if (report) {
      handleEdit(report);
    }
  };

  const handleAccept = (itemId: string, reportId: string, notes?: string) => {
    const notesToUse = notes !== undefined ? notes : approvalNotes;
    const report = expenses.find((r) => r.id === reportId);
    if (report) {
      const items = report.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: "approved" as const,
              approvalNotes: notesToUse || undefined,
              approvedAt: new Date(),
              approvedBy: "Alice Dubois",
            }
          : item,
      );
      persistReportItems(reportId, items as unknown as ExpenseItem[]);
    }
    if (notes === undefined) {
      setIsViewModalOpen(false);
      setApprovalNotes("");
    }
  };

  const handleRefuse = (itemId: string, reportId: string, notes?: string) => {
    const notesToUse = notes !== undefined ? notes : approvalNotes;
    const report = expenses.find((r) => r.id === reportId);
    if (report) {
      const items = report.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: "rejected" as const,
              rejectionNotes: notesToUse || undefined,
              rejectedAt: new Date(),
              rejectedBy: "Alice Dubois",
            }
          : item,
      );
      persistReportItems(reportId, items as unknown as ExpenseItem[]);
    }
    if (notes === undefined) {
      setIsViewModalOpen(false);
      setApprovalNotes("");
    }
  };

  // Supprime la note entière (toutes ses lignes) après confirmation.
  const confirmDeleteReport = async () => {
    if (!reportToDelete) return;
    try {
      await deleteExpenseMutation.mutateAsync(reportToDelete.id);
      setReportToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Échec de la suppression de la note de frais : ${message}`);
    }
  };

  // Décision groupée : les articles d'une même note sont regroupés pour n'écrire
  // qu'une fois, sinon chaque écriture repartirait de la note d'origine et la
  // dernière écraserait les autres.
  const applyBulk = (kind: "accept" | "refuse" | "delete", notes: string) => {
    const parNote = new Map<string, Set<string>>();
    for (const item of selectedItems) {
      if (kind !== "delete" && item.status !== "submitted") continue;
      const ids = parNote.get(item.reportId) ?? new Set<string>();
      ids.add(String(item.id));
      parNote.set(item.reportId, ids);
    }
    parNote.forEach((ids, reportId) => {
      const report = expenses.find((r) => r.id === reportId);
      if (!report) return;
      if (kind === "delete") {
        const remaining = report.items.filter((i) => !ids.has(String(i.id)));
        if (remaining.length === 0) deleteExpenseMutation.mutate(reportId);
        else persistReportItems(reportId, remaining);
        return;
      }
      const items = report.items.map((i) => {
        if (!ids.has(String(i.id))) return i;
        return kind === "accept"
          ? {
              ...i,
              status: "approved" as const,
              approvalNotes: notes || undefined,
              approvedAt: new Date(),
              approvedBy: "Alice Dubois",
            }
          : {
              ...i,
              status: "rejected" as const,
              rejectionNotes: notes || undefined,
              rejectedAt: new Date(),
              rejectedBy: "Alice Dubois",
            };
      });
      persistReportItems(reportId, items as unknown as ExpenseItem[]);
    });
  };

  const handleSave = async (asDraft = false) => {
    if (!formData.employeeId) return;

    const totalAmount = formData.items.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    const toIso = (d: unknown): string =>
      d instanceof Date ? d.toISOString() : String(d ?? "");

    const items: ApiExpenseItem[] = formData.items.map((item, index) => {
      const saisie = {
        category: item.category,
        description: item.description ?? "",
        amount: Number(item.amount),
        date: toIso(item.date),
        notes: item.notes,
      };
      const original = editingExpense?.items.find(
        (o) => o.id === item.originalId,
      );
      if (!original) {
        return {
          ...saisie,
          id: editingExpense
            ? `${Date.now()}-${index}`
            : (index + 1).toString(),
          status: asDraft ? ("draft" as const) : ("submitted" as const),
        };
      }
      // Ligne existante : on garde son identifiant, son statut et ses notes.
      // Une ligne déjà tranchée dont le fond change repart en validation.
      const fondModifie =
        original.category !== saisie.category ||
        original.description !== saisie.description ||
        Number(original.amount) !== saisie.amount;
      const tranchee =
        original.status === "approved" || original.status === "rejected";
      const status =
        original.status === "draft" && !asDraft
          ? ("submitted" as const)
          : tranchee && fondModifie
            ? ("submitted" as const)
            : original.status;
      const reste = { ...(original as unknown as Record<string, unknown>) };
      if (tranchee && fondModifie) {
        for (const cle of [
          "approvalNotes",
          "approvedAt",
          "approvedBy",
          "rejectionNotes",
          "rejectedAt",
          "rejectedBy",
        ]) {
          delete reste[cle];
        }
      }
      return { ...reste, ...saisie, id: original.id, status };
    });

    const statuts = new Set(items.map((i) => i.status));
    const statutNote = !editingExpense
      ? asDraft
        ? ("draft" as const)
        : ("submitted" as const)
      : statuts.has("submitted")
        ? ("submitted" as const)
        : statuts.size === 1 && statuts.has("draft")
          ? ("draft" as const)
          : editingExpense.status;

    const expenseData = {
      employeeId: formData.employeeId,
      title:
        editingExpense?.title ??
        `Note de frais du ${new Date().toLocaleDateString("fr-FR")}`,
      items,
      totalAmount,
      status: statutNote,
      exportedToPayroll: editingExpense?.exportedToPayroll ?? false,
    };

    try {
      if (editingExpense) {
        await updateExpenseMutation.mutateAsync({
          id: editingExpense.id,
          data: expenseData,
        });
      } else {
        await createExpenseMutation.mutateAsync(expenseData);
      }
      setIsCreateModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Échec de l'enregistrement de la note de frais : ${message}`);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          category: "fuel",
          description: "",
          amount: 0,
          date: new Date(),
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (
    index: number,
    field: keyof Omit<ExpenseItem, "id" | "status">,
    value: ExpenseItem[keyof Omit<ExpenseItem, "id" | "status">],
  ) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({
      ...formData,
      items: newItems,
    });
  };

  const columns: ColumnDef<TableItem>[] = [
    {
      key: "employee",
      label: "Employé",
      sortable: true,
      sortValue: (item: TableItem) => item.employeeName,
      render: (item: TableItem) => {
        const employee = salaries.find((e) => e.id === item.employeeId);
        return (
          <div>
            <div className="font-medium">{item.employeeName}</div>
            <div className="text-sm text-muted-foreground">
              {employee?.matricule || employee?.position || ""}
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      label: "Catégorie",
      render: (item: TableItem) => (
        <Badge variant="outline">{categoryLabels[item.category]}</Badge>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (item: TableItem) => (
        <div>
          <div className="font-medium">{item.description}</div>
          <div className="text-sm text-muted-foreground">
            {item.reportTitle}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Montant",
      render: (item: TableItem) => (
        <div className="flex items-center gap-1">
          <Euro className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{item.amount.toFixed(2)} €</span>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (item: TableItem) => item.date.toLocaleDateString("fr-FR"),
    },
    {
      key: "status",
      label: "Statut",
      render: (item: TableItem) => (
        <Badge variant={statusColors[item.status]}>
          {statusLabels[item.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: TableItem) => (
        <RowActionsMenu
          onView={() => handleViewItem(item)}
          onEdit={() => handleEditReport(item.reportId)}
          editLabel="Modifier la note"
          onDelete={() => {
            const report = expenses.find((r) => r.id === item.reportId);
            if (report) setReportToDelete(report);
          }}
          deleteLabel="Supprimer la note"
        />
      ),
    },
  ];

  // Calculate stats
  const draftCount = allItems.filter((i) => i.status === "draft").length;
  const submittedCount = allItems.filter(
    (i) => i.status === "submitted",
  ).length;
  const approvedCount = allItems.filter((i) => i.status === "approved").length;
  const totalApprovedAmount = allItems
    .filter((i) => i.status === "approved")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes de Frais</h1>
          <p className="text-muted-foreground">
            Déclarez et suivez vos notes de frais
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle note de frais
        </Button>
      </div>

      {/* Stats Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={FileText}
          title="Brouillons"
          value={draftCount}
          subtext="Notes de frais"
          color="gray"
        />

        <InfoCard
          icon={Clock}
          title="En attente"
          value={submittedCount}
          subtext="À approuver"
          color="orange"
        />

        <InfoCard
          icon={CheckCircle}
          title="Approuvées"
          value={approvedCount}
          subtext="Ce mois-ci"
          color="green"
        />

        <InfoCard
          icon={Euro}
          title="Total approuvé"
          value={`${totalApprovedAmount.toFixed(2)} €`}
          subtext="Montant validé"
          color="blue"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader>
          <CardTitle>Notes de frais</CardTitle>
          {selectedItems.length > 0 && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkActionType("accept");
                  setIsBulkActionModalOpen(true);
                }}
                disabled={
                  !selectedItems.some((item) => item.status === "submitted")
                }
              >
                <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                Approuver (
                {
                  selectedItems.filter((item) => item.status === "submitted")
                    .length
                }
                )
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkActionType("refuse");
                  setIsBulkActionModalOpen(true);
                }}
                disabled={
                  !selectedItems.some((item) => item.status === "submitted")
                }
              >
                <XCircle className="mr-2 h-4 w-4" />
                Refuser (
                {
                  selectedItems.filter((item) => item.status === "submitted")
                    .length
                }
                )
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setBulkActionType("delete");
                  setIsBulkActionModalOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                Supprimer ({selectedItems.length})
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <DataTable
            onRowClick={handleViewItem}
            columns={columns}
            data={allItems}
            getRowId={(item) => item.index.toString()}
            selectable={true}
            onSelectionChange={setSelectedItems}
            searchKeys={["description", "reportTitle", "employeeName"]}
            getSearchValue={(item) =>
              `${item.description} ${item.reportTitle} ${item.employeeName}`
            }
            searchPlaceholder="Rechercher une dépense ou un salarié..."
            filters={[
              {
                key: "status",
                label: "Statut",
                options: [
                  { value: "all", label: "Tous" },
                  { value: "draft", label: "Brouillon" },
                  { value: "submitted", label: "Soumis" },
                  { value: "approved", label: "Approuvé" },
                  { value: "rejected", label: "Rejeté" },
                  { value: "paid", label: "Payé" },
                ],
              },
              {
                key: "category",
                label: "Catégorie",
                options: [
                  { value: "all", label: "Toutes" },
                  { value: "travel", label: "Transport" },
                  { value: "meal", label: "Repas" },
                  { value: "accommodation", label: "Hébergement" },
                  { value: "fuel", label: "Carburant" },
                  { value: "parking", label: "Parking" },
                  { value: "other", label: "Autre" },
                ],
              },
            ]}
            groupBy={groupBy}
            groupByLabel={(value) => {
              const strValue = String(value);
              if (groupBy === "employeeId") {
                const employee = salaries.find((e) => e.id === strValue);
                return employee?.name || "Salarié inconnu";
              }
              if (groupBy === "category") {
                return (
                  categoryLabels[strValue as keyof typeof categoryLabels] ||
                  strValue
                );
              }
              return strValue;
            }}
            groupByOptions={[
              { value: "employeeId", label: "Employé" },
              { value: "category", label: "Catégorie" },
            ]}
            onGroupByChange={setGroupBy}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={
          editingExpense
            ? "Modifier la note de frais"
            : "Nouvelle note de frais"
        }
        size="xl"
        actions={{
          primary: {
            label: editingExpense ? "Enregistrer" : "Soumettre",
            onClick: () => handleSave(false),
            icon: <Send className="h-4 w-4" />,
            disabled: !formData.employeeId,
          },
          secondary: {
            label: "Enregistrer comme brouillon",
            onClick: () => handleSave(true),
            variant: "outline",
            disabled: !formData.employeeId,
          },
          tertiary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "ghost",
          },
        }}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Salarié *</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value: string) =>
                setFormData((prev) => ({ ...prev, employeeId: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner le salarié concerné" />
              </SelectTrigger>
              <SelectContent>
                {salaries.map((salarie) => (
                  <SelectItem key={salarie.id} value={salarie.id}>
                    {salarie.name}
                    {salarie.matricule ? ` (${salarie.matricule})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editingExpense && !formData.employeeId && (
              <p className="text-xs text-amber-600">
                Cette note n&apos;est rattachée à aucun salarié connu :
                choisissez-en un pour pouvoir l&apos;enregistrer.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Articles</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter un article
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {formData.items.map((item, index) => (
                <Card key={index} className="border-l-4 border-l-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Article {index + 1}
                      </CardTitle>
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Catégorie *
                        </Label>
                        <Select
                          value={item.category}
                          onValueChange={(value: string) =>
                            updateItem(index, "category", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="travel">Transport</SelectItem>
                            <SelectItem value="meal">Repas</SelectItem>
                            <SelectItem value="accommodation">
                              Hébergement
                            </SelectItem>
                            <SelectItem value="fuel">Carburant</SelectItem>
                            <SelectItem value="parking">Parking</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Date *</Label>
                        <Input
                          type="date"
                          value={
                            item.date instanceof Date
                              ? item.date.toISOString().split("T")[0]
                              : item.date
                          }
                          onChange={(e) =>
                            updateItem(index, "date", new Date(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-medium">
                          Description *
                        </Label>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(index, "description", e.target.value)
                          }
                          placeholder="Description de la dépense"
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Montant (€) *
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(index, "amount", e.target.value)
                          }
                          placeholder="0.00"
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Justificatif (PDF/Image)
                        </Label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium">Montant total</Label>
            <span className="text-lg font-bold text-primary">
              {formData.items
                .reduce((sum, item) => sum + Number(item.amount || 0), 0)
                .toFixed(2)}{" "}
              €
            </span>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de l'article"
        size="lg"
        actions={
          viewingItem && viewingItem.status === "submitted"
            ? {
                primary: {
                  label: "Approuver",
                  onClick: () =>
                    handleAccept(viewingItem.id, viewingItem.reportId),
                  icon: <CheckCircle className="h-4 w-4" />,
                },
                secondary: {
                  label: "Refuser",
                  onClick: () =>
                    handleRefuse(viewingItem.id, viewingItem.reportId),
                  variant: "destructive",
                  icon: <XCircle className="h-4 w-4" />,
                },
              }
            : undefined
        }
      >
        {viewingItem ? (
          <div className="space-y-4">
            <div>
              <Label>Note de frais</Label>
              <p className="text-sm font-medium">{viewingItem.reportTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employé</Label>
                <p className="text-sm">
                  {salaries.find((e) => e.id === viewingItem.employeeId)
                    ?.name || "N/A"}
                </p>
              </div>

              <div>
                <Label>Statut</Label>
                <div>
                  <Badge variant={statusColors[viewingItem.status]}>
                    {statusLabels[viewingItem.status]}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <Label>Catégorie</Label>
              <Badge variant="outline">
                {categoryLabels[viewingItem.category]}
              </Badge>
            </div>

            <div>
              <Label>Description</Label>
              <p className="text-sm">{viewingItem.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <p className="text-sm">
                  {viewingItem.date.toLocaleDateString("fr-FR")}
                </p>
              </div>

              <div>
                <Label>Montant</Label>
                <p className="text-sm font-bold">
                  {viewingItem.amount.toFixed(2)} €
                </p>
              </div>
            </div>

            {viewingItem.receipt && (
              <div>
                <Label>Justificatif</Label>
                <Button variant="outline" size="sm" asChild>
                  <a href={viewingItem.receipt} target="_blank">
                    <Receipt className="h-4 w-4 mr-2" />
                    Voir le justificatif
                  </a>
                </Button>
              </div>
            )}

            {viewingItem.notes && (
              <div>
                <Label>Notes</Label>
                <p className="text-sm whitespace-pre-wrap">
                  {viewingItem.notes}
                </p>
              </div>
            )}

            {viewingItem.approvalNotes && (
              <div>
                <Label>Notes d&apos;approbation</Label>
                <p className="text-sm whitespace-pre-wrap">
                  {viewingItem.approvalNotes}
                </p>
                {viewingItem.approvedAt && viewingItem.approvedBy && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Approuvé par {viewingItem.approvedBy} le{" "}
                    {viewingItem.approvedAt.toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            )}

            {viewingItem.rejectionNotes && (
              <div>
                <Label>Notes de rejet</Label>
                <p className="text-sm whitespace-pre-wrap">
                  {viewingItem.rejectionNotes}
                </p>
                {viewingItem.rejectedAt && viewingItem.rejectedBy && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Rejeté par {viewingItem.rejectedBy} le{" "}
                    {viewingItem.rejectedAt.toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            )}

            {viewingItem.status === "submitted" && (
              <div className="bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/50 dark:border-blue-400/50 rounded-lg p-4">
                <Label htmlFor="approvalNotes">
                  Notes d&apos;approbation/refus
                </Label>
                <Textarea
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Ajoutez des notes pour l'approbation ou le refus..."
                  rows={3}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        ) : null}
      </Modal>
      {/* Confirmation de suppression d'une note */}
      <Modal
        open={reportToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setReportToDelete(null);
        }}
        type="warning"
        title="Supprimer la note de frais"
        description={
          reportToDelete
            ? `${reportToDelete.title} — ${
                salaries.find((e) => e.id === reportToDelete.employeeId)
                  ?.name ?? "Salarié inconnu"
              }`
            : undefined
        }
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setReportToDelete(null),
            variant: "outline",
          },
          primary: {
            label: "Supprimer",
            onClick: confirmDeleteReport,
            variant: "destructive",
            loading: deleteExpenseMutation.isPending,
          },
        }}
      >
        {reportToDelete && (
          <div className="space-y-2 text-sm">
            <p>
              La note et ses {reportToDelete.items.length} article
              {reportToDelete.items.length > 1 ? "s" : ""} (
              {reportToDelete.items
                .reduce((somme, it) => somme + Number(it.amount), 0)
                .toFixed(2)}{" "}
              €) seront supprimés définitivement.
            </p>
            <p className="font-medium text-destructive">
              Cette action est irréversible.
            </p>
          </div>
        )}
      </Modal>

      {/* Bulk Action Warning Modal */}
      <Modal
        open={isBulkActionModalOpen}
        onOpenChange={setIsBulkActionModalOpen}
        type="warning"
        title={
          bulkActionType === "accept"
            ? "Approuver les articles sélectionnés"
            : bulkActionType === "refuse"
              ? "Refuser les articles sélectionnés"
              : "Supprimer les articles sélectionnés"
        }
        description={`Vous allez ${
          bulkActionType === "accept"
            ? "approuver"
            : bulkActionType === "refuse"
              ? "refuser"
              : "supprimer"
        } ${selectedItems.length} article(s)`}
        closable={false}
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => {
              setIsBulkActionModalOpen(false);
              setBulkApprovalNotes("");
            },
            variant: "outline",
          },
          primary: {
            label:
              bulkActionType === "accept"
                ? "Approuver"
                : bulkActionType === "refuse"
                  ? "Refuser"
                  : "Supprimer",
            onClick: () => {
              if (bulkActionType) applyBulk(bulkActionType, bulkApprovalNotes);
              setSelectedItems([]);
              setIsBulkActionModalOpen(false);
              setBulkApprovalNotes("");
            },
            variant: bulkActionType === "delete" ? "destructive" : "default",
          },
        }}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cette action affectera les articles suivants :
          </p>
          <div className="rounded-lg border bg-muted/30 p-3 max-h-50 overflow-y-auto">
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div
                  key={item.index}
                  className="flex items-center justify-between py-1"
                >
                  <div className="text-sm">
                    <span className="font-medium">{item.description}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      - {item.amount.toFixed(2)} €
                    </span>
                  </div>
                  <Badge variant={statusColors[item.status]}>
                    {statusLabels[item.status]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {(bulkActionType === "accept" || bulkActionType === "refuse") && (
            <div className="bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/50 dark:border-blue-400/50 rounded-lg p-4">
              <Label htmlFor="bulkApprovalNotes">
                Notes d&apos;approbation/refus
              </Label>
              <Textarea
                id="bulkApprovalNotes"
                value={bulkApprovalNotes}
                onChange={(e) => setBulkApprovalNotes(e.target.value)}
                placeholder="Ajoutez des notes pour l'approbation ou le refus..."
                rows={3}
                className="mt-2"
              />
            </div>
          )}

          {bulkActionType === "delete" && (
            <p className="text-sm font-medium text-destructive">
              Cette action est irréversible.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
