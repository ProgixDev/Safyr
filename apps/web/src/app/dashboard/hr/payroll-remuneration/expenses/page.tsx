"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  CheckCircle,
  XCircle,
  MoreVertical,
  Euro,
  Clock,
  FileText,
  Eye,
  Pencil,
  Trash2,
  Send,
  Receipt,
} from "lucide-react";
import { ExpenseReport, ExpenseItem } from "@/lib/types";

// Mock data - replace with API call
const mockExpenseReports: ExpenseReport[] = [
  {
    id: "1",
    employeeId: "1",
    title: "Frais de déplacement - Mission site A",
    items: [
      {
        id: "1",
        category: "fuel",
        description: "Essence pour déplacement",
        amount: 45.5,
        date: new Date("2024-12-10"),
        receipt: "/files/receipt_1.pdf",
        status: "submitted",
      },
      {
        id: "2",
        category: "meal",
        description: "Repas midi",
        amount: 15.0,
        date: new Date("2024-12-10"),
        status: "submitted",
      },
      {
        id: "3",
        category: "parking",
        description: "Parking site A",
        amount: 8.5,
        date: new Date("2024-12-10"),
        receipt: "/files/receipt_2.pdf",
        status: "submitted",
      },
    ],
    totalAmount: 69.0,
    status: "submitted",
    submittedAt: new Date("2024-12-11"),
    exportedToPayroll: false,
    createdAt: new Date("2024-12-10"),
    updatedAt: new Date("2024-12-11"),
  },
  {
    id: "2",
    employeeId: "2",
    title: "Frais de formation SSIAP",
    items: [
      {
        id: "1",
        category: "travel",
        description: "Train Paris-Lyon",
        amount: 85.0,
        date: new Date("2024-12-05"),
        receipt: "/files/receipt_3.pdf",
        status: "approved",
      },
      {
        id: "2",
        category: "accommodation",
        description: "Hôtel 1 nuit",
        amount: 90.0,
        date: new Date("2024-12-05"),
        receipt: "/files/receipt_4.pdf",
        status: "approved",
      },
    ],
    totalAmount: 175.0,
    status: "approved",
    submittedAt: new Date("2024-12-06"),
    reviewedAt: new Date("2024-12-07"),
    reviewedBy: "Alice Dubois",
    approvedBy: "Alice Dubois",
    approvedAt: new Date("2024-12-07"),
    exportedToPayroll: false,
    createdAt: new Date("2024-12-05"),
    updatedAt: new Date("2024-12-07"),
  },
  {
    id: "3",
    employeeId: "1",
    title: "Frais mission décembre",
    items: [
      {
        id: "1",
        category: "fuel",
        description: "Essence",
        amount: 50.0,
        date: new Date("2024-12-15"),
        status: "draft",
      },
    ],
    totalAmount: 50.0,
    status: "draft",
    exportedToPayroll: false,
    createdAt: new Date("2024-12-15"),
    updatedAt: new Date("2024-12-15"),
  },
];

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

// Mock employees
const mockEmployees = [
  { id: "1", name: "Marie Dupont" },
  { id: "2", name: "Jean Martin" },
  { id: "3", name: "Sophie Leroy" },
  { id: "4", name: "Pierre Durand" },
];

type TableItem = ExpenseItem & {
  index: number;
  reportId: string;
  employeeId: string;
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
  const [expenses, setExpenses] = useState<ExpenseReport[]>(mockExpenseReports);
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
    employeeId: "1", // Current user - in real app, get from auth
    items: [] as Omit<ExpenseItem, "id" | "status">[],
  });

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
      reportTitle: report.title,
      reportStatus: report.status,
    })),
  );

  const handleCreate = () => {
    setEditingExpense(null);
    setFormData({
      employeeId: "1", // Default employee ID
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

  const handleDeleteItem = (itemId: string, reportId: string) => {
    setExpenses(
      expenses.map((report) =>
        report.id === reportId
          ? {
              ...report,
              items: report.items.filter((item) => item.id !== itemId),
              totalAmount: report.items
                .filter((item) => item.id !== itemId)
                .reduce((sum, item) => sum + item.amount, 0),
              updatedAt: new Date(),
            }
          : report,
      ),
    );
  };

  const handleAccept = (itemId: string, reportId: string, notes?: string) => {
    const notesToUse = notes !== undefined ? notes : approvalNotes;
    setExpenses(
      expenses.map((report) =>
        report.id === reportId
          ? {
              ...report,
              items: report.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      status: "approved" as const,
                      approvalNotes: notesToUse || undefined,
                      approvedAt: new Date(),
                      approvedBy: "Alice Dubois", // Mock current user
                    }
                  : item,
              ),
              updatedAt: new Date(),
            }
          : report,
      ),
    );
    if (notes === undefined) {
      setIsViewModalOpen(false);
      setApprovalNotes("");
    }
  };

  const handleRefuse = (itemId: string, reportId: string, notes?: string) => {
    const notesToUse = notes !== undefined ? notes : approvalNotes;
    setExpenses(
      expenses.map((report) =>
        report.id === reportId
          ? {
              ...report,
              items: report.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      status: "rejected" as const,
                      rejectionNotes: notesToUse || undefined,
                      rejectedAt: new Date(),
                      rejectedBy: "Alice Dubois", // Mock current user
                    }
                  : item,
              ),
              updatedAt: new Date(),
            }
          : report,
      ),
    );
    if (notes === undefined) {
      setIsViewModalOpen(false);
      setApprovalNotes("");
    }
  };

  const handleSave = (asDraft = false) => {
    const totalAmount = formData.items.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    const expenseData = {
      employeeId: formData.employeeId,
      title: `Note de frais du ${new Date().toLocaleDateString("fr-FR")}`,
      items: formData.items.map((item, index) => ({
        id: (index + 1).toString(),
        ...item,
        amount: Number(item.amount),
        status: asDraft ? ("draft" as const) : ("submitted" as const),
      })),
      totalAmount,
      status: asDraft ? ("draft" as const) : ("submitted" as const),
      submittedAt: asDraft ? undefined : new Date(),
      exportedToPayroll: false,
    };

    if (editingExpense) {
      setExpenses(
        expenses.map((expense) =>
          expense.id === editingExpense.id
            ? {
                ...expense,
                ...expenseData,
                updatedAt: new Date(),
              }
            : expense,
        ),
      );
    } else {
      const newExpense: ExpenseReport = {
        id: Date.now().toString(),
        ...expenseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setExpenses([...expenses, newExpense]);
    }

    setIsCreateModalOpen(false);
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
      render: (item: TableItem) => {
        const employee = mockEmployees.find((e) => e.id === item.employeeId);
        return (
          <div>
            <div className="font-medium">{employee?.name || "N/A"}</div>
            <div className="text-sm text-muted-foreground">
              {item.employeeId}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewItem(item)}>
              <Eye className="mr-2 h-4 w-4 text-orange-500" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditReport(item.reportId)}>
              <Pencil className="mr-2 h-4 w-4 text-green-600" />
              Modifier la note
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteItem(item.id, item.reportId)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                <CheckCircle className="mr-2 h-4 w-4" />
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
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer ({selectedItems.length})
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={allItems}
            getRowId={(item) => item.index.toString()}
            selectable={true}
            onSelectionChange={setSelectedItems}
            searchKeys={["description", "reportTitle"]}
            searchPlaceholder="Rechercher une dépense..."
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
                const employee = mockEmployees.find((e) => e.id === strValue);
                return employee?.name || strValue;
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
            label: "Soumettre",
            onClick: () => handleSave(false),
            icon: <Send className="h-4 w-4" />,
          },
          secondary: {
            label: "Enregistrer comme brouillon",
            onClick: () => handleSave(true),
            variant: "outline",
          },
          tertiary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "ghost",
          },
        }}
      >
        <div className="space-y-6">
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
                  {mockEmployees.find((e) => e.id === viewingItem.employeeId)
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
              if (bulkActionType === "accept") {
                selectedItems.forEach((item) => {
                  if (item.status === "submitted") {
                    handleAccept(item.id, item.reportId, bulkApprovalNotes);
                  }
                });
              } else if (bulkActionType === "refuse") {
                selectedItems.forEach((item) => {
                  if (item.status === "submitted") {
                    handleRefuse(item.id, item.reportId, bulkApprovalNotes);
                  }
                });
              } else if (bulkActionType === "delete") {
                selectedItems.forEach((item) => {
                  handleDeleteItem(item.id, item.reportId);
                });
              }
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
