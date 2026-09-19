import { BADGE_TONS, type BadgeTon } from "@/lib/hr-status-badges";

/**
 * Demande d'absence ou de congé, telle qu'enregistrée en base.
 *
 * Les dates sont des chaînes ISO (« 2026-09-14 » pour un jour, ISO complet
 * pour un horodatage) : une date-heure UTC affichée dans un autre fuseau
 * décalait le jour de début ou de fin.
 */
export type StatutDemande = "pending" | "approved" | "rejected" | "cancelled";

export interface DemandeTemps {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  /** Poste du salarié (le dossier n'a pas de service). */
  department: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: StatutDemande;
  validatedBy?: string;
  validatedAt?: string;
  validationComment?: string;
  createdAt: string;
  updatedAt: string;
}

export type ModeTemps = "absence" | "conge";

export interface TypeDemande {
  value: string;
  label: string;
}

/** Absences : tout ce qui n'est pas un congé payé. */
export const TYPES_ABSENCE: TypeDemande[] = [
  { value: "sick_leave", label: "Maladie" },
  { value: "work_accident", label: "Accident du travail" },
  { value: "unjustified", label: "Absence injustifiée" },
  { value: "authorized", label: "Absence autorisée" },
  { value: "unpaid_leave", label: "Congé sans solde" },
  { value: "family_event", label: "Événement familial" },
  { value: "training", label: "Formation" },
];

/** Congés : congés payés, RTT, récupération, maternité/paternité. */
export const TYPES_CONGE: TypeDemande[] = [
  { value: "vacation", label: "Congés payés" },
  { value: "rtt", label: "RTT" },
  { value: "recovery", label: "Repos compensateur / récupération" },
  { value: "maternity_leave", label: "Congé maternité" },
  { value: "paternity_leave", label: "Congé paternité" },
];

export const STATUTS: Record<
  StatutDemande,
  { label: string; ton: BadgeTon; classe: string }
> = {
  pending: { label: "En attente", ton: "orange", classe: BADGE_TONS.orange },
  approved: { label: "Approuvé", ton: "vert", classe: BADGE_TONS.vert },
  rejected: { label: "Refusé", ton: "rouge", classe: BADGE_TONS.rouge },
  cancelled: { label: "Annulé", ton: "gris", classe: BADGE_TONS.gris },
};

export function libelleType(types: TypeDemande[], valeur: string): string {
  return types.find((t) => t.value === valeur)?.label ?? valeur;
}

/** « 2026-09-14 » → Date locale à minuit (sans décalage de fuseau). */
export function dateLocale(iso: string): Date {
  const brut = iso.length === 10 ? `${iso}T00:00:00` : iso;
  return new Date(brut);
}

export function formaterDate(iso?: string): string {
  if (!iso) return "—";
  const d = dateLocale(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
}

export function formaterDateHeure(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("fr-FR");
}

/** Date du jour au format « AAAA-MM-JJ », en heure locale. */
export function aujourdhuiIso(): string {
  const d = new Date();
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mois}-${jour}`;
}

/** Nombre de jours calendaires entre deux dates (bornes incluses). */
export function joursEntre(debut: string, fin: string): number {
  if (!debut || !fin) return 0;
  const a = dateLocale(debut);
  const b = dateLocale(fin);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

export function messageErreur(e: unknown): string {
  const detail = e instanceof Error && e.message ? ` (${e.message})` : "";
  return `Enregistrement impossible${detail}. Réessayez dans un instant.`;
}

/** Évite de recréer le tableau à chaque rendu (dépendance de useRegistre). */
export const AUCUN_FICHIER: readonly string[] = [];
