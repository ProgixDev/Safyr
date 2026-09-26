"use client";

import { useState, type ReactNode } from "react";
import { FileSpreadsheet, FileText, Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Grille de cartes KPI qui tient toujours sur UNE seule ligne dès 1024 px
 * (remarque client : la dernière carte retombait seule à la ligne).
 * Les classes sont écrites en toutes lettres pour que Tailwind les détecte.
 */
const GRILLES = {
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
} as const;

export function GrilleKpi({
  colonnes,
  children,
}: {
  /** Nombre de cartes : une colonne par carte. */
  colonnes: keyof typeof GRILLES;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-3 lg:gap-4", GRILLES[colonnes])}>
      {children}
    </div>
  );
}

/** Deux boutons d'export (Excel + PDF) ; l'export porte sur le tableau affiché. */
export function BoutonsExport({
  onExcel,
  onPdf,
  disabled,
}: {
  onExcel: () => Promise<void> | void;
  onPdf: () => Promise<void> | void;
  disabled?: boolean;
}) {
  const [enCours, setEnCours] = useState<"excel" | "pdf" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const lancer = async (
    type: "excel" | "pdf",
    action: () => Promise<void> | void,
  ) => {
    setErreur(null);
    setEnCours(type);
    try {
      await action();
    } catch {
      setErreur("Export impossible. Réessayez dans un instant.");
    } finally {
      setEnCours(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={disabled || enCours !== null}
          onClick={() => void lancer("excel", onExcel)}
        >
          {enCours === "excel" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          )}
          Exporter en Excel
        </Button>
        <Button
          variant="outline"
          disabled={disabled || enCours !== null}
          onClick={() => void lancer("pdf", onPdf)}
        >
          {enCours === "pdf" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4 text-red-600" />
          )}
          Exporter en PDF
        </Button>
      </div>
      {erreur && (
        <p role="alert" className="text-sm text-red-600">
          {erreur}
        </p>
      )}
    </div>
  );
}

export interface FiltreListe {
  cle: string;
  libelle: string;
  valeur: string;
  onChange: (valeur: string) => void;
  options: { value: string; label: string }[];
}

/**
 * Recherche + listes de filtres toujours visibles. Le filtrage est fait par
 * l'écran (pas par le tableau) pour que l'export reprenne exactement les
 * lignes affichées.
 */
export function BarreFiltres({
  recherche,
  onRecherche,
  placeholder,
  filtres,
  onReinitialiser,
  resume,
}: {
  recherche: string;
  onRecherche: (valeur: string) => void;
  placeholder: string;
  filtres: FiltreListe[];
  onReinitialiser: () => void;
  /** Texte du type « 12 sur 40 demandes ». */
  resume: string;
}) {
  const actif = recherche !== "" || filtres.some((f) => f.valeur !== "all");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-sm flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder={placeholder}
          // Évite que le navigateur remplisse l'adresse e-mail enregistrée.
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          name="recherche-temps"
          data-form-type="other"
          value={recherche}
          onChange={(e) => onRecherche(e.target.value)}
        />
      </div>
      {filtres.map((f) => (
        <Select key={f.cle} value={f.valeur} onValueChange={f.onChange}>
          <SelectTrigger className="w-52" aria-label={f.libelle}>
            <SelectValue placeholder={f.libelle} />
          </SelectTrigger>
          <SelectContent>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {actif && (
        <Button variant="ghost" size="sm" onClick={onReinitialiser}>
          <X className="mr-1 h-4 w-4" />
          Réinitialiser
        </Button>
      )}
      <span className="ml-auto text-sm text-muted-foreground">{resume}</span>
    </div>
  );
}

/**
 * Habillage des tableaux : en-têtes pleins colorés, lignes zébrées lisibles,
 * cellules aérées. Classes à poser sur le conteneur du DataTable partagé
 * (variantes descendantes) : elles colorent aussi la colonne « Actions »,
 * que `headerClassName` ne permet pas d'atteindre.
 */
const BASE_ENTETE =
  "[&_thead_th]:h-12 [&_thead_th]:px-4 [&_thead_th]:font-semibold [&_thead_th]:text-white";
export const ENTETES = {
  bleu: `${BASE_ENTETE} [&_thead_th]:bg-blue-600 dark:[&_thead_th]:bg-blue-700`,
  rose: `${BASE_ENTETE} [&_thead_th]:bg-rose-600 dark:[&_thead_th]:bg-rose-700`,
  turquoise: `${BASE_ENTETE} [&_thead_th]:bg-teal-600 dark:[&_thead_th]:bg-teal-700`,
} as const;

/** Nombres : alignés à droite, chiffres de même largeur. */
export const ENTETE_NOMBRE = "text-right";
export const CELLULE_NOMBRE = "block text-right tabular-nums";

export const LIGNE_ZEBREE = "even:bg-muted/50 [&>td]:px-4 [&>td]:py-3";
