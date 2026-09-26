"use client";

import {
  AlertTriangle,
  CalendarClock,
  Clock,
  Plus,
  Shirt,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SourceHeuresPaie } from "@/hooks/payroll";
import {
  PERIODES_ASTREINTE,
  PRIMES,
  formaterEuros,
  formaterNombre,
  heuresMajorationRetenues,
  ligneVide,
  periodeAstreinte,
  primeParId,
  tauxHoraireMajoration,
  totalLigne,
  versSaisie,
  type LignePrime,
  type ModeMajoration,
  type PeriodeAstreinte,
  type PrimeDefinition,
  type PrimeId,
} from "@/lib/payroll-primes";

interface PrimeLinesEditorProps {
  lignes: LignePrime[];
  onChange: (lignes: LignePrime[]) => void;
  /** Montant unitaire (ou global) courant de chaque prime (paramètres annuels). */
  montantPrime: (id: string) => number;
  /** Heures de paie du salarié pour le mois (calcul automatique de l'habillage). */
  heuresAuto: number;
  sourceHeures: SourceHeuresPaie;
  /** Heures dimanche / fériés du Relevé des heures (majoration). */
  heuresMajoration: number;
  /** `null` tant qu'aucun salarié n'est choisi. */
  droitHabillage: boolean | null;
  /** Ajout / retrait de lignes autorisé (création, ou modification d'un mois). */
  multiLignes: boolean;
}

const SOURCES: Record<SourceHeuresPaie, string> = {
  paie: "variables d'heures de la paie",
  planning: "vacations planifiées du mois",
  aucune: "aucune heure trouvée",
};

/** Indication « nombre × montant » affichée en face de chaque prime du menu. */
function apercuPrime(def: PrimeDefinition, montant: number): string {
  if (def.mode === "montant_global") {
    return montant
      ? `montant global (${formaterEuros(montant)})`
      : "montant global";
  }
  if (def.mode === "forfait_periode") return "forfait mois / semaine / jour";
  if (def.mode === "majoration_heures") return "heures du relevé × majoration";
  const unite =
    def.mode === "heures_x_taux" ? "heures" : (def.unite ?? "nombre");
  const suffixe = def.mode === "heures_x_taux" ? "/h" : "";
  return `${unite} × ${formaterEuros(montant)}${suffixe}`;
}

export function PrimeLinesEditor({
  lignes,
  onChange,
  montantPrime,
  heuresAuto,
  sourceHeures,
  heuresMajoration,
  droitHabillage,
  multiLignes,
}: PrimeLinesEditorProps) {
  // Sans droit à l'habillage, le calcul automatique vaut 0 : seules des
  // heures saisies à la main peuvent alors alimenter la ligne.
  const heuresAutoEffectives = droitHabillage === false ? 0 : heuresAuto;

  const maj = (cle: string, changes: Partial<LignePrime>) =>
    onChange(lignes.map((l) => (l.cle === cle ? { ...l, ...changes } : l)));

  const changerPrime = (ligne: LignePrime, id: PrimeId) => {
    const neuve = ligneVide(id, montantPrime(id), montantPrime);
    onChange(
      lignes.map((l) =>
        l.cle === ligne.cle
          ? { ...neuve, cle: ligne.cle, recordId: ligne.recordId }
          : l,
      ),
    );
  };

  const ajouter = () => {
    const utilisees = new Set(lignes.map((l) => l.primeId));
    const libre = PRIMES.find((p) => !utilisees.has(p.id)) ?? PRIMES[0];
    onChange([
      ...lignes,
      ligneVide(libre.id, montantPrime(libre.id), montantPrime),
    ]);
  };

  const totalGeneral = lignes.reduce(
    (somme, l) => somme + totalLigne(l, heuresAutoEffectives, heuresMajoration),
    0,
  );

  return (
    <div className="space-y-4">
      {lignes.map((ligne) => {
        const def = primeParId(ligne.primeId);
        if (!def) return null;
        const total = totalLigne(ligne, heuresAutoEffectives, heuresMajoration);
        return (
          <div
            key={ligne.cle}
            className="space-y-3 rounded-lg border border-l-4 border-l-primary/30 p-4"
          >
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label>Prime / indemnité</Label>
                <Select
                  value={ligne.primeId}
                  onValueChange={(v) => changerPrime(ligne, v as PrimeId)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{def.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PRIMES.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex w-full items-center justify-between gap-6">
                          <span>{p.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {apercuPrime(p, montantPrime(p.id))}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {multiLignes && lignes.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Retirer cette prime"
                  onClick={() =>
                    onChange(lignes.filter((l) => l.cle !== ligne.cle))
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>

            {def.mode === "heures_x_taux" && (
              <div className="space-y-3">
                <div className="rounded-md border border-dashed bg-muted/30 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Shirt className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">
                      Heures de paie du mois : {formaterNombre(heuresAuto)} h
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      {SOURCES[sourceHeures]}
                    </Badge>
                    {droitHabillage === true && (
                      <Badge variant="secondary" className="text-xs">
                        Droit à l&apos;habillage
                      </Badge>
                    )}
                  </div>
                  {droitHabillage === false && (
                    <p className="mt-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Ce salarié n&apos;a pas le droit à l&apos;indemnité
                      d&apos;habillage (case à cocher dans sa fiche, onglet
                      Avantages) : le calcul automatique est à 0. Saisissez des
                      heures manuelles pour la verser malgré tout.
                    </p>
                  )}
                  {droitHabillage === null && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Choisissez un salarié pour calculer les heures de paie.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Heures manuelles (absence)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ligne.heuresManuelles}
                      onChange={(e) =>
                        maj(ligne.cle, { heuresManuelles: e.target.value })
                      }
                      placeholder={`Auto : ${formaterNombre(heuresAutoEffectives)} h`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Si renseignées, elles remplacent le calcul automatique.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{def.montantLabel}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ligne.unitaire}
                      onChange={(e) =>
                        maj(ligne.cle, { unitaire: e.target.value })
                      }
                    />
                  </div>
                  <TotalLigne total={total} />
                </div>
                {def.aide && (
                  <p className="text-xs text-muted-foreground">{def.aide}</p>
                )}
              </div>
            )}

            {def.mode === "quantite_x_unitaire" && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{def.quantiteLabel}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ligne.quantite}
                      onChange={(e) =>
                        maj(ligne.cle, { quantite: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{def.montantLabel}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ligne.unitaire}
                      onChange={(e) =>
                        maj(ligne.cle, { unitaire: e.target.value })
                      }
                    />
                  </div>
                  <TotalLigne total={total} />
                </div>
                {def.aide && (
                  <p className="text-xs text-muted-foreground">{def.aide}</p>
                )}
              </div>
            )}

            {def.mode === "forfait_periode" && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Forfait retenu</Label>
                    <Select
                      value={ligne.periode}
                      onValueChange={(v) =>
                        maj(ligne.cle, {
                          periode: v as PeriodeAstreinte,
                          unitaire: versSaisie(
                            montantPrime(periodeAstreinte(v).parametre),
                          ),
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODES_ASTREINTE.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {periodeAstreinte(ligne.periode).quantiteLabel}
                    </Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={ligne.quantite}
                      onChange={(e) =>
                        maj(ligne.cle, { quantite: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{periodeAstreinte(ligne.periode).label} (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ligne.unitaire}
                      onChange={(e) =>
                        maj(ligne.cle, { unitaire: e.target.value })
                      }
                    />
                  </div>
                  <TotalLigne total={total} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Total = quantité × forfait du mode choisi (mois, semaine ou
                  jour). Les trois forfaits se règlent dans « Paramètres des
                  primes ».
                </p>
              </div>
            )}

            {def.mode === "majoration_heures" && (
              <div className="space-y-3">
                <div className="rounded-md border border-dashed bg-muted/30 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">
                      Heures dimanche / fériés du relevé :{" "}
                      {formaterNombre(
                        heuresMajorationRetenues(ligne, heuresMajoration),
                      )}{" "}
                      h
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      Relevé des heures
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Ces heures viennent du Relevé des heures (H Dimanche, H
                    Férié) : elles ne se saisissent pas ici.
                    {heuresMajoration === 0 &&
                      " Aucune heure dimanche / férié n'est déclarée pour ce salarié sur ce mois."}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Calcul de la majoration</Label>
                    <Select
                      value={ligne.modeMajoration}
                      onValueChange={(v) =>
                        maj(ligne.cle, { modeMajoration: v as ModeMajoration })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="taux">Par taux (%)</SelectItem>
                        <SelectItem value="montant">
                          Par montant (€ / heure)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {ligne.modeMajoration === "taux" ? (
                    <>
                      <div className="space-y-2">
                        <Label>Taux de majoration (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={ligne.taux}
                          onChange={(e) =>
                            maj(ligne.cle, { taux: e.target.value })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Base horaire (€ / h)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={ligne.base}
                          onChange={(e) =>
                            maj(ligne.cle, { base: e.target.value })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 md:col-span-2">
                      <Label>{def.montantLabel}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={ligne.unitaire}
                        onChange={(e) =>
                          maj(ligne.cle, { unitaire: e.target.value })
                        }
                      />
                    </div>
                  )}
                  <TotalLigne total={total} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Total = heures du relevé × majoration horaire (
                  {formaterEuros(tauxHoraireMajoration(ligne))} / h).
                </p>
              </div>
            )}

            {def.mode === "montant_global" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{def.montantLabel}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ligne.montant}
                    onChange={(e) =>
                      maj(ligne.cle, { montant: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <TotalLigne total={total} />
              </div>
            )}

            <div className="space-y-2">
              <Label>
                {def.libelleLibre
                  ? "Libellé de la prime"
                  : "Précision (facultatif)"}
              </Label>
              <Input
                value={ligne.libelle}
                onChange={(e) => maj(ligne.cle, { libelle: e.target.value })}
                placeholder={
                  def.libelleLibre
                    ? "Ex. prime de fin de mission"
                    : "Note ajoutée à la ligne"
                }
              />
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between gap-4">
        {multiLignes ? (
          <Button type="button" variant="outline" size="sm" onClick={ajouter}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une prime
          </Button>
        ) : (
          <span />
        )}
        <div className="rounded-lg bg-muted/50 px-4 py-2 text-sm">
          Total des primes :{" "}
          <span className="text-base font-bold text-primary">
            {formaterEuros(totalGeneral)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TotalLigne({ total }: { total: number }) {
  return (
    <div className="space-y-2">
      <Label>Total calculé</Label>
      <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm font-semibold">
        {formaterEuros(total)}
      </div>
    </div>
  );
}
