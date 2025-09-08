import { Transaction, ReconciliationResult, MatchedTransaction } from '../types/transaction';
import { detectDuplicates } from './duplicateDetection';

export const reconcileTransactions = (
  internalData: Transaction[],
  providerData: Transaction[]
): ReconciliationResult => {
  console.log('=== STARTING RECONCILIATION ===');
  console.log('Internal data sample:', internalData.slice(0, 3));
  console.log('Provider data sample:', providerData.slice(0, 3));
  console.log('Internal count:', internalData.length);
  console.log('Provider count:', providerData.length);

  const matched: MatchedTransaction[] = [];
  const internalOnly: Transaction[] = [];
  const providerOnly: Transaction[] = [];

  // Detect duplicates in both datasets
  console.log('=== DETECTING DUPLICATES ===');
  const internalDuplicateAnalysis = detectDuplicates(internalData);
  const providerDuplicateAnalysis = detectDuplicates(providerData);

  console.log('Internal duplicates:', {
    groups: internalDuplicateAnalysis.duplicateGroups.length,
    total: internalDuplicateAnalysis.totalDuplicates
  });
  console.log('Provider duplicates:', {
    groups: providerDuplicateAnalysis.duplicateGroups.length,
    total: providerDuplicateAnalysis.totalDuplicates
  });

  // Create maps for efficient lookup - normalize transaction references for comparison
  const providerMap = new Map<string, Transaction>();
  const processedProviderRefs = new Set<string>();

  // Build provider map with normalized references
  providerData.forEach((transaction, index) => {
    if (transaction.transaction_reference) {
      const normalizedRef = transaction.transaction_reference.toString().trim().toUpperCase();
      if (normalizedRef && normalizedRef !== '') {
        providerMap.set(normalizedRef, transaction);
        console.log(`Provider[${index}]: ${normalizedRef} -> ${transaction.amount} ${transaction.currency}`);
      }
    }
  });

  const internalMap = new Map<string, Transaction>();
  const processedInternalRefs = new Set<string>();

  // Build internal map with normalized references
  internalData.forEach((transaction, index) => {
    if (transaction.transaction_reference) {
      const normalizedRef = transaction.transaction_reference.toString().trim().toUpperCase();
      if (normalizedRef && normalizedRef !== '') {
        internalMap.set(normalizedRef, transaction);
        console.log(`Internal[${index}]: ${normalizedRef} -> ${transaction.amount} ${transaction.currency}`);
      }
    }
  });

  console.log('Maps created:', {
    providerMapSize: providerMap.size,
    internalMapSize: internalMap.size,
    providerKeys: Array.from(providerMap.keys()).slice(0, 5),
    internalKeys: Array.from(internalMap.keys()).slice(0, 5)
  });

  // Process internal transactions to find matches
  internalData.forEach((internalTx, index) => {
    if (!internalTx.transaction_reference) {
      console.warn(`Internal transaction ${index} missing reference:`, internalTx);
      return;
    }

    const normalizedRef = internalTx.transaction_reference.toString().trim().toUpperCase();
    
    if (!normalizedRef || normalizedRef === '') {
      console.warn(`Internal transaction ${index} has empty reference after normalization`);
      return;
    }

    const providerTx = providerMap.get(normalizedRef);
    
    if (providerTx) {
      // Match found, analyze discrepancies
      console.log(`✅ MATCH FOUND: ${normalizedRef}`);
      console.log(`  Internal: ${internalTx.amount} ${internalTx.currency} ${internalTx.status}`);
      console.log(`  Provider: ${providerTx.amount} ${providerTx.currency} ${providerTx.status}`);
      
      const matchedTx = analyzeDiscrepancies(internalTx, providerTx);
      matched.push(matchedTx);
      processedInternalRefs.add(normalizedRef);
      processedProviderRefs.add(normalizedRef);
    } else {
      // No match in provider data
      console.log(`⚠️ INTERNAL ONLY: ${normalizedRef}`);
      internalOnly.push(internalTx);
      processedInternalRefs.add(normalizedRef);
    }
  });

  // Find provider-only transactions
  providerData.forEach((providerTx, index) => {
    if (!providerTx.transaction_reference) {
      console.warn(`Provider transaction ${index} missing reference:`, providerTx);
      return;
    }

    const normalizedRef = providerTx.transaction_reference.toString().trim().toUpperCase();
    
    if (!normalizedRef || normalizedRef === '') {
      console.warn(`Provider transaction ${index} has empty reference after normalization`);
      return;
    }
    
    // Only add to provider-only if it wasn't already processed as a match
    if (!processedProviderRefs.has(normalizedRef)) {
      console.log(`❌ PROVIDER ONLY: ${normalizedRef}`);
      providerOnly.push(providerTx);
    }
  });

  // Calculate summary statistics
  const totalInternal = internalData.length;
  const totalProvider = providerData.length;
  const totalInternalAmount = internalData.reduce((sum, tx) => {
    const amount = parseFloat(tx.amount?.toString() || '0');
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  const totalProviderAmount = providerData.reduce((sum, tx) => {
    const amount = parseFloat(tx.amount?.toString() || '0');
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  const matchRate = totalInternal > 0 ? (matched.length / totalInternal) * 100 : 0;
  const totalDiscrepancies = matched.filter(m => m.matchType !== 'perfect').length + 
                            internalOnly.length + providerOnly.length;
  const totalDuplicates = internalDuplicateAnalysis.totalDuplicates + providerDuplicateAnalysis.totalDuplicates;

  const result = {
    matched,
    internalOnly,
    providerOnly,
    duplicates: {
      internal: internalDuplicateAnalysis.uniqueDuplicateTransactions,
      provider: providerDuplicateAnalysis.uniqueDuplicateTransactions,
      totalCount: totalDuplicates
    },
    summary: {
      totalInternal,
      totalProvider,
      totalInternalAmount,
      totalProviderAmount,
      matchRate,
      totalDiscrepancies,
      totalDuplicates
    }
  };

  console.log('=== RECONCILIATION RESULTS ===');
  console.log(`Total Internal: ${totalInternal}`);
  console.log(`Total Provider: ${totalProvider}`);
  console.log(`Matched: ${matched.length}`);
  console.log(`Internal Only: ${internalOnly.length}`);
  console.log(`Provider Only: ${providerOnly.length}`);
  console.log(`Total Duplicates: ${totalDuplicates}`);
  console.log(`Match Rate: ${matchRate.toFixed(2)}%`);
  console.log(`Total Discrepancies: ${totalDiscrepancies}`);
  
  if (internalOnly.length > 0) {
    console.log('Internal Only Sample:', internalOnly.slice(0, 3).map(tx => ({
      ref: tx.transaction_reference,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status
    })));
  }
  
  if (providerOnly.length > 0) {
    console.log('Provider Only Sample:', providerOnly.slice(0, 3).map(tx => ({
      ref: tx.transaction_reference,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status
    })));
  }

  return result;
};

const analyzeDiscrepancies = (internal: Transaction, provider: Transaction): MatchedTransaction => {
  const discrepancies: MatchedTransaction['discrepancies'] = {};
  let matchType: 'perfect' | 'minor' | 'major' = 'perfect';

  // Amount discrepancy
  const internalAmount = parseFloat(internal.amount?.toString() || '0');
  const providerAmount = parseFloat(provider.amount?.toString() || '0');
  
  if (Math.abs(internalAmount - providerAmount) > 0.01) { // Account for floating point precision
    const difference = Math.abs(internalAmount - providerAmount);
    const percentage = internalAmount > 0 ? (difference / internalAmount) * 100 : 0;
    discrepancies.amount = {
      internal: internalAmount,
      provider: providerAmount,
      difference,
      percentage
    };
    matchType = percentage > 5 ? 'major' : 'minor';
    console.log(`Amount discrepancy: Internal=${internalAmount}, Provider=${providerAmount}, Diff=${difference}, %=${percentage.toFixed(2)}`);
  }

  // Status discrepancy
  const internalStatus = internal.status?.toString().trim().toLowerCase() || '';
  const providerStatus = provider.status?.toString().trim().toLowerCase() || '';
  
  if (internalStatus !== providerStatus) {
    discrepancies.status = {
      internal: internal.status || '',
      provider: provider.status || ''
    };
    matchType = 'major';
    console.log(`Status discrepancy: Internal="${internalStatus}", Provider="${providerStatus}"`);
  }

  // Currency discrepancy
  const internalCurrency = internal.currency?.toString().trim().toUpperCase() || '';
  const providerCurrency = provider.currency?.toString().trim().toUpperCase() || '';
  
  if (internalCurrency !== providerCurrency) {
    discrepancies.currency = {
      internal: internal.currency || '',
      provider: provider.currency || ''
    };
    matchType = 'major';
    console.log(`Currency discrepancy: Internal="${internalCurrency}", Provider="${providerCurrency}"`);
  }

  // Timestamp discrepancy
  try {
    const internalTimestamp = internal.timestamp?.toString().trim();
    const providerTimestamp = provider.timestamp?.toString().trim();
    
    if (internalTimestamp && providerTimestamp) {
      const internalDate = new Date(internalTimestamp);
      const providerDate = new Date(providerTimestamp);
      
      if (!isNaN(internalDate.getTime()) && !isNaN(providerDate.getTime())) {
        const timeDifference = Math.abs(internalDate.getTime() - providerDate.getTime());
        const differenceMinutes = timeDifference / (1000 * 60);

        if (differenceMinutes > 5) {
          discrepancies.timestamp = {
            internal: internalTimestamp,
            provider: providerTimestamp,
            differenceMinutes
          };
          if (differenceMinutes > 60 && matchType === 'perfect') {
            matchType = 'minor';
          }
          console.log(`Timestamp discrepancy: ${differenceMinutes.toFixed(2)} minutes difference`);
        }
      }
    }
  } catch (error) {
    console.warn('Invalid timestamp format detected:', { 
      internal: internal.timestamp, 
      provider: provider.timestamp,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return {
    internal,
    provider,
    discrepancies,
    matchType
  };
};