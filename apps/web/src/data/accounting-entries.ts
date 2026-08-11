export interface AccountingEntry {
  id: string;
  entryNumber: string; // "EC-2024-001"
  date: string;
  journal: string; // "ACHAT", "VENTE", "BANQUE", "OD"
  account: string; // Account code
  accountLabel: string;
  debit: number;
  credit: number;
  label: string; // Entry label
  partner?: string; // Client/Supplier
  status: "Brouillon" | "Validée" | "Pointée" | "Lettrée";
  createdAt: string;
  createdBy: string;
}

export const mockAccountingEntries: AccountingEntry[] = [];
