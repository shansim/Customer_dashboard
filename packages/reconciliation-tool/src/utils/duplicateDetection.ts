import { Transaction, MatchedTransaction } from '../types/transaction';

export interface DuplicateGroup {
  reference: string;
  transactions: Transaction[];
  count: number;
  totalAmount: number;
  currencies: string[];
  statuses: string[];
}

export interface DuplicateAnalysis {
  duplicateGroups: DuplicateGroup[];
  totalDuplicates: number;
  uniqueDuplicateTransactions: Transaction[];
  duplicatesByReference: Map<string, Transaction[]>;
}

export const detectDuplicates = (transactions: Transaction[]): DuplicateAnalysis => {
  console.log('Starting duplicate detection for', transactions.length, 'transactions');
  
  // Group transactions by reference
  const referenceGroups = new Map<string, Transaction[]>();
  
  transactions.forEach(transaction => {
    if (!transaction.transaction_reference) return;
    
    const normalizedRef = transaction.transaction_reference.toString().trim().toUpperCase();
    if (!normalizedRef) return;
    
    if (!referenceGroups.has(normalizedRef)) {
      referenceGroups.set(normalizedRef, []);
    }
    referenceGroups.get(normalizedRef)!.push(transaction);
  });

  // Find groups with more than one transaction (duplicates)
  const duplicateGroups: DuplicateGroup[] = [];
  const uniqueDuplicateTransactions: Transaction[] = [];
  const duplicatesByReference = new Map<string, Transaction[]>();

  referenceGroups.forEach((groupTransactions, reference) => {
    if (groupTransactions.length > 1) {
      // This is a duplicate group
      const totalAmount = groupTransactions.reduce((sum, tx) => {
        const amount = parseFloat(tx.amount?.toString() || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      const currencies = [...new Set(groupTransactions.map(tx => tx.currency || 'UNKNOWN'))];
      const statuses = [...new Set(groupTransactions.map(tx => tx.status || 'unknown'))];

      const duplicateGroup: DuplicateGroup = {
        reference,
        transactions: groupTransactions,
        count: groupTransactions.length,
        totalAmount,
        currencies,
        statuses
      };

      duplicateGroups.push(duplicateGroup);
      uniqueDuplicateTransactions.push(...groupTransactions);
      duplicatesByReference.set(reference, groupTransactions);

      console.log(`Duplicate found: ${reference} (${groupTransactions.length} instances)`);
    }
  });

  const totalDuplicates = uniqueDuplicateTransactions.length;

  console.log('Duplicate detection completed:', {
    totalGroups: duplicateGroups.length,
    totalDuplicates,
    duplicateReferences: Array.from(duplicatesByReference.keys()).slice(0, 5)
  });

  return {
    duplicateGroups,
    totalDuplicates,
    uniqueDuplicateTransactions,
    duplicatesByReference
  };
};

export const detectDuplicatesInMatched = (matchedTransactions: MatchedTransaction[]): DuplicateAnalysis => {
  // Extract internal transactions from matched transactions for duplicate detection
  const internalTransactions = matchedTransactions.map(match => match.internal);
  return detectDuplicates(internalTransactions);
};

// SIMPLIFIED DUPLICATES EXPORT - Even Cleaner (14 columns)
export const formatDuplicatesForExport = (duplicateGroups: DuplicateGroup[]) => {
  const exportData: any[] = [];

  duplicateGroups.forEach(group => {
    group.transactions.forEach((transaction, index) => {
      exportData.push({
        // === BASIC INFO ===
        transaction_reference: transaction.transaction_reference || '',
        duplicate_instance: `${index + 1} of ${group.count}`,
        total_duplicates: group.count,
        
        // === TRANSACTION DETAILS ===
        amount: transaction.amount || 0,
        currency: transaction.currency || '',
        status: transaction.status || '',
        timestamp: transaction.timestamp || '',
        description: transaction.description || '',
        
        // === ANALYSIS ===
        group_total_amount: group.totalAmount,
        risk_level: group.count > 3 ? 'HIGH' : group.count > 2 ? 'MEDIUM' : 'LOW',
        data_consistency: group.transactions.every(tx => 
          tx.amount === group.transactions[0].amount && 
          tx.currency === group.transactions[0].currency
        ) ? 'CONSISTENT' : 'INCONSISTENT',
        
        // === ACTION REQUIRED ===
        action_required: 'YES',
        recommended_action: group.count > 3 ? 'IMMEDIATE_REVIEW' : 'STANDARD_REVIEW',
        potential_overcharge: group.totalAmount - (group.transactions[0]?.amount || 0),
        
        // === METADATA ===
        detection_date: new Date().toISOString().split('T')[0]
      });
    });
  });

  return exportData;
};