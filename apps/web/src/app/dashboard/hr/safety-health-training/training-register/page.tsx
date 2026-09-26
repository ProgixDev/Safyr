"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FileDown,
  GraduationCap,
  Plus,
  Search,
  XCircle,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { HoursInput } from "@/components/ui/hours-input";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TEINTES, type Teinte } from "@/components/safety-training/couleurs";
import { downloadStoredFile, pickFile } from "@/lib/document-files";
import { cn } from "@/lib/utils";
import {
  LIBELLE_ORIGINE,
  LIBELLE_STATUT,
  LIBELLE_TYPE,
  TYPES_FORMATION,
  anneeDe,
  dateFr,
  statutDe,
  typeDepuisTexte,
  type LigneFormation,
  type StatutFormation,
  type TypeFormation,
} from "./_lib/formations";
import { exporterRegistreExcel, exporterRegistrePdf } from "./_lib/export";
import { useFormations, type FormationSaisie } from "./_lib/use-formations";

const BASE = "/dashboard/hr/safety-health-training";

const TEINTE_STATUT: Record<StatutFormation, Teinte> = {
  valide: "vert",
  bientot: "orange",
  expire: "rouge",
  sans_echeance: "gris",
};

const FINANCEMENTS = [
  { valeur: "company", libelle: "Entreprise" },
  { valeur: "opco", libelle: "OPCO" },
  { valeur: "personal", libelle: "Personnel" },
  { valeur: "other", libelle: "Autre" },
];

/** En-têtes de colonnes teintés : le registre se lit d'un coup d'œil. */
const ENTETE =
  "bg-indigo-500/10 font-semibold text-indigo-800 dark:bg-indigo-400/10 dark:text-indigo-200";

const ORDRE_STATUT: Record<StatutFormation, number> = {
  expire: 0,
  bientot: 1,
  valide: 2,
  sans_echeance: 3,
};

function BadgeStatut({ statut }: { statut: StatutFormation }) {
  return (
    <Badge variant="outline" className={TEINTES[TEINTE_STATUT[statut]]}>
      {LIBELLE_STATUT[statut]}
    </Badge>
  );
}

const FORMULAIRE_VIDE = {
  employeeId: "",
  trainingName: "",
  trainingType: "PROFESSIONNELLE" as TypeFormation,
  trainingOrganization: "",
  startDate: "",
  endDate: "",
  duration: 0,
  cost: "",
  fundingSource: "company",
  certificationNumber: "",
  expirationDate: "",
  notes: "",
};

/** Lien vers l'écran où la formation est réellement tenue (hors saisie). */
function lienSource(l: LigneFormation, salarieConnu: boolean): string | null {
  if (l.origine === "plan") return `${BASE}/training-plan`;
  if (l.origine === "akto") return `${BASE}/training-plan/akto`;
  if (l.origine === "dossier" && salarieConnu)
    return `/dashboard/hr/collaborators/${l.salarieId}`;
  return null;
}

export default function RegistreFormationPage() {
  const { lignes, salaries, registre, isLoading } = useFormations();

  const [recherche, setRecherche] = useState("");
  const [annee, setAnnee] = useState("all");
  const [salarieFiltre, setSalarieFiltre] = useState("all");
  const [typeFiltre, setTypeFiltre] = useState("all");

  const [formOuvert, setFormOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<string | null>(null);
  const [form, setForm] = useState(FORMULAIRE_VIDE);
  const [fichier, setFichier] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [voirCle, setVoirCle] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<LigneFormation | null>(null);

  const salarieConnu = (id: string) => salaries.some((e) => e.id === id);

  // ── Filtres : le tableau, les cartes et les exports partagent le même jeu.
  const annees = useMemo(
    () =>
      [...new Set(lignes.map(anneeDe).filter(Boolean))].sort((a, b) =>
        b.localeCompare(a),
      ),
    [lignes],
  );
  const optionsSalaries = useMemo(() => {
    const parId = new Map<string, string>();
    for (const l of lignes) parId.set(l.salarieId, l.salarie);
    return [...parId.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }, [lignes]);

  const affichees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return lignes.filter((l) => {
      if (annee !== "all" && anneeDe(l) !== annee) return false;
      if (salarieFiltre !== "all" && l.salarieId !== salarieFiltre)
        return false;
      if (typeFiltre !== "all" && l.type !== typeFiltre) return false;
      if (!terme) return true;
      return [
        l.salarie,
        l.intitule,
        l.organisme,
        l.certificat,
        LIBELLE_TYPE[l.type],
        LIBELLE_STATUT[l.statut],
        l.document?.name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(terme);
    });
  }, [lignes, recherche, annee, salarieFiltre, typeFiltre]);

  const filtresActifs =
    recherche.trim() !== "" ||
    annee !== "all" ||
    salarieFiltre !== "all" ||
    typeFiltre !== "all";

  const reinitialiser = () => {
    setRecherche("");
    setAnnee("all");
    setSalarieFiltre("all");
    setTypeFiltre("all");
  };

  /** Rappel des filtres, repris en sous-titre des exports. */
  const libelleFiltres = () =>
    [
      annee !== "all" ? `Année ${annee}` : "",
      salarieFiltre !== "all"
        ? `Salarié : ${optionsSalaries.find(([id]) => id === salarieFiltre)?.[1] ?? ""}`
        : "",
      typeFiltre !== "all"
        ? `Type : ${LIBELLE_TYPE[typeFiltre as TypeFormation]}`
        : "",
      recherche.trim() ? `Recherche « ${recherche.trim()} »` : "",
    ]
      .filter(Boolean)
      .join(" — ");

  const lancerExport = async (
    exporter: typeof exporterRegistrePdf | typeof exporterRegistreExcel,
  ) => {
    try {
      await exporter(affichees, { filtres: libelleFiltres() || undefined });
    } catch (e) {
      alert(
        `Export impossible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    }
  };

  // ── Cartes de synthèse (sur les lignes affichées).
  const nombre = (s: StatutFormation) =>
    affichees.filter((l) => l.statut === s).length;
  const totalHeures = affichees.reduce((n, l) => n + (l.dureeH ?? 0), 0);
  const sousTexteFiltre = filtresActifs ? "Selon les filtres" : undefined;

  // ── Saisie.
  const ouvrirCreation = () => {
    setEnEdition(null);
    setForm(FORMULAIRE_VIDE);
    setFichier(null);
    setErreur(null);
    setFormOuvert(true);
  };

  const ouvrirEdition = (l: LigneFormation) => {
    const brut = registre.lignes.find((f) => f.id === l.id);
    if (!brut) return;
    setEnEdition(l.id);
    setForm({
      employeeId: l.salarieId,
      trainingName: l.intitule,
      trainingType: l.type,
      trainingOrganization: l.organisme,
      startDate: l.debut,
      endDate: l.fin,
      duration: l.dureeH ?? 0,
      cost: brut.cost != null ? String(brut.cost) : "",
      fundingSource: brut.fundingSource ?? "company",
      certificationNumber: l.certificat,
      expirationDate: l.validite,
      notes: l.notes,
    });
    setFichier(null);
    setErreur(null);
    setFormOuvert(true);
  };

  const enregistrer = async () => {
    // Sans ces contrôles, une date vide était enregistrée « nulle » et faisait
    // planter l'affichage du registre à la ligne suivante.
    if (!form.employeeId) return setErreur("Choisissez le salarié.");
    if (!form.trainingName.trim())
      return setErreur("Renseignez l'intitulé de la formation.");
    if (!form.startDate || !form.endDate)
      return setErreur("Renseignez les dates de début et de fin.");
    if (form.endDate < form.startDate)
      return setErreur("La date de fin précède la date de début.");
    const cout = form.cost.trim() === "" ? null : Number(form.cost);
    if (cout !== null && (Number.isNaN(cout) || cout < 0))
      return setErreur("Le coût doit être un nombre positif.");

    const salarie = salaries.find((e) => e.id === form.employeeId);
    const nom = salarie
      ? `${salarie.firstName ?? ""} ${salarie.lastName ?? ""}`.trim() ||
        (salarie.email ?? "Salarié")
      : (lignes.find((l) => l.salarieId === form.employeeId)?.salarie ?? "");
    const maintenant = new Date().toISOString();
    const existante = enEdition
      ? registre.lignes.find((f) => f.id === enEdition)
      : undefined;
    const ligne: FormationSaisie = {
      ...existante,
      // Ignoré à la création : c'est le serveur qui attribue l'identifiant.
      id: enEdition ?? "",
      employeeId: form.employeeId,
      employeeName: nom,
      trainingName: form.trainingName.trim(),
      trainingType: form.trainingType,
      trainingOrganization: form.trainingOrganization.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      duration: form.duration > 0 ? form.duration : null,
      cost: cout,
      fundingSource: form.fundingSource,
      certificationNumber: form.certificationNumber.trim(),
      expirationDate: form.expirationDate || null,
      notes: form.notes.trim(),
      createdAt: existante?.createdAt ?? maintenant,
      updatedAt: maintenant,
    };
    setEnCours(true);
    setErreur(null);
    try {
      const id = await registre.enregistrer(ligne, {
        period: form.startDate.slice(0, 7),
        label: `${nom} — ${ligne.trainingName}`.slice(0, 160),
        status: statutDe(form.expirationDate || undefined),
        ...(cout !== null ? { amount: cout } : {}),
      });
      if (fichier) {
        if (existante?.document) await registre.retirerPiece(id, "document");
        await registre.attacherFichier(id, "document", fichier);
      }
      setFormOuvert(false);
    } catch (e) {
      // La fenêtre reste ouverte : la saisie n'est pas perdue.
      setErreur(
        `Enregistrement impossible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    } finally {
      setEnCours(false);
    }
  };

  const joindreDocument = async (l: LigneFormation) => {
    try {
      const f = await pickFile();
      if (!f) return;
      if (l.document) await registre.retirerPiece(l.id, "document");
      await registre.attacherFichier(l.id, "document", f);
    } catch (e) {
      alert(
        `Téléversement impossible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    }
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      await registre.supprimerLigne(aSupprimer.id);
      setASupprimer(null);
    } catch (e) {
      alert(
        `Suppression impossible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    }
  };

  // ── Tableau.
  const colonnes: ColumnDef<LigneFormation>[] = [
    {
      key: "salarie",
      label: "Salarié",
      headerClassName: ENTETE,
      render: (l) =>
        salarieConnu(l.salarieId) ? (
          <Link
            href={`/dashboard/hr/collaborators/${l.salarieId}`}
            className="font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {l.salarie}
          </Link>
        ) : (
          <span className="font-medium">{l.salarie}</span>
        ),
    },
    {
      key: "intitule",
      label: "Formation",
      headerClassName: ENTETE,
      render: (l) => (
        <div>
          <div className="font-medium">{l.intitule}</div>
          <div className="text-xs text-muted-foreground">
            {LIBELLE_ORIGINE[l.origine]}
          </div>
        </div>
      ),
    },
    {
      key: "organisme",
      label: "Organisme",
      headerClassName: ENTETE,
      render: (l) => <span className="text-sm">{l.organisme || "—"}</span>,
    },
    {
      key: "debut",
      label: "Début",
      headerClassName: ENTETE,
      render: (l) => <span className="text-sm">{dateFr(l.debut) || "—"}</span>,
    },
    {
      key: "fin",
      label: "Fin",
      headerClassName: ENTETE,
      render: (l) => <span className="text-sm">{dateFr(l.fin) || "—"}</span>,
    },
    {
      key: "dureeH",
      label: "Durée (h)",
      headerClassName: ENTETE,
      sortValue: (l) => String(l.dureeH ?? 0).padStart(8, "0"),
      render: (l) => (
        <span className="text-sm">
          {l.dureeH === null ? "—" : `${l.dureeH} h`}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      headerClassName: ENTETE,
      sortValue: (l) => LIBELLE_TYPE[l.type],
      render: (l) => (
        <Badge variant="outline" className={TEINTES.violet}>
          {LIBELLE_TYPE[l.type]}
        </Badge>
      ),
    },
    {
      key: "certificat",
      label: "N° certificat / attestation",
      headerClassName: ENTETE,
      render: (l) => <span className="text-sm">{l.certificat || "—"}</span>,
    },
    {
      key: "validite",
      label: "Validité",
      headerClassName: ENTETE,
      render: (l) => (
        <span
          className={cn(
            "text-sm",
            l.statut === "expire" && "font-medium text-red-600",
            l.statut === "bientot" && "font-medium text-orange-600",
          )}
        >
          {dateFr(l.validite) || "—"}
        </span>
      ),
    },
    {
      key: "statut",
      label: "Statut",
      headerClassName: ENTETE,
      sortValue: (l) => ORDRE_STATUT[l.statut],
      render: (l) => <BadgeStatut statut={l.statut} />,
    },
    {
      key: "document",
      label: "Document",
      headerClassName: ENTETE,
      sortable: false,
      render: (l) =>
        l.document ? (
          <button
            type="button"
            className="flex max-w-40 items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
            title={l.document.name}
            onClick={(e) => {
              e.stopPropagation();
              void downloadStoredFile(l.document!);
            }}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{l.document.name}</span>
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  const vue = voirCle ? (lignes.find((l) => l.cle === voirCle) ?? null) : null;

  const actions = (l: LigneFormation) => {
    const source = lienSource(l, salarieConnu(l.salarieId));
    return (
      <RowActionsMenu
        onView={() => setVoirCle(l.cle)}
        onEdit={l.origine === "saisie" ? () => ouvrirEdition(l) : undefined}
        onUpload={
          l.origine === "saisie" ? () => void joindreDocument(l) : undefined
        }
        uploadLabel={
          l.document ? "Remplacer le document" : "Joindre un document"
        }
        onDownload={
          l.document ? () => void downloadStoredFile(l.document!) : undefined
        }
        downloadLabel="Ouvrir le document"
        onDelete={l.origine === "saisie" ? () => setASupprimer(l) : undefined}
        extraItems={
          source
            ? [
                {
                  label: "Ouvrir la source",
                  icon: ExternalLink,
                  tone: "locate",
                  onClick: () => window.open(source, "_self"),
                },
              ]
            : []
        }
      />
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-serif text-3xl font-light tracking-tight text-indigo-600 dark:text-indigo-400">
            <span className="rounded-full bg-indigo-500/15 p-2.5">
              <GraduationCap className="h-6 w-6" />
            </span>
            Registre de formation
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Formations réalisées par le personnel : organisme, dates, durée,
            certificat et validité.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => void lancerExport(exporterRegistreExcel)}
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Exporter en Excel
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => void lancerExport(exporterRegistrePdf)}
          >
            <FileDown className="h-4 w-4 text-red-600" />
            Exporter en PDF
          </Button>
          <Button className="gap-2" onClick={ouvrirCreation}>
            <Plus className="h-4 w-4" />
            Ajouter une formation
          </Button>
        </div>
      </div>

      <InfoCardContainer className="lg:grid-cols-5">
        <InfoCard
          compact
          icon={GraduationCap}
          title="Formations"
          value={affichees.length}
          subtext={sousTexteFiltre ?? "Formations réalisées"}
          color="blue"
        />
        <InfoCard
          compact
          icon={Clock}
          title="Heures de formation"
          value={`${totalHeures.toLocaleString("fr-FR")} h`}
          subtext={sousTexteFiltre ?? "Durée cumulée"}
          color="purple"
        />
        <InfoCard
          compact
          icon={CheckCircle2}
          title="Valides"
          value={nombre("valide")}
          subtext={`${nombre("sans_echeance")} sans échéance`}
          color="green"
        />
        <InfoCard
          compact
          icon={AlertTriangle}
          title="Expirent bientôt"
          value={nombre("bientot")}
          subtext="À renouveler sous 3 mois"
          color="orange"
        />
        <InfoCard
          compact
          icon={XCircle}
          title="Expirées"
          value={nombre("expire")}
          subtext="À renouveler"
          color="red"
        />
      </InfoCardContainer>

      <Card style={{ borderTop: "3px solid #6366f1" }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>
              Registre ({affichees.length}
              {filtresActifs ? ` sur ${lignes.length}` : ""})
            </span>
            {filtresActifs && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={reinitialiser}
              >
                <X className="h-4 w-4" />
                Réinitialiser les filtres
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-60 flex-1 sm:max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Rechercher un salarié, une formation, un organisme…"
                autoComplete="off"
                name="recherche-registre-formation"
                data-form-type="other"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </div>
            <Select value={annee} onValueChange={setAnnee}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {annees.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={salarieFiltre} onValueChange={setSalarieFiltre}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Salarié" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les salariés</SelectItem>
                {optionsSalaries.map(([id, nom]) => (
                  <SelectItem key={id} value={id}>
                    {nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFiltre} onValueChange={setTypeFiltre}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {TYPES_FORMATION.map((t) => (
                  <SelectItem key={t.valeur} value={t.valeur}>
                    {t.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isLoading && lignes.length === 0 && (
            <div className="rounded-lg border border-dashed border-indigo-300 bg-indigo-500/5 p-4 text-sm text-muted-foreground dark:border-indigo-800">
              Aucune formation enregistrée pour le moment. Le registre se
              remplit avec les formations saisies ici, les diplômes et
              certifications des dossiers salariés, les formations du plan
              passées à « Terminée » et les dossiers AKTO / OPCO validés.
            </div>
          )}

          <DataTable
            data={affichees}
            columns={colonnes}
            isLoading={isLoading}
            getRowId={(l) => l.cle}
            onRowClick={(l) => setVoirCle(l.cle)}
            actions={actions}
            rowClassName={(l) =>
              l.statut === "expire"
                ? "bg-red-500/5"
                : l.statut === "bientot"
                  ? "bg-orange-500/5"
                  : ""
            }
          />
        </CardContent>
      </Card>

      {/* Saisie / modification */}
      <Modal
        open={formOuvert}
        onOpenChange={setFormOuvert}
        type="form"
        title={enEdition ? "Modifier la formation" : "Ajouter une formation"}
        size="xl"
        actions={{
          primary: {
            label: "Enregistrer",
            onClick: () => void enregistrer(),
            loading: enCours,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setFormOuvert(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          {erreur && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              {erreur}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Salarié *</Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setForm({ ...form, employeeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un salarié" />
                </SelectTrigger>
                <SelectContent>
                  {salaries.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() ||
                        e.email ||
                        e.id}
                    </SelectItem>
                  ))}
                  {form.employeeId && !salarieConnu(form.employeeId) && (
                    <SelectItem value={form.employeeId}>
                      {lignes.find((l) => l.salarieId === form.employeeId)
                        ?.salarie ?? form.employeeId}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type de formation *</Label>
              <Select
                value={form.trainingType}
                onValueChange={(v) =>
                  setForm({ ...form, trainingType: v as TypeFormation })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_FORMATION.map((t) => (
                    <SelectItem key={t.valeur} value={t.valeur}>
                      {t.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="rf-intitule">Intitulé de la formation *</Label>
            <Input
              id="rf-intitule"
              value={form.trainingName}
              onChange={(e) => {
                const trainingName = e.target.value;
                setForm({
                  ...form,
                  trainingName,
                  // Le type suit l'intitulé tant qu'il n'a pas été choisi.
                  trainingType:
                    form.trainingType === "PROFESSIONNELLE" ||
                    form.trainingType === "AUTRE"
                      ? typeDepuisTexte(trainingName) === "AUTRE"
                        ? form.trainingType
                        : typeDepuisTexte(trainingName)
                      : form.trainingType,
                });
              }}
              placeholder="Ex : SSIAP 1 — formation initiale"
            />
          </div>

          <div>
            <Label htmlFor="rf-organisme">Organisme de formation</Label>
            <Input
              id="rf-organisme"
              value={form.trainingOrganization}
              onChange={(e) =>
                setForm({ ...form, trainingOrganization: e.target.value })
              }
              placeholder="Ex : centre de formation"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="rf-debut">Date de début *</Label>
              <Input
                id="rf-debut"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startDate: e.target.value,
                    endDate: form.endDate || e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="rf-fin">Date de fin *</Label>
              <Input
                id="rf-fin"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Durée (heures)</Label>
              <HoursInput
                value={form.duration}
                onChange={(v) => setForm({ ...form, duration: v })}
                step={0.5}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rf-certificat">
                N° de certificat / attestation
              </Label>
              <Input
                id="rf-certificat"
                value={form.certificationNumber}
                onChange={(e) =>
                  setForm({ ...form, certificationNumber: e.target.value })
                }
                placeholder="Ex : SSIAP1-2026-001"
              />
            </div>
            <div>
              <Label htmlFor="rf-validite">Date de validité</Label>
              <Input
                id="rf-validite"
                type="date"
                value={form.expirationDate}
                onChange={(e) =>
                  setForm({ ...form, expirationDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rf-cout">Coût (€)</Label>
              <Input
                id="rf-cout"
                type="number"
                step="0.01"
                min="0"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="Ex : 850"
              />
            </div>
            <div>
              <Label>Financement</Label>
              <Select
                value={form.fundingSource}
                onValueChange={(v) => setForm({ ...form, fundingSource: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINANCEMENTS.map((f) => (
                    <SelectItem key={f.valeur} value={f.valeur}>
                      {f.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="rf-document">
              Document (certificat, attestation, convention)
            </Label>
            <Input
              id="rf-document"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
            />
            {enEdition &&
              lignes.find((l) => l.id === enEdition)?.document &&
              !fichier && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Document actuel :{" "}
                  {lignes.find((l) => l.id === enEdition)?.document?.name}.
                  Choisissez un fichier pour le remplacer.
                </p>
              )}
          </div>

          <div>
            <Label htmlFor="rf-notes">Notes</Label>
            <Textarea
              id="rf-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Fiche */}
      <Modal
        open={vue !== null}
        onOpenChange={(ouvert) => !ouvert && setVoirCle(null)}
        type="details"
        title="Détail de la formation"
        size="lg"
      >
        {vue && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <BadgeStatut statut={vue.statut} />
              <Badge variant="outline" className={TEINTES.violet}>
                {LIBELLE_TYPE[vue.type]}
              </Badge>
              <Badge variant="outline" className={TEINTES.bleu}>
                {LIBELLE_ORIGINE[vue.origine]}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {(
                [
                  ["Salarié", vue.salarie],
                  ["Intitulé", vue.intitule],
                  ["Organisme", vue.organisme],
                  ["Durée", vue.dureeH === null ? "" : `${vue.dureeH} h`],
                  ["Début", dateFr(vue.debut)],
                  ["Fin", dateFr(vue.fin)],
                  ["N° certificat / attestation", vue.certificat],
                  ["Date de validité", dateFr(vue.validite)],
                ] as [string, string][]
              ).map(([libelle, valeur]) => (
                <div key={libelle}>
                  <dt className="text-muted-foreground">{libelle}</dt>
                  <dd className="font-medium">{valeur || "—"}</dd>
                </div>
              ))}
            </dl>
            {vue.notes && (
              <div className="text-sm">
                <div className="text-muted-foreground">Notes</div>
                <p>{vue.notes}</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {vue.document ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => void downloadStoredFile(vue.document!)}
                >
                  <FileText className="h-4 w-4 text-blue-500" />
                  {vue.document.name}
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Aucun document joint.
                </span>
              )}
              {lienSource(vue, salarieConnu(vue.salarieId)) && (
                <Button variant="ghost" size="sm" className="gap-2" asChild>
                  <Link href={lienSource(vue, salarieConnu(vue.salarieId))!}>
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir la source
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Suppression */}
      <Modal
        open={aSupprimer !== null}
        onOpenChange={(ouvert) => !ouvert && setASupprimer(null)}
        type="confirmation"
        title="Supprimer la formation ?"
        description={
          aSupprimer
            ? `« ${aSupprimer.intitule} » (${aSupprimer.salarie}) sera retirée du registre.`
            : undefined
        }
        actions={{
          primary: {
            label: "Supprimer",
            variant: "destructive",
            onClick: () => void supprimer(),
          },
          secondary: {
            label: "Annuler",
            variant: "outline",
            onClick: () => setASupprimer(null),
          },
        }}
      >
        <p className="text-sm text-muted-foreground">
          Cette action est définitive.
        </p>
      </Modal>
    </div>
  );
}
