import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Flame, HeartPulse, Zap, ChevronRight } from "lucide-react";

const BASE = "/dashboard/hr/safety-health-training/authorizations-matrix";

const sections = [
  {
    href: `${BASE}/ssiap`,
    title: "SSIAP",
    description: "Habilitations SSIAP 1, 2 et 3 (sécurité incendie)",
    icon: Flame,
  },
  {
    href: `${BASE}/sst`,
    title: "SST",
    description: "Sauveteurs Secouristes du Travail",
    icon: HeartPulse,
  },
  {
    href: `${BASE}/h0b0`,
    title: "H0B0",
    description: "Habilitations électriques H0B0",
    icon: Zap,
  },
];

export default function AuthorizationsMatrixIndexPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <ShieldCheck className="h-7 w-7" />
          Matrice des Habilitations
        </h1>
        <p className="text-muted-foreground">
          Suivi des habilitations des agents par type
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full cursor-pointer transition-colors hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <s.icon className="h-5 w-5" />
                    {s.title}
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
