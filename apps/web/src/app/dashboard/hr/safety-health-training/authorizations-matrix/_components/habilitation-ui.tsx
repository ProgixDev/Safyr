import type { CSSProperties, ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Couleurs des écrans Habilitations : une teinte par famille (incendie,
 * secourisme, électricité). Le fond et la bordure passent en style en ligne :
 * `Card` porte déjà ses propres classes de bordure et de fond, qui
 * écraseraient des classes Tailwind ajoutées par l'appelant.
 */
export type FamilleCouleur = "ssiap" | "sst" | "h0b0";

interface Theme {
  hex: string;
  /** Dégradé de fond de la carte (translucide : lisible en clair et sombre). */
  degrade: string;
  pastille: string;
  titre: string;
  entete: string;
  /** Couleur de la carte « Total » des sous-pages. */
  carteTotal: string;
}

export const THEMES: Record<FamilleCouleur, Theme> = {
  ssiap: {
    hex: "#ef4444",
    degrade:
      "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(59,130,246,0.10))",
    pastille: "bg-red-500/15 text-red-600 dark:text-red-400",
    titre: "text-red-600 dark:text-red-400",
    entete: "bg-red-500/10 text-red-700 dark:text-red-300",
    carteTotal: "blue",
  },
  sst: {
    hex: "#22c55e",
    degrade:
      "linear-gradient(135deg, rgba(34,197,94,0.16), rgba(20,184,166,0.08))",
    pastille: "bg-green-500/15 text-green-600 dark:text-green-400",
    titre: "text-green-600 dark:text-green-400",
    entete: "bg-green-500/10 text-green-700 dark:text-green-300",
    carteTotal: "teal",
  },
  h0b0: {
    hex: "#f59e0b",
    degrade:
      "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(234,179,8,0.08))",
    pastille: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    titre: "text-amber-600 dark:text-amber-400",
    entete: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    carteTotal: "yellow",
  },
};

export function styleCarte(famille: FamilleCouleur): CSSProperties {
  const t = THEMES[famille];
  return {
    borderColor: `${t.hex}55`,
    borderLeftColor: t.hex,
    borderLeftWidth: 4,
    backgroundImage: t.degrade,
  };
}

/** Titre de page : pastille d'icône colorée + titre teinté. */
export function TitreHabilitation({
  famille,
  icone: Icone,
  children,
}: {
  famille: FamilleCouleur;
  icone: ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const t = THEMES[famille];
  return (
    <h1
      className={cn(
        "flex items-center gap-3 font-serif text-3xl font-light tracking-tight",
        t.titre,
      )}
    >
      <span className={cn("rounded-full p-2.5", t.pastille)}>
        <Icone className="h-6 w-6" />
      </span>
      {children}
    </h1>
  );
}

const STATUTS = {
  valid: {
    libelle: "Valide",
    classes:
      "border-green-500/40 bg-green-500/15 text-green-700 dark:text-green-400",
  },
  "expiring-soon": {
    libelle: "Expire bientôt",
    classes:
      "border-orange-500/40 bg-orange-500/15 text-orange-700 dark:text-orange-400",
  },
  expired: {
    libelle: "Expiré",
    classes: "border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-400",
  },
} as const;

/** Statut d'une habilitation : Valide vert, Expire bientôt orange, Expiré rouge. */
export function StatutHabilitation({ statut }: { statut: string }) {
  const s =
    STATUTS[statut as keyof typeof STATUTS] ??
    (statut === "valid" ? STATUTS.valid : STATUTS.expired);
  return (
    <Badge variant="outline" className={s.classes}>
      {s.libelle}
    </Badge>
  );
}
