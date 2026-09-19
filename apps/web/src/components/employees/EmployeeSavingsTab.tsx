"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Modal } from "@/components/ui/modal";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, TrendingUp, Calendar, Plus, Download } from "lucide-react";
import type { Employee } from "@/lib/types";
import { useRegistre, type LigneRegistre } from "@/hooks/fiscal/use-registre";
import { exporterPdf } from "@/lib/export-table";
import { BADGE_TONS } from "@/lib/hr-status-badges";
import { cn } from "@/lib/utils";

interface EmployeeSavingsTabProps {
  employee: Employee;
}

type Plan = "PEE" | "PERECO";
type Nature =
  | "versement"
  | "abondement"
  | "interessement"
  | "participation"
  | "deblocage";

/**
 * Contribution enregistrée en base (registre `epargne`, meta du fiscal_record).
 * Dates au format « AAAA-MM-JJ ».
 */
interface LigneEpargne extends LigneRegistre {
  employeeId: string;
  employeeName: string;
  plan: Plan;
  nature: Nature;
  amount: number;
  date: string;
  notes?: string;
}

const PLANS: { value: Plan; label: string; libelleLong: string }[] = [
  { value: "PEE", label: "PEE", libelleLong: "Plan d'Épargne Entreprise" },
  {
    value: "PERECO",
    label: "PERECO",
    libelleLong: "Plan d'Épargne Retraite Collectif",
  },
];

const NATURES: { value: Nature; label: string }[] = [
  { value: "versement", label: "Versement volontaire" },
  { value: "abondement", label: "Abondement de l'employeur" },
  { value: "interessement", label: "Intéressement" },
  { value: "participation", label: "Participation" },
  { value: "deblocage", label: "Déblocage (retrait)" },
];

const libelleNature = (n: Nature) =>
  NATURES.find((x) => x.value === n)?.label ?? n;

const EURO = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const aujourdhui = () => new Date().toISOString().slice(0, 10);

const formulaireVide = (plan: Plan) => ({
  plan,
  nature: "versement" as Nature,
  amount: "",
  date: aujourdhui(),
  notes: "",
});

export function EmployeeSavingsTab({ employee }: EmployeeSavingsTabProps) {
  // Les contributions sont enregistrées en base : le bouton « Nouvelle
  // contribution » n'avait aucun formulaire derrière lui.
  const registre = useRegistre<LigneEpargne>("epargne", []);
  const contributions = registre.lignes
    .filter(
      (l) =>
        l.employeeId === employee.id &&
        PLANS.some((p) => p.value === l.plan) &&
        typeof l.amount === "number",
    )
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const [modalOuvert, setModalOuvert] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(formulaireVide("PEE"));
  const [enCours, setEnCours] = useState(false);
  const [aSupprimer, setASupprimer] = useState<LigneEpargne | null>(null);

  const ouvrirCreation = (plan: Plan = "PEE") => {
    setEditingId(null);
    setForm(formulaireVide(plan));
    setModalOuvert(true);
  };

  const ouvrirModification = (ligne: LigneEpargne) => {
    setEditingId(ligne.id);
    setForm({
      plan: ligne.plan,
      nature: ligne.nature,
      amount: String(ligne.amount),
      date: ligne.date,
      notes: ligne.notes ?? "",
    });
    setModalOuvert(true);
  };

  const montant = Number.parseFloat(form.amount.replace(",", "."));
  const formulaireValide = Number.isFinite(montant) && montant > 0 && form.date;

  const enregistrer = async () => {
    if (!formulaireValide) return;
    setEnCours(true);
    try {
      await registre.enregistrer(
        {
          id: editingId ?? "",
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
          plan: form.plan,
          nature: form.nature,
          amount: montant,
          date: form.date,
          notes: form.notes.trim() || undefined,
        },
        {
          period: form.date.slice(0, 7),
          label: `${form.plan} — ${libelleNature(form.nature)} — ${employee.lastName}`,
          status: "enregistre",
          amount: montant,
        },
      );
      setModalOuvert(false);
    } catch (erreur) {
      alert(
        erreur instanceof Error
          ? `Échec de l'enregistrement : ${erreur.message}`
          : "Échec de l'enregistrement.",
      );
    } finally {
      setEnCours(false);
    }
  };

  const confirmerSuppression = async () => {
    if (!aSupprimer) return;
    try {
      await registre.supprimerLigne(aSupprimer.id);
      setASupprimer(null);
    } catch {
      alert("Échec de la suppression. Réessayez.");
    }
  };

  const synthese = (plan: Plan) => {
    const lignes = contributions.filter((c) => c.plan === plan);
    const versees = lignes.filter((c) => c.nature !== "deblocage");
    const debloque = lignes
      .filter((c) => c.nature === "deblocage")
      .reduce((somme, c) => somme + c.amount, 0);
    const total = versees.reduce((somme, c) => somme + c.amount, 0);
    return {
      lignes,
      contributions: total,
      solde: total - debloque,
      derniere: versees[0]?.date,
    };
  };

  const telechargerReleve = (plan: Plan) => {
    const { lignes, contributions: total, solde } = synthese(plan);
    void exporterPdf(
      `releve-${plan}-${employee.lastName}-${aujourdhui()}`,
      [
        {
          titre: "Date",
          valeur: (l: LigneEpargne) =>
            new Date(l.date).toLocaleDateString("fr-FR"),
        },
        { titre: "Nature", valeur: (l) => libelleNature(l.nature) },
        {
          titre: "Montant (€)",
          valeur: (l) => (l.nature === "deblocage" ? -l.amount : l.amount),
        },
        { titre: "Notes", valeur: (l) => l.notes ?? "" },
      ],
      [...lignes].reverse(),
      {
        titre: `Relevé ${plan} — ${employee.firstName} ${employee.lastName}`,
        sousTitre:
          `Contributions : ${EURO.format(total)} — Solde : ${EURO.format(solde)}`.replace(
            /[  ]/g,
            " ",
          ),
      },
    );
  };

  const colonnes: ColumnDef<LigneEpargne>[] = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (l) => new Date(l.date).toLocaleDateString("fr-FR"),
    },
    {
      key: "plan",
      label: "Plan",
      sortable: true,
      render: (l) => <Badge variant="outline">{l.plan}</Badge>,
    },
    {
      key: "nature",
      label: "Nature",
      sortable: true,
      render: (l) => (
        <Badge
          variant="outline"
          className={cn(
            l.nature === "deblocage" ? BADGE_TONS.orange : BADGE_TONS.vert,
          )}
        >
          {libelleNature(l.nature)}
        </Badge>
      ),
    },
    {
      key: "amount",
      label: "Montant",
      sortable: true,
      render: (l) => (
        <span className="font-medium">
          {l.nature === "deblocage" ? "−" : ""}
          {EURO.format(l.amount)}
        </span>
      ),
    },
    {
      key: "notes",
      label: "Notes",
      render: (l) => (
        <span className="text-sm text-muted-foreground">{l.notes ?? "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Savings Overview Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Suivi des épargnes</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              PEE et PERECO de {employee.firstName} {employee.lastName}
            </p>
          </div>
          <Button onClick={() => ouvrirCreation()}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle contribution
          </Button>
        </CardHeader>
      </Card>

      {PLANS.map((plan) => {
        const s = synthese(plan.value);
        return (
          <Card key={plan.value}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {plan.libelleLong} ({plan.label})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Solde actuel</p>
                    <p className="text-2xl font-bold text-green-600">
                      {EURO.format(s.solde)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Contributions totales</p>
                    <p className="text-lg font-semibold">
                      {EURO.format(s.contributions)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Dernière contribution</p>
                    <p className="text-sm text-muted-foreground">
                      {s.derniere
                        ? new Date(s.derniere).toLocaleDateString("fr-FR")
                        : "Aucune"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ouvrirCreation(plan.value)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une contribution
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={s.lignes.length === 0}
                  onClick={() => telechargerReleve(plan.value)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger relevé
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Historique des contributions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {registre.isLoading
                ? "Chargement…"
                : "Aucune contribution enregistrée"}
            </div>
          ) : (
            <DataTable
              data={contributions}
              columns={colonnes}
              searchKeys={["notes"]}
              searchPlaceholder="Rechercher une contribution..."
              itemsPerPage={10}
              filters={[
                {
                  key: "plan",
                  label: "Plan",
                  options: [
                    { value: "all", label: "Tous" },
                    ...PLANS.map((p) => ({ value: p.value, label: p.label })),
                  ],
                },
              ]}
              actions={(ligne) => (
                <RowActionsMenu
                  onEdit={() => ouvrirModification(ligne)}
                  onDelete={() => setASupprimer(ligne)}
                />
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Nouvelle contribution / modification */}
      <Modal
        open={modalOuvert}
        onOpenChange={setModalOuvert}
        type="form"
        size="lg"
        title={editingId ? "Modifier la contribution" : "Nouvelle contribution"}
        description={`Épargne salariale de ${employee.firstName} ${employee.lastName}`}
        actions={{
          primary: {
            label: enCours ? "Enregistrement…" : "Enregistrer",
            onClick: () => void enregistrer(),
            disabled: !formulaireValide || enCours,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setModalOuvert(false),
          },
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="epargne-plan">Plan</Label>
              <Select
                value={form.plan}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, plan: v as Plan }))
                }
              >
                <SelectTrigger id="epargne-plan" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label} — {p.libelleLong}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="epargne-nature">Nature</Label>
              <Select
                value={form.nature}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, nature: v as Nature }))
                }
              >
                <SelectTrigger id="epargne-nature" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NATURES.map((n) => (
                    <SelectItem key={n.value} value={n.value}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="epargne-montant">
                Montant (€) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="epargne-montant"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="Ex. 150,00"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="epargne-date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="epargne-date"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="epargne-notes">Notes (optionnel)</Label>
            <Textarea
              id="epargne-notes"
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>
        </div>
      </Modal>

      {/* Suppression */}
      <Modal
        open={aSupprimer !== null}
        onOpenChange={(open) => {
          if (!open) setASupprimer(null);
        }}
        type="warning"
        closable
        title="Supprimer la contribution"
        description="Cette action est définitive."
        actions={{
          primary: {
            label: "Supprimer",
            variant: "destructive",
            onClick: () => void confirmerSuppression(),
          },
          secondary: { label: "Annuler", onClick: () => setASupprimer(null) },
        }}
      >
        {aSupprimer && (
          <p className="text-sm">
            Supprimer {libelleNature(aSupprimer.nature).toLowerCase()} de{" "}
            <strong>{EURO.format(aSupprimer.amount)}</strong> ({aSupprimer.plan}
            , {new Date(aSupprimer.date).toLocaleDateString("fr-FR")}) ?
          </p>
        )}
      </Modal>
    </div>
  );
}
