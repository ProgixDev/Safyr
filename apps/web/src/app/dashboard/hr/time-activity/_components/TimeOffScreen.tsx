"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle,
  Clock,
  History,
  Plus,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard } from "@/components/ui/info-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployeeOptions } from "@/hooks/employees";
import { useRegistre } from "@/hooks/fiscal";
import { useSession } from "@/lib/auth-client";
import {
  exporterCsvExcel,
  exporterPdf,
  type ColonneExport,
} from "@/lib/export-table";
import { EmployeePicker } from "./EmployeePicker";
import {
  BarreFiltres,
  BoutonsExport,
  CELLULE_NOMBRE,
  ENTETES,
  ENTETE_NOMBRE,
  GrilleKpi,
  LIGNE_ZEBREE,
} from "./OutilsTableau";
import {
  AUCUN_FICHIER,
  STATUTS,
  TYPES_ABSENCE,
  TYPES_CONGE,
  aujourdhuiIso,
  dateLocale,
  formaterDate,
  formaterDateHeure,
  joursEntre,
  libelleType,
  messageErreur,
  type DemandeTemps,
  type ModeTemps,
  type StatutDemande,
} from "./temps";

/**
 * Écran commun aux « absences » et aux « congés ».
 *
 * Les deux menus sont séparés (demande du client) mais fonctionnent de la
 * même façon : ils partagent donc ce composant, chacun avec son registre
 * (`absence` ou `conge`) et sa liste de types.
 */
const CONFIG = {
  absence: {
    types: TYPES_ABSENCE,
    typeParDefaut: "sick_leave",
    titre: "Gestion des absences",
    description:
      "Maladie, accident du travail, absences injustifiées ou autorisées, congés sans solde",
    tableau: "Demandes d'absence",
    formulaire: "Nouvelle demande d'absence",
    nomFichier: "absences",
    enteteTableau: ENTETES.rose,
    enCours: "Salariés absents",
    enCoursSous: "Absents aujourd'hui",
    infos: [
      "Les arrêts maladie et accidents du travail doivent être déclarés sous 48 h",
      "Une absence injustifiée peut donner lieu à une procédure disciplinaire",
      "Les congés payés et RTT se gèrent dans « Gestion des Congés »",
    ],
  },
  conge: {
    types: TYPES_CONGE,
    typeParDefaut: "vacation",
    titre: "Gestion des congés",
    description:
      "Congés payés, RTT, récupération, congés maternité et paternité",
    tableau: "Demandes de congés",
    formulaire: "Nouvelle demande de congé",
    nomFichier: "conges",
    enteteTableau: ENTETES.bleu,
    enCours: "Salariés en congé",
    enCoursSous: "En congé aujourd'hui",
    infos: [
      "Les congés payés se prennent en jours ouvrables ; la durée proposée est en jours calendaires, corrigez-la si besoin",
      "Les congés maternité et paternité se déclarent au moins 2 mois à l'avance",
      "Les arrêts maladie et autres absences se gèrent dans « Gestion des absences »",
    ],
  },
} as const;

interface Formulaire {
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  /** Vide = calculé depuis les dates. */
  jours: string;
  reason: string;
}

const formulaireVide = (type: string): Formulaire => ({
  employeeId: "",
  type,
  startDate: "",
  endDate: "",
  jours: "",
  reason: "",
});

interface TimeOffScreenProps {
  mode: ModeTemps;
  /** Masque le titre quand la page l'affiche déjà (page Congés à onglets). */
  sansTitre?: boolean;
}

export function TimeOffScreen({ mode, sansTitre }: TimeOffScreenProps) {
  const cfg = CONFIG[mode];
  const { data: session } = useSession();
  const auteur =
    session?.user?.name || session?.user?.email || "Administrateur";

  const registre = useRegistre<DemandeTemps>(mode, AUCUN_FICHIER);
  const demandes = registre.lignes;
  const salaries = useEmployeeOptions();

  const [formOuvert, setFormOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<DemandeTemps | null>(null);
  const [form, setForm] = useState<Formulaire>(
    formulaireVide(cfg.typeParDefaut),
  );
  const [erreurForm, setErreurForm] = useState<string | null>(null);
  const [erreurPage, setErreurPage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [aSupprimer, setASupprimer] = useState<DemandeTemps | null>(null);
  const [historiqueId, setHistoriqueId] = useState<string | null>(null);

  // Filtres gérés ici (et non par le tableau) : l'export reprend ainsi
  // exactement les lignes affichées.
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("all");
  const [filtreType, setFiltreType] = useState("all");

  // Toujours relues dans la liste à jour : après une validation, la fenêtre
  // ouverte reflète le nouveau statut.
  const detail = demandes.find((d) => d.id === detailId) ?? null;
  const historique = demandes.find((d) => d.id === historiqueId) ?? null;

  const optionsSalaries = useMemo(
    () =>
      salaries.map((s) => ({
        id: s.id,
        name: s.name,
        detail: [s.matricule, s.poste].filter(Boolean).join(" - "),
      })),
    [salaries],
  );

  const joursAuto = joursEntre(form.startDate, form.endDate);
  const joursSaisis = form.jours.trim() === "" ? null : Number(form.jours);
  const joursRetenus = joursSaisis !== null ? joursSaisis : joursAuto;
  const datesIncoherentes =
    !!form.startDate && !!form.endDate && form.endDate < form.startDate;
  const chevauchement =
    form.employeeId && form.startDate && form.endDate && !datesIncoherentes
      ? demandes.filter(
          (d) =>
            d.employeeId === form.employeeId &&
            d.id !== enEdition?.id &&
            (d.status === "pending" || d.status === "approved") &&
            d.startDate <= form.endDate &&
            d.endDate >= form.startDate,
        )
      : [];
  const formValide =
    !!form.employeeId &&
    !!form.startDate &&
    !!form.endDate &&
    !datesIncoherentes &&
    Number.isFinite(joursRetenus) &&
    joursRetenus > 0;

  const ouvrirCreation = () => {
    setEnEdition(null);
    setForm(formulaireVide(cfg.typeParDefaut));
    setErreurForm(null);
    setFormOuvert(true);
  };

  const ouvrirEdition = (d: DemandeTemps) => {
    setEnEdition(d);
    setForm({
      employeeId: d.employeeId,
      type: d.type,
      startDate: d.startDate,
      endDate: d.endDate,
      jours: String(d.totalDays),
      reason: d.reason ?? "",
    });
    setErreurForm(null);
    setFormOuvert(true);
  };

  /** Écrit la demande en base ; renvoie false (avec message) en cas d'échec. */
  const enregistrerDemande = async (
    demande: DemandeTemps,
    onErreur: (message: string) => void,
  ): Promise<boolean> => {
    setEnCours(true);
    try {
      await registre.enregistrer(demande, {
        period: demande.startDate.slice(0, 7),
        label: `${demande.employeeName} — ${libelleType(cfg.types, demande.type)}`,
        status: demande.status,
      });
      return true;
    } catch (e) {
      onErreur(messageErreur(e));
      return false;
    } finally {
      setEnCours(false);
    }
  };

  const soumettreFormulaire = async () => {
    if (!formValide) return;
    const maintenant = new Date().toISOString();
    let demande: DemandeTemps;
    if (enEdition) {
      demande = {
        ...enEdition,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        totalDays: joursRetenus,
        reason: form.reason.trim(),
        updatedAt: maintenant,
      };
    } else {
      const salarie = salaries.find((s) => s.id === form.employeeId);
      if (!salarie) {
        setErreurForm("Salarié introuvable : rechargez la page.");
        return;
      }
      demande = {
        // Identifiant provisoire : le serveur en attribue un à la création.
        id: "nouvelle",
        employeeId: salarie.id,
        employeeName: salarie.name,
        employeeNumber: salarie.matricule,
        department: salarie.poste,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        totalDays: joursRetenus,
        reason: form.reason.trim(),
        status: "pending",
        createdAt: maintenant,
        updatedAt: maintenant,
      };
    }
    setErreurForm(null);
    const ok = await enregistrerDemande(demande, setErreurForm);
    if (ok) {
      setFormOuvert(false);
      setEnEdition(null);
    }
  };

  const changerStatut = async (
    d: DemandeTemps,
    statut: StatutDemande,
    avis?: string,
  ) => {
    setErreurPage(null);
    const decision = statut === "approved" || statut === "rejected";
    const maintenant = new Date().toISOString();
    const ok = await enregistrerDemande(
      {
        ...d,
        status: statut,
        validatedBy: decision ? auteur : undefined,
        validatedAt: decision ? maintenant : undefined,
        validationComment: decision ? (avis ?? "") : undefined,
        updatedAt: maintenant,
      },
      setErreurPage,
    );
    if (ok && detailId === d.id) {
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
      setASupprimer(null);
      if (detailId === aSupprimer.id) setDetailId(null);
    } catch (e) {
      setErreurPage(messageErreur(e));
      setASupprimer(null);
    } finally {
      setEnCours(false);
    }
  };

  const demandesAffichees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return (
      demandes
        .filter(
          (d) =>
            (filtreStatut === "all" || d.status === filtreStatut) &&
            (filtreType === "all" || d.type === filtreType) &&
            (q === "" ||
              [d.employeeName, d.employeeNumber, d.department].some((v) =>
                (v ?? "").toLowerCase().includes(q),
              )),
        )
        // Plus récentes d'abord ; l'export suit le même ordre.
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
    );
  }, [demandes, recherche, filtreStatut, filtreType]);

  const reinitialiserFiltres = () => {
    setRecherche("");
    setFiltreStatut("all");
    setFiltreType("all");
  };

  // Date vide plutôt que « — » : Excel reconnaît alors une vraie colonne de dates.
  const colonnesExport: ColonneExport<DemandeTemps>[] = [
    { titre: "Salarié", valeur: (d) => d.employeeName },
    { titre: "Matricule", valeur: (d) => d.employeeNumber },
    { titre: "Poste", valeur: (d) => d.department },
    { titre: "Type", valeur: (d) => libelleType(cfg.types, d.type) },
    {
      titre: "Date de début",
      valeur: (d) => (d.startDate ? formaterDate(d.startDate) : ""),
    },
    {
      titre: "Date de fin",
      valeur: (d) => (d.endDate ? formaterDate(d.endDate) : ""),
    },
    { titre: "Nombre de jours", valeur: (d) => d.totalDays, format: "number" },
    { titre: "Statut", valeur: (d) => STATUTS[d.status]?.label ?? d.status },
    { titre: "Motif", valeur: (d) => d.reason ?? "" },
  ];

  const descriptionFiltres = () => {
    const parts: string[] = [];
    if (filtreStatut !== "all")
      parts.push(`Statut : ${STATUTS[filtreStatut as StatutDemande]?.label}`);
    if (filtreType !== "all")
      parts.push(`Type : ${libelleType(cfg.types, filtreType)}`);
    if (recherche.trim()) parts.push(`Recherche : « ${recherche.trim()} »`);
    return parts.length ? parts.join(" — ") : "Toutes les demandes";
  };

  const piedExport = () =>
    colonnesExport.map((c, i) =>
      i === 0
        ? "Total"
        : c.titre === "Nombre de jours"
          ? demandesAffichees.reduce((s, d) => s + (d.totalDays || 0), 0)
          : "",
    );

  const nomExport = `${cfg.nomFichier}-${aujourdhuiIso()}`;

  const exporterEnExcel = () =>
    exporterCsvExcel(nomExport, colonnesExport, demandesAffichees, {
      titre: cfg.tableau.toUpperCase(),
      sousTitre: descriptionFiltres(),
      pied: piedExport(),
      nomFeuille: cfg.tableau,
    });

  const exporterEnPdf = () =>
    exporterPdf(nomExport, colonnesExport, demandesAffichees, {
      titre: cfg.tableau,
      sousTitre: descriptionFiltres(),
      orientation: "landscape",
      pied: piedExport(),
    });

  const badgeStatut = (statut: StatutDemande, grand?: boolean) => {
    const s = STATUTS[statut] ?? STATUTS.pending;
    const Icone =
      statut === "approved"
        ? CheckCircle
        : statut === "pending"
          ? Clock
          : XCircle;
    return (
      <Badge
        variant="outline"
        className={`w-fit font-semibold ${s.classe} ${grand ? "px-3 py-1" : ""}`}
      >
        <Icone className={grand ? "h-4 w-4" : "h-3 w-3"} />
        {s.label}
      </Badge>
    );
  };

  const colonnes: ColumnDef<DemandeTemps>[] = [
    {
      key: "employeeName",
      label: "Salarié",
      sortable: true,
      render: (d) => (
        <div className="min-w-48">
          <p className="truncate font-semibold">{d.employeeName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {d.employeeNumber || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      sortValue: (d) => libelleType(cfg.types, d.type),
      render: (d) => (
        <span className="whitespace-nowrap text-sm font-medium">
          {libelleType(cfg.types, d.type)}
        </span>
      ),
    },
    {
      key: "department",
      label: "Poste",
      sortable: true,
      render: (d) => (
        <span className="truncate text-sm">{d.department || "—"}</span>
      ),
    },
    {
      key: "startDate",
      label: "Période",
      sortable: true,
      render: (d) => (
        <span className="whitespace-nowrap text-sm tabular-nums">
          {formaterDate(d.startDate)} → {formaterDate(d.endDate)}
        </span>
      ),
    },
    {
      key: "totalDays",
      label: "Jours",
      sortable: true,
      headerClassName: ENTETE_NOMBRE,
      // Tri numérique : le tableau compare des chaînes.
      sortValue: (d) => String(d.totalDays).padStart(8, "0"),
      render: (d) => (
        <span className={`${CELLULE_NOMBRE} font-semibold`}>{d.totalDays}</span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      sortValue: (d) => STATUTS[d.status]?.label ?? d.status,
      render: (d) => badgeStatut(d.status),
    },
  ];

  const actions = (d: DemandeTemps) => (
    <RowActionsMenu
      onView={() => {
        setCommentaire("");
        setDetailId(d.id);
      }}
      onEdit={() => ouvrirEdition(d)}
      onDelete={() => setASupprimer(d)}
      extraItems={[
        {
          label: "Historique",
          icon: History,
          tone: "history",
          onClick: () => setHistoriqueId(d.id),
        },
        ...(d.status === "pending"
          ? [
              {
                label: "Approuver",
                icon: CheckCircle,
                tone: "validate" as const,
                onClick: () => void changerStatut(d, "approved"),
                separatorBefore: true,
              },
              {
                label: "Refuser",
                icon: XCircle,
                tone: "delete" as const,
                destructive: true,
                onClick: () => void changerStatut(d, "rejected"),
              },
            ]
          : [
              {
                label: "Remettre en attente",
                icon: Clock,
                tone: "neutral" as const,
                onClick: () => void changerStatut(d, "pending"),
                separatorBefore: true,
              },
            ]),
      ]}
    />
  );

  // Statistiques calculées depuis les vraies demandes.
  const aujourdhui = aujourdhuiIso();
  const totalJours = demandes.reduce((s, d) => s + (d.totalDays || 0), 0);
  const enAttente = demandes.filter((d) => d.status === "pending").length;
  const approuvees = demandes.filter((d) => d.status === "approved").length;
  const durees = demandes
    .filter((d) => d.validatedAt)
    .map(
      (d) =>
        (new Date(d.validatedAt as string).getTime() -
          new Date(d.createdAt).getTime()) /
        3_600_000,
    )
    .filter((h) => Number.isFinite(h) && h >= 0);
  const delaiMoyen = durees.length
    ? Math.round(durees.reduce((s, h) => s + h, 0) / durees.length)
    : 0;
  const enCongeAujourdhui = new Set(
    demandes
      .filter(
        (d) =>
          d.status === "approved" &&
          d.startDate <= aujourdhui &&
          d.endDate >= aujourdhui,
      )
      .map((d) => d.employeeId),
  ).size;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {sansTitre ? (
          <div />
        ) : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{cfg.titre}</h1>
            <p className="text-muted-foreground">{cfg.description}</p>
          </div>
        )}
        <div className="flex flex-wrap items-start gap-2">
          <BoutonsExport
            onExcel={exporterEnExcel}
            onPdf={exporterEnPdf}
            disabled={demandesAffichees.length === 0}
          />
          <Button onClick={ouvrirCreation}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle demande
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
          icon={Calendar}
          title="Total demandes"
          value={demandes.length}
          subtext={`${totalJours} jour${totalJours > 1 ? "s" : ""} au total`}
          color="gray"
        />
        <InfoCard
          compact
          icon={Clock}
          title="En attente"
          value={enAttente}
          subtext={`Délai moyen de réponse : ${delaiMoyen} h`}
          color="orange"
        />
        <InfoCard
          compact
          icon={CheckCircle}
          title="Approuvées"
          value={approuvees}
          subtext={`${
            demandes.length
              ? Math.round((approuvees / demandes.length) * 100)
              : 0
          }% du total`}
          color="green"
        />
        <InfoCard
          compact
          icon={Users}
          title={cfg.enCours}
          value={enCongeAujourdhui}
          subtext={cfg.enCoursSous}
          color="blue"
        />
      </GrilleKpi>

      <Card>
        <CardHeader>
          <CardTitle>{cfg.tableau}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BarreFiltres
            recherche={recherche}
            onRecherche={setRecherche}
            placeholder="Rechercher par nom, matricule ou poste..."
            onReinitialiser={reinitialiserFiltres}
            resume={`${demandesAffichees.length} sur ${demandes.length} demande${demandes.length > 1 ? "s" : ""}`}
            filtres={[
              {
                cle: "statut",
                libelle: "Statut",
                valeur: filtreStatut,
                onChange: setFiltreStatut,
                options: [
                  { value: "all", label: "Tous les statuts" },
                  { value: "pending", label: "En attente" },
                  { value: "approved", label: "Approuvé" },
                  { value: "rejected", label: "Refusé" },
                  { value: "cancelled", label: "Annulé" },
                ],
              },
              {
                cle: "type",
                libelle: "Type",
                valeur: filtreType,
                onChange: setFiltreType,
                options: [
                  { value: "all", label: "Tous les types" },
                  ...cfg.types.map((t) => ({ value: t.value, label: t.label })),
                ],
              },
            ]}
          />
          <div className={cfg.enteteTableau}>
            {/* key : le tableau revient à la page 1 quand un filtre change. */}
            <DataTable
              key={`${recherche}|${filtreStatut}|${filtreType}`}
              data={demandesAffichees}
              isLoading={registre.isLoading}
              columns={colonnes}
              onRowClick={(d) => {
                setCommentaire("");
                setDetailId(d.id);
              }}
              itemsPerPage={10}
              rowClassName={() => LIGNE_ZEBREE}
              actions={actions}
            />
          </div>
          {!registre.isLoading && demandes.length === 0 && (
            <p className="pt-2 text-center text-sm text-muted-foreground">
              Aucune demande enregistrée. Utilisez « Nouvelle demande » pour en
              créer une.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Création / modification */}
      <Modal
        open={formOuvert}
        onOpenChange={(ouvert) => {
          setFormOuvert(ouvert);
          if (!ouvert) setEnEdition(null);
        }}
        type="form"
        size="lg"
        title={enEdition ? "Modifier la demande" : cfg.formulaire}
        description={
          enEdition
            ? `${enEdition.employeeName} — corrigez les informations ci-dessous`
            : "La demande est créée « En attente » puis validée ou refusée depuis le tableau"
        }
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => {
              setFormOuvert(false);
              setEnEdition(null);
            },
            variant: "outline",
          },
          primary: {
            label: enEdition ? "Enregistrer" : "Soumettre la demande",
            onClick: () => void soumettreFormulaire(),
            disabled: !formValide || enCours,
            loading: enCours,
          },
        }}
      >
        <div className="space-y-4">
          {erreurForm && (
            <div
              role="alert"
              className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
            >
              {erreurForm}
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Salarié <span className="text-red-500">*</span>
            </Label>
            {enEdition ? (
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {enEdition.employeeName}
                {enEdition.employeeNumber
                  ? ` (${enEdition.employeeNumber})`
                  : ""}
              </p>
            ) : (
              <EmployeePicker
                options={optionsSalaries}
                value={form.employeeId}
                onChange={(id) => setForm((f) => ({ ...f, employeeId: id }))}
                emptyMessage={
                  optionsSalaries.length === 0
                    ? "Aucun salarié dans l'entreprise : créez d'abord un dossier salarié."
                    : "Aucun salarié trouvé."
                }
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cfg.types.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="temps-debut">
                Date de début <span className="text-red-500">*</span>
              </Label>
              <Input
                id="temps-debut"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temps-fin">
                Date de fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="temps-fin"
                type="date"
                min={form.startDate}
                value={form.endDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temps-jours">Durée (jours)</Label>
              <Input
                id="temps-jours"
                type="number"
                min={0.5}
                step={0.5}
                placeholder={joursAuto ? String(joursAuto) : "Auto"}
                value={form.jours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, jours: e.target.value }))
                }
              />
            </div>
          </div>

          {datesIncoherentes && (
            <p className="text-sm text-red-600">
              La date de fin est antérieure à la date de début.
            </p>
          )}
          {!datesIncoherentes && form.startDate && form.endDate && (
            <div className="rounded-md bg-muted p-3 text-sm font-medium">
              Durée retenue : {joursRetenus} jour{joursRetenus > 1 ? "s" : ""}
              {joursSaisis === null ? " (calendaires, calculée)" : ""}
            </div>
          )}
          {chevauchement.length > 0 && (
            <p className="rounded-md border border-orange-500/40 bg-orange-500/10 p-3 text-sm text-orange-700 dark:text-orange-300">
              Attention : ce salarié a déjà {chevauchement.length} demande
              {chevauchement.length > 1 ? "s" : ""} sur cette période (du{" "}
              {formaterDate(chevauchement[0].startDate)} au{" "}
              {formaterDate(chevauchement[0].endDate)}).
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="temps-motif">Motif (optionnel)</Label>
            <Textarea
              id="temps-motif"
              rows={3}
              value={form.reason}
              onChange={(e) =>
                setForm((f) => ({ ...f, reason: e.target.value }))
              }
              placeholder="Précisez le motif de la demande..."
            />
          </div>

          <ul className="space-y-1 rounded-md border border-muted bg-muted/50 p-4 text-sm text-muted-foreground">
            {cfg.infos.map((info) => (
              <li key={info}>• {info}</li>
            ))}
          </ul>
        </div>
      </Modal>

      {/* Détails et validation */}
      <Modal
        open={!!detail}
        onOpenChange={(ouvert) => {
          if (!ouvert) setDetailId(null);
        }}
        type="details"
        title={detail ? `Demande — ${detail.employeeName}` : "Demande"}
        description={detail ? libelleType(cfg.types, detail.type) : ""}
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
              {badgeStatut(detail.status, true)}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Type
                </span>
                <p className="mt-1 font-medium">
                  {libelleType(cfg.types, detail.type)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Durée
                </span>
                <p className="mt-1 font-medium">
                  {detail.totalDays} jour{detail.totalDays > 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Date de début
                </span>
                <p className="mt-1 font-medium">
                  {dateLocale(detail.startDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Date de fin
                </span>
                <p className="mt-1 font-medium">
                  {dateLocale(detail.endDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {detail.reason && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Motif
                </span>
                <p className="mt-1">{detail.reason}</p>
              </div>
            )}

            <Separator />
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-semibold">{detail.employeeName}</p>
                <p className="text-sm text-muted-foreground">
                  {[detail.employeeNumber, detail.department]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/hr/collaborators/${detail.employeeId}`}>
                  Voir le profil
                </Link>
              </Button>
            </div>

            {detail.status === "pending" && (
              <>
                <Separator />
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
              </>
            )}

            {(detail.status === "approved" || detail.status === "rejected") && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="font-medium">
                    {detail.status === "approved" ? "Approuvé" : "Refusé"}
                    {detail.validatedBy ? ` par ${detail.validatedBy}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Le {formaterDateHeure(detail.validatedAt)}
                  </p>
                  {detail.validationComment && (
                    <div className="mt-3 rounded-md bg-muted p-3 text-sm">
                      {detail.validationComment}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Suppression */}
      <Modal
        open={!!aSupprimer}
        onOpenChange={(ouvert) => {
          if (!ouvert) setASupprimer(null);
        }}
        type="confirmation"
        title="Supprimer la demande"
        actions={{
          primary: {
            label: "Supprimer",
            onClick: () => void confirmerSuppression(),
            disabled: enCours,
            loading: enCours,
            variant: "destructive",
          },
          secondary: {
            label: "Annuler",
            onClick: () => setASupprimer(null),
            variant: "outline",
          },
        }}
      >
        <p>
          Voulez-vous vraiment supprimer la demande de{" "}
          <span className="font-semibold">{aSupprimer?.employeeName}</span> (
          {aSupprimer ? libelleType(cfg.types, aSupprimer.type) : ""}) ? Cette
          action est irréversible.
        </p>
      </Modal>

      {/* Historique */}
      <Modal
        open={!!historique}
        onOpenChange={(ouvert) => {
          if (!ouvert) setHistoriqueId(null);
        }}
        type="details"
        title="Historique de la demande"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setHistoriqueId(null),
            variant: "outline",
          },
        }}
      >
        {historique && (
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="w-40 shrink-0 text-muted-foreground">
                {formaterDateHeure(historique.createdAt)}
              </span>
              <span>Demande créée</span>
            </div>
            {historique.validatedAt && (
              <div className="flex gap-3">
                <span className="w-40 shrink-0 text-muted-foreground">
                  {formaterDateHeure(historique.validatedAt)}
                </span>
                <span>
                  {historique.status === "approved" ? "Approuvée" : "Refusée"}
                  {historique.validatedBy
                    ? ` par ${historique.validatedBy}`
                    : ""}
                  {historique.validationComment
                    ? ` — « ${historique.validationComment} »`
                    : ""}
                </span>
              </div>
            )}
            <div className="flex gap-3">
              <span className="w-40 shrink-0 text-muted-foreground">
                {formaterDateHeure(historique.updatedAt)}
              </span>
              <span>Dernière modification</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
