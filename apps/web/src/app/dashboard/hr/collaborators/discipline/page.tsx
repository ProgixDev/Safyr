"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, FileText, BookOpen } from "lucide-react";
import { WarningsSection } from "@/components/discipline/WarningsSection";
import { ProceduresSection } from "@/components/discipline/ProceduresSection";
import { SanctionsSection } from "@/components/discipline/SanctionsSection";
import {
  TEINTES,
  type SectionDiscipline,
} from "@/components/discipline/discipline-theme";
import { cn } from "@/lib/utils";

const TABS: {
  id: "warnings" | "procedures" | "sanctions";
  label: string;
  icon: typeof AlertTriangle;
  section: SectionDiscipline;
}[] = [
  {
    id: "warnings",
    label: "Sanctions",
    icon: AlertTriangle,
    section: "sanctions",
  },
  {
    id: "procedures",
    label: "Procédures disciplinaires",
    icon: FileText,
    section: "procedures",
  },
  {
    id: "sanctions",
    label: "Registre des sanctions",
    icon: BookOpen,
    section: "registre",
  },
];

type TabId = (typeof TABS)[number]["id"];

function DisciplineTabs() {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("tab");
  const active: TabId = TABS.some((t) => t.id === requested)
    ? (requested as TabId)
    : "warnings";

  const setActive = (value: string) => {
    const query = new URLSearchParams(params.toString());
    query.set("tab", value);
    router.replace(
      `/dashboard/hr/collaborators/discipline?${query.toString()}`,
      { scroll: false },
    );
  };

  return (
    <Tabs value={active} onValueChange={setActive}>
      {/* Barre volontairement grande (client : « augmenter la taille ») ; les
          classes sont locales, le composant Tabs partagé n'est pas modifié. */}
      <TabsList className="h-auto gap-3 rounded-2xl p-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "min-h-14 gap-3 rounded-xl px-6 py-4 text-lg font-semibold [&_svg]:size-6",
                TEINTES[tab.section].onglet,
              )}
            >
              <Icon />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      <TabsContent value="warnings" className="mt-6">
        <WarningsSection />
      </TabsContent>
      <TabsContent value="procedures" className="mt-6">
        <ProceduresSection />
      </TabsContent>
      <TabsContent value="sanctions" className="mt-6">
        <SanctionsSection />
      </TabsContent>
    </Tabs>
  );
}

export default function DisciplinePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Discipline</h1>
        <p className="text-muted-foreground">
          Gestion des sanctions, des procédures disciplinaires et du registre
          des sanctions
        </p>
      </div>
      <Suspense fallback={null}>
        <DisciplineTabs />
      </Suspense>
    </div>
  );
}
