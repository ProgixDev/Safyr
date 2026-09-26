"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES_GRILLE,
  SANS_ECHELON,
  echelonsDe,
  formaterEuros,
  formaterTaux,
  niveauxDe,
} from "@/lib/grille-salaires";
import {
  recalculerFiche,
  type BaseHeures,
  type FicheEmploi,
} from "@/lib/fiche-emploi";

export type ChangementFiche = "grille" | "essai";

interface Props {
  fiche: FicheEmploi;
  /** `modifie` dit quelle zone a changé (la fin d'essai proposée en dépend). */
  onChange: (next: FicheEmploi, modifie: ChangementFiche) => void;
  disabled?: boolean;
}

// Champ calculé : affiché comme un champ de saisie mais non modifiable.
function ChampCalcule({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        readOnly
        tabIndex={-1}
        value={valeur}
        placeholder="—"
        className="bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
      />
    </div>
  );
}

/**
 * Grille des salaires en cascade (catégorie, niveau, échelon) : le coefficient,
 * le taux horaire et le salaire mensuel se remplissent seuls. Avec la base
 * « Autres », le nombre d'heures se saisit à la main et le salaire est calculé
 * au prorata sans jamais toucher aux heures saisies.
 */
export function FicheEmploiFields({ fiche, onChange, disabled }: Props) {
  const niveaux = fiche.categorie ? niveauxDe(fiche.categorie) : [];
  const echelons =
    fiche.categorie && fiche.niveau
      ? echelonsDe(fiche.categorie, fiche.niveau)
      : [];

  const majGrille = (patch: Partial<FicheEmploi>) =>
    onChange(recalculerFiche({ ...fiche, ...patch }), "grille");

  const changerCategorie = (categorie: string) =>
    majGrille({ categorie, niveau: "", echelon: "" });

  const changerNiveau = (niveau: string) => {
    const suivants = echelonsDe(fiche.categorie, niveau);
    majGrille({
      niveau,
      echelon: suivants.length === 0 ? SANS_ECHELON : "",
    });
  };

  const changerBase = (base: BaseHeures) =>
    majGrille({
      base,
      heuresManuelles: base === "autres" ? fiche.heuresManuelles : null,
    });

  const changerHeures = (brut: string) => {
    // On garde exactement la valeur saisie (108 reste 108).
    const n = brut === "" ? null : Number(brut.replace(",", "."));
    majGrille({ heuresManuelles: n !== null && Number.isFinite(n) ? n : null });
  };

  const salaireAffiche =
    fiche.salaireMensuel !== null ? formaterEuros(fiche.salaireMensuel) : "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Catégorie</Label>
          <Select
            value={fiche.categorie || undefined}
            onValueChange={changerCategorie}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES_GRILLE.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Niveau / Position</Label>
          <Select
            value={fiche.niveau || undefined}
            onValueChange={changerNiveau}
            disabled={disabled || !fiche.categorie}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              {niveaux.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Échelon</Label>
          <Select
            value={fiche.echelon || undefined}
            onValueChange={(echelon) => majGrille({ echelon })}
            disabled={disabled || !fiche.niveau || echelons.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  fiche.niveau && echelons.length === 0
                    ? "Sans échelon"
                    : "Choisir…"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {echelons.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ChampCalcule
          label="Coefficient"
          valeur={fiche.coefficient !== null ? String(fiche.coefficient) : ""}
        />
        <ChampCalcule
          label="Taux / h"
          valeur={
            fiche.tauxHoraire !== null ? formaterTaux(fiche.tauxHoraire) : ""
          }
        />
        <ChampCalcule label="Salaire / mois" valeur={salaireAffiche} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Base</Label>
          <Select
            value={fiche.base}
            onValueChange={(v) => changerBase(v as BaseHeures)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="151.67">151,67 h</SelectItem>
              <SelectItem value="autres">Autres</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {fiche.base === "autres" && (
          <div className="space-y-2">
            <Label>Nombre d&apos;heures par mois</Label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="ex. 108"
              disabled={disabled}
              value={fiche.heuresManuelles ?? ""}
              onChange={(e) => changerHeures(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Début de période d&apos;essai</Label>
          <Input
            type="date"
            disabled={disabled}
            value={fiche.debutEssai}
            onChange={(e) =>
              onChange({ ...fiche, debutEssai: e.target.value }, "essai")
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Fin de période d&apos;essai</Label>
          <Input
            type="date"
            disabled={disabled}
            value={fiche.finEssai}
            onChange={(e) =>
              onChange({ ...fiche, finEssai: e.target.value }, "essai")
            }
          />
        </div>
      </div>
    </div>
  );
}
