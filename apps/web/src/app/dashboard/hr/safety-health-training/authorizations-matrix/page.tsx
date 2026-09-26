import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck,
  Flame,
  HeartPulse,
  Zap,
  ChevronRight,
} from "lucide-react";
import {
  THEMES,
  styleCarte,
  type FamilleCouleur,
} from "./_components/habilitation-ui";
import { cn } from "@/lib/utils";

const BASE = "/dashboard/hr/safety-health-training/authorizations-matrix";

const sections: {
  href: string;
  title: string;
  description: string;
  icon: typeof Flame;
  famille: FamilleCouleur;
}[] = [
  {
    href: `${BASE}/ssiap`,
    title: "SSIAP",
    description: "Habilitations SSIAP 1, 2 et 3 (sécurité incendie)",
    icon: Flame,
    famille: "ssiap",
  },
  {
    href: `${BASE}/sst`,
    title: "SST",
    description: "Sauveteurs Secouristes du Travail",
    icon: HeartPulse,
    famille: "sst",
  },
  {
    href: `${BASE}/h0b0`,
    title: "H0B0",
    description: "Habilitations électriques H0B0",
    icon: Zap,
    famille: "h0b0",
  },
];

export default function AuthorizationsMatrixIndexPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <ShieldCheck className="h-7 w-7 text-cyan-500" />
          Habilitations
        </h1>
        <p className="text-muted-foreground">
          Suivi des habilitations des agents par type
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((s) => {
          const theme = THEMES[s.famille];
          return (
            <Link key={s.href} href={s.href}>
              <Card
                className="h-full cursor-pointer hover:shadow-md"
                style={styleCarte(s.famille)}
              >
                <CardHeader>
                  <CardTitle
                    className={cn(
                      "flex items-center justify-between text-lg",
                      theme.titre,
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cn("rounded-full p-2.5", theme.pastille)}
                      >
                        <s.icon className="h-5 w-5" />
                      </span>
                      {s.title}
                    </span>
                    <ChevronRight className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80">{s.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
