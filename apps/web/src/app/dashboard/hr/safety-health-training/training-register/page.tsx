import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Bell, History, ChevronRight } from "lucide-react";

const BASE = "/dashboard/hr/safety-health-training/training-register";

const sections = [
  {
    href: `${BASE}/alerts`,
    title: "Alertes",
    description: "Échéances et expirations de formations à venir",
    icon: Bell,
  },
  {
    href: `${BASE}/history`,
    title: "Historique",
    description: "Registre des formations réalisées",
    icon: History,
  },
];

export default function TrainingRegisterIndexPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <GraduationCap className="h-7 w-7" />
          Registre de formation &amp; Alertes
        </h1>
        <p className="text-muted-foreground">
          Suivi des formations et des échéances réglementaires
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
