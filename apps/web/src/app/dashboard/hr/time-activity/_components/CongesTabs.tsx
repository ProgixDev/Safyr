"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaidLeaveBalances } from "./PaidLeaveBalances";
import { TimeOffScreen } from "./TimeOffScreen";

export type OngletConges = "demandes" | "soldes";

/** Page « Gestion des Congés » : demandes de congés et soldes de congés payés. */
export function CongesTabs({ ongletInitial }: { ongletInitial: OngletConges }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des congés
        </h1>
        <p className="text-muted-foreground">
          Demandes de congés (congés payés, RTT, récupération, maternité,
          paternité) et soldes de congés payés
        </p>
      </div>

      <Tabs defaultValue={ongletInitial} className="space-y-6">
        <TabsList>
          <TabsTrigger value="demandes">Demandes de congés</TabsTrigger>
          <TabsTrigger value="soldes">Soldes de congés payés</TabsTrigger>
        </TabsList>
        <TabsContent value="demandes">
          <TimeOffScreen mode="conge" sansTitre />
        </TabsContent>
        <TabsContent value="soldes">
          <PaidLeaveBalances />
        </TabsContent>
      </Tabs>
    </div>
  );
}
