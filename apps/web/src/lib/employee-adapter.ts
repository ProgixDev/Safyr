import type { Employee as ApiEmployee } from "@safyr/api-client";
import type { Employee as UiEmployee } from "@/lib/types";

/**
 * Une date absente est représentée par l'époque exacte (0 ms). Ce n'est PAS
 * « toute date jusqu'en 1970 » : les salariés nés avant 1970 (ex. 1961, 1966,
 * 1967) ont une vraie date de naissance, longtemps masquée par erreur.
 */
const ABSENTE = 0;

function toDate(v: string | null | undefined): Date {
  if (!v) return new Date(ABSENTE);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date(ABSENTE) : d;
}

/** Vrai si la date est réellement renseignée (ni absente, ni invalide). */
export function estDateRenseignee(d: Date | null | undefined): d is Date {
  return !!d && Number.isFinite(d.getTime()) && d.getTime() !== ABSENTE;
}

/**
 * JJ/MM/AAAA, ou « — » si absente. Lu en UTC : ces dates sont stockées à
 * minuit UTC, un formatage en heure locale décalerait d'un jour hors d'Europe.
 */
export function formatDateFr(d: Date | null | undefined): string {
  if (!estDateRenseignee(d)) return "—";
  const jj = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${jj}/${mm}/${String(d.getUTCFullYear()).padStart(4, "0")}`;
}

/** AAAA-MM-JJ pour un champ `<input type="date">` ; chaîne vide si absente. */
export function dateVersChamp(d: Date | null | undefined): string {
  return estDateRenseignee(d) ? d.toISOString().slice(0, 10) : "";
}

function toOptionalDate(v: string | null | undefined): Date | undefined {
  return v ? new Date(v) : undefined;
}

export function toUiEmployee(e: ApiEmployee): UiEmployee {
  return {
    id: e.id,
    firstName: e.firstName ?? "",
    lastName: e.lastName ?? "",
    email: e.email ?? e.user.email,
    phone: e.phone ?? "",
    photo: e.user.image ?? undefined,
    dateOfBirth: toDate(e.birthDate),
    placeOfBirth: e.birthPlace ?? "",
    nationality: e.nationality ?? "",
    gender: (e.gender as UiEmployee["gender"]) ?? "other",
    civilStatus: (e.civilStatus as UiEmployee["civilStatus"]) ?? "single",
    children: e.children ?? 0,
    address: {
      street: e.addressRecord?.street ?? "",
      city: e.addressRecord?.city ?? "",
      postalCode: e.addressRecord?.postalCode ?? "",
      country: e.addressRecord?.country ?? "France",
    },
    bankDetails: {
      iban: e.bankDetails?.iban ?? "",
      bic: e.bankDetails?.bic ?? "",
      bankName: e.bankDetails?.bankName ?? "",
    },
    socialSecurityNumber: e.socialSecurityNumber ?? "",
    cartePro: e.cartePro ?? "",
    employeeNumber: e.employeeNumber ?? "",
    hireDate: toDate(e.hireDate),
    position: e.position ?? "",
    department: "",
    contractType: e.contractType as UiEmployee["contractType"],
    workSchedule: (e.workSchedule as UiEmployee["workSchedule"]) ?? "full-time",
    status: e.status,
    role: (e.role as UiEmployee["role"]) ?? undefined,
    dressingAllowance: e.dressingAllowance ?? false,
    documents: {},
    contracts: [],
    assignedEquipment: [],
    cseRole: undefined,
    savingsPlans: {
      pee: { contributions: 0, balance: 0 },
      pereco: { contributions: 0, balance: 0 },
    },
    createdAt: toDate(e.createdAt),
    updatedAt: toOptionalDate(e.createdAt) ?? new Date(),
  };
}
