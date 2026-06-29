import type { Employee as ApiEmployee } from "@safyr/api-client";
import type { Employee as UiEmployee } from "@/lib/types";

function toDate(v: string | null | undefined): Date {
  return v ? new Date(v) : new Date(0);
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
