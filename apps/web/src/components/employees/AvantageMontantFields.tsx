"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Equipment } from "@/lib/types";

export type Periodicite = NonNullable<Equipment["periodicity"]>;

export const PERIODICITES: {
  value: Periodicite;
  label: string;
  unite: string;
}[] = [
  { value: "hour", label: "Par heure", unite: "heure" },
  { value: "day", label: "Par jour", unite: "jour" },
  { value: "month", label: "Par mois", unite: "mois" },
  { value: "year", label: "Par an", unite: "an" },
];

/** Événements ouvrant droit à une carte cadeau (plafond annuel par événement). */
export const EVENEMENTS_CARTE_CADEAU = [
  { code: "fete-des-meres", label: "Fête des mères" },
  { code: "fete-des-peres", label: "Fête des pères" },
  { code: "sainte-catherine", label: "Sainte-Catherine" },
  { code: "saint-nicolas", label: "Saint-Nicolas" },
  { code: "rentree-scolaire", label: "Rentrée scolaire" },
  { code: "noel", label: "Noël" },
  { code: "noel-enfant", label: "Noël enfant" },
] as const;

/** Plafond par défaut : 200 € par an et par événement, modifiable. */
export const PLAFOND_EVENEMENT_DEFAUT = 200;

interface EvenementForm {
  code: string;
  label: string;
  actif: boolean;
  amount: string;
}

/** État du formulaire : les montants restent des chaînes tant qu'on saisit. */
export interface ChampsMontant {
  amount: string;
  periodicity: Periodicite;
  giftEvents: EvenementForm[];
}

function evenementsParDefaut(): EvenementForm[] {
  return EVENEMENTS_CARTE_CADEAU.map((e) => ({
    code: e.code,
    label: e.label,
    actif: true,
    amount: String(PLAFOND_EVENEMENT_DEFAUT),
  }));
}

export function champsMontantVides(): ChampsMontant {
  return {
    amount: "",
    periodicity: "day",
    giftEvents: evenementsParDefaut(),
  };
}

/** Pré-remplit le formulaire avec le montant déjà enregistré pour le salarié. */
export function champsMontantDepuis(eq: Equipment): ChampsMontant {
  const parDefaut = evenementsParDefaut();
  const existants = eq.giftEvents;
  return {
    amount: eq.amount !== undefined ? String(eq.amount) : "",
    periodicity: eq.periodicity ?? "day",
    // Carte attribuée avant l'ajout des événements : tout est proposé par défaut.
    giftEvents: existants
      ? parDefaut.map((e) => {
          const trouve = existants.find((x) => x.code === e.code);
          return trouve
            ? { ...e, actif: true, amount: String(trouve.amount) }
            : { ...e, actif: false };
        })
      : parDefaut,
  };
}

function versNombre(saisie: string): number | undefined {
  const nombre = Number.parseFloat(saisie.replace(",", "."));
  return Number.isFinite(nombre) && nombre >= 0 ? nombre : undefined;
}

/** Valeurs à enregistrer sur l'avantage attribué au salarié. */
export function montantDepuisChamps(
  champs: ChampsMontant,
  type: Equipment["type"],
): Pick<Equipment, "amount" | "periodicity" | "giftEvents"> {
  if (type === "GIFT_CARD") {
    const evenements = champs.giftEvents
      .filter((e) => e.actif)
      .map((e) => ({
        code: e.code,
        label: e.label,
        amount: versNombre(e.amount) ?? PLAFOND_EVENEMENT_DEFAUT,
      }));
    return {
      giftEvents: evenements,
      amount: evenements.reduce((somme, e) => somme + e.amount, 0),
      periodicity: "year",
    };
  }
  return {
    amount: versNombre(champs.amount),
    periodicity:
      versNombre(champs.amount) === undefined ? undefined : champs.periodicity,
    giftEvents: undefined,
  };
}

const EURO = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

/** « 8,00 € / jour » ; pour une carte cadeau, le détail par événement. */
export function formatMontantAvantage(
  eq: Pick<Equipment, "amount" | "periodicity" | "giftEvents" | "type">,
): string {
  if (eq.type === "GIFT_CARD" && eq.giftEvents) {
    if (eq.giftEvents.length === 0) return "Aucun événement";
    const total = eq.giftEvents.reduce((somme, e) => somme + e.amount, 0);
    return `${eq.giftEvents.length} événement${
      eq.giftEvents.length > 1 ? "s" : ""
    } · ${EURO.format(total)} / an`;
  }
  if (eq.amount === undefined || eq.amount === null) return "—";
  const unite = PERIODICITES.find((p) => p.value === eq.periodicity)?.unite;
  return unite
    ? `${EURO.format(eq.amount)} / ${unite}`
    : EURO.format(eq.amount);
}

interface AvantageMontantFieldsProps {
  type: Equipment["type"];
  value: ChampsMontant;
  onChange: (valeur: ChampsMontant) => void;
}

/**
 * Montant et périodicité d'un avantage attribué à un salarié (ex. 8 € / jour
 * pour le transport). Pour une carte cadeau : un plafond annuel par événement.
 */
export function AvantageMontantFields({
  type,
  value,
  onChange,
}: AvantageMontantFieldsProps) {
  if (type === "GIFT_CARD") {
    const majEvenement = (code: string, patch: Partial<EvenementForm>) =>
      onChange({
        ...value,
        giftEvents: value.giftEvents.map((e) =>
          e.code === code ? { ...e, ...patch } : e,
        ),
      });
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <h4 className="text-sm font-medium">Événements et plafonds</h4>
          <p className="text-xs text-muted-foreground">
            Plafond par défaut : {PLAFOND_EVENEMENT_DEFAUT} € par an et par
            événement. Décochez un événement pour l&apos;exclure, ou modifiez le
            montant pour ce salarié.
          </p>
        </div>
        <div className="space-y-2">
          {value.giftEvents.map((evenement) => (
            <div
              key={evenement.code}
              className="flex items-center justify-between gap-3"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={evenement.actif}
                  onCheckedChange={(v) =>
                    majEvenement(evenement.code, { actif: v === true })
                  }
                />
                {evenement.label}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="h-8 w-28 text-right"
                  aria-label={`Plafond annuel — ${evenement.label}`}
                  disabled={!evenement.actif}
                  value={evenement.amount}
                  onChange={(e) =>
                    majEvenement(evenement.code, { amount: e.target.value })
                  }
                />
                <span className="w-10 text-xs text-muted-foreground">
                  € / an
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="avantage-montant">Montant (€)</Label>
          <Input
            id="avantage-montant"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Ex. 8,00"
            value={value.amount}
            onChange={(e) => onChange({ ...value, amount: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="avantage-periodicite">Périodicité</Label>
          <Select
            value={value.periodicity}
            onValueChange={(v) =>
              onChange({ ...value, periodicity: v as Periodicite })
            }
          >
            <SelectTrigger id="avantage-periodicite" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODICITES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Exemple : 8 € par jour pour un avantage transport. Le montant est propre
        à ce salarié et reste modifiable à tout moment.
      </p>
    </div>
  );
}
