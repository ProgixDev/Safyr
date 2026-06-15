import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldAlert,
  FileText,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

const BASE = "/dashboard/hr/safety-health-training/duerp-accidents";

const sections = [
  {
    href: `${BASE}/duerp`,
    title: "DUERP",
    description: "Document Unique d'Évaluation des Risques Professionnels",
    icon: FileText,
  },
  {
    href: `${BASE}/work-accidents`,
    title: "Accidents du travail",
    description: "Déclarations et suivi des accidents du travail",
    icon: AlertTriangle,
  },
];

export default function DuerpAccidentsIndexPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <ShieldAlert className="h-7 w-7" />
          DUERP &amp; Accidents du travail
        </h1>
        <p className="text-muted-foreground">
          Prévention des risques et déclarations d&apos;accidents
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
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
