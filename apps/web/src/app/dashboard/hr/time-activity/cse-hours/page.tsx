"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { useEmployeeOptions } from "@/hooks/employees";
import { useRegistre } from "@/hooks/fiscal";
import {
  ROLES_CSE,
  libelleRoleCse,
  useRolesCse,
  type EluCse,
  type RoleCse,
} from "@/hooks/fiscal/use-cse-roles";
import { BADGE_TONS } from "@/lib/hr-status-badges";
import { useSession } from "@/lib/auth-client";
import { exporterCsvExcel } from "@/lib/export-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard } from "@/components/ui/info-card";
import { GrilleKpi } from "../_components/OutilsTableau";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoursInput } from "@/components/ui/hours-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { EmployeePicker } from "../_components/EmployeePicker";
import {
  AUCUN_FICHIER,
  aujourdhuiIso,
  formaterDate,
  formaterDateHeure,
  messageErreur,
} from "../_components/temps";

type TypeSeance = "meeting" | "employee_reception" | "other" | "training";
type StatutSeance = "pending" | "approved" | "rejected";

/** Séance de délégation, enregistrée en base (registre `seance_cse`). */
interface SeanceCse {
  id: string;
  employeeId: string;
  employeeName: string;
  /** « AAAA-MM-JJ » */
  date: string;
  duration: number;
  type: TypeSeance;
  description: string;
  status: StatutSeance;
  validatedBy?: string;
  validatedAt?: string;
  validationComment?: string;
  createdAt: string;
}

const TYPES_SEANCE: { value: TypeSeance; label: string; classe: string }[] = [
  { value: "meeting", label: "Réunion", classe: BADGE_TONS.bleu },
  {
    value: "employee_reception",
    label: "Réception salariés",
    classe: BADGE_TONS.bleu,
  },
  { value: "training", label: "Formation", classe: BADGE_TONS.bleu },
  { value: "other", label: "Autre", classe: BADGE_TONS.gris },
];

const STATUTS_SEANCE: Record<
  StatutSeance,
  { label: string; classe: string; icone: typeof Clock }
> = {
  pending: { label: "En attente", classe: BADGE_TONS.orange, icone: Clock },
  approved: { label: "Validée", classe: BADGE_TONS.vert, icone: CheckCircle },
  rejected: { label: "Refusée", classe: BADGE_TONS.rouge, icone: XCircle },
};

const libelleType = (t: string) =>
  TYPES_SEANCE.find((x) => x.value === t)?.label ?? t;

interface FormSeance {
  employeeId: string;
  date: string;
  duration: number;
  type: TypeSeance;
  description: string;
}

const formSeanceVide = (): FormSeance => ({
  employeeId: "",
  date: aujourdhuiIso(),
  duration: 0,
  type: "meeting",
  description: "",
});

interface FormRole {
  employeeId: string;
  role: RoleCse;
  startDate: string;
  endDate: string;
  hours: string;
}

const heuresDuRole = (role: RoleCse) =>
  String(ROLES_CSE.find((r) => r.value === role)?.heuresParDefaut ?? 0);

const formRoleVide = (): FormRole => ({
  employeeId: "",
  role: "titulaire",
  startDate: aujourdhuiIso(),
  endDate: "",
  hours: heuresDuRole("titulaire"),
});

const libelleRoles = (roles: RoleCse[]) => roles.map(libelleRoleCse).join(", ");

export default function CSEHoursPage() {
  const { data: session } = useSession();
  const auteur =
    session?.user?.name || session?.user?.email || "Administrateur";

  const salaries = useEmployeeOptions();
  const cse = useRolesCse();
  const registre = useRegistre<SeanceCse>("seance_cse", AUCUN_FICHIER);
  const seances = registre.lignes;
  const elus = cse.elus;

  const [seanceOuverte, setSeanceOuverte] = useState(false);
  const [seanceEnEdition, setSeanceEnEdition] = useState<SeanceCse | null>(
    null,
  );
  const [formSeance, setFormSeance] = useState<FormSeance>(formSeanceVide());
  const [erreurSeance, setErreurSeance] = useState<string | null>(null);

  const [roleOuvert, setRoleOuvert] = useState(false);
  /** Vrai quand le dialogue de rôle a été ouvert depuis le formulaire de séance. */
  const [roleDepuisSeance, setRoleDepuisSeance] = useState(false);
  const [formRole, setFormRole] = useState<FormRole>(formRoleVide());
  const [erreurRole, setErreurRole] = useState<string | null>(null);

  const [erreurPage, setErreurPage] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [aSupprimer, setASupprimer] = useState<SeanceCse | null>(null);
  const [enCours, setEnCours] = useState(false);

  const detail = seances.find((s) => s.id === detailId) ?? null;

  const moisCourant = aujourdhuiIso().slice(0, 7);
  const eluDe = (employeeId: string): EluCse | undefined =>
    elus.find((e) => e.employeeId === employeeId);
  const heuresUtilisees = (employeeId: string, mois: string) =>
    seances
      .filter(
        (s) =>
          s.employeeId === employeeId &&
          s.date.startsWith(mois) &&
          s.status !== "rejected",
      )
      .reduce((somme, s) => somme + (s.duration || 0), 0);

  const seancesDuMois = seances.filter((s) => s.date.startsWith(moisCourant));
  const totalAlloue = elus.reduce((s, e) => s + e.delegationHours, 0);
  const totalUtilise = elus.reduce(
    (s, e) => s + heuresUtilisees(e.employeeId, moisCourant),
    0,
  );

  // Rôle déjà tenu par le salarié : on n'enregistre pas deux fois le même.
  const roleDejaAttribue =
    !!formRole.employeeId &&
    cse.roles.some(
      (r) =>
        r.employeeId === formRole.employeeId &&
        r.role === formRole.role &&
        (!r.endDate || r.endDate >= aujourdhuiIso()),
    );
  const heuresRole = Number(formRole.hours);
  const roleValide =
    !!formRole.employeeId &&
    !!formRole.startDate &&
    (!formRole.endDate || formRole.endDate >= formRole.startDate) &&
    Number.isFinite(heuresRole) &&
    heuresRole >= 0 &&
    !roleDejaAttribue;

  const optionsSalaries = useMemo(
    () =>
      salaries.map((s) => ({
        id: s.id,
        name: s.name,
        detail: [s.matricule, s.poste].filter(Boolean).join(" - "),
      })),
    [salaries],
  );

  const eluChoisi = eluDe(formSeance.employeeId);
  const restantChoisi = eluChoisi
    ? eluChoisi.delegationHours -
      (heuresUtilisees(eluChoisi.employeeId, formSeance.date.slice(0, 7)) -
        (seanceEnEdition &&
        seanceEnEdition.employeeId === eluChoisi.employeeId &&
        seanceEnEdition.date.startsWith(formSeance.date.slice(0, 7)) &&
        seanceEnEdition.status !== "rejected"
          ? seanceEnEdition.duration
          : 0))
    : 0;
  const seanceValide =
    !!formSeance.employeeId && !!formSeance.date && formSeance.duration > 0;

  const ouvrirCreation = () => {
    setSeanceEnEdition(null);
    setFormSeance(formSeanceVide());
    setErreurSeance(null);
    setSeanceOuverte(true);
  };

  const ouvrirEdition = (s: SeanceCse) => {
    setSeanceEnEdition(s);
    setFormSeance({
      employeeId: s.employeeId,
      date: s.date,
      duration: s.duration,
      type: s.type,
      description: s.description ?? "",
    });
    setErreurSeance(null);
    setSeanceOuverte(true);
  };

  const ouvrirAssignation = (depuisSeance: boolean) => {
    setFormRole(formRoleVide());
    setErreurRole(null);
    setRoleDepuisSeance(depuisSeance);
    // Le formulaire de séance est masqué, pas réinitialisé : on le rouvre
    // à la fermeture du dialogue de rôle.
    if (depuisSeance) setSeanceOuverte(false);
    setRoleOuvert(true);
  };

  const fermerAssignation = () => {
    setRoleOuvert(false);
    if (roleDepuisSeance) setSeanceOuverte(true);
    setRoleDepuisSeance(false);
  };

  const enregistrerRole = async () => {
    if (!roleValide) return;
    const salarie = salaries.find((s) => s.id === formRole.employeeId);
    if (!salarie) {
      setErreurRole("Salarié introuvable : rechargez la page.");
      return;
    }
    setEnCours(true);
    setErreurRole(null);
    try {
      await cse.enregistrer(
        {
          // Identifiant provisoire : le serveur en attribue un à la création.
          id: "nouveau",
          employeeId: salarie.id,
          employeeName: salarie.name,
          role: formRole.role,
          startDate: formRole.startDate,
          ...(formRole.endDate ? { endDate: formRole.endDate } : {}),
          delegationHours: heuresRole,
          isElected:
            ROLES_CSE.find((r) => r.value === formRole.role)?.elu ?? true,
        },
        {
          period: formRole.startDate.slice(0, 7),
          label: `${salarie.name} — ${libelleRoleCse(formRole.role)}`,
        },
      );
      // L'élu vient d'être ajouté : on le présélectionne dans la séance.
      if (roleDepuisSeance) {
        setFormSeance((f) => ({ ...f, employeeId: salarie.id }));
      }
      fermerAssignation();
    } catch (e) {
      setErreurRole(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  const enregistrerSeance = async (
    seance: SeanceCse,
    onErreur: (m: string) => void,
  ): Promise<boolean> => {
    setEnCours(true);
    try {
      await registre.enregistrer(seance, {
        period: seance.date.slice(0, 7),
        label: `${seance.employeeName} — ${libelleType(seance.type)}`,
        status: seance.status,
      });
      return true;
    } catch (e) {
      onErreur(messageErreur(e));
      return false;
    } finally {
      setEnCours(false);
    }
  };

  const soumettreSeance = async () => {
    if (!seanceValide) return;
    let seance: SeanceCse;
    if (seanceEnEdition) {
      seance = {
        ...seanceEnEdition,
        date: formSeance.date,
        duration: formSeance.duration,
        type: formSeance.type,
        description: formSeance.description.trim(),
      };
    } else {
      const elu = eluDe(formSeance.employeeId);
      if (!elu) {
        setErreurSeance("Cet élu n'a plus de mandat en cours.");
        return;
      }
      seance = {
        // Identifiant provisoire : le serveur en attribue un à la création.
        id: "nouvelle",
        employeeId: elu.employeeId,
        employeeName: elu.employeeName,
        date: formSeance.date,
        duration: formSeance.duration,
        type: formSeance.type,
        description: formSeance.description.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };
    }
    setErreurSeance(null);
    if (await enregistrerSeance(seance, setErreurSeance)) {
      setSeanceOuverte(false);
      setSeanceEnEdition(null);
      setFormSeance(formSeanceVide());
    }
  };

  const changerStatut = async (
    s: SeanceCse,
    statut: StatutSeance,
    avis?: string,
  ) => {
    setErreurPage(null);
    const decision = statut !== "pending";
    const ok = await enregistrerSeance(
      {
        ...s,
        status: statut,
        validatedBy: decision ? auteur : undefined,
        validatedAt: decision ? new Date().toISOString() : undefined,
        validationComment: decision ? (avis ?? "") : undefined,
      },
      setErreurPage,
    );
    if (ok && detailId === s.id) {
      setDetailId(null);
      setCommentaire("");
    }
  };

  const confirmerSuppression = async () => {
    if (!aSupprimer) return;
    setErreurPage(null);
    setEnCours(true);
    try {
      await registre.supprimerLigne(aSupprimer.id);
      if (detailId === aSupprimer.id) setDetailId(null);
    } catch (e) {
      setErreurPage(messageErreur(e));
    } finally {
      setASupprimer(null);
      setEnCours(false);
    }
  };

  const exporter = () =>
    exporterCsvExcel(
      "heures-delegation-cse",
      [
        { titre: "Élu", valeur: (s: SeanceCse) => s.employeeName },
        { titre: "Date", valeur: (s) => formaterDate(s.date) },
        { titre: "Type", valeur: (s) => libelleType(s.type) },
        { titre: "Description", valeur: (s) => s.description },
        { titre: "Durée (h)", valeur: (s) => s.duration },
        { titre: "Statut", valeur: (s) => STATUTS_SEANCE[s.status]?.label },
      ],
      seances,
    );

  const badgeStatut = (statut: StatutSeance) => {
    const c = STATUTS_SEANCE[statut] ?? STATUTS_SEANCE.pending;
    const Icone = c.icone;
    return (
      <Badge variant="outline" className={`w-fit ${c.classe}`}>
        <Icone className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  const colonnesSeances: ColumnDef<SeanceCse>[] = [
    {
      key: "employeeName",
      label: "Élu CSE",
      sortable: true,
      render: (s) => {
        const elu = eluDe(s.employeeId);
        return (
          <div className="min-w-0">
            <p className="truncate font-semibold">{s.employeeName}</p>
            {elu && (
              <Badge variant="outline" className="mt-1 text-xs">
                {libelleRoles(elu.roles)}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span className="text-sm">{formaterDate(s.date)}</span>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      sortValue: (s) => libelleType(s.type),
      render: (s) => (
        <Badge
          variant="outline"
          className={
            TYPES_SEANCE.find((t) => t.value === s.type)?.classe ??
            BADGE_TONS.gris
          }
        >
          {libelleType(s.type)}
        </Badge>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (s) => (
        <span className="block max-w-xs truncate text-sm">{s.description}</span>
      ),
    },
    {
      key: "duration",
      label: "Durée",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span className="font-semibold">{s.duration} h</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      sortValue: (s) => STATUTS_SEANCE[s.status]?.label ?? s.status,
      render: (s) => badgeStatut(s.status),
    },
  ];

  const colonnesElus: ColumnDef<EluCse>[] = [
    {
      key: "employeeName",
      label: "Élu",
      sortable: true,
      render: (e) => <span className="font-semibold">{e.employeeName}</span>,
    },
    {
      key: "roles",
      label: "Rôle",
      render: (e) => (
        <Badge variant="outline" className="text-xs">
          {libelleRoles(e.roles)}
        </Badge>
      ),
    },
    {
      key: "delegationHours",
      label: "Crédit mensuel",
      sortable: true,
      render: (e) => <span>{e.delegationHours} h</span>,
    },
    {
      key: "utilise",
      label: "Utilisé ce mois",
      render: (e) => (
        <span>{heuresUtilisees(e.employeeId, moisCourant)} h</span>
      ),
    },
    {
      key: "restant",
      label: "Restant",
      render: (e) => {
        const restant =
          e.delegationHours - heuresUtilisees(e.employeeId, moisCourant);
        return (
          <span
            className={
              restant < 0 ? "font-semibold text-red-600" : "font-semibold"
            }
          >
            {restant} h
          </span>
        );
      },
    },
  ];

  const actionsSeance = (s: SeanceCse) => (
    <RowActionsMenu
      onView={() => {
        setCommentaire("");
        setDetailId(s.id);
      }}
      onEdit={() => ouvrirEdition(s)}
      onDelete={() => setASupprimer(s)}
      extraItems={
        s.status === "pending"
          ? [
              {
                label: "Approuver",
                icon: CheckCircle,
                tone: "validate" as const,
                onClick: () => void changerStatut(s, "approved"),
                separatorBefore: true,
              },
              {
                label: "Refuser",
                icon: XCircle,
                tone: "delete" as const,
                destructive: true,
                onClick: () => void changerStatut(s, "rejected"),
              },
            ]
          : [
              {
                label: "Remettre en attente",
                icon: Clock,
                tone: "neutral" as const,
                onClick: () => void changerStatut(s, "pending"),
                separatorBefore: true,
              },
            ]
      }
    />
  );

  const eluDetail = detail ? eluDe(detail.employeeId) : undefined;
  const moisDetail = detail ? detail.date.slice(0, 7) : moisCourant;
  const utiliseDetail = detail
    ? heuresUtilisees(detail.employeeId, moisDetail)
    : 0;
  const alloueDetail = eluDetail?.delegationHours ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Heures de Délégation CSE
          </h1>
          <p className="text-muted-foreground">
            Suivi des heures des élus et représentants du personnel
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => ouvrirAssignation(false)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assigner un rôle CSE
          </Button>
          <Button onClick={ouvrirCreation}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle séance
          </Button>
        </div>
      </div>

      {erreurPage && (
        <div
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {erreurPage}
        </div>
      )}

      <GrilleKpi colonnes={4}>
        <InfoCard
          compact
          icon={Users}
          title="Élus CSE"
          value={elus.length}
          subtext="Mandats en cours"
          color="gray"
        />
        <InfoCard
          compact
          icon={Clock}
          title="Heures allouées"
          value={`${totalAlloue} h`}
          subtext="Crédit mensuel total"
          color="blue"
        />
        <InfoCard
          compact
          icon={CheckCircle}
          title="Heures utilisées"
          value={`${totalUtilise} h`}
          subtext={`${
            totalAlloue > 0 ? Math.round((totalUtilise / totalAlloue) * 100) : 0
          }% du crédit ce mois-ci`}
          color="green"
        />
        <InfoCard
          compact
          icon={Calendar}
          title="Séances"
          value={seancesDuMois.length}
          subtext="Ce mois-ci"
          color="orange"
        />
      </GrilleKpi>

      {!cse.isLoading && elus.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">Aucun élu CSE enregistré</p>
              <p className="mx-auto max-w-xl text-sm text-muted-foreground">
                La liste des élus se construit à partir des salariés ayant un
                rôle CSE. Assignez un rôle (titulaire, suppléant, secrétaire…) à
                un salarié ici ou depuis l&apos;onglet « CSE » de son dossier :
                il apparaîtra alors dans « Nouvelle séance ».
              </p>
            </div>
            <Button onClick={() => ouvrirAssignation(false)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Assigner un rôle CSE
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Élus et crédit d&apos;heures</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={elus}
              isLoading={cse.isLoading}
              columns={colonnesElus}
              getRowId={(e) => e.employeeId}
              itemsPerPage={10}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Séances de délégation CSE</CardTitle>
          <Button
            variant="outline"
            onClick={exporter}
            disabled={seances.length === 0}
          >
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={seances}
            isLoading={registre.isLoading}
            columns={colonnesSeances}
            onRowClick={(s) => {
              setCommentaire("");
              setDetailId(s.id);
            }}
            searchKeys={["employeeName", "description"]}
            searchPlaceholder="Rechercher par élu ou description..."
            itemsPerPage={10}
            filters={[
              {
                key: "type",
                label: "Type",
                options: [
                  { value: "all", label: "Tous" },
                  ...TYPES_SEANCE.map((t) => ({
                    value: t.value,
                    label: t.label,
                  })),
                ],
              },
              {
                key: "status",
                label: "Statut",
                options: [
                  { value: "all", label: "Tous" },
                  { value: "approved", label: "Validées" },
                  { value: "pending", label: "En attente" },
                  { value: "rejected", label: "Refusées" },
                ],
              },
            ]}
            actions={actionsSeance}
          />
          {!registre.isLoading && seances.length === 0 && (
            <p className="pt-2 text-center text-sm text-muted-foreground">
              Aucune séance enregistrée. Utilisez « Nouvelle séance » pour en
              déclarer une.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Détails et validation */}
      <Modal
        open={!!detail}
        onOpenChange={(ouvert) => {
          if (!ouvert) {
            setDetailId(null);
            setCommentaire("");
          }
        }}
        type="details"
        title={detail ? `Séance CSE — ${detail.employeeName}` : "Séance CSE"}
        description={
          detail
            ? `${libelleType(detail.type)} du ${formaterDate(detail.date)}`
            : ""
        }
        actions={
          detail?.status === "pending"
            ? {
                secondary: {
                  label: "Fermer",
                  onClick: () => setDetailId(null),
                  variant: "outline",
                },
                primary: {
                  label: "Approuver",
                  disabled: enCours,
                  onClick: () =>
                    void changerStatut(detail, "approved", commentaire),
                },
                tertiary: {
                  label: "Refuser",
                  variant: "destructive",
                  disabled: enCours,
                  onClick: () =>
                    void changerStatut(detail, "rejected", commentaire),
                },
              }
            : {
                secondary: {
                  label: "Fermer",
                  onClick: () => setDetailId(null),
                  variant: "outline",
                },
              }
        }
      >
        {detail && (
          <div className="space-y-6">
            <div className="flex justify-center">
              {badgeStatut(detail.status)}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Date
                </span>
                <p className="mt-1 font-medium">{formaterDate(detail.date)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Durée
                </span>
                <p className="mt-1 font-medium">{detail.duration} h</p>
              </div>
            </div>

            {detail.description && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Description
                </span>
                <p className="mt-1">{detail.description}</p>
              </div>
            )}

            <div className="rounded-lg bg-muted/30 p-3">
              <p className="font-semibold">{detail.employeeName}</p>
              <p className="text-sm text-muted-foreground">
                {eluDetail ? libelleRoles(eluDetail.roles) : "Mandat terminé"}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">
                Utilisation des heures — {moisDetail}
              </h4>
              {eluDetail && alloueDetail > 0 ? (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                      <span className="text-sm">Allouées</span>
                      <span className="font-semibold">{alloueDetail} h</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                      <span className="text-sm">Utilisées</span>
                      <span className="font-semibold">{utiliseDetail} h</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                      <span className="text-sm">Restantes</span>
                      <span className="font-semibold">
                        {alloueDetail - utiliseDetail} h
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(100, (utiliseDetail / alloueDetail) * 100)}
                    className="h-2"
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun crédit d&apos;heures mensuel enregistré pour cet élu (
                  {utiliseDetail} h déclarées ce mois-là).
                </p>
              )}
            </div>

            {detail.status === "pending" && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Commentaire (optionnel)
                </Label>
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  rows={3}
                />
              </div>
            )}

            {detail.status !== "pending" && detail.validatedAt && (
              <div className="space-y-2">
                <p className="font-medium">
                  {STATUTS_SEANCE[detail.status]?.label}
                  {detail.validatedBy ? ` par ${detail.validatedBy}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  Le {formaterDateHeure(detail.validatedAt)}
                </p>
                {detail.validationComment && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    {detail.validationComment}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Nouvelle séance / modification */}
      <Modal
        open={seanceOuverte}
        onOpenChange={(ouvert) => {
          setSeanceOuverte(ouvert);
          if (!ouvert) {
            setSeanceEnEdition(null);
            setFormSeance(formSeanceVide());
          }
        }}
        type="form"
        size="lg"
        title={
          seanceEnEdition ? "Modifier la séance CSE" : "Nouvelle séance CSE"
        }
        description={
          seanceEnEdition
            ? "Modifier les informations de la séance"
            : "Déclarer des heures de délégation pour un élu CSE"
        }
        actions={{
          primary: {
            label: seanceEnEdition
              ? "Enregistrer les modifications"
              : "Créer la séance",
            onClick: () => void soumettreSeance(),
            disabled: !seanceValide || enCours,
            loading: enCours,
          },
          secondary: {
            label: "Annuler",
            variant: "outline",
            onClick: () => {
              setSeanceOuverte(false);
              setSeanceEnEdition(null);
              setFormSeance(formSeanceVide());
            },
          },
        }}
      >
        <div className="space-y-5">
          {erreurSeance && (
            <div
              role="alert"
              className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
            >
              {erreurSeance}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>
                  Élu CSE <span className="text-red-500">*</span>
                </Label>
                {!seanceEnEdition && (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => ouvrirAssignation(true)}
                  >
                    + Assigner un rôle CSE
                  </button>
                )}
              </div>
              {seanceEnEdition ? (
                <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  {seanceEnEdition.employeeName}
                </p>
              ) : (
                <Select
                  value={formSeance.employeeId}
                  onValueChange={(v) =>
                    setFormSeance((f) => ({ ...f, employeeId: v }))
                  }
                  disabled={elus.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        elus.length === 0
                          ? "Aucun élu CSE"
                          : "Sélectionner un élu CSE"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {elus.map((e) => (
                      <SelectItem key={e.employeeId} value={e.employeeId}>
                        {e.employeeName} — {libelleRoles(e.roles)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cse-date">Date</Label>
              <Input
                id="cse-date"
                type="date"
                value={formSeance.date}
                onChange={(e) =>
                  setFormSeance((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
          </div>

          {!seanceEnEdition && elus.length === 0 && (
            <div className="flex items-start gap-2 rounded-md border border-orange-500/40 bg-orange-500/10 p-3 text-sm text-orange-700 dark:text-orange-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Aucun élu CSE n&apos;est encore enregistré. Cliquez sur «
                Assigner un rôle CSE » pour désigner un salarié (titulaire,
                suppléant, secrétaire…) : il apparaîtra aussitôt dans cette
                liste.
              </span>
            </div>
          )}

          {eluChoisi && (
            <p
              className={`text-sm ${
                formSeance.duration > restantChoisi
                  ? "text-orange-600"
                  : "text-muted-foreground"
              }`}
            >
              Crédit mensuel : {eluChoisi.delegationHours} h — restant sur le
              mois : {restantChoisi} h
              {formSeance.duration > restantChoisi
                ? " (cette séance dépasse le crédit)"
                : ""}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type de séance</Label>
              <Select
                value={formSeance.type}
                onValueChange={(v) =>
                  setFormSeance((f) => ({ ...f, type: v as TypeSeance }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_SEANCE.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Durée (heures)
              </Label>
              <HoursInput
                value={formSeance.duration}
                onChange={(v) => setFormSeance((f) => ({ ...f, duration: v }))}
                step={0.5}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cse-description">Description</Label>
            <Textarea
              id="cse-description"
              placeholder="Décrivez l'objet de la séance..."
              value={formSeance.description}
              onChange={(e) =>
                setFormSeance((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {/* Assigner un rôle CSE */}
      <Modal
        open={roleOuvert}
        onOpenChange={(ouvert) => {
          if (!ouvert) fermerAssignation();
        }}
        type="form"
        size="lg"
        title="Assigner un rôle CSE"
        description="Le salarié apparaîtra aussitôt dans la liste des élus"
        actions={{
          secondary: {
            label: "Annuler",
            variant: "outline",
            onClick: fermerAssignation,
          },
          primary: {
            label: "Assigner le rôle",
            onClick: () => void enregistrerRole(),
            disabled: !roleValide || enCours,
            loading: enCours,
          },
        }}
      >
        <div className="space-y-4">
          {erreurRole && (
            <div
              role="alert"
              className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
            >
              {erreurRole}
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Salarié <span className="text-red-500">*</span>
            </Label>
            <EmployeePicker
              options={optionsSalaries}
              value={formRole.employeeId}
              onChange={(id) => setFormRole((f) => ({ ...f, employeeId: id }))}
              emptyMessage={
                optionsSalaries.length === 0
                  ? "Aucun salarié dans l'entreprise : créez d'abord un dossier salarié."
                  : "Aucun salarié trouvé."
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Rôle <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formRole.role}
                onValueChange={(v) =>
                  setFormRole((f) => ({
                    ...f,
                    role: v as RoleCse,
                    hours: heuresDuRole(v as RoleCse),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_CSE.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-heures">Heures de délégation / mois</Label>
              <Input
                id="role-heures"
                type="number"
                min={0}
                step={0.5}
                value={formRole.hours}
                onChange={(e) =>
                  setFormRole((f) => ({ ...f, hours: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role-debut">
                Début du mandat <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role-debut"
                type="date"
                value={formRole.startDate}
                onChange={(e) =>
                  setFormRole((f) => ({ ...f, startDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-fin">Fin du mandat (optionnel)</Label>
              <Input
                id="role-fin"
                type="date"
                min={formRole.startDate}
                value={formRole.endDate}
                onChange={(e) =>
                  setFormRole((f) => ({ ...f, endDate: e.target.value }))
                }
              />
            </div>
          </div>

          {roleDejaAttribue && (
            <p className="text-sm text-red-600">
              Ce salarié a déjà ce rôle en cours.
            </p>
          )}
          {formRole.startDate > aujourdhuiIso() && (
            <p className="text-sm text-orange-600">
              Le mandat commence dans le futur : l&apos;élu n&apos;apparaîtra
              dans la liste qu&apos;à partir de cette date.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Les heures proposées sont indicatives : le crédit légal dépend de
            l&apos;effectif de l&apos;entreprise, ajustez-le selon votre accord
            d&apos;entreprise.
          </p>
        </div>
      </Modal>

      {/* Suppression */}
      <Modal
        open={!!aSupprimer}
        onOpenChange={(ouvert) => {
          if (!ouvert) setASupprimer(null);
        }}
        type="confirmation"
        title="Supprimer la séance"
        actions={{
          primary: {
            label: "Supprimer",
            variant: "destructive",
            onClick: () => void confirmerSuppression(),
            disabled: enCours,
            loading: enCours,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setASupprimer(null),
            variant: "outline",
          },
        }}
      >
        <p>
          Voulez-vous vraiment supprimer la séance de{" "}
          <span className="font-semibold">{aSupprimer?.employeeName}</span> (
          {aSupprimer ? libelleType(aSupprimer.type) : ""}) ? Cette action est
          irréversible.
        </p>
      </Modal>
    </div>
  );
}
