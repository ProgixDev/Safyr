"use client";

import { useState } from "react";
import { useEmployeeOptions } from "@/hooks/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import {
  RowActionsMenu,
  type RowActionTone,
} from "@/components/ui/row-actions-menu";
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
  Paperclip,
  Loader2,
} from "lucide-react";
import { ExpenseReport, ExpenseItem } from "@/lib/types";
import { downloadStoredFile } from "@/lib/document-files";
import { cn } from "@/lib/utils";
import {
  useExpenseReports,
  useCreateExpenseReport,
  useUpdateAnyExpenseReport,
  useDeleteExpenseReport,
} from "@/hooks/payroll";
import { uploadFile } from "@safyr/api-client";
import type { ExpenseItem as ApiExpenseItem } from "@safyr/api-client";

type StatutItem = ExpenseItem["status"];
type StatutNote = ExpenseReport["status"];
/** Statuts proposés dans le menu d'action et à la création (orange / vert / rouge). */
type StatutChoix = Extract<StatutItem, "submitted" | "approved" | "rejected">;

const STATUTS: Record<
  StatutNote,
  { label: string; badge: string; point: string }
> = {
  draft: {
    label: "Brouillon",
    badge:
      "border-slate-400/50 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    point: "bg-slate-400",
  },
  submitted: {
    label: "Soumis",
    badge:
      "border-orange-500/50 bg-orange-500/15 text-orange-700 dark:text-orange-300",
    point: "bg-orange-500",
  },
  approved: {
    label: "Approuvé",
    badge:
      "border-green-500/50 bg-green-500/15 text-green-700 dark:text-green-300",
    point: "bg-green-500",
  },
  rejected: {
    label: "Rejeté",
    badge: "border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300",
    point: "bg-red-500",
  },
  paid: {
    label: "Payé",
    badge: "border-blue-500/50 bg-blue-500/15 text-blue-700 dark:text-blue-300",
    point: "bg-blue-500",
  },
};

const CHOIX_STATUT: {
  statut: StatutChoix;
  icone: typeof Clock;
  tone: RowActionTone;
  texte: string;
}[] = [
  {
    statut: "submitted",
    icone: Clock,
    tone: "edit",
    texte: "text-orange-600 dark:text-orange-400",
  },
  {
    statut: "approved",
    icone: CheckCircle,
    tone: "view",
    texte: "text-green-600 dark:text-green-500",
  },
  {
    statut: "rejected",
    icone: XCircle,
    tone: "delete",
    texte: "text-red-600 dark:text-red-500",
  },
];

function StatutBadge({ statut }: { statut: StatutNote }) {
  const meta = STATUTS[statut] ?? STATUTS.draft;
  return (
    <Badge variant="outline" className={cn("gap-1.5", meta.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.point)} />
      {STATUTS[statut]?.label ?? String(statut)}
    </Badge>
  );
}

/** Date valide ou undefined (les dates JSON reviennent en texte, parfois vides). */
const aDate = (valeur: unknown): Date | undefined => {
  if (!valeur) return undefined;
  const d = valeur instanceof Date ? valeur : new Date(String(valeur));
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const dateIso = (valeur: unknown): string => aDate(valeur)?.toISOString() ?? "";

/** Jour local au format des champs <input type="date"> (pas de décalage UTC). */
const versChampDate = (valeur: unknown): string => {
  const d = aDate(valeur);
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const aujourdhui = (): Date => {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
};

const montantDe = (valeur: unknown): number => {
  const n = Number(valeur);
  return Number.isFinite(n) ? n : 0;
};

const formaterMontant = (valeur: unknown): string =>
  `${montantDe(valeur).toFixed(2)} €`;

/** Les justificatifs se téléversent vers une fonction serverless (corps limité à ~4,5 Mo). */
const TAILLE_MAX_JUSTIFICATIF = 4 * 1024 * 1024;

const nomDepuisCle = (cle: string): string =>
  decodeURIComponent(cle.split("/").pop() ?? cle);

/**
 * Pose un statut sur une ligne et nettoie les traces de la décision
 * précédente (date, notes) : une ligne remise en « Soumis » repart en validation.
 */
function appliquerStatut<T extends { status: string }>(
  item: T,
  statut: StatutItem,
): T {
  const brut = { ...(item as unknown as Record<string, unknown>) };
  for (const cle of ["approvedAt", "approvedBy", "rejectedAt", "rejectedBy"]) {
    delete brut[cle];
  }
  if (statut !== "approved") delete brut.approvalNotes;
  if (statut !== "rejected") delete brut.rejectionNotes;
  if (statut === "approved") brut.approvedAt = new Date().toISOString();
  if (statut === "rejected") brut.rejectedAt = new Date().toISOString();
  return { ...brut, status: statut } as unknown as T;
}

/** Statut de la note d'après ses lignes ; une note payée le reste. */
function statutNoteDepuis(
  items: { status: string }[],
  actuel: StatutNote,
): StatutNote {
  if (actuel === "paid" || items.length === 0) return actuel;
  const statuts = new Set(items.map((i) => i.status));
  if (statuts.has("submitted")) return "submitted";
  if (statuts.size === 1) return items[0].status as StatutNote;
  return actuel;
}

/**
 * Ouvre un justificatif. Doit être appelé DIRECTEMENT depuis le clic : l'onglet
 * s'ouvre avant tout await (Safari bloque sinon le popup).
 */
function ouvrirJustificatif(receipt: string, nom: string) {
  if (/^https?:\/\//i.test(receipt)) {
    const fenetre = window.open(receipt, "_blank");
    if (fenetre) fenetre.opener = null;
    return;
  }
  void downloadStoredFile({ name: nom, key: receipt });
}

const categoryLabels = {
  travel: "Transport",
  meal: "Repas",
  accommodation: "Hébergement",
  fuel: "Carburant",
  parking: "Parking",
  other: "Autre",
};

// Article du formulaire : `originalId` relie une ligne à celle de la note
// modifiée, pour conserver son statut et ses notes d'approbation. `cle` est
// locale (liste React, téléversement en cours) et n'est jamais envoyée.
type FormItem = Omit<ExpenseItem, "id" | "status" | "date" | "amount"> & {
  cle: string;
  originalId?: string;
  date: Date | string;
  amount: number | string;
  receiptName?: string;
  envoi?: boolean;
  erreurEnvoi?: string;
};

let compteurArticle = 0;
const nouvelArticle = (): FormItem => ({
  cle: `article-${Date.now()}-${compteurArticle++}`,
  category: "fuel",
  description: "",
  amount: 0,
  date: aujourdhui(),
});

// Champs ajoutés côté client (nom du justificatif) et dates rendues valides.
type TableItem = Omit<ExpenseItem, "date"> & {
  date?: Date;
  receiptName?: string;
  index: number;
  itemIndex: number;
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

  // Persiste les items modifiés d'un rapport (opérations au niveau ligne) et
  // recalcule le statut de la note ; une erreur est toujours signalée.
  const persistReportItems = async (reportId: string, items: ExpenseItem[]) => {
    const report = expenses.find((r) => r.id === reportId);
    const totalAmount = items.reduce(
      (sum, it) => sum + montantDe(it.amount),
      0,
    );
    try {
      await updateExpenseMutation.mutateAsync({
        id: reportId,
        data: {
          items: items.map((it) => ({
            ...it,
            date: dateIso(it.date),
          })) as unknown as ApiExpenseItem[],
          totalAmount,
          ...(report ? { status: statutNoteDepuis(items, report.status) } : {}),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Échec de la mise à jour de la note de frais : ${message}`);
    }
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
    statut: "submitted" as StatutChoix,
    items: [] as FormItem[],
  });
  const [enregistrement, setEnregistrement] = useState(false);
  // Erreur d'enregistrement, affichée dans la fenêtre (jamais d'échec silencieux).
  const [erreurForm, setErreurForm] = useState<string | null>(null);
  // Note dont la suppression attend une confirmation.
  const [reportToDelete, setReportToDelete] = useState<ExpenseReport | null>(
    null,
  );

  // Approval notes state
  const [approvalNotes, setApprovalNotes] = useState("");
  const [bulkApprovalNotes, setBulkApprovalNotes] = useState("");

  // Une ligne par article. Les dates de décision reviennent du serveur en texte :
  // on les remet en Date, sinon l'affichage du détail plante.
  const allItems: TableItem[] = expenses.flatMap((report, reportIndex) =>
    report.items.map((item, itemIndex) => {
      const brut = item as unknown as Record<string, unknown>;
      return {
        ...item,
        date: aDate(item.date),
        amount: montantDe(item.amount),
        receiptName: brut.receiptName as string | undefined,
        approvedAt: aDate(brut.approvedAt),
        rejectedAt: aDate(brut.rejectedAt),
        index: reportIndex * 1000 + itemIndex, // Unique index across reports
        itemIndex,
        reportId: report.id,
        employeeId: report.employeeId,
        employeeName:
          salaries.find((e) => e.id === report.employeeId)?.name ??
          "Salarié inconnu",
        reportTitle: report.title,
        reportStatus: report.status,
      } as TableItem;
    }),
  );

  const handleCreate = () => {
    setEditingExpense(null);
    setErreurForm(null);
    setFormData({
      employeeId: "",
      statut: "submitted",
      items: [nouvelArticle()],
    });
    setIsCreateModalOpen(true);
  };

  const handleViewItem = (item: TableItem) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleEdit = (expense: ExpenseReport) => {
    setEditingExpense(expense);
    setErreurForm(null);
    setFormData({
      employeeId: expense.employeeId,
      statut: "submitted",
      items: expense.items.map((item) => {
        const brut = item as unknown as Record<string, unknown>;
        return {
          ...nouvelArticle(),
          originalId: item.id,
          category: item.category,
          description: item.description,
          amount: item.amount,
          date: item.date,
          notes: item.notes,
          receipt: item.receipt,
          receiptName: brut.receiptName as string | undefined,
        };
      }),
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

  // Menu d'action : Soumis / Approuvé / Rejeté sur une ligne, persisté aussitôt.
  const changerStatut = async (item: TableItem, statut: StatutChoix) => {
    if (item.status === statut) return;
    const report = expenses.find((r) => r.id === item.reportId);
    if (!report) return;
    const items = report.items.map((it, i) =>
      i === item.itemIndex ? appliquerStatut(it, statut) : it,
    );
    await persistReportItems(item.reportId, items);
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
    if (formData.items.some((item) => item.envoi)) {
      setErreurForm(
        "Un justificatif est encore en cours de téléversement : patientez quelques secondes.",
      );
      return;
    }

    const totalAmount = formData.items.reduce(
      (sum, item) => sum + montantDe(item.amount),
      0,
    );

    const statutCreation: StatutItem = asDraft ? "draft" : formData.statut;

    const items: ApiExpenseItem[] = formData.items.map((item, index) => {
      const saisie = {
        category: item.category,
        description: item.description ?? "",
        amount: montantDe(item.amount),
        date: dateIso(item.date) || dateIso(aujourdhui()),
        notes: item.notes || undefined,
        // Clé de stockage + nom d'origine : c'est ce qui rend le justificatif
        // retrouvable après rechargement.
        receipt: item.receipt || undefined,
        receiptName: item.receipt ? item.receiptName : undefined,
      };
      const original = editingExpense?.items.find(
        (o) => o.id === item.originalId,
      );
      if (!original) {
        return appliquerStatut(
          {
            ...saisie,
            id: editingExpense
              ? `${Date.now()}-${index}`
              : (index + 1).toString(),
            status: statutCreation,
          },
          statutCreation,
        ) as ApiExpenseItem;
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

    const statutNote: StatutNote = !editingExpense
      ? statutNoteDepuis(items, asDraft ? "draft" : formData.statut)
      : statutNoteDepuis(items, editingExpense.status);

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

    setErreurForm(null);
    setEnregistrement(true);
    try {
      const enregistree = editingExpense
        ? await updateExpenseMutation.mutateAsync({
            id: editingExpense.id,
            data: expenseData,
          })
        : await createExpenseMutation.mutateAsync(expenseData);
      // Le serveur a répondu : on vérifie que chaque justificatif est bien
      // dans la note enregistrée, sinon on le dit au lieu d'échouer en silence.
      const clesRetenues = new Set(
        (enregistree.items ?? []).map((i) => i.receipt).filter(Boolean),
      );
      const perdus = items.filter(
        (i) => i.receipt && !clesRetenues.has(i.receipt),
      );
      if (perdus.length > 0) {
        throw new Error(
          "la note est enregistrée mais le serveur n'a pas conservé le justificatif de " +
            perdus.map((i) => `« ${i.description || "article"} »`).join(", ") +
            ". Rouvrez la note et joignez-le de nouveau.",
        );
      }
      setIsCreateModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "erreur inconnue";
      setErreurForm(
        `Échec de l'enregistrement de la note de frais : ${message}`,
      );
    } finally {
      setEnregistrement(false);
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, nouvelArticle()],
    }));
  };

  const removeItem = (cle: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.cle !== cle),
    }));
  };

  // Mise à jour par clé locale : un téléversement peut se terminer après
  // l'ajout ou le retrait d'un autre article.
  const patchItem = (cle: string, changes: Partial<FormItem>) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.cle === cle ? { ...i, ...changes } : i)),
    }));
  };

  // Téléverse le justificatif dès son choix : la clé de stockage est ensuite
  // enregistrée avec la note (avant, le fichier n'était jamais envoyé).
  const televerserJustificatif = async (cle: string, fichier: File | null) => {
    if (!fichier) return;
    if (fichier.size > TAILLE_MAX_JUSTIFICATIF) {
      patchItem(cle, {
        erreurEnvoi: `Fichier trop volumineux (${(fichier.size / 1024 / 1024).toFixed(1)} Mo) : 4 Mo maximum.`,
      });
      return;
    }
    patchItem(cle, { envoi: true, erreurEnvoi: undefined });
    try {
      const { key } = await uploadFile(fichier);
      if (!key)
        throw new Error("le stockage n'a pas renvoyé de clé de fichier");
      patchItem(cle, {
        receipt: key,
        receiptName: fichier.name,
        envoi: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "erreur inconnue";
      patchItem(cle, {
        envoi: false,
        erreurEnvoi: `Le téléversement a échoué : ${message}`,
      });
    }
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
        <Badge variant="outline">
          {categoryLabels[item.category] ?? item.category}
        </Badge>
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
          <span className="font-semibold">{formaterMontant(item.amount)}</span>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (item: TableItem) =>
        item.date?.toLocaleDateString("fr-FR") ?? "—",
    },
    {
      key: "status",
      label: "Statut",
      render: (item: TableItem) => <StatutBadge statut={item.status} />,
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
          extraItems={CHOIX_STATUT.map(({ statut, icone, tone, texte }, i) => {
            const actuel = item.status === statut;
            return {
              label: actuel
                ? `${STATUTS[statut].label} (statut actuel)`
                : STATUTS[statut].label,
              icon: icone,
              tone,
              separatorBefore: i === 0,
              labelClassName: cn(texte, actuel && "bg-muted/60 font-semibold"),
              onClick: () => void changerStatut(item, statut),
            };
          })}
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
    .reduce((sum, i) => sum + montantDe(i.amount), 0);

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
            label:
              editingExpense || formData.statut !== "submitted"
                ? "Enregistrer"
                : "Soumettre",
            onClick: () => handleSave(false),
            icon: <Send className="h-4 w-4" />,
            loading: enregistrement,
            disabled:
              !formData.employeeId ||
              enregistrement ||
              formData.items.some((item) => item.envoi),
          },
          secondary: {
            label: "Enregistrer comme brouillon",
            onClick: () => handleSave(true),
            variant: "outline",
            disabled:
              !formData.employeeId ||
              enregistrement ||
              formData.items.some((item) => item.envoi),
          },
          tertiary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "ghost",
          },
        }}
      >
        <div className="space-y-6">
          {erreurForm && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {erreurForm}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            {!editingExpense && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Statut initial</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({
                      ...prev,
                      statut: value as StatutChoix,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHOIX_STATUT.map(({ statut, texte }) => (
                      <SelectItem key={statut} value={statut}>
                        <span className={cn("flex items-center gap-2", texte)}>
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              STATUTS[statut].point,
                            )}
                          />
                          {STATUTS[statut].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Le statut pourra être changé ensuite depuis le menu
                  d&apos;action de la note.
                </p>
              </div>
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
                <Card key={item.cle} className="border-l-4 border-l-primary/20">
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
                          onClick={() => removeItem(item.cle)}
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
                            patchItem(item.cle, {
                              category: value as ExpenseItem["category"],
                            })
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
                          value={versChampDate(item.date)}
                          onChange={(e) =>
                            patchItem(item.cle, {
                              // Champ vidé : on garde la date précédente plutôt
                              // qu'une date invalide.
                              date: e.target.value
                                ? new Date(e.target.value)
                                : item.date,
                            })
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
                            patchItem(item.cle, { description: e.target.value })
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
                            patchItem(item.cle, { amount: e.target.value })
                          }
                          placeholder="0.00"
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {item.receipt
                            ? "Remplacer le justificatif (PDF/Image)"
                            : "Justificatif (PDF/Image)"}
                        </Label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full"
                          disabled={item.envoi}
                          onChange={(e) => {
                            const champ = e.currentTarget;
                            const fichier = champ.files?.[0] ?? null;
                            // Permet de rechoisir le même fichier après une erreur.
                            champ.value = "";
                            void televerserJustificatif(item.cle, fichier);
                          }}
                        />
                        {item.envoi && (
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Téléversement en cours…
                          </p>
                        )}
                        {item.erreurEnvoi && (
                          <p className="text-xs text-destructive">
                            {item.erreurEnvoi}
                          </p>
                        )}
                        {item.receipt && !item.envoi && (
                          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5 text-sm">
                            <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate">
                              {item.receiptName || nomDepuisCle(item.receipt)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                ouvrirJustificatif(
                                  item.receipt!,
                                  item.receiptName ||
                                    nomDepuisCle(item.receipt!),
                                )
                              }
                            >
                              Voir
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                patchItem(item.cle, {
                                  receipt: undefined,
                                  receiptName: undefined,
                                })
                              }
                            >
                              Retirer
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-medium">
                          Notes (facultatif)
                        </Label>
                        <Input
                          value={item.notes ?? ""}
                          onChange={(e) =>
                            patchItem(item.cle, { notes: e.target.value })
                          }
                          placeholder="Précisions sur la dépense"
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
                .reduce((sum, item) => sum + montantDe(item.amount), 0)
                .toFixed(2)}{" "}
              €
            </span>
          </div>
        </div>
      </Modal>

      {/* View Modal : lecture seule, tolérant aux champs absents */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de la note de frais"
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
                <Label>Salarié</Label>
                <p className="text-sm">
                  {salaries.find((e) => e.id === viewingItem.employeeId)
                    ?.name || "Salarié inconnu"}
                </p>
              </div>

              <div>
                <Label>Statut</Label>
                <div>
                  <StatutBadge statut={viewingItem.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Catégorie</Label>
                <div>
                  <Badge variant="outline">
                    {categoryLabels[viewingItem.category] ??
                      viewingItem.category ??
                      "—"}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Date</Label>
                <p className="text-sm">
                  {viewingItem.date?.toLocaleDateString("fr-FR") ?? "—"}
                </p>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <p className="text-sm">{viewingItem.description || "—"}</p>
            </div>

            <div>
              <Label>Montant</Label>
              <p className="text-sm font-bold">
                {formaterMontant(viewingItem.amount)}
              </p>
            </div>

            <div>
              <Label>Justificatif</Label>
              {viewingItem.receipt ? (
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      ouvrirJustificatif(
                        viewingItem.receipt!,
                        viewingItem.receiptName ||
                          nomDepuisCle(viewingItem.receipt!),
                      )
                    }
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Voir le justificatif
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {viewingItem.receiptName ||
                      nomDepuisCle(viewingItem.receipt)}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun justificatif joint
                </p>
              )}
            </div>

            <div>
              <Label>Notes</Label>
              <p className="text-sm whitespace-pre-wrap">
                {viewingItem.notes || (
                  <span className="text-muted-foreground">Aucune note</span>
                )}
              </p>
            </div>

            {viewingItem.approvalNotes && (
              <div>
                <Label>Notes d&apos;approbation</Label>
                <p className="text-sm whitespace-pre-wrap">
                  {viewingItem.approvalNotes}
                </p>
                {viewingItem.approvedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Approuvé
                    {viewingItem.approvedBy
                      ? ` par ${viewingItem.approvedBy}`
                      : ""}{" "}
                    le {viewingItem.approvedAt.toLocaleDateString("fr-FR")}
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
                {viewingItem.rejectedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Rejeté
                    {viewingItem.rejectedBy
                      ? ` par ${viewingItem.rejectedBy}`
                      : ""}{" "}
                    le {viewingItem.rejectedAt.toLocaleDateString("fr-FR")}
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
                      - {formaterMontant(item.amount)}
                    </span>
                  </div>
                  <StatutBadge statut={item.status} />
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
