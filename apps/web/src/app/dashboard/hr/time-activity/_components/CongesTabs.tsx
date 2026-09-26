"use client";

import { CalendarDays, Wallet } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaidLeaveBalances } from "./PaidLeaveBalances";
import { TimeOffScreen } from "./TimeOffScreen";

export type OngletConges = "demandes" | "soldes";

/**
 * Barre d'onglets agrandie (remarque client : trop mince, libellés trop
 * petits). Classes locales : le composant `Tabs` partagé reste inchangé.
 * Une teinte par onglet ; l'onglet actif est plein.
 */
const LISTE = "h-auto min-h-16 gap-3 rounded-2xl p-2";
const ONGLET_COMMUN =
  "min-h-14 rounded-xl px-6 py-3 text-lg font-semibold [&_svg]:size-6 " +
  "data-[state=active]:border-transparent data-[state=active]:text-white dark:data-[state=active]:text-white data-[state=active]:shadow-md";
const ONGLET_BLEU =
  "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-300 " +
  "data-[state=active]:bg-blue-600 data-[state=active]:hover:bg-blue-600";
const ONGLET_TURQUOISE =
  "bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 dark:text-teal-300 " +
  "data-[state=active]:bg-teal-600 data-[state=active]:hover:bg-teal-600";

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
        <TabsList className={LISTE}>
          <TabsTrigger
            value="demandes"
            className={`${ONGLET_COMMUN} ${ONGLET_BLEU}`}
          >
            <CalendarDays />
            Demandes de congés
          </TabsTrigger>
          <TabsTrigger
            value="soldes"
            className={`${ONGLET_COMMUN} ${ONGLET_TURQUOISE}`}
          >
            <Wallet />
            Soldes de congés payés
          </TabsTrigger>
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
