import Papa from 'papaparse';
import { Transaction, MatchedTransaction } from '../types/transaction';

export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data, {
    header: true,
    skipEmptyLines: true
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// PERFECT MATCHES EXPORT - Clean and Simple
export const formatPerfectMatchesForExport = (matched: MatchedTransaction[]) => {
  return matched.map(match => ({
    transaction_reference: match.internal.transaction_reference || '',
    amount: match.internal.amount || 0,
    currency: match.internal.currency || '',
    status: match.internal.status || '',
    timestamp: match.internal.timestamp || '',
    description: match.internal.description || '',
    customer_id: match.internal.customer_id || '',
    match_status: 'PERFECT_MATCH',
    notes: 'No discrepancies found'
  }));
};

// DISCREPANCIES SUMMARY EXPORT - Key Issues Only
export const formatDiscrepanciesSummaryForExport = (matched: MatchedTransaction[]) => {
  return matched.map(match => {
    const issues: string[] = [];
    
    // Identify key issues
    if (match.discrepancies.amount) {
      const percentage = match.discrepancies.amount.percentage;
      issues.push(`Amount differs by ${percentage.toFixed(1)}%`);
    }
    
    if (match.discrepancies.status) {
      issues.push(`Status mismatch: ${match.discrepancies.status.internal} vs ${match.discrepancies.status.provider}`);
    }
    
    if (match.discrepancies.currency) {
      issues.push(`Currency mismatch: ${match.discrepancies.currency.internal} vs ${match.discrepancies.currency.provider}`);
    }
    
    if (match.discrepancies.timestamp) {
      const minutes = match.discrepancies.timestamp.differenceMinutes;
      if (minutes > 60) {
        issues.push(`Time difference: ${minutes.toFixed(0)} minutes`);
      }
    }

    return {
      transaction_reference: match.internal.transaction_reference || '',
      internal_amount: match.internal.amount || 0,
      provider_amount: match.provider.amount || 0,
      internal_status: match.internal.status || '',
      provider_status: match.provider.status || '',
      issue_type: match.matchType.toUpperCase(),
      issues_found: issues.join(' | ') || 'Minor discrepancies',
      priority: issues.length > 1 ? 'HIGH' : 'MEDIUM',
      action_required: issues.length > 1 ? 'YES' : 'MONITOR'
    };
  });
};

// DISCREPANCIES DETAILED EXPORT - More Analysis
export const formatDiscrepanciesDetailedForExport = (matched: MatchedTransaction[]) => {
  return matched.map(match => ({
    transaction_reference: match.internal.transaction_reference || '',
    
    // Amount Analysis
    internal_amount: match.internal.amount || 0,
    provider_amount: match.provider.amount || 0,
    amount_difference: match.discrepancies.amount?.difference || 0,
    amount_percentage_diff: match.discrepancies.amount?.percentage || 0,
    
    // Status Analysis
    internal_status: match.internal.status || '',
    provider_status: match.provider.status || '',
    status_mismatch: match.discrepancies.status ? 'YES' : 'NO',
    
    // Currency Analysis
    internal_currency: match.internal.currency || '',
    provider_currency: match.provider.currency || '',
    currency_mismatch: match.discrepancies.currency ? 'YES' : 'NO',
    
    // Timing Analysis
    internal_timestamp: match.internal.timestamp || '',
    provider_timestamp: match.provider.timestamp || '',
    timestamp_diff_minutes: match.discrepancies.timestamp?.differenceMinutes || 0,
    
    // Overall Assessment
    match_type: match.matchType.toUpperCase(),
    risk_level: match.matchType === 'major' ? 'HIGH' : match.matchType === 'minor' ? 'MEDIUM' : 'LOW',
    financial_impact: match.discrepancies.amount ? `${match.discrepancies.amount.difference.toFixed(2)} ${match.internal.currency}` : '0.00',
    action_required: match.matchType === 'major' ? 'IMMEDIATE' : 'MONITOR',
    
    // Descriptions
    internal_description: match.internal.description || '',
    provider_description: match.provider.description || ''
  }));
};

// STANDARD MATCHED EXPORT - Comprehensive but Clean
export const formatMatchedForExport = (matched: MatchedTransaction[]) => {
  return matched.map(match => ({
    transaction_reference: match.internal.transaction_reference || '',
    internal_amount: match.internal.amount || 0,
    provider_amount: match.provider.amount || 0,
    amount_difference: match.discrepancies.amount?.difference || 0,
    
    internal_status: match.internal.status || '',
    provider_status: match.provider.status || '',
    
    internal_currency: match.internal.currency || '',
    provider_currency: match.provider.currency || '',
    
    internal_timestamp: match.internal.timestamp || '',
    provider_timestamp: match.provider.timestamp || '',
    
    match_type: match.matchType || '',
    has_discrepancies: Object.keys(match.discrepancies).length > 0 ? 'Yes' : 'No',
    discrepancy_types: Object.keys(match.discrepancies).join(', ') || 'None',
    
    internal_description: match.internal.description || '',
    customer_id: match.internal.customer_id || '',
    provider_id: match.provider.provider_id || ''
  }));
};

// UNMATCHED TRANSACTIONS EXPORT - Simplified
export const formatTransactionsForExport = (transactions: Transaction[], type: 'internal' | 'provider') => {
  return transactions.map(tx => ({
    transaction_reference: tx.transaction_reference || '',
    amount: tx.amount || 0,
    currency: tx.currency || '',
    status: tx.status || '',
    timestamp: tx.timestamp || '',
    description: tx.description || '',
    customer_id: tx.customer_id || '',
    provider_id: tx.provider_id || '',
    
    file_source: type === 'internal' ? 'Internal System' : 'Provider Statement',
    issue_type: type === 'internal' ? 'Missing from Provider' : 'Extra in Provider',
    priority: 'HIGH',
    action_required: 'YES',
    
    potential_reason: type === 'internal' 
      ? 'Transaction not processed by provider or sync delay'
      : 'Unauthorized transaction or provider error',
    
    recommended_action: type === 'internal'
      ? 'Contact provider to verify transaction status'
      : 'Investigate transaction origin and verify authorization'
  }));
};

// COMPREHENSIVE DISCREPANCIES EXPORT - All Issues Combined
export const formatAllDiscrepanciesForExport = (
  matchedWithIssues: MatchedTransaction[],
  internalOnly: Transaction[],
  providerOnly: Transaction[]
) => {
  const matchedDiscrepancies = formatMatchedForExport(matchedWithIssues);
  const internalOnlyFormatted = formatTransactionsForExport(internalOnly, 'internal');
  const providerOnlyFormatted = formatTransactionsForExport(providerOnly, 'provider');

  return [
    ...matchedDiscrepancies,
    ...internalOnlyFormatted,
    ...providerOnlyFormatted
  ];
};

// FILENAME GENERATOR
export const generateExportFilename = (category: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  return `reconciliation_${category}_${timestamp}_${timeStr}.csv`;
};