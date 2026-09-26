"use client";

import { useState } from "react";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROW_ACTION_TONES } from "@/components/ui/row-actions-menu";
import {
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Pencil,
  Upload,
  Download,
  Archive,
  ArchiveRestore,
  MoreVertical,
} from "lucide-react";
import { useEmployeeOptions } from "@/hooks/employees";
import { useRegistre } from "@/hooks/fiscal";
import { Combobox } from "@/components/ui/combobox";
import { TEINTES, type Teinte } from "@/components/safety-training/couleurs";
import {
  downloadStoredFile,
  pickFile,
  type StoredFile,
} from "@/lib/document-files";
import type { MedicalVisit } from "@/data/hr-occupational-medicine";

/**
 * Visite telle qu'enregistrée en base (registre « visite_medicale »).
 * Elle vivait dans l'état de la page : une visite planifiée disparaissait au
 * rechargement. Le document (fiche d'aptitude…) est une pièce jointe.
 */
interface Visite extends Omit<MedicalVisit, "documents"> {
  archived?: boolean;
  archivedAt?: string;
  document?: StoredFile | null;
}

const CHAMPS_PIECES = ["document"] as const;

const STATUTS_VISITE: MedicalVisit["status"][] = [
  "À planifier",
  "Planifiée",
  "Effectuée",
  "En retard",
  "Annulée",
];

const APTITUDES: { valeur: MedicalVisit["fitness"]; libelle: string }[] = [
  { valeur: "-", libelle: "Non renseignée" },
  { valeur: "Apte", libelle: "Apte" },
  { valeur: "Apte avec réserves", libelle: "Apte avec réserves" },
  { valeur: "Inapte temporaire", libelle: "Inapte temporaire" },
  { valeur: "Inapte", libelle: "Inapte" },
];

/** Apte = vert, inapte = rouge ; « avec réserves » reste orange (entre les deux). */
const TEINTE_APTITUDE: Record<MedicalVisit["fitness"], Teinte> = {
  Apte: "vert",
  "Apte avec réserves": "orange",
  "Inapte temporaire": "rouge",
  Inapte: "rouge",
  "-": "gris",
};

/** Pastille de couleur des choix d'aptitude dans le formulaire. */
const POINT_APTITUDE: Record<MedicalVisit["fitness"], string> = {
  Apte: "bg-green-500",
  "Apte avec réserves": "bg-orange-500",
  "Inapte temporaire": "bg-red-500",
  Inapte: "bg-red-500",
  "-": "bg-gray-400",
};

const TEINTE_STATUT: Record<MedicalVisit["status"], Teinte> = {
  "À planifier": "orange",
  Planifiée: "violet",
  Effectuée: "vert",
  "En retard": "rouge",
  Annulée: "gris",
};

const aujourdhui = () => new Date().toISOString().slice(0, 10);

/**
 * Une visite planifiée dont la date est passée est en retard, même si
 * personne n'a pensé à changer son statut.
 */
function statutAffiche(visite: Visite): MedicalVisit["status"] {
  if (
    visite.status === "Planifiée" &&
    visite.scheduledDate &&
    visite.scheduledDate.slice(0, 10) < aujourdhui()
  ) {
    return "En retard";
  }
  return visite.status;
}

// Lecture directe du jour « AAAA-MM-JJ » : passer par Date décalerait d'un
// jour dans un fuseau à l'ouest de Greenwich.
const dateFr = (iso?: string) => {
  if (!iso) return "-";
  const jour = /^(d{4})-(d{2})-(d{2})/.exec(iso);
  if (jour) return `${jour[3]}/${jour[2]}/${jour[1]}`;
  return new Date(iso).toLocaleDateString("fr-FR");
};

/** Périodicité de la visite médicale : 5 ans après la visite. */
const DELAI_PROCHAINE_VISITE_ANS = 5;

/** « AAAA-MM-JJ » + 5 ans ; le 29 février devient le 28 si l'année cible n'est pas bissextile. */
function plusCinqAns(iso: string): string {
  const m = /^(d{4})-(d{2})-(d{2})/.exec(iso);
  if (!m) return "";
  const annee = Number(m[1]) + DELAI_PROCHAINE_VISITE_ANS;
  const mois = Number(m[2]);
  let jour = Number(m[3]);
  const dernierJour = new Date(Date.UTC(annee, mois, 0)).getUTCDate();
  if (jour > dernierJour) jour = dernierJour;
  return `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

/** Prochaine visite : la date enregistrée, sinon date de la visite + 5 ans. */
function prochaineVisite(visite: Visite): string | undefined {
  if (visite.nextVisitDate) return visite.nextVisitDate;
  const base = visite.completedDate || visite.scheduledDate;
  return base ? plusCinqAns(base) || undefined : undefined;
}

const FORMULAIRE_VIDE = {
  employeeName: "",
  type: "VM" as MedicalVisit["type"],
  scheduledDate: "",
  doctor: "",
  organization: "Médecine du Travail Paris",
  status: "À planifier" as MedicalVisit["status"],
  completedDate: "",
  nextVisitDate: "",
  fitness: "-" as MedicalVisit["fitness"],
  restrictions: "",
};

function BadgeAptitude({ aptitude }: { aptitude: MedicalVisit["fitness"] }) {
  return (
    <Badge variant="outline" className={TEINTES[TEINTE_APTITUDE[aptitude]]}>
      {aptitude === "-" ? "Non renseignée" : aptitude}
    </Badge>
  );
}

/**
 * Menu 3 points d'une visite : Voir · Modifier · Téléverser · Télécharger ·
 * Archiver. Écrit ici plutôt qu'avec le menu standard car celui-ci place
 * les actions propres à la page avant « Téléverser », alors que le client
 * attend « Archiver » en dernier.
 */
function MenuVisite({
  visite,
  onView,
  onEdit,
  onUpload,
  onArchive,
}: {
  visite: Visite;
  onView: () => void;
  onEdit: () => void;
  onUpload: () => void;
  onArchive: () => void;
}) {
  const fichier = visite.document;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Ouvrir le menu d'actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-44"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onView} className="cursor-pointer">
          <Eye className={`mr-2 h-4 w-4 ${ROW_ACTION_TONES.view}`} />
          Voir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Pencil className={`mr-2 h-4 w-4 ${ROW_ACTION_TONES.edit}`} />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onUpload} className="cursor-pointer">
          <Upload className={`mr-2 h-4 w-4 ${ROW_ACTION_TONES.upload}`} />
          {fichier ? "Remplacer le document" : "Téléverser"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => fichier && void downloadStoredFile(fichier)}
          disabled={!fichier}
          className="cursor-pointer"
        >
          <Download className={`mr-2 h-4 w-4 ${ROW_ACTION_TONES.download}`} />
          Télécharger
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onArchive} className="cursor-pointer">
          {visite.archived ? (
            <ArchiveRestore
              className={`mr-2 h-4 w-4 ${ROW_ACTION_TONES.history}`}
            />
          ) : (
            <Archive className={`mr-2 h-4 w-4 ${ROW_ACTION_TONES.history}`} />
          )}
          {visite.archived ? "Désarchiver" : "Archiver"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function OccupationalMedicinePage() {
  const salaries = useEmployeeOptions();
  // Le salarié se choisit dans la liste : c'était une saisie libre,
  // sujette aux fautes de frappe et sans lien avec le dossier.
  const optionsSalaries = salaries.map((salarie) => ({
    value: salarie.name,
    label: salarie.name,
  }));

  const registre = useRegistre<Visite>("visite_medicale", CHAMPS_PIECES);
  const visits = registre.lignes;

  const [voirArchives, setVoirArchives] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Identifiant, pas une copie : la fiche reflète le document déposé ou
  // l'archivage sans avoir à être rouverte.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState(FORMULAIRE_VIDE);
  // Vrai dès que l'utilisateur fixe lui-même la prochaine visite : le calcul
  // automatique (date + 5 ans) ne l'écrase plus.
  const [prochaineManuelle, setProchaineManuelle] = useState(false);

  /** Change une date de visite et recalcule la prochaine visite si elle est automatique. */
  const changerDates = (
    patch: Partial<
      Pick<typeof FORMULAIRE_VIDE, "scheduledDate" | "completedDate">
    >,
  ) => {
    const suivant = { ...formData, ...patch };
    if (!prochaineManuelle) {
      const base = suivant.completedDate || suivant.scheduledDate;
      suivant.nextVisitDate = base ? plusCinqAns(base) : "";
    }
    setFormData(suivant);
  };

  const selectedVisit = visits.find((v) => v.id === selectedId) ?? null;
  const actives = visits.filter((v) => !v.archived);
  const archivees = visits.filter((v) => v.archived);
  const affichees = voirArchives ? archivees : actives;

  const toSchedule = actives.filter(
    (v) => statutAffiche(v) === "À planifier",
  ).length;
  const overdue = actives.filter(
    (v) => statutAffiche(v) === "En retard",
  ).length;
  const completed = actives.filter((v) => v.status === "Effectuée").length;

  const infosVisite = (v: Visite) => ({
    period: (v.scheduledDate || v.completedDate || aujourdhui()).slice(0, 7),
    label: `${v.employeeName} — ${v.type}`.slice(0, 160),
    status: v.status,
  });

  const columns: ColumnDef<Visite>[] = [
    {
      key: "employeeName",
      label: "Employé",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      render: (visit) => {
        const variants: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          VM: "default",
          VIP: "secondary",
          "Pré-reprise": "outline",
          Reprise: "outline",
        };
        return <Badge variant={variants[visit.type]}>{visit.type}</Badge>;
      },
    },
    {
      key: "status",
      label: "Statut",
      render: (visit) => {
        if (visit.archived) {
          return (
            <Badge variant="outline" className={TEINTES.bleu}>
              Archivée
            </Badge>
          );
        }
        const statut = statutAffiche(visit);
        return (
          <Badge variant="outline" className={TEINTES[TEINTE_STATUT[statut]]}>
            {statut}
          </Badge>
        );
      },
    },
    {
      key: "scheduledDate",
      label: "Date prévue",
      render: (visit) => dateFr(visit.scheduledDate),
    },
    {
      key: "nextVisitDate",
      label: "Prochaine visite",
      render: (visit) => dateFr(prochaineVisite(visit)),
    },
    {
      key: "fitness",
      label: "Aptitude",
      render: (visit) => <BadgeAptitude aptitude={visit.fitness} />,
    },
    {
      key: "organization",
      label: "Organisme",
      render: (visit) => <span className="text-sm">{visit.organization}</span>,
    },
    {
      key: "document",
      label: "Document",
      render: (visit) =>
        visit.document ? (
          <span
            className="block max-w-40 truncate text-xs"
            title={visit.document.name}
          >
            {visit.document.name}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Aucun</span>
        ),
    },
    {
      key: "alertSent",
      label: "Alerte",
      render: (visit) =>
        visit.alertSent ? (
          <AlertCircle className="h-4 w-4 text-orange-600" />
        ) : null,
    },
  ];

  const handleCreate = () => {
    setEditingId(null);
    setFormData(FORMULAIRE_VIDE);
    setProchaineManuelle(false);
    setIsFormOpen(true);
  };

  const handleEdit = (visit: Visite) => {
    setEditingId(visit.id);
    const baseVisite = visit.completedDate || visit.scheduledDate;
    const enregistree = visit.nextVisitDate?.slice(0, 10) ?? "";
    // Une date différente de « visite + 5 ans » a été fixée à la main.
    setProchaineManuelle(
      !!enregistree && (!baseVisite || enregistree !== plusCinqAns(baseVisite)),
    );
    setFormData({
      employeeName: visit.employeeName,
      type: visit.type,
      scheduledDate: visit.scheduledDate?.slice(0, 10) ?? "",
      doctor: visit.doctor ?? "",
      organization: visit.organization ?? "",
      status: visit.status,
      completedDate: visit.completedDate?.slice(0, 10) ?? "",
      nextVisitDate: enregistree || (baseVisite ? plusCinqAns(baseVisite) : ""),
      fitness: visit.fitness,
      restrictions: visit.restrictions ?? "",
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    const salarie = salaries.find((s) => s.name === formData.employeeName);
    const maintenant = new Date().toISOString();
    try {
      if (editingId) {
        const existant = visits.find((v) => v.id === editingId);
        if (!existant) return;
        const misAJour: Visite = {
          ...existant,
          employeeId: salarie?.id ?? existant.employeeId,
          employeeName: formData.employeeName,
          employeeNumber: salarie?.employeeNumber ?? existant.employeeNumber,
          type: formData.type,
          status: formData.status,
          scheduledDate: formData.scheduledDate || undefined,
          completedDate: formData.completedDate || undefined,
          nextVisitDate: formData.nextVisitDate || undefined,
          fitness: formData.fitness,
          doctor: formData.doctor,
          organization: formData.organization,
          restrictions: formData.restrictions || undefined,
          updatedAt: maintenant,
        };
        await registre.enregistrer(misAJour, infosVisite(misAJour));
      } else {
        const nouvelle: Visite = {
          // Ignoré à la création : c'est le serveur qui attribue l'identifiant.
          id: "",
          employeeId: salarie?.id ?? "",
          employeeName: formData.employeeName,
          employeeNumber: salarie?.employeeNumber ?? "",
          type: formData.type,
          status: formData.scheduledDate ? "Planifiée" : "À planifier",
          scheduledDate: formData.scheduledDate || undefined,
          nextVisitDate: formData.nextVisitDate || undefined,
          fitness: "-",
          doctor: formData.doctor,
          organization: formData.organization,
          alertSent: false,
          createdAt: maintenant,
          updatedAt: maintenant,
        };
        await registre.enregistrer(nouvelle, infosVisite(nouvelle));
      }
      setIsFormOpen(false);
      setEditingId(null);
    } catch (e) {
      // La fenêtre reste ouverte : la saisie n'est pas perdue.
      alert(
        `Échec de l'enregistrement : ${
          e instanceof Error ? e.message : "Erreur inconnue"
        }`,
      );
    }
  };

  const handleUpload = async (visit: Visite) => {
    try {
      const fichier = await pickFile();
      if (!fichier) return;
      await registre.attacherFichier(visit.id, "document", fichier);
    } catch (e) {
      alert(
        `Échec du téléversement : ${
          e instanceof Error ? e.message : "Erreur inconnue"
        }`,
      );
    }
  };

  const handleArchive = (visit: Visite) => {
    const misAJour: Visite = visit.archived
      ? { ...visit, archived: false, archivedAt: undefined }
      : { ...visit, archived: true, archivedAt: new Date().toISOString() };
    void registre.enregistrer(misAJour, infosVisite(misAJour));
  };

  const handleSendAlert = (visit: Visite) => {
    const misAJour: Visite = { ...visit, alertSent: true };
    void registre.enregistrer(misAJour, infosVisite(misAJour));
    alert("Alerte envoyée à l'employé et l'organisme de médecine du travail");
  };

  // Le salarié d'une visite ancienne peut ne plus être dans la liste : on le
  // garde comme choix pour ne pas vider le champ à la modification.
  const optionsFormulaire =
    formData.employeeName &&
    !optionsSalaries.some((o) => o.value === formData.employeeName)
      ? [
          ...optionsSalaries,
          { value: formData.employeeName, label: formData.employeeName },
        ]
      : optionsSalaries;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Médecine du Travail</h1>
          <p className="text-muted-foreground">
            Suivi complet des visites médicales (VM, VIP, reprise, pré-reprise)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Planifier une visite
        </Button>
      </div>

      {/* Summary Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Clock}
          title="À planifier"
          value={toSchedule}
          subtext="Visites à organiser"
          color="orange"
        />

        <InfoCard
          icon={AlertCircle}
          title="En retard"
          value={overdue}
          subtext="Visites dépassées"
          color="red"
        />

        <InfoCard
          icon={CheckCircle}
          title="Effectuées"
          value={completed}
          subtext="Cette année"
          color="green"
        />

        <InfoCard
          icon={AlertCircle}
          title="Alertes envoyées"
          value={actives.filter((v) => v.alertSent).length}
          subtext="Ce mois"
          color="blue"
        />
      </InfoCardContainer>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setVoirArchives((v) => !v)}
        >
          <Archive className="h-4 w-4 mr-2 text-blue-500" />
          {voirArchives
            ? "Retour aux visites en cours"
            : `Voir les archives (${archivees.length})`}
        </Button>
      </div>

      <DataTable
        data={affichees}
        isLoading={registre.isLoading}
        columns={columns}
        searchKey="employeeName"
        searchPlaceholder="Rechercher un employé..."
        onRowClick={(visit) => setSelectedId(visit.id)}
        actions={(visit) => (
          <MenuVisite
            visite={visit}
            onView={() => setSelectedId(visit.id)}
            onEdit={() => handleEdit(visit)}
            onUpload={() => void handleUpload(visit)}
            onArchive={() => handleArchive(visit)}
          />
        )}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        type="form"
        title={
          editingId
            ? "Modifier la visite médicale"
            : "Planifier une visite médicale"
        }
        size="lg"
        actions={{
          primary: {
            label: editingId ? "Enregistrer" : "Créer",
            onClick: () => void handleSave(),
            disabled: !formData.employeeName,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsFormOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="employeeName">Employé</Label>
            <Combobox
              options={optionsFormulaire}
              value={formData.employeeName}
              onValueChange={(valeur) =>
                setFormData({ ...formData, employeeName: valeur })
              }
              placeholder="Sélectionner un employé"
              searchPlaceholder="Rechercher un employé..."
              emptyMessage="Aucun employé trouvé."
            />
          </div>

          <div>
            <Label htmlFor="type">Type de visite</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  type: value as MedicalVisit["type"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VM">Visite Médicale (VM)</SelectItem>
                <SelectItem value="VIP">
                  Visite Initiale Périodique (VIP)
                </SelectItem>
                <SelectItem value="Pré-reprise">
                  Visite de Pré-reprise
                </SelectItem>
                <SelectItem value="Reprise">Visite de Reprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="organization">Organisme</Label>
            <Input
              id="organization"
              value={formData.organization}
              onChange={(e) =>
                setFormData({ ...formData, organization: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="doctor">Médecin (optionnel)</Label>
            <Input
              id="doctor"
              value={formData.doctor}
              onChange={(e) =>
                setFormData({ ...formData, doctor: e.target.value })
              }
              placeholder="Dr. ..."
            />
          </div>

          <div>
            <Label htmlFor="scheduledDate">Date prévue (optionnel)</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => changerDates({ scheduledDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="nextVisitDate">Prochaine visite</Label>
            <Input
              id="nextVisitDate"
              type="date"
              value={formData.nextVisitDate}
              onChange={(e) => {
                const valeur = e.target.value;
                // Champ vidé : on repasse au calcul automatique.
                const base = formData.completedDate || formData.scheduledDate;
                setProchaineManuelle(!!valeur);
                setFormData({
                  ...formData,
                  nextVisitDate: valeur || (base ? plusCinqAns(base) : ""),
                });
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Calculée automatiquement : date de la visite + 5 ans. Vous pouvez
              la modifier.
            </p>
          </div>

          {editingId && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        status: value as MedicalVisit["status"],
                      })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUTS_VISITE.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fitness">Aptitude</Label>
                  <Select
                    value={formData.fitness}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        fitness: value as MedicalVisit["fitness"],
                      })
                    }
                  >
                    <SelectTrigger id="fitness">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APTITUDES.map((a) => (
                        <SelectItem key={a.valeur} value={a.valeur}>
                          <span className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${POINT_APTITUDE[a.valeur]}`}
                            />
                            {a.libelle}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="completedDate">Date d&apos;exécution</Label>
                  <Input
                    id="completedDate"
                    type="date"
                    value={formData.completedDate}
                    onChange={(e) =>
                      changerDates({ completedDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="restrictions">
                  Restrictions / Observations
                </Label>
                <Textarea
                  id="restrictions"
                  value={formData.restrictions}
                  onChange={(e) =>
                    setFormData({ ...formData, restrictions: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={selectedVisit !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setSelectedId(null);
        }}
        type="details"
        title="Détails de la visite médicale"
        size="lg"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setSelectedId(null),
          },
        }}
      >
        {selectedVisit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employé</Label>
                <p className="text-sm font-medium">
                  {selectedVisit.employeeName}
                </p>
              </div>
              <div>
                <Label>Type</Label>
                <div>
                  <Badge variant="default">{selectedVisit.type}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statut</Label>
                <div>
                  {selectedVisit.archived ? (
                    <Badge variant="outline" className={TEINTES.bleu}>
                      Archivée
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={
                        TEINTES[TEINTE_STATUT[statutAffiche(selectedVisit)]]
                      }
                    >
                      {statutAffiche(selectedVisit)}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <Label>Aptitude</Label>
                <div>
                  <BadgeAptitude aptitude={selectedVisit.fitness} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date prévue</Label>
                <p className="text-sm font-medium">
                  {selectedVisit.scheduledDate
                    ? dateFr(selectedVisit.scheduledDate)
                    : "Non planifiée"}
                </p>
              </div>
              {selectedVisit.completedDate && (
                <div>
                  <Label>Date d&apos;exécution</Label>
                  <p className="text-sm font-medium">
                    {dateFr(selectedVisit.completedDate)}
                  </p>
                </div>
              )}
            </div>

            {prochaineVisite(selectedVisit) && (
              <div>
                <Label>Prochaine visite</Label>
                <p className="text-sm font-medium">
                  {dateFr(prochaineVisite(selectedVisit))}
                </p>
              </div>
            )}

            <div>
              <Label>Organisme</Label>
              <p className="text-sm font-medium">
                {selectedVisit.organization}
              </p>
            </div>

            {selectedVisit.doctor && (
              <div>
                <Label>Médecin</Label>
                <p className="text-sm font-medium">{selectedVisit.doctor}</p>
              </div>
            )}

            {selectedVisit.restrictions && (
              <div>
                <Label>Restrictions / Observations</Label>
                <p className="text-sm">{selectedVisit.restrictions}</p>
              </div>
            )}

            <div>
              <Label>Document</Label>
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-muted p-2">
                <span className="truncate text-sm">
                  {selectedVisit.document?.name ?? "Aucun document déposé"}
                </span>
                <div className="flex shrink-0 gap-1">
                  {selectedVisit.document && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void downloadStoredFile(selectedVisit.document!)
                      }
                    >
                      <Download
                        className={`mr-1 h-3.5 w-3.5 ${ROW_ACTION_TONES.download}`}
                      />
                      Télécharger
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleUpload(selectedVisit)}
                  >
                    <Upload
                      className={`mr-1 h-3.5 w-3.5 ${ROW_ACTION_TONES.upload}`}
                    />
                    {selectedVisit.document ? "Remplacer" : "Téléverser"}
                  </Button>
                </div>
              </div>
            </div>

            {!selectedVisit.alertSent &&
              (statutAffiche(selectedVisit) === "À planifier" ||
                statutAffiche(selectedVisit) === "En retard") && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    handleSendAlert(selectedVisit);
                    setSelectedId(null);
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Envoyer une alerte automatique
                </Button>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}
