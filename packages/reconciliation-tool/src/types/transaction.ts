export interface Transaction {
  transaction_reference: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
  customer_id?: string;
  provider_id?: string;
  fees?: number;
  description: string;
}

export interface ReconciliationResult {
  matched: MatchedTransaction[];
  internalOnly: Transaction[];
  providerOnly: Transaction[];
  duplicates: {
    internal: Transaction[];
    provider: Transaction[];
    totalCount: number;
  };
  summary: {
    totalInternal: number;
    totalProvider: number;
    totalInternalAmount: number;
    totalProviderAmount: number;
    matchRate: number;
    totalDiscrepancies: number;
    totalDuplicates: number;
  };
}

export interface MatchedTransaction {
  internal: Transaction;
  provider: Transaction;
  discrepancies: {
    amount?: { internal: number; provider: number; difference: number; percentage: number };
    status?: { internal: string; provider: string };
    currency?: { internal: string; provider: string };
    timestamp?: { internal: string; provider: string; differenceMinutes: number };
  };
  matchType: 'perfect' | 'minor' | 'major';
}

export interface FileUploadState {
  file: File | null;
  data: Transaction[] | null;
  loading: boolean;
  error: string | null;
}

export type TransactionTableType = 'matched' | 'internal-only' | 'provider-only' | 'duplicates';

export interface FullScreenViewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Transaction[] | MatchedTransaction[];
  type: TransactionTableType;
  icon: React.ReactNode;
  reconciliationResult?: ReconciliationResult;
}