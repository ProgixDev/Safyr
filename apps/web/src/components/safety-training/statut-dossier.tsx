"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  STATUTS_DOSSIER,
  TEINTES,
  TEINTE_STATUT_DOSSIER,
  type StatutDossier,
} from "./couleurs";

const POINTS: Record<StatutDossier, string> = {
  Créé: "bg-orange-500",
  Refusé: "bg-red-500",
  Validé: "bg-green-500",
  Archivé: "bg-blue-500",
};

/** Statut d'un dossier AKTO en lecture seule : Créé orange, Refusé rouge, Validé vert, Archivé bleu. */
export function BadgeStatutDossier({ statut }: { statut: StatutDossier }) {
  return (
    <Badge variant="outline" className={TEINTES[TEINTE_STATUT_DOSSIER[statut]]}>
      {statut}
    </Badge>
  );
}

/**
 * Statut modifiable en place. Le conteneur arrête la propagation du clic :
 * sinon ouvrir la liste déclenchait aussi l'ouverture de la fiche de la ligne
 * (les portails React remontent leurs événements jusqu'au parent).
 */
export function SelectStatutDossier({
  statut,
  onChange,
  className,
}: {
  statut: StatutDossier;
  onChange: (statut: StatutDossier) => void;
  className?: string;
}) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        value={statut}
        onValueChange={(valeur) => onChange(valeur as StatutDossier)}
      >
        <SelectTrigger
          size="sm"
          aria-label="Modifier le statut"
          className={cn(
            "h-7 rounded-full px-2.5 text-xs font-semibold shadow-none",
            TEINTES[TEINTE_STATUT_DOSSIER[statut]],
            className,
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUTS_DOSSIER.map((s) => (
            <SelectItem key={s} value={s}>
              <span className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", POINTS[s])} />
                {s}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
