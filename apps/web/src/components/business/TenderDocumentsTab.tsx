"use client";

import { useState } from "react";
import { FileText, Paperclip, Plus } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TYPES_DOCUMENT_AO,
  aujourdhui,
  messageErreur,
  type LigneAppelOffre,
  type LigneDocumentAO,
} from "./appel-offre-types";
import type { useDocumentsAO } from "./use-documents-ao";

/** Valeur du menu déroulant pour un document sans appel d'offre. */
const GENERAL = "general";

interface FormulaireDocument {
  name: string;
  tenderId: string;
  type: string;
  date: string;
  notes: string;
  fichier: File | null;
}

const FORMULAIRE_VIDE: FormulaireDocument = {
  name: "",
  tenderId: GENERAL,
  type: TYPES_DOCUMENT_AO[0],
  date: "",
  notes: "",
  fichier: null,
};

interface Props {
  tenders: LigneAppelOffre[];
  docs: ReturnType<typeof useDocumentsAO>;
}

export function TenderDocumentsTab({ tenders, docs }: Props) {
  const [formOuvert, setFormOuvert] = useState(false);
  const [edition, setEdition] = useState<LigneDocumentAO | null>(null);
  const [form, setForm] = useState<FormulaireDocument>(FORMULAIRE_VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [vue, setVue] = useState<LigneDocumentAO | null>(null);
  const [aSupprimer, setASupprimer] = useState<LigneDocumentAO | null>(null);

  const appelDe = (id: string) => tenders.find((t) => t.id === id);
  const libelleAppel = (id: string) => {
    if (!id) return "Document général";
    const t = appelDe(id);
    return t ? `${t.reference} - ${t.title}` : "Appel d'offre supprimé";
  };

  const lignes = [...docs.documents].sort((a, b) =>
    (b.date || "").localeCompare(a.date || ""),
  );

  const colonnes: ColumnDef<LigneDocumentAO>[] = [
    {
      key: "name",
      label: "Nom du document",
      render: (d) => (
        <span className="flex items-center gap-2 font-medium">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {d.name}
        </span>
      ),
    },
    {
      key: "tenderId",
      label: "Appel d'offre lié",
      render: (d) => (
        <span className="text-sm">{libelleAppel(d.tenderId)}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (d) => <Badge variant="outline">{d.type}</Badge>,
    },
    {
      key: "date",
      label: "Date",
      render: (d) =>
        d.date ? new Date(d.date).toLocaleDateString("fr-FR") : "-",
    },
    {
      key: "fichier",
      label: "Fichier",
      sortable: false,
      render: (d) =>
        d.fichier ? (
          <Badge variant="secondary">
            <Paperclip className="h-3 w-3 mr-1" />
            Joint
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Aucun fichier</span>
        ),
    },
  ];

  const ouvrirCreation = () => {
    setEdition(null);
    setErreur(null);
    setForm({ ...FORMULAIRE_VIDE, date: aujourdhui() });
    setFormOuvert(true);
  };

  const ouvrirEdition = (d: LigneDocumentAO) => {
    setEdition(d);
    setErreur(null);
    setForm({
      name: d.name,
      tenderId: d.tenderId || GENERAL,
      type: d.type,
      date: d.date,
      notes: d.notes ?? "",
      fichier: null,
    });
    setFormOuvert(true);
  };

  const fermerForm = () => {
    setFormOuvert(false);
    setEdition(null);
    setErreur(null);
    setForm(FORMULAIRE_VIDE);
  };

  const enregistrer = async () => {
    const nom = form.name.trim() || form.fichier?.name || "";
    if (!nom) {
      setErreur("Indiquez un nom de document ou choisissez un fichier.");
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      await docs.enregistrerDocument(
        {
          id: edition?.id ?? "",
          name: nom,
          tenderId: form.tenderId === GENERAL ? "" : form.tenderId,
          type: form.type,
          date: form.date || aujourdhui(),
          notes: form.notes.trim() || undefined,
        },
        form.fichier,
      );
      fermerForm();
    } catch (e) {
      setErreur(`Enregistrement impossible : ${messageErreur(e)}`);
    } finally {
      setEnCours(false);
    }
  };

  const televerser = async (d: LigneDocumentAO) => {
    try {
      await docs.remplacerFichier(d);
    } catch (e) {
      alert(`Téléversement impossible : ${messageErreur(e)}`);
    }
  };

  const confirmerSuppression = async () => {
    if (!aSupprimer) return;
    const cible = aSupprimer;
    setASupprimer(null);
    try {
      await docs.supprimerDocument(cible);
    } catch (e) {
      alert(`Suppression impossible : ${messageErreur(e)}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Pièces des appels d&apos;offre : cahiers des charges, mémoires, pièces
          administratives, offres de prix.
        </p>
        <Button onClick={ouvrirCreation}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      <DataTable
        data={lignes}
        isLoading={docs.isLoading}
        columns={colonnes}
        searchKey="name"
        searchPlaceholder="Rechercher un document..."
        filters={[
          {
            key: "tenderId",
            label: "Appel d'offre",
            options: tenders.map((t) => ({
              value: t.id,
              label: `${t.reference} - ${t.title}`,
            })),
          },
          {
            key: "type",
            label: "Type",
            options: TYPES_DOCUMENT_AO.map((t) => ({ value: t, label: t })),
          },
        ]}
        onRowClick={(d) => setVue(d)}
        actions={(d) => (
          <RowActionsMenu
            onView={() => setVue(d)}
            onEdit={() => ouvrirEdition(d)}
            onUpload={() => void televerser(d)}
            onDownload={() => docs.telecharger(d)}
            onDelete={() => setASupprimer(d)}
          />
        )}
      />

      {/* Ajout / modification */}
      <Modal
        open={formOuvert}
        onOpenChange={(ouvert) => {
          if (!ouvert) fermerForm();
        }}
        type="form"
        title={edition ? "Modifier le document" : "Ajouter un document"}
        size="lg"
        actions={{
          primary: {
            label: edition ? "Enregistrer les modifications" : "Ajouter",
            onClick: () => void enregistrer(),
            loading: enCours,
            disabled: enCours,
          },
          secondary: {
            label: "Annuler",
            onClick: fermerForm,
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          {erreur && (
            <p className="text-sm text-destructive" role="alert">
              {erreur}
            </p>
          )}
          <div>
            <Label htmlFor="ao-doc-nom">Nom du document</Label>
            <Input
              id="ao-doc-nom"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex : Cahier des charges - Centre commercial"
            />
          </div>
          <div>
            <Label htmlFor="ao-doc-appel">Appel d&apos;offre lié</Label>
            <Select
              value={form.tenderId}
              onValueChange={(v) => setForm({ ...form, tenderId: v })}
            >
              <SelectTrigger id="ao-doc-appel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GENERAL}>
                  Aucun (document général)
                </SelectItem>
                {tenders.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.reference} - {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ao-doc-type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger id="ao-doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_DOCUMENT_AO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ao-doc-date">Date</Label>
              <Input
                id="ao-doc-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="ao-doc-notes">Notes (optionnel)</Label>
            <Textarea
              id="ao-doc-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="ao-doc-fichier">
              {edition ? "Remplacer le fichier" : "Fichier"} (optionnel)
            </Label>
            <Input
              id="ao-doc-fichier"
              type="file"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
              onChange={(e) =>
                setForm({ ...form, fichier: e.target.files?.[0] ?? null })
              }
            />
            {edition?.fichier && !form.fichier && (
              <p className="text-xs text-muted-foreground mt-1">
                Fichier actuel : {edition.fichier.name}
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Détail */}
      <Modal
        open={vue !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setVue(null);
        }}
        type="details"
        title="Détails du document"
        size="lg"
        actions={{
          primary: {
            label: "Télécharger",
            onClick: () => vue && docs.telecharger(vue),
          },
          secondary: {
            label: "Fermer",
            onClick: () => setVue(null),
            variant: "outline",
          },
        }}
      >
        {vue && (
          <div className="space-y-4">
            <div>
              <Label>Nom</Label>
              <p className="text-sm font-medium">{vue.name}</p>
            </div>
            <div>
              <Label>Appel d&apos;offre lié</Label>
              <p className="text-sm font-medium">
                {libelleAppel(vue.tenderId)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <p className="text-sm font-medium">{vue.type}</p>
              </div>
              <div>
                <Label>Date</Label>
                <p className="text-sm font-medium">
                  {vue.date
                    ? new Date(vue.date).toLocaleDateString("fr-FR")
                    : "Non renseigné"}
                </p>
              </div>
            </div>
            <div>
              <Label>Fichier</Label>
              <p className="text-sm font-medium">
                {vue.fichier ? vue.fichier.name : "Aucun fichier joint"}
              </p>
            </div>
            {vue.notes && (
              <div>
                <Label>Notes</Label>
                <p className="text-sm whitespace-pre-wrap">{vue.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Suppression */}
      <Modal
        open={aSupprimer !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setASupprimer(null);
        }}
        type="warning"
        title="Supprimer le document"
        description="Cette action est irréversible."
        actions={{
          primary: {
            label: "Supprimer",
            onClick: () => void confirmerSuppression(),
            variant: "destructive",
          },
          secondary: {
            label: "Annuler",
            onClick: () => setASupprimer(null),
            variant: "outline",
          },
        }}
        closable={false}
      >
        <p className="text-sm text-muted-foreground">
          {aSupprimer
            ? `Supprimer « ${aSupprimer.name} » et son fichier joint ?`
            : ""}
        </p>
      </Modal>
    </div>
  );
}
