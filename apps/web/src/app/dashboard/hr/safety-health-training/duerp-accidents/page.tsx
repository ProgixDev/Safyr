import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldAlert,
  FileText,
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  FileDown,
  Ambulance,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CADRES, TEINTES } from "@/components/safety-training/couleurs";

const BASE = "/dashboard/hr/safety-health-training/duerp-accidents";

/**
 * Chaque cadre a sa couleur : orange pour la prévention (DUERP), rouge pour
 * les accidents. En-tête teinté, icône en pastille, liseré latéral et badges
 * portent la même teinte, en clair comme en sombre.
 */
const sections = [
  {
    href: `${BASE}/duerp`,
    title: "DUERP",
    description: "Document Unique d'Évaluation des Risques Professionnels",
    icon: FileText,
    teinte: "orange",
    liseret: "border-l-orange-500 dark:border-l-orange-500",
    pastille: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    survol: "hover:border-orange-400 dark:hover:border-orange-600",
    badge: "Prévention",
    points: [
      { icon: ClipboardCheck, texte: "Évaluation des risques par poste" },
      { icon: BarChart3, texte: "Niveaux : faible, moyen, élevé, critique" },
      { icon: FileDown, texte: "Export PDF et Excel" },
    ],
  },
  {
    href: `${BASE}/work-accidents`,
    title: "Accidents du travail",
    description: "Déclarations et suivi des accidents du travail",
    icon: AlertTriangle,
    teinte: "rouge",
    liseret: "border-l-red-500 dark:border-l-red-500",
    pastille: "bg-red-500/15 text-red-600 dark:text-red-400",
    survol: "hover:border-red-400 dark:hover:border-red-600",
    badge: "Déclaration",
    points: [
      { icon: Ambulance, texte: "Déclaration et suivi des accidents" },
      { icon: ClipboardCheck, texte: "Arrêts de travail et gravité" },
      { icon: FileDown, texte: "Export PDF et Excel" },
    ],
  },
] as const;

const CADRE_PAR_TEINTE = {
  orange: CADRES.orange,
  rouge: CADRES.rouge,
} as const;

export default function DuerpAccidentsIndexPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <ShieldAlert className="h-7 w-7 text-red-500" />
          DUERP &amp; Accidents du travail
        </h1>
        <p className="text-muted-foreground">
          Prévention des risques et déclarations d&apos;accidents
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((s) => {
          const cadre = CADRE_PAR_TEINTE[s.teinte];
          return (
            <Link key={s.href} href={s.href}>
              <Card
                className={cn(
                  "h-full cursor-pointer overflow-hidden border-l-4 transition-colors",
                  cadre.border,
                  s.liseret,
                  s.survol,
                )}
              >
                <CardHeader className={cadre.bg}>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-3">
                      <span className={cn("rounded-full p-2", s.pastille)}>
                        <s.icon className="h-5 w-5" />
                      </span>
                      <span className={cadre.text}>{s.title}</span>
                      <Badge variant="outline" className={TEINTES[s.teinte]}>
                        {s.badge}
                      </Badge>
                    </span>
                    <ChevronRight className={cn("h-5 w-5", cadre.icon)} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <p className="text-sm text-muted-foreground">
                    {s.description}
                  </p>
                  <ul className="space-y-1.5">
                    {s.points.map((p) => (
                      <li
                        key={p.texte}
                        className="flex items-center gap-2 text-sm"
                      >
                        <p.icon
                          className={cn("h-4 w-4 shrink-0", cadre.icon)}
                        />
                        {p.texte}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
