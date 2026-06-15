"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, FileText, BookOpen } from "lucide-react";
import { WarningsSection } from "@/components/discipline/WarningsSection";
import { ProceduresSection } from "@/components/discipline/ProceduresSection";
import { SanctionsSection } from "@/components/discipline/SanctionsSection";

const TABS = [
  { id: "warnings", label: "Avertissements", icon: AlertTriangle },
  { id: "procedures", label: "Procédures disciplinaires", icon: FileText },
  { id: "sanctions", label: "Registre des sanctions", icon: BookOpen },
] as const;

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
      <TabsList>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger key={tab.id} value={tab.id}>
              <Icon className="h-4 w-4 mr-2" />
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
          Gestion des avertissements, procédures et sanctions disciplinaires
        </p>
      </div>
      <Suspense fallback={null}>
        <DisciplineTabs />
      </Suspense>
    </div>
  );
}
