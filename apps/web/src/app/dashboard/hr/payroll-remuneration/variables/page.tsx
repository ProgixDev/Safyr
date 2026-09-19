"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { useEmployees } from "@/hooks/employees";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
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
  Euro,
  Clock,
  Calendar,
  Users,
  X,
  Shirt,
  Settings,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { PayrollVariable, PayrollVariableType } from "@/lib/types";
import {
  usePayrollVariables,
  useCreatePayrollVariable,
  useDeletePayrollVariable,
  useUpdateAnyPayrollVariable,
  useParametresPaie,
  useHeuresPaie,
  cleMontantPrime,
} from "@/hooks/payroll";
import { PrimeLinesEditor } from "@/components/payroll/PrimeLinesEditor";
import {
  PRIMES,
  arrondi2,
  detailCalcul,
  encoderDescription,
  formaterEuros,
  ligneDepuisVariable,
  ligneVide,
  libelleVariable,
  lireNombre,
  montantEuros,
  primeParId,
  totalLigne,
  versSaisie,
  type LignePrime,
  type PrimeId,
} from "@/lib/payroll-primes";

// Colonnes du tableau « Par salarié » : les six primes du client, puis un
// regroupement pour les autres (ancienneté, 13ème mois, astreinte…).
const COLONNES_PIVOT: { key: string; label: string; ids: PrimeId[] }[] = [
  {
    key: "indemnite_habillage",
    label: "Indemnité d'habillage",
    ids: ["indemnite_habillage"],
  },
  { key: "nbre_paniers", label: "Prime de panier", ids: ["nbre_paniers"] },
  {
    key: "frais_restauration",
    label: "Frais de restauration",
    ids: ["frais_restauration"],
  },
  {
    key: "nbre_deplacement",
    label: "Frais de déplacement",
    ids: ["nbre_deplacement"],
  },
  { key: "tenue", label: "Entretien de tenue", ids: ["tenue"] },
  {
    key: "autres_indemnites",
    label: "Autre prime",
    ids: ["autres_indemnites"],
  },
  {
    key: "divers",
    label: "Primes diverses",
    ids: [
      "prime",
      "prime_anciennete",
      "treizieme_mois",
      "astreinte",
      "majoration_dimanche_ferie",
    ],
  },
];

const colonneDe = (type: string): string =>
  COLONNES_PIVOT.find((c) => (c.ids as string[]).includes(type))?.key ??
  "divers";

// Une ligne = un salarié pour un mois, avec le cumul de ses primes par colonne.
type LignePivot = {
  cle: string;
  employeeId: string;
  employeeName: string;
  matricule: string;
  resolu: boolean;
  period: string;
  montants: Record<string, number>;
  details: Record<string, string[]>;
  total: number;
  enAttente: number;
  variables: PayrollVariable[];
};

interface Salarie {
  id: string;
  name: string;
  matricule: string;
  poste: string;
  droitHabillage: boolean;
}

const libellePeriode = (period: string): string => {
  const [annee, mois] = period.split("-");
  const date = new Date(Number(annee), Number(mois) - 1, 1);
  return Number.isNaN(date.getTime())
    ? period
    : date.toLocaleDateString("fr-FR", { year: "numeric", month: "long" });
};

const libelleStatut = (statut: PayrollVariable["status"]) =>
  statut === "validated"
    ? "Validé"
    : statut === "refused"
      ? "Refusé"
      : "En attente";

const varianteStatut = (statut: PayrollVariable["status"]) =>
  statut === "validated"
    ? "default"
    : statut === "refused"
      ? "destructive"
      : "secondary";

const maintenant = () => {
  const now = new Date();
  return {
    annee: now.getFullYear().toString(),
    mois: (now.getMonth() + 1).toString().padStart(2, "0"),
  };
};

export default function PayrollVariablesPage() {
  const { data: employees = [] } = useEmployees();
  const searchParams = useSearchParams();

  // Tous les dossiers servent à retrouver un nom ; seuls les salariés encore
  // présents sont proposés dans le formulaire.
  const tousSalaries = useMemo<Salarie[]>(
    () =>
      employees.map((e) => ({
        id: e.id,
        name:
          `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() ||
          (e.employeeNumber ?? "Salarié"),
        matricule: e.employeeNumber ?? "",
        poste: e.position ?? "",
        droitHabillage: e.dressingAllowance === true,
      })),
    [employees],
  );
  const salariesProposes = useMemo(
    () =>
      tousSalaries.filter(
        (s) => employees.find((e) => e.id === s.id)?.status !== "terminated",
      ),
    [tousSalaries, employees],
  );
  // Les anciennes variables portaient le matricule à la place de l'identifiant.
  const trouverSalarie = (idOuMatricule: string): Salarie | undefined =>
    tousSalaries.find(
      (s) =>
        s.id === idOuMatricule ||
        (s.matricule !== "" && s.matricule === idOuMatricule),
    );

  const { data: rawVariables = [] } = usePayrollVariables();
  const createVariableMutation = useCreatePayrollVariable();
  const deleteVariableMutation = useDeletePayrollVariable();
  const updateVariableMutation = useUpdateAnyPayrollVariable();

  const variables: PayrollVariable[] = rawVariables.map((v) => ({
    ...v,
    type: v.type as PayrollVariableType,
    description: v.description ?? undefined,
    notes: v.notes ?? undefined,
    createdAt: new Date(v.createdAt),
    updatedAt: new Date(v.updatedAt),
  }));

  // ── Ouverture depuis un lien (?employeeId=…&month=…&year=…) ────────────
  const paramEmployee = searchParams.get("employeeId");
  const paramMois = searchParams.get("month");
  const paramAnnee = searchParams.get("year");
  const ouvertureDepuisLien = Boolean(paramEmployee && paramMois && paramAnnee);
  const depart = maintenant();

  const [isVariableModalOpen, setIsVariableModalOpen] =
    useState(ouvertureDepuisLien);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedVariable, setSelectedVariable] =
    useState<PayrollVariable | null>(null);
  const [detailLigne, setDetailLigne] = useState<LignePivot | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const [groupBy, setGroupBy] = useState<string | undefined>(undefined);
  const [validationNotes, setValidationNotes] = useState("");
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const employeeSearchRef = useRef<HTMLDivElement>(null);
  const [periodeFiltre, setPeriodeFiltre] = useState("all");
  const [viewMode, setViewMode] = useState<"consolidated" | "detailed">(
    "consolidated",
  );

  // Formulaire : salarié + période, puis une ligne par prime.
  const [form, setForm] = useState({
    employeeId: paramEmployee ?? "",
    year: paramAnnee ?? depart.annee,
    month: (paramMois ?? depart.mois).padStart(2, "0"),
  });
  // Ouvert depuis un lien : une première ligne (montant du panier par défaut,
  // les paramètres annuels n'étant pas encore chargés au premier rendu).
  const [lignes, setLignes] = useState<LignePrime[]>(() =>
    ouvertureDepuisLien
      ? [ligneVide("nbre_paniers", primeParId("nbre_paniers")?.montantDefaut)]
      : [],
  );
  // Variables en cours de modification (vide = création).
  const [cibles, setCibles] = useState<PayrollVariable[]>([]);

  // Paramètres annuels des primes (montant du panier, taux d'habillage…).
  const anneeForm = Number(form.year) || Number(depart.annee);
  const parametres = useParametresPaie(anneeForm);
  const parametresCourants = useParametresPaie(Number(depart.annee));
  const [paramModalOpen, setParamModalOpen] = useState(false);
  const [paramAnneeEdition, setParamAnneeEdition] = useState(depart.annee);
  const [paramSaisies, setParamSaisies] = useState<Record<string, string>>({});
  const parametresEdition = useParametresPaie(Number(paramAnneeEdition));

  const salarieForm = trouverSalarie(form.employeeId);
  const heuresPaie = useHeuresPaie({
    memberId: salarieForm?.id ?? "",
    matricule: salarieForm?.matricule,
    annee: form.year,
    mois: form.month,
  });
  const droitHabillage = salarieForm ? salarieForm.droitHabillage : null;
  const heuresAutoEffectives = droitHabillage === false ? 0 : heuresPaie.heures;

  // Ferme la liste des salariés au clic à l'extérieur.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        employeeSearchRef.current &&
        !employeeSearchRef.current.contains(event.target as Node)
      ) {
        setEmployeeSearchOpen(false);
        setEmployeeSearchQuery("");
      }
    };

    if (employeeSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [employeeSearchOpen]);

  const handleValidate = (variable: PayrollVariable, notes: string) => {
    updateVariableMutation.mutate({
      id: variable.id,
      data: { status: "validated", notes },
    });
  };

  const handleRefuse = (variable: PayrollVariable, notes: string) => {
    updateVariableMutation.mutate({
      id: variable.id,
      data: { status: "refused", notes },
    });
  };

  const fermerFormulaire = () => {
    setIsVariableModalOpen(false);
    setIsEditMode(false);
    setEmployeeSearchOpen(false);
    setEmployeeSearchQuery("");
    setCibles([]);
    setLignes([]);
  };

  const handleOpenCreateModal = () => {
    const now = maintenant();
    setIsEditMode(false);
    setSelectedVariable(null);
    setCibles([]);
    setForm({ employeeId: "", year: now.annee, month: now.mois });
    setLignes([
      ligneVide(
        "nbre_paniers",
        parametresCourants.montantPrime("nbre_paniers"),
      ),
    ]);
    setIsVariableModalOpen(true);
  };

  // Modifier : une variable (vue détaillée) ou toutes celles d'un salarié pour
  // un mois (vue « Par salarié »).
  const handleEditVariables = (aModifier: PayrollVariable[]) => {
    if (aModifier.length === 0) return;
    const [annee, mois] = aModifier[0].period.split("-");
    const salarie = trouverSalarie(aModifier[0].employeeId);
    setForm({
      employeeId: salarie?.id ?? aModifier[0].employeeId,
      year: annee,
      month: mois,
    });
    setLignes(
      aModifier.map((v) =>
        ligneDepuisVariable(v, parametresCourants.montantPrime(v.type)),
      ),
    );
    setCibles(aModifier);
    setIsEditMode(true);
    setIsVariableModalOpen(true);
  };

  const handleDeleteVariables = (
    aSupprimer: PayrollVariable[],
    message: string,
  ) => {
    if (!confirm(message)) return;
    aSupprimer.forEach((v) => deleteVariableMutation.mutate(v.id));
  };

  const handleSubmit = async () => {
    const period = `${form.year}-${form.month.padStart(2, "0")}-01`;
    const nom = salarieForm?.name ?? cibles[0]?.employeeName ?? "";
    const employeeId = salarieForm?.id ?? form.employeeId;
    if (!employeeId || !nom) return;

    setEnregistrement(true);
    try {
      const conservees = new Set<string>();
      const operations: Promise<unknown>[] = [];
      for (const ligne of lignes) {
        const total = totalLigne(ligne, heuresAutoEffectives);
        const description = encoderDescription(ligne, heuresAutoEffectives);
        if (ligne.recordId) {
          conservees.add(ligne.recordId);
          operations.push(
            updateVariableMutation.mutateAsync({
              id: ligne.recordId,
              data: {
                employeeId,
                employeeName: nom,
                period,
                type: ligne.primeId,
                amount: total,
                description,
              },
            }),
          );
        } else if (total > 0) {
          operations.push(
            createVariableMutation.mutateAsync({
              employeeId,
              employeeName: nom,
              period,
              type: ligne.primeId,
              amount: total,
              currency: "EUR",
              description,
              status: "pending",
            }),
          );
        }
      }
      // Lignes retirées du formulaire lors d'une modification groupée.
      for (const cible of cibles) {
        if (!conservees.has(cible.id)) {
          operations.push(deleteVariableMutation.mutateAsync(cible.id));
        }
      }
      await Promise.all(operations);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Échec de l'enregistrement : ${message}`);
      setEnregistrement(false);
      return;
    }
    setEnregistrement(false);
    fermerFormulaire();
  };

  const ouvrirParametres = () => {
    setParamAnneeEdition(depart.annee);
    setParamSaisies({});
    setParamModalOpen(true);
  };

  const enregistrerParametres = async () => {
    const valeurs: Record<string, number> = {};
    for (const [id, saisie] of Object.entries(paramSaisies)) {
      valeurs[cleMontantPrime(id)] = arrondi2(lireNombre(saisie));
    }
    try {
      if (Object.keys(valeurs).length > 0) {
        await parametresEdition.enregistrer(valeurs);
      }
      setParamModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Échec de l'enregistrement des paramètres : ${message}`);
    }
  };

  const filteredEmployees = salariesProposes.filter((s) =>
    `${s.name} ${s.matricule} ${s.poste}`
      .toLowerCase()
      .includes(employeeSearchQuery.toLowerCase()),
  );

  // ── Données du tableau ───────────────────────────────────────────────────
  // Les variables d'heures (h_*) ne sont pas des montants : elles servent au
  // calcul de l'habillage et n'entrent dans aucun total en euros.
  const primesDeclarees = variables.filter((v) => !v.type.startsWith("h_"));
  const periodes = Array.from(
    new Set(primesDeclarees.map((v) => v.period.slice(0, 7))),
  )
    .sort()
    .reverse();
  const filteredVariables =
    periodeFiltre === "all"
      ? primesDeclarees
      : primesDeclarees.filter((v) => v.period.startsWith(periodeFiltre));

  const eurosDe = (v: PayrollVariable) =>
    montantEuros(v, parametresCourants.montantPrime);

  const pivotRows = useMemo<LignePivot[]>(() => {
    const map = new Map<string, LignePivot>();
    for (const v of filteredVariables) {
      const salarie = trouverSalarie(v.employeeId);
      const employeeId = salarie?.id ?? v.employeeId;
      const mois = v.period.slice(0, 7);
      const cle = `${employeeId}|${mois}`;
      let row = map.get(cle);
      if (!row) {
        row = {
          cle,
          employeeId,
          employeeName: salarie?.name ?? v.employeeName,
          matricule: salarie?.matricule ?? "",
          resolu: Boolean(salarie),
          period: `${mois}-01`,
          montants: {},
          details: {},
          total: 0,
          enAttente: 0,
          variables: [],
        };
        map.set(cle, row);
      }
      row.variables.push(v);
      if (v.status === "pending") row.enAttente += 1;
      // Une ligne refusée reste visible dans le détail mais ne compte pas.
      if (v.status === "refused") continue;
      const col = colonneDe(v.type);
      const euros = eurosDe(v);
      row.montants[col] = arrondi2((row.montants[col] ?? 0) + euros);
      row.total = arrondi2(row.total + euros);
      const detail = detailCalcul(v);
      if (detail) (row.details[col] ??= []).push(detail);
    }
    return Array.from(map.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredVariables, tousSalaries, parametresCourants.montantPrime]);

  const totalMontant = arrondi2(
    filteredVariables
      .filter((v) => v.status !== "refused")
      .reduce((somme, v) => somme + eurosDe(v), 0),
  );
  const totalHabillage = arrondi2(
    filteredVariables
      .filter((v) => v.type === "indemnite_habillage" && v.status !== "refused")
      .reduce((somme, v) => somme + eurosDe(v), 0),
  );

  const pivotColumns: ColumnDef<LignePivot>[] = [
    {
      key: "employee",
      label: "Employé",
      icon: Users,
      sortable: true,
      sortValue: (r) => r.employeeName,
      render: (r) => (
        <div>
          {r.resolu ? (
            <Link
              href={`/dashboard/hr/collaborators/${r.employeeId}`}
              className="font-medium text-primary hover:underline"
            >
              {r.employeeName}
            </Link>
          ) : (
            <span className="font-medium">{r.employeeName}</span>
          )}
          <div className="text-sm text-muted-foreground">
            {r.matricule || r.employeeId}
          </div>
        </div>
      ),
    },
    {
      key: "period",
      label: "Période",
      icon: Calendar,
      sortable: true,
      sortValue: (r) => r.period,
      render: (r) => (
        <span className="text-sm capitalize">{libellePeriode(r.period)}</span>
      ),
    },
    ...COLONNES_PIVOT.map(
      (col): ColumnDef<LignePivot> => ({
        key: col.key,
        label: col.label,
        sortable: true,
        sortValue: (r) => r.montants[col.key] ?? 0,
        render: (r) => {
          const val = r.montants[col.key] ?? 0;
          const details = r.details[col.key] ?? [];
          return (
            <div className={val ? "" : "text-muted-foreground"}>
              <span className="flex items-center">
                {col.key === "indemnite_habillage" && val > 0 && (
                  <Shirt className="mr-1 inline h-3 w-3 text-purple-500" />
                )}
                {formaterEuros(val)}
              </span>
              {details.length === 1 && (
                <div className="text-xs text-muted-foreground">
                  {details[0]}
                </div>
              )}
            </div>
          );
        },
      }),
    ),
    {
      key: "total",
      label: "Total (€)",
      sortable: true,
      sortValue: (r) => r.total,
      render: (r) => (
        <div>
          <span className="font-medium">{formaterEuros(r.total)}</span>
          {r.enAttente > 0 && (
            <div className="text-xs text-muted-foreground">
              dont {r.enAttente} en attente
            </div>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: LignePivot) => (
        <RowActionsMenu
          onView={() => setDetailLigne(row)}
          onEdit={() => handleEditVariables(row.variables)}
          onDelete={() =>
            handleDeleteVariables(
              row.variables,
              `Supprimer toutes les variables de ${row.employeeName} pour ${libellePeriode(row.period)} ?`,
            )
          }
        />
      ),
    },
  ];

  const individualColumns: ColumnDef<PayrollVariable>[] = [
    {
      key: "employee",
      label: "Employé",
      icon: Users,
      sortable: true,
      sortValue: (item) => item.employeeName,
      render: (item) => {
        const salarie = trouverSalarie(item.employeeId);
        return (
          <div>
            <div className="font-medium">
              {salarie ? (
                <Link
                  href={`/dashboard/hr/collaborators/${salarie.id}`}
                  className="text-primary hover:underline"
                >
                  {salarie.name}
                </Link>
              ) : (
                item.employeeName
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {salarie?.matricule || item.employeeId}
            </div>
          </div>
        );
      },
    },
    {
      key: "period",
      label: "Période",
      icon: Calendar,
      sortable: true,
      render: (item) => (
        <span className="text-sm capitalize">
          {libellePeriode(item.period)}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (item) => (
        <span className="flex items-center gap-1">
          {item.type === "indemnite_habillage" && (
            <Shirt className="h-3 w-3 text-purple-500" />
          )}
          {libelleVariable(item.type)}
        </span>
      ),
    },
    {
      key: "calcul",
      label: "Calcul",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {detailCalcul(item) || item.description || "—"}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Montant",
      sortable: true,
      sortValue: (item) => eurosDe(item),
      render: (item) => (
        <span className="font-medium">{formaterEuros(eurosDe(item))}</span>
      ),
    },
    {
      key: "validated",
      label: "Statut",
      sortable: true,
      render: (item) => (
        <Badge variant={varianteStatut(item.status)}>
          {libelleStatut(item.status)}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: PayrollVariable) => (
        <RowActionsMenu
          onView={() => {
            setSelectedVariable(item);
            setIsViewModalOpen(true);
          }}
          onEdit={() => handleEditVariables([item])}
          onDelete={() =>
            handleDeleteVariables([item], "Supprimer cette variable ?")
          }
        />
      ),
    },
  ];

  const anneeParam = paramAnneeEdition;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Variables de paie
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Gestion des primes, indemnités et majorations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={ouvrirParametres}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Paramètres des primes
          </Button>
          <Button onClick={handleOpenCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle variable
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Euro}
          title="Total déclarations"
          value={filteredVariables.length}
          subtext="Déclarations"
          color="gray"
        />

        <InfoCard
          icon={Clock}
          title="En attente de validation"
          value={filteredVariables.filter((v) => v.status === "pending").length}
          subtext="À valider"
          color="orange"
        />

        <InfoCard
          icon={Euro}
          title="Montant total"
          value={formaterEuros(totalMontant)}
          subtext="Hors variables refusées"
          color="blue"
        />

        <InfoCard
          icon={Shirt}
          title="Indemnités habillage"
          value={formaterEuros(totalHabillage)}
          subtext="Heures de paie × taux"
          color="purple"
        />

        <InfoCard
          icon={CheckCircle}
          title="Taux de validation"
          value={`${
            filteredVariables.length > 0
              ? Math.round(
                  (filteredVariables.filter((v) => v.status === "validated")
                    .length /
                    filteredVariables.length) *
                    100,
                )
              : 0
          }%`}
          subtext="Variables validées"
          color="green"
        />
      </InfoCardContainer>

      {/* Bascule de vue + période */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "consolidated" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("consolidated")}
          >
            Par salarié
          </Button>
          <Button
            variant={viewMode === "detailed" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("detailed")}
          >
            Détaillé
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Période</Label>
          <Select value={periodeFiltre} onValueChange={setPeriodeFiltre}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les périodes</SelectItem>
              {periodes.map((p) => (
                <SelectItem key={p} value={p}>
                  <span className="capitalize">
                    {libellePeriode(`${p}-01`)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === "consolidated" ? (
        <DataTable
          data={pivotRows}
          columns={pivotColumns}
          searchKeys={["employeeName"]}
          getSearchValue={(r) => r.employeeName}
          searchPlaceholder="Rechercher par employé..."
          getRowId={(r) => r.cle}
        />
      ) : (
        <DataTable
          data={filteredVariables}
          columns={individualColumns}
          searchKeys={["employeeName"]}
          getSearchValue={(item) => item.employeeName}
          searchPlaceholder="Rechercher par employé..."
          getRowId={(item) => item.id}
          filters={[
            {
              key: "status",
              label: "Statut",
              options: [
                { value: "all", label: "Tous" },
                { value: "validated", label: "Validé" },
                { value: "pending", label: "En attente" },
                { value: "refused", label: "Refusé" },
              ],
            },
            {
              key: "type",
              label: "Type",
              options: [
                { value: "all", label: "Tous" },
                ...PRIMES.map((p) => ({ value: p.id, label: p.label })),
              ],
            },
          ]}
          groupBy={groupBy}
          groupByOptions={[
            { value: "employeeName", label: "Employé" },
            { value: "period", label: "Période" },
            { value: "type", label: "Type" },
          ]}
          groupByLabel={(value: unknown) => {
            if (groupBy === "period") return libellePeriode(value as string);
            if (groupBy === "type") return libelleVariable(value as string);
            return value as string;
          }}
          onGroupByChange={setGroupBy}
        />
      )}

      {/* Détail d'une ligne « Par salarié » */}
      <Modal
        open={detailLigne !== null}
        onOpenChange={(open) => {
          if (!open) setDetailLigne(null);
        }}
        type="details"
        title="Variables de paie du salarié"
        size="lg"
      >
        {detailLigne && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Employé</Label>
                <p className="text-sm text-muted-foreground">
                  {detailLigne.employeeName}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Période</Label>
                <p className="text-sm capitalize text-muted-foreground">
                  {libellePeriode(detailLigne.period)}
                </p>
              </div>
            </div>
            <div className="divide-y rounded-lg border">
              {detailLigne.variables.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-4 p-3"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {libelleVariable(v.type)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {detailCalcul(v) || v.description || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={varianteStatut(v.status)}>
                      {libelleStatut(v.status)}
                    </Badge>
                    <span className="w-24 text-right text-sm font-medium">
                      {formaterEuros(eurosDe(v))}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDetailLigne(null);
                        setSelectedVariable(v);
                        setIsViewModalOpen(true);
                      }}
                    >
                      Détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm">
              <span>Total (hors lignes refusées)</span>
              <span className="text-base font-bold text-primary">
                {formaterEuros(detailLigne.total)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* View Variable Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de la variable de paie"
        size="md"
      >
        {selectedVariable && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Employé</Label>
                <p className="text-sm text-muted-foreground">
                  <Link
                    href={`/dashboard/hr/collaborators/${trouverSalarie(selectedVariable.employeeId)?.id ?? selectedVariable.employeeId}`}
                    className="text-primary hover:underline"
                  >
                    {trouverSalarie(selectedVariable.employeeId)?.name ??
                      selectedVariable.employeeName}
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  {trouverSalarie(selectedVariable.employeeId)?.matricule ||
                    selectedVariable.employeeId}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  {selectedVariable.type === "indemnite_habillage" && (
                    <Shirt className="h-4 w-4 text-purple-500" />
                  )}
                  {libelleVariable(selectedVariable.type)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Période</Label>
                <p className="text-sm capitalize text-muted-foreground">
                  {libellePeriode(selectedVariable.period)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Montant</Label>
                <p className="text-sm font-medium">
                  {formaterEuros(eurosDe(selectedVariable))}
                </p>
                {detailCalcul(selectedVariable) && (
                  <p className="text-xs text-muted-foreground">
                    {detailCalcul(selectedVariable)}
                  </p>
                )}
              </div>
            </div>

            {selectedVariable.description &&
              !detailCalcul(selectedVariable) && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedVariable.description}
                  </p>
                </div>
              )}

            {selectedVariable.type === "indemnite_habillage" && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/20">
                <div className="flex items-start gap-2">
                  <Shirt className="mt-0.5 h-4 w-4 text-purple-600" />
                  <div className="text-sm">
                    <p className="font-medium text-purple-900 dark:text-purple-100">
                      Indemnité d&apos;habillage
                    </p>
                    <p className="text-purple-700 dark:text-purple-300">
                      Heures de paie × taux d&apos;habillage, ou heures saisies
                      manuellement en cas d&apos;absence.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <div className="mt-1">
                  <Badge variant={varianteStatut(selectedVariable.status)}>
                    {libelleStatut(selectedVariable.status)}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  {selectedVariable.status === "validated"
                    ? "Validé par"
                    : selectedVariable.status === "refused"
                      ? "Refusé par"
                      : "Traité par"}
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedVariable.processedBy || "-"}
                </p>
              </div>
            </div>

            {selectedVariable.notes && (
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedVariable.notes}
                </p>
              </div>
            )}

            {selectedVariable.status === "pending" && (
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Notes</Label>
                <div className="mt-2 space-y-4">
                  <Textarea
                    placeholder="Ajouter des notes..."
                    value={validationNotes}
                    onChange={(e) => setValidationNotes(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleValidate(selectedVariable, validationNotes);
                        setIsViewModalOpen(false);
                        setValidationNotes("");
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Valider
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleRefuse(selectedVariable, validationNotes);
                        setIsViewModalOpen(false);
                        setValidationNotes("");
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Refuser
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                Créée le{" "}
                {selectedVariable.createdAt.toLocaleDateString("fr-FR")}
                {selectedVariable.status !== "pending" &&
                  selectedVariable.processedBy && (
                    <span> par {selectedVariable.processedBy}</span>
                  )}
              </div>
              <div>
                {selectedVariable.processedAt
                  ? `Traitée le ${selectedVariable.processedAt.toLocaleDateString("fr-FR")}`
                  : `Modifiée le ${selectedVariable.updatedAt.toLocaleDateString("fr-FR")}`}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Variable Modal (Create/Edit) */}
      <Modal
        open={isVariableModalOpen}
        onOpenChange={(open) => {
          if (open) setIsVariableModalOpen(true);
          else fermerFormulaire();
        }}
        type="form"
        title={
          isEditMode
            ? "Modifier les variables de paie"
            : "Nouvelle déclaration de variables de paie"
        }
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: fermerFormulaire,
            variant: "outline",
          },
          primary: {
            label: isEditMode ? "Mettre à jour" : "Créer les variables",
            onClick: handleSubmit,
            loading: enregistrement,
            disabled:
              enregistrement ||
              !(salarieForm || cibles.length > 0) ||
              !lignes.some(
                (l) => l.recordId || totalLigne(l, heuresAutoEffectives) > 0,
              ),
          },
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">
              Employé <span className="text-destructive">*</span>
            </Label>
            <div className="relative" ref={employeeSearchRef}>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setEmployeeSearchOpen(!employeeSearchOpen)}
              >
                {salarieForm?.name ||
                  cibles[0]?.employeeName ||
                  "Sélectionner un employé"}
                <Users className="h-4 w-4 opacity-50" />
              </Button>
              {employeeSearchOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
                  <div className="p-2">
                    <Input
                      placeholder="Rechercher un employé..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="mb-2"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((salarie) => (
                        <button
                          key={salarie.id}
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              employeeId: salarie.id,
                            }));
                            setEmployeeSearchOpen(false);
                            setEmployeeSearchQuery("");
                          }}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                            {salarie.name
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{salarie.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {salarie.matricule} • {salarie.poste}
                            </div>
                          </div>
                          {salarie.droitHabillage && (
                            <Badge variant="outline" className="text-xs">
                              <Shirt className="mr-1 h-3 w-3" />
                              Indemnité habillage
                            </Badge>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Aucun employé trouvé
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Année</Label>
              <Select
                value={form.year}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, year: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'année" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = (new Date().getFullYear() - 5 + i).toString();
                    return (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Mois</Label>
              <Select
                value={form.month}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, month: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le mois" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, "0");
                    const monthName = new Date(2000, i, 1).toLocaleDateString(
                      "fr-FR",
                      { month: "long" },
                    );
                    return (
                      <SelectItem key={month} value={month}>
                        <span className="capitalize">{monthName}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <PrimeLinesEditor
            lignes={lignes}
            onChange={setLignes}
            montantPrime={parametres.montantPrime}
            heuresAuto={heuresPaie.heures}
            sourceHeures={heuresPaie.source}
            droitHabillage={droitHabillage}
            multiLignes={!isEditMode || cibles.length !== 1}
          />
        </div>
      </Modal>

      {/* Paramètres annuels des primes */}
      <Modal
        open={paramModalOpen}
        onOpenChange={setParamModalOpen}
        type="form"
        title="Paramètres des primes"
        description="Montants unitaires proposés à la saisie. Ils changent chaque année : à défaut de réglage pour une année, le dernier montant connu est repris."
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setParamModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Enregistrer",
            onClick: enregistrerParametres,
            loading: parametresEdition.enCours,
            disabled: Object.keys(paramSaisies).length === 0,
          },
        }}
      >
        <div className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label>Année</Label>
            <Select
              value={anneeParam}
              onValueChange={(v) => {
                setParamAnneeEdition(v);
                setParamSaisies({});
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) =>
                  (Number(depart.annee) - 2 + i).toString(),
                ).map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {parametresEdition.isError && (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Les paramètres enregistrés n&apos;ont pas pu être lus : les
              montants par défaut sont affichés.
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PRIMES.filter((p) => p.montantDefaut > 0 || p.annuel).map((p) => (
              <div key={p.id} className="space-y-2">
                <Label>
                  {p.label} — {p.montantLabel}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    paramSaisies[p.id] ??
                    versSaisie(parametresEdition.montantPrime(p.id))
                  }
                  onChange={(e) =>
                    setParamSaisies((prev) => ({
                      ...prev,
                      [p.id]: e.target.value,
                    }))
                  }
                />
                {p.aide && (
                  <p className="text-xs text-muted-foreground">{p.aide}</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {primeParId("indemnite_habillage")?.aide}
          </p>
        </div>
      </Modal>
    </div>
  );
}
