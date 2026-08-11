export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  bic: string;
  accountType: "Compte courant" | "Compte de dépôt" | "Compte de caution";
  balance: number;
  currency: string;
  status: "Actif" | "Inactif" | "Suspendu";
  lastSync: string;
  apiConnected: boolean;
}

export const mockBankAccounts: BankAccount[] = [];
