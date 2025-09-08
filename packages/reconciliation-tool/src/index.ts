// Export the main reconciliation feature component
export { ReconciliationFeature } from './ReconciliationFeature';

// Export types that might be needed by the dashboard
export type { 
  FileUploadState, 
  ReconciliationResult, 
  TransactionTableType,
  Transaction,
  MatchedTransaction
} from './types/transaction';

export type { DuplicateGroup } from './utils/duplicateDetection';