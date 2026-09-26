"use client";

import { useState, type ComponentType } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Car,
  Coins,
  Loader2,
  Moon,
  RotateCcw,
  Save,
  Settings,
  Shirt,
  ShoppingBasket,
  Utensils,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cleMontantPrime, useParametresPaie } from "@/hooks/payroll";
import {
  PARAM_MAJORATION_BASE,
  PARAM_MAJORATION_TAUX,
  arrondi2,
  defautParametre,
  formaterNombre,
  lireNombre,
  versSaisie,
} from "@/lib/payroll-primes";
import { cn } from "@/lib/utils";

interface ChampDef {
  /** Identifiant du paramètre (clé annuelle = `prime:<id>`). */
  id: string;
  label: string;
  unite: "€" | "€/h" | "%";
  /** Précision sur la période (« par panier », « par mois »…). */
  par?: string;
  aide?: string;
}

interface CarteDef {
  titre: string;
  icone: ComponentType<{ className?: string }>;
  /** Classes de la pastille d'icône et du liseré. */
  pastille: string;
  liseret: string;
  aide?: string;
  champs: ChampDef[];
}

interface SectionDef {
  titre: string;
  description: string;
  cartes: CarteDef[];
}

const SECTIONS: SectionDef[] = [
  {
    titre: "Indemnités horaires",
    description: "Calculées à partir des heures de paie du mois.",
    cartes: [
      {
        titre: "Indemnité d'habillage",
        icone: Shirt,
        pastille: "bg-purple-500/15 text-purple-600",
        liseret: "border-l-purple-500",
        aide: "Par défaut : 2 % du SMIC horaire. Remplacez par l'indemnité prévue par votre convention collective.",
        champs: [
          {
            id: "indemnite_habillage",
            label: "Taux d'habillage",
            unite: "€/h",
            par: "par heure de paie",
          },
        ],
      },
    ],
  },
  {
    titre: "Primes forfaitaires",
    description: "Montants fixes versés au mois, à la semaine ou au jour.",
    cartes: [
      {
        titre: "Prime d'entretien de tenue",
        icone: Coins,
        pastille: "bg-amber-500/15 text-amber-600",
        liseret: "border-l-amber-500",
        champs: [
          {
            id: "tenue",
            label: "Montant mensuel",
            unite: "€",
            par: "par mois",
          },
        ],
      },
      {
        titre: "Indemnité d'astreinte",
        icone: Moon,
        pastille: "bg-indigo-500/15 text-indigo-600",
        liseret: "border-l-indigo-500",
        aide: "À la saisie d'une variable, on choisit le mode puis la quantité : total = quantité × forfait.",
        champs: [
          { id: "astreinte:mois", label: "Forfait / mois", unite: "€" },
          { id: "astreinte:semaine", label: "Forfait / semaine", unite: "€" },
          { id: "astreinte", label: "Forfait / jour", unite: "€" },
        ],
      },
    ],
  },
  {
    titre: "Frais",
    description: "Remboursements unitaires, revalorisés chaque année.",
    cartes: [
      {
        titre: "Prime de panier",
        icone: ShoppingBasket,
        pastille: "bg-green-500/15 text-green-600",
        liseret: "border-l-green-500",
        champs: [
          {
            id: "nbre_paniers",
            label: "Montant par panier",
            unite: "€",
            par: "par panier",
          },
        ],
      },
      {
        titre: "Frais de restauration",
        icone: Utensils,
        pastille: "bg-emerald-500/15 text-emerald-600",
        liseret: "border-l-emerald-500",
        champs: [
          {
            id: "frais_restauration",
            label: "Montant par jour",
            unite: "€",
            par: "par jour",
          },
        ],
      },
      {
        titre: "Frais de déplacement",
        icone: Car,
        pastille: "bg-sky-500/15 text-sky-600",
        liseret: "border-l-sky-500",
        champs: [
          {
            id: "nbre_deplacement",
            label: "Montant par jour",
            unite: "€",
            par: "par jour",
          },
        ],
      },
    ],
  },
  {
    titre: "Majorations",
    description:
      "Les heures ne se paramètrent pas ici : elles viennent du Relevé des heures.",
    cartes: [
      {
        titre: "Majoration dimanche / jours fériés",
        icone: CalendarClock,
        pastille: "bg-orange-500/15 text-orange-600",
        liseret: "border-l-orange-500",
        aide: "Majoration = heures dimanche / fériés du relevé × (base horaire × taux), ou × montant par heure. Le mode se choisit à la saisie.",
        champs: [
          {
            id: PARAM_MAJORATION_TAUX,
            label: "Taux de majoration",
            unite: "%",
          },
          {
            id: PARAM_MAJORATION_BASE,
            label: "Base horaire du taux",
            unite: "€/h",
          },
          {
            id: "majoration_dimanche_ferie",
            label: "Ou montant par heure",
            unite: "€/h",
          },
        ],
      },
    ],
  },
];

interface ParametresPrimesDialogProps {
  /** Année proposée à l'ouverture. */
  anneeDepart: number;
  onClose: () => void;
}

/**
 * Paramètres annuels des primes : un enregistrement par année (registre
 * `parametre_paie`). Seuls les champs modifiés sont écrits, pour ne pas
 * toucher aux autres paramètres de l'année (taux de charges…).
 */
export function ParametresPrimesDialog({
  anneeDepart,
  onClose,
}: ParametresPrimesDialogProps) {
  const [annee, setAnnee] = useState(String(anneeDepart));
  const [saisies, setSaisies] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const parametres = useParametresPaie(Number(annee));

  const valeurAffichee = (id: string) =>
    saisies[id] ?? versSaisie(parametres.montantPrime(id));
  const nbModifs = Object.keys(saisies).length;

  const changerAnnee = (v: string) => {
    setAnnee(v);
    setSaisies({});
    setErreur(null);
  };

  const enregistrer = async () => {
    const valeurs: Record<string, number> = {};
    for (const [id, saisie] of Object.entries(saisies)) {
      valeurs[cleMontantPrime(id)] = Math.max(0, arrondi2(lireNombre(saisie)));
    }
    setErreur(null);
    try {
      await parametres.enregistrer(valeurs);
      onClose();
    } catch (e) {
      setErreur(
        `L'enregistrement a échoué : ${
          e instanceof Error ? e.message : "erreur inconnue"
        }. Vos saisies sont conservées, vous pouvez réessayer.`,
      );
    }
  };

  const annees = Array.from({ length: 5 }, (_, i) =>
    String(anneeDepart - 2 + i),
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Paramètres des primes</DialogTitle>
              <DialogDescription className="mt-1 max-w-xl">
                Montants proposés à la saisie des variables de paie. Ils
                changent chaque année : à défaut de réglage pour une année, le
                dernier montant connu est repris.
              </DialogDescription>
            </div>
          </div>
          <div className="w-36 space-y-1">
            <Label className="text-xs text-muted-foreground">Année</Label>
            <Select value={annee} onValueChange={changerAnnee}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {annees.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-5">
          {parametres.isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des paramètres enregistrés…
            </p>
          )}
          {parametres.isError && (
            <p className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Les paramètres enregistrés n&apos;ont pas pu être lus : les
              montants par défaut sont affichés. Enregistrer les remplacerait.
            </p>
          )}

          {SECTIONS.map((section) => (
            <section key={section.titre} className="space-y-3">
              <div>
                <h3 className="text-base font-semibold">{section.titre}</h3>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {section.cartes.map((carte) => {
                  const Icone = carte.icone;
                  return (
                    <div
                      key={carte.titre}
                      className={cn(
                        "space-y-3 rounded-lg border border-l-4 bg-card p-4",
                        carte.liseret,
                        carte.champs.length > 2 && "md:col-span-2",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("rounded-full p-2", carte.pastille)}>
                          <Icone className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-semibold">{carte.titre}</h4>
                      </div>
                      <div
                        className={cn(
                          "grid grid-cols-1 gap-4",
                          carte.champs.length > 1 && "sm:grid-cols-3",
                        )}
                      >
                        {carte.champs.map((champ) => (
                          <Champ
                            key={champ.id}
                            champ={champ}
                            valeur={valeurAffichee(champ.id)}
                            modifie={saisies[champ.id] !== undefined}
                            onChange={(v) =>
                              setSaisies((prev) => ({
                                ...prev,
                                [champ.id]: v,
                              }))
                            }
                            onReset={() =>
                              setSaisies((prev) => ({
                                ...prev,
                                [champ.id]: versSaisie(
                                  defautParametre(champ.id),
                                ),
                              }))
                            }
                          />
                        ))}
                      </div>
                      {carte.aide && (
                        <p className="text-xs text-muted-foreground">
                          {carte.aide}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-background px-6 py-4">
          <div className="min-w-0 flex-1 text-sm">
            {erreur ? (
              <span className="text-destructive">{erreur}</span>
            ) : nbModifs > 0 ? (
              <span className="text-muted-foreground">
                {nbModifs} modification{nbModifs > 1 ? "s" : ""} non enregistrée
                {nbModifs > 1 ? "s" : ""} pour {annee}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Aucune modification pour {annee}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={enregistrer}
              disabled={nbModifs === 0 || parametres.enCours}
              className="gap-2"
            >
              {parametres.enCours ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Champ({
  champ,
  valeur,
  modifie,
  onChange,
  onReset,
}: {
  champ: ChampDef;
  valeur: string;
  modifie: boolean;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  const defaut = defautParametre(champ.id);
  const differe = arrondi2(lireNombre(valeur)) !== arrondi2(defaut);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {champ.label}
        {champ.par && (
          <span className="font-normal text-muted-foreground">
            {" "}
            ({champ.par})
          </span>
        )}
      </Label>
      <div className="relative">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "pr-14",
            modifie && "border-primary ring-1 ring-primary/30",
          )}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
          {champ.unite}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>
          Par défaut : {formaterNombre(defaut)} {champ.unite}
        </span>
        {differe && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <RotateCcw className="h-3 w-3" />
            Rétablir
          </button>
        )}
      </div>
    </div>
  );
}
