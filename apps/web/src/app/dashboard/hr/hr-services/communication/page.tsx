import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Megaphone,
  Mail,
  Bell,
  FileText,
  Archive,
  ChevronRight,
} from "lucide-react";

const BASE = "/dashboard/hr/hr-services/communication";

const sections = [
  {
    href: `${BASE}/send-email`,
    title: "Envoyer un email",
    description: "Composer et envoyer un message aux collaborateurs",
    icon: Mail,
  },
  {
    href: `${BASE}/notifications`,
    title: "Notifications",
    description: "Centre de notifications internes",
    icon: Bell,
  },
  {
    href: `${BASE}/templates`,
    title: "Modèles",
    description: "Modèles d'emails et de messages",
    icon: FileText,
  },
  {
    href: `${BASE}/archives`,
    title: "Archives",
    description: "Historique des communications envoyées",
    icon: Archive,
  },
];

export default function CommunicationIndexPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Megaphone className="h-7 w-7" />
          Centre de Communication
        </h1>
        <p className="text-muted-foreground">
          Emails, notifications et modèles de communication interne
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
