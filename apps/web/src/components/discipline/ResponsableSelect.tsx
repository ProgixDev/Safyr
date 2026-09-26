"use client";

import { useMemo, useState } from "react";

import { Pencil, Settings2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegistre } from "@/hooks/fiscal/use-registre";
import type { LigneResponsable } from "./discipline-shared";

const AJOUTER = "__ajouter_responsable__";
const AUCUN_FICHIER = [] as const;

/** Responsable enregistré ; `ids` regroupe les doublons de même nom. */
export interface Responsable extends LigneResponsable {
  ids: string[];
}

/** Responsables enregistrés (base de données), triés par nom. */
export function useResponsables() {
  const registre = useRegistre<LigneResponsable>(
    "responsable_disciplinaire",
    AUCUN_FICHIER,
  );
  const responsables = useMemo(() => {
    // Un même nom enregistré deux fois n'apparaît qu'une fois, mais la
    // suppression retire toutes les lignes : sinon il « reviendrait ».
    const parNom = new Map<string, Responsable>();
    for (const r of registre.lignes) {
      const nom = (r.nom ?? "").trim();
      if (!nom) continue;
      const cle = nom.toLowerCase();
      const connu = parNom.get(cle);
      if (connu) connu.ids.push(r.id);
      else parNom.set(cle, { ...r, nom, ids: [r.id] });
    }
    return [...parNom.values()].sort((a, b) =>
      a.nom.localeCompare(b.nom, "fr"),
    );
  }, [registre.lignes]);

  const infos = (nom: string) => ({
    period: new Date().toISOString().slice(0, 7),
    label: nom,
  });

  /** Enregistre un responsable et renvoie son nom (celui déjà connu si doublon). */
  const ajouter = async (nom: string, fonction: string): Promise<string> => {
    const propre = nom.trim();
    const existant = responsables.find(
      (r) => r.nom.trim().toLowerCase() === propre.toLowerCase(),
    );
    if (existant) return existant.nom;
    await registre.enregistrer(
      { id: "", nom: propre, fonction: fonction.trim() },
      infos(propre),
    );
    return propre;
  };

  /**
   * Modifie un responsable. Les sanctions et procédures déjà créées gardent le
   * nom saisi à l'époque (copié dans leur ligne) : elles ne sont pas touchées.
   */
  const modifier = async (
    responsable: Responsable,
    nom: string,
    fonction: string,
  ) => {
    const [id, ...doublons] = responsable.ids;
    await registre.enregistrer(
      { id, nom: nom.trim(), fonction: fonction.trim() },
      infos(nom.trim()),
    );
    await Promise.all(doublons.map((d) => registre.supprimerLigne(d)));
  };

  /** Retire le responsable de la liste (et ses éventuels doublons). */
  const supprimer = async (responsable: Responsable) => {
    await Promise.all(responsable.ids.map((id) => registre.supprimerLigne(id)));
  };

  /** Fonction d'un responsable, à partir de son nom. */
  const fonctionDe = (nom: string) =>
    responsables.find((r) => r.nom === nom)?.fonction ?? "";

  return {
    responsables,
    ajouter,
    modifier,
    supprimer,
    fonctionDe,
    isLoading: registre.isLoading,
  };
}

interface ResponsableSelectProps {
  id?: string;
  /** Nom du responsable ; vide tant que rien n'est choisi. */
  value: string;
  onChange: (nom: string) => void;
}

/**
 * Liste des responsables enregistrés, avec « + Ajouter un responsable »
 * (nom et fonction) pour compléter la liste sans quitter le formulaire.
 */
export function ResponsableSelect({
  id,
  value,
  onChange,
}: ResponsableSelectProps) {
  const { responsables, ajouter, modifier, supprimer } = useResponsables();
  const [gestionOuverte, setGestionOuverte] = useState(false);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [fonction, setFonction] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Une valeur déjà enregistrée sur une ancienne sanction reste affichable
  // même si le responsable n'est pas (ou plus) dans la liste.
  const valeurInconnue =
    value && !responsables.some((r) => r.nom === value) ? value : null;

  const handleChange = (v: string) => {
    if (v !== AJOUTER) {
      onChange(v);
      return;
    }
    setNom("");
    setFonction("");
    setErreur(null);
    // Différé : ouvrir la boîte pendant que la liste se ferme laisse parfois
    // la page non cliquable.
    setTimeout(() => setAjoutOuvert(true), 0);
  };

  const handleAjouter = async () => {
    setEnCours(true);
    setErreur(null);
    try {
      onChange(await ajouter(nom, fonction));
      setAjoutOuvert(false);
    } catch (e) {
      setErreur(
        `Impossible d'enregistrer le responsable : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    } finally {
      setEnCours(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Select value={value || undefined} onValueChange={handleChange}>
            <SelectTrigger id={id}>
              <SelectValue placeholder="Sélectionner un responsable" />
            </SelectTrigger>
            <SelectContent>
              {valeurInconnue && (
                <SelectItem value={valeurInconnue}>{valeurInconnue}</SelectItem>
              )}
              {responsables.map((r) => (
                <SelectItem key={r.id} value={r.nom}>
                  {r.fonction ? `${r.nom} — ${r.fonction}` : r.nom}
                </SelectItem>
              ))}
              <SelectItem value={AJOUTER}>+ Ajouter un responsable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          title="Gérer les responsables (modifier, supprimer)"
          aria-label="Gérer les responsables"
          onClick={() => setGestionOuverte(true)}
        >
          <Settings2 className="h-4 w-4" />
          Gérer
        </Button>
      </div>

      <GestionResponsables
        open={gestionOuverte}
        onOpenChange={setGestionOuverte}
        responsables={responsables}
        onModifier={async (r, nom, fonction) => {
          await modifier(r, nom, fonction);
          // Le champ suit le renommage du responsable choisi.
          if (r.nom === value) onChange(nom.trim());
        }}
        onSupprimer={async (r) => {
          await supprimer(r);
          // Un nom supprimé ne reste pas sélectionné dans le formulaire ; les
          // sanctions et procédures déjà créées gardent leur signataire.
          if (r.nom === value) onChange("");
        }}
      />

      <Modal
        open={ajoutOuvert}
        onOpenChange={setAjoutOuvert}
        type="form"
        size="md"
        title="Ajouter un responsable"
        description="Il sera enregistré et proposé pour les prochaines sanctions et procédures."
        actions={{
          primary: {
            label: enCours ? "Enregistrement…" : "Enregistrer",
            onClick: () => void handleAjouter(),
            disabled: enCours || !nom.trim(),
          },
          secondary: {
            label: "Annuler",
            onClick: () => setAjoutOuvert(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="responsable-nom">Nom *</Label>
            <Input
              id="responsable-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Prénom et nom"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsable-fonction">Fonction</Label>
            <Input
              id="responsable-fonction"
              value={fonction}
              onChange={(e) => setFonction(e.target.value)}
              placeholder="Ex : Directeur des ressources humaines"
            />
          </div>
          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
        </div>
      </Modal>
    </>
  );
}

interface GestionResponsablesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responsables: Responsable[];
  onModifier: (r: Responsable, nom: string, fonction: string) => Promise<void>;
  onSupprimer: (r: Responsable) => Promise<void>;
}

/** Liste de tous les responsables, avec modification et suppression. */
function GestionResponsables({
  open,
  onOpenChange,
  responsables,
  onModifier,
  onSupprimer,
}: GestionResponsablesProps) {
  const [enEdition, setEnEdition] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [fonction, setFonction] = useState("");
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const executer = async (id: string, action: () => Promise<void>) => {
    setEnCours(id);
    setErreur(null);
    try {
      await action();
      setEnEdition(null);
      setAConfirmer(null);
    } catch (e) {
      setErreur(
        `Opération impossible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    } finally {
      setEnCours(null);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setEnEdition(null);
          setAConfirmer(null);
          setErreur(null);
        }
        onOpenChange(v);
      }}
      type="form"
      size="md"
      title="Gérer les responsables"
      description="Modifiez ou supprimez un responsable de la liste. Les sanctions et procédures déjà créées conservent le nom de leur signataire."
      actions={{
        primary: { label: "Fermer", onClick: () => onOpenChange(false) },
      }}
    >
      <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
        {responsables.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucun responsable enregistré.
          </p>
        )}
        {responsables.map((r) => {
          const occupe = enCours === r.id;
          return (
            <div key={r.id} className="rounded-lg border p-3">
              {enEdition === r.id ? (
                <div className="space-y-2">
                  <Input
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Prénom et nom"
                    aria-label="Nom du responsable"
                  />
                  <Input
                    value={fonction}
                    onChange={(e) => setFonction(e.target.value)}
                    placeholder="Fonction"
                    aria-label="Fonction du responsable"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEnEdition(null)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!nom.trim() || occupe}
                      onClick={() =>
                        void executer(r.id, () => onModifier(r, nom, fonction))
                      }
                    >
                      {occupe ? "Enregistrement…" : "Enregistrer"}
                    </Button>
                  </div>
                </div>
              ) : aConfirmer === r.id ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm">
                    Supprimer <span className="font-medium">{r.nom}</span> de la
                    liste ?
                  </p>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAConfirmer(null)}
                    >
                      Non
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={occupe}
                      onClick={() => void executer(r.id, () => onSupprimer(r))}
                    >
                      {occupe ? "Suppression…" : "Oui, supprimer"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.nom}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.fonction || "Fonction non renseignée"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Modifier ${r.nom}`}
                      title="Modifier"
                      onClick={() => {
                        setNom(r.nom);
                        setFonction(r.fonction ?? "");
                        setAConfirmer(null);
                        setEnEdition(r.id);
                      }}
                    >
                      <Pencil className="h-4 w-4 text-orange-500" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Supprimer ${r.nom}`}
                      title="Supprimer"
                      onClick={() => {
                        setEnEdition(null);
                        setAConfirmer(r.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-500" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {erreur && <p className="text-sm text-destructive">{erreur}</p>}
      </div>
    </Modal>
  );
}
