export interface BankingTransaction {
  id: string;
  date: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  accountId: string;
  category?: string;
  reference?: string;
}

export const mockBankingTransactions: BankingTransaction[] = [];
