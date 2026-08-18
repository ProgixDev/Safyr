"use client";

import { useMemo } from "react";
import { useClients } from "@/hooks/clients";
import type { BillingClient } from "@/data/billing-clients";

/**
 * Clients proposés dans les écrans de facturation (devis, factures, bons de
 * commande), construits à partir de la fiche client unique d'Entreprise.
 *
 * Ces écrans lisaient une liste d'exemples : leurs menus déroulants sont
 * restés vides une fois les données de démonstration retirées. Les conditions
 * commerciales absentes de la fiche (taux horaire, délai de paiement) prennent
 * les valeurs d'usage, modifiables sur chaque devis ou facture.
 */
export function useBillingClients(): BillingClient[] {
  const { data: clients = [] } = useClients();

  return useMemo(
    () =>
      clients.map(
        (c) =>
          ({
            id: c.id,
            name: c.name,
            siret: c.siret ?? "",
            tva: c.numTVA ?? undefined,
            contractType: "Mensuel",
            serviceType: "Gardiennage",
            serviceTypes: ["Gardiennage"],
            contractStartDate: (c.createdAt ?? "").split("T")[0] ?? "",
            sites: 0,
            hourlyRate: 22,
            nightBonus: 0,
            sundayBonus: 0,
            holidayBonus: 0,
            status: "Actif",
            billingDay: 1,
            paymentTerm: 30,
            contactName: c.contactPerson ?? "",
            address: [c.address, c.postalCode, c.city]
              .filter(Boolean)
              .join(" "),
            phone: c.phone ?? "",
            email: c.email ?? "",
          }) as unknown as BillingClient,
      ),
    [clients],
  );
}
