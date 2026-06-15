import type { ComplianceItem } from "@safyr/api-client";

// Cadences de renouvellement (en mois) par type de document.
export const RENEWAL_MONTHS: Record<string, number> = {
  fiscale: 6,
  urssaf: 6,
  assurance_rc: 12,
  kbis: 3,
};

// Documents suivis par date d'expiration (et non par cadence).
export const EXPIRY_TYPES = new Set([
  "carte_pro_dirigeant",
  "carte_pro_entreprise",
  "cni_dirigeant",
]);

export function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export type DocAlert = {
  id: string;
  label: string;
  message: string;
  level: "danger" | "warning";
  date?: string;
};

export function computeDocumentAlerts(items: ComplianceItem[]): DocAlert[] {
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 30);
  const soonExpiry = new Date(now);
  soonExpiry.setDate(soonExpiry.getDate() + 60);

  const alerts: DocAlert[] = [];
  for (const item of items) {
    const { type, name, id, isRequired } = item.requirement;
    const doc = item.document;

    if (type in RENEWAL_MONTHS) {
      const cadence = RENEWAL_MONTHS[type];
      const freq = cadence === 12 ? "tous les ans" : `tous les ${cadence} mois`;
      if (!doc) {
        alerts.push({
          id,
          label: name,
          message: `À télécharger (${freq})`,
          level: "danger",
        });
      } else {
        const due = addMonths(new Date(doc.createdAt), cadence);
        if (due < now) {
          alerts.push({
            id,
            label: name,
            message: `Renouvellement dépassé (${freq})`,
            level: "danger",
            date: due.toISOString(),
          });
        } else if (due < soon) {
          alerts.push({
            id,
            label: name,
            message: `À renouveler bientôt (${freq})`,
            level: "warning",
            date: due.toISOString(),
          });
        }
      }
      continue;
    }

    if (EXPIRY_TYPES.has(type)) {
      if (!doc || !doc.expiryDate) {
        if (isRequired) {
          alerts.push({
            id,
            label: name,
            message: "À télécharger",
            level: "danger",
          });
        }
      } else {
        const exp = new Date(doc.expiryDate);
        if (exp < now) {
          alerts.push({
            id,
            label: name,
            message: "Expiré",
            level: "danger",
            date: doc.expiryDate,
          });
        } else if (exp < soonExpiry) {
          alerts.push({
            id,
            label: name,
            message: "Expire bientôt",
            level: "warning",
            date: doc.expiryDate,
          });
        }
      }
    }
  }

  return alerts.sort((a, b) =>
    a.level === b.level ? 0 : a.level === "danger" ? -1 : 1,
  );
}
