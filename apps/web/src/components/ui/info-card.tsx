import * as React from "react";

import { cn } from "@/lib/utils";

import { Card, CardContent } from "./card";

interface InfoCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtext?: string;
  color: string; // e.g., 'blue', 'green', etc.
  className?: string;
}

/**
 * Couleur de la carte : pastille d'icône, liseré et fond très légèrement
 * teinté. Valeurs hexadécimales fixes (nuance 500 de la palette Tailwind
 * standard) appliquées en style en ligne plutôt qu'en classes Tailwind.
 *
 * Deux passages ont échoué avant celui-ci :
 * - ne colorer que la petite pastille d'icône ne se voyait presque pas sur
 *   la carte entière ;
 * - passer par des classes `border-l-{couleur}` / `bg-{couleur}/5` ne
 *   marchait pas non plus : le composant `Card` porte déjà `border
 *   border-border/40` et `bg-card` dans son propre `className`, placés
 *   après celui de l'appelant dans l'appel à `cn()` — à spécificité égale,
 *   ces classes gagnent dans la feuille de style compilée et écrasaient la
 *   couleur. Le style en ligne n'a pas ce problème : il l'emporte toujours.
 */
const COULEURS: Record<string, { hex: string; pastille: string }> = {
  blue: { hex: "#3b82f6", pastille: "bg-blue-500/20 text-blue-500" },
  purple: { hex: "#a855f7", pastille: "bg-purple-500/20 text-purple-500" },
  green: { hex: "#22c55e", pastille: "bg-green-500/20 text-green-500" },
  red: { hex: "#ef4444", pastille: "bg-red-500/20 text-red-500" },
  orange: { hex: "#f97316", pastille: "bg-orange-500/20 text-orange-500" },
  yellow: { hex: "#eab308", pastille: "bg-yellow-500/20 text-yellow-500" },
  amber: { hex: "#f59e0b", pastille: "bg-amber-500/20 text-amber-500" },
  teal: { hex: "#14b8a6", pastille: "bg-teal-500/20 text-teal-500" },
  cyan: { hex: "#06b6d4", pastille: "bg-cyan-500/20 text-cyan-500" },
  indigo: { hex: "#6366f1", pastille: "bg-indigo-500/20 text-indigo-500" },
  pink: { hex: "#ec4899", pastille: "bg-pink-500/20 text-pink-500" },
  slate: { hex: "#64748b", pastille: "bg-slate-500/20 text-slate-500" },
  gray: { hex: "", pastille: "bg-muted text-muted-foreground" },
};

function teinteRGB(hex: string, alpha: number): string | undefined {
  if (!hex) return undefined;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const InfoCard = React.forwardRef<HTMLDivElement, InfoCardProps>(
  ({ icon: Icon, title, value, subtext, color, className }, ref) => {
    const teinte = COULEURS[color] ?? COULEURS.gray;
    return (
      <Card
        ref={ref}
        className={cn("border-l-4", className)}
        style={{
          borderLeftColor: teinte.hex || undefined,
          backgroundColor: teinteRGB(teinte.hex, 0.05),
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-full", teinte.pastille)}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p
                className="text-2xl font-bold"
                style={{ color: teinte.hex || undefined }}
              >
                {value}
              </p>
              {subtext && (
                <p className="text-xs font-medium text-muted-foreground">
                  {subtext}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);

InfoCard.displayName = "InfoCard";

interface InfoCardContainerProps {
  children: React.ReactNode;
  className?: string;
}

const InfoCardContainer: React.FC<InfoCardContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
};

export { InfoCard, InfoCardContainer };
