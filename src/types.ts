export type TransactionType = 'expense' | 'income' | 'transfer' | 'pass-through';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  type: TransactionType;
  accountId: string;
  notes?: string;
  isAIAnalyzed?: boolean;
  userId?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'credit';
  balance: number;
  userId?: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  userId?: string;
}

export interface CategoryCorrection {
  id?: string;
  merchant: string;
  correctedCategory: string;
  correctedType: TransactionType;
  userId?: string;
}

export interface Due {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  type: 'emi' | 'bill';
  isPaid: boolean;
  accountId: string;
  userId?: string;
}

export interface Investment {
  id: string;
  name: string;
  type: 'mutual_fund' | 'equity';
  schemeCode?: string; // For MF API
  units: number;
  averageNav?: number;
  currentNav?: number;
  navDate?: string;
  userId?: string;
}
