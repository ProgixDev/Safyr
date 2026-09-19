"use client";

import { useMemo, useState } from "react";

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

/** Responsables enregistrés (base de données), triés par nom. */
export function useResponsables() {
  const registre = useRegistre<LigneResponsable>(
    "responsable_disciplinaire",
    AUCUN_FICHIER,
  );
  const responsables = useMemo(
    () =>
      registre.lignes
        .filter((r) => (r.nom ?? "").trim())
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [registre.lignes],
  );

  /** Enregistre un responsable et renvoie son nom (celui déjà connu si doublon). */
  const ajouter = async (nom: string, fonction: string): Promise<string> => {
    const propre = nom.trim();
    const existant = responsables.find(
      (r) => r.nom.trim().toLowerCase() === propre.toLowerCase(),
    );
    if (existant) return existant.nom;
    await registre.enregistrer(
      { id: "", nom: propre, fonction: fonction.trim() },
      {
        period: new Date().toISOString().slice(0, 7),
        label: propre,
      },
    );
    return propre;
  };

  /** Fonction d'un responsable, à partir de son nom. */
  const fonctionDe = (nom: string) =>
    responsables.find((r) => r.nom === nom)?.fonction ?? "";

  return { responsables, ajouter, fonctionDe, isLoading: registre.isLoading };
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
  const { responsables, ajouter } = useResponsables();
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
