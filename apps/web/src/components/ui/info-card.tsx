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
 * Couleur de la pastille d'icône. Classes statiques (pas de construction
 * dynamique de nom de classe) pour que Tailwind les inclue dans le build.
 */
const COULEURS: Record<string, string> = {
  blue: "bg-blue-500/15 text-blue-500",
  purple: "bg-purple-500/15 text-purple-500",
  green: "bg-green-500/15 text-green-500",
  red: "bg-red-500/15 text-red-500",
  orange: "bg-orange-500/15 text-orange-500",
  yellow: "bg-yellow-500/15 text-yellow-500",
  amber: "bg-amber-500/15 text-amber-500",
  teal: "bg-teal-500/15 text-teal-500",
  cyan: "bg-cyan-500/15 text-cyan-500",
  indigo: "bg-indigo-500/15 text-indigo-500",
  pink: "bg-pink-500/15 text-pink-500",
  slate: "bg-slate-500/15 text-slate-500",
  gray: "bg-muted text-muted-foreground",
};

const InfoCard = React.forwardRef<HTMLDivElement, InfoCardProps>(
  ({ icon: Icon, title, value, subtext, color, className }, ref) => {
    const teinte = COULEURS[color] ?? COULEURS.gray;
    return (
      <Card ref={ref} className={cn("", className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-full", teinte)}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
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
