import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, Search, AlertTriangle, CheckCircle, Clock, Maximize2, Info } from 'lucide-react';
import { Transaction, MatchedTransaction, TransactionTableType } from '../types/transaction';
import { MatchedTransactionFilters } from './MatchedTransactionFilters';
import { 
  exportToCSV, 
  formatPerfectMatchesForExport, 
  formatDiscrepanciesSummaryForExport,
  formatDiscrepanciesDetailedForExport,
  formatMatchedForExport,
  generateExportFilename 
} from '../utils/csvExport';

interface TransactionTableProps {
  title: string;
  data: Transaction[] | MatchedTransaction[];
  type: TransactionTableType;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  onFullScreen: () => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  title,
  data,
  type,
  icon,
  bgColor,
  borderColor,
  onFullScreen
}) => {
  const [sortField, setSortField] = useState<string>('transaction_reference');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [matchFilter, setMatchFilter] = useState<'all' | 'perfect' | 'discrepancies'>('all');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSort = useCallback((field: string) => {
    setSortField(prevField => {
      if (prevField === field) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        return field;
      } else {
        setSortDirection('asc');
        return field;
      }
    });
  }, []);

  const formatAmount = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  const formatTimestamp = useCallback((timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  }, []);

  const getMatchTypeIcon = useCallback((matchType: string) => {
    switch (matchType) {
      case 'perfect':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'minor':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'major':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  }, []);

  // Get tooltip text based on type - Concise version
  const getTooltipText = () => {
    switch (type) {
      case 'internal-only':
        return 'Found in Internal CSV but missing from Provider CSV';
      case 'provider-only':
        return 'Found in Provider CSV but missing from Internal CSV';
      default:
        return '';
    }
  };

  // Calculate match statistics for matched transactions (stable reference)
  const matchStats = useMemo(() => {
    if (type !== 'matched' || !data) return null;
    
    const matchedData = data as MatchedTransaction[];
    const perfectMatches = matchedData.filter(m => m.matchType === 'perfect');
    const withDiscrepancies = matchedData.filter(m => m.matchType !== 'perfect');
    
    return {
      total: matchedData.length,
      perfect: perfectMatches.length,
      discrepancies: withDiscrepancies.length
    };
  }, [data, type]);

  // Export handlers (stable references)
  const handleExportPerfectMatches = useCallback(() => {
    if (type !== 'matched') return;
    const perfectMatches = (data as MatchedTransaction[]).filter(m => m.matchType === 'perfect');
    const exportData = formatPerfectMatchesForExport(perfectMatches);
    const filename = generateExportFilename('perfect_matches');
    exportToCSV(exportData, filename);
  }, [data, type]);

  const handleExportDiscrepanciesSummary = useCallback(() => {
    if (type !== 'matched') return;
    const withDiscrepancies = (data as MatchedTransaction[]).filter(m => m.matchType !== 'perfect');
    const exportData = formatDiscrepanciesSummaryForExport(withDiscrepancies);
    const filename = generateExportFilename('discrepancies_summary');
    exportToCSV(exportData, filename);
  }, [data, type]);

  const handleExportDiscrepanciesDetailed = useCallback(() => {
    if (type !== 'matched') return;
    const withDiscrepancies = (data as MatchedTransaction[]).filter(m => m.matchType !== 'perfect');
    const exportData = formatDiscrepanciesDetailedForExport(withDiscrepancies);
    const filename = generateExportFilename('discrepancies_detailed');
    exportToCSV(exportData, filename);
  }, [data, type]);

  const handleExportAllMatched = useCallback(() => {
    if (type !== 'matched') return;
    const exportData = formatMatchedForExport(data as MatchedTransaction[]);
    const filename = generateExportFilename('all_matched');
    exportToCSV(exportData, filename);
  }, [data, type]);

  // Handle filter change with proper state management
  const handleFilterChange = useCallback((filter: 'all' | 'perfect' | 'discrepancies') => {
    console.log('TransactionTable: Filter change requested:', filter, 'Current:', matchFilter);
    setMatchFilter(filter);
  }, [matchFilter]);

  // Optimized filtering and sorting (multi-stage memoization) - Enhanced to include currency
  const filteredAndSortedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    try {
      // Step 1: Apply match type filter
      let filtered = data;
      if (type === 'matched') {
        const matchedData = data as MatchedTransaction[];
        switch (matchFilter) {
          case 'perfect':
            filtered = matchedData.filter(m => m.matchType === 'perfect');
            break;
          case 'discrepancies':
            filtered = matchedData.filter(m => m.matchType !== 'perfect');
            break;
          default:
            filtered = matchedData;
        }
      }

      // Step 2: Apply search filter - Enhanced to include currency
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = (filtered as any[]).filter((item: any) => {
          try {
            if (type === 'matched') {
              const match = item as MatchedTransaction;
              return (
                (match.internal.transaction_reference || '').toLowerCase().includes(searchLower) ||
                (match.internal.description || '').toLowerCase().includes(searchLower) ||
                (match.internal.currency || '').toLowerCase().includes(searchLower) ||
                (match.provider.currency || '').toLowerCase().includes(searchLower)
              );
            } else {
              const transaction = item as Transaction;
              return (
                (transaction.transaction_reference || '').toLowerCase().includes(searchLower) ||
                (transaction.description || '').toLowerCase().includes(searchLower) ||
                (transaction.currency || '').toLowerCase().includes(searchLower)
              );
            }
          } catch (error) {
            console.warn('Error filtering item:', error);
            return false;
          }
        });
      }

      // Step 3: Apply sorting
      return [...filtered].sort((a, b) => {
        try {
          let aValue: any, bValue: any;

          if (type === 'matched') {
            const matchA = a as MatchedTransaction;
            const matchB = b as MatchedTransaction;
            
            switch (sortField) {
              case 'transaction_reference':
                aValue = matchA.internal.transaction_reference || '';
                bValue = matchB.internal.transaction_reference || '';
                break;
              case 'amount':
                aValue = Number(matchA.internal.amount) || 0;
                bValue = Number(matchB.internal.amount) || 0;
                break;
              case 'timestamp':
                aValue = new Date(matchA.internal.timestamp || 0).getTime();
                bValue = new Date(matchB.internal.timestamp || 0).getTime();
                break;
              default:
                aValue = matchA.internal.transaction_reference || '';
                bValue = matchB.internal.transaction_reference || '';
            }
          } else {
            const transactionA = a as Transaction;
            const transactionB = b as Transaction;
            
            switch (sortField) {
              case 'transaction_reference':
                aValue = transactionA.transaction_reference || '';
                bValue = transactionB.transaction_reference || '';
                break;
              case 'amount':
                aValue = Number(transactionA.amount) || 0;
                bValue = Number(transactionB.amount) || 0;
                break;
              case 'timestamp':
                aValue = new Date(transactionA.timestamp || 0).getTime();
                bValue = new Date(transactionB.timestamp || 0).getTime();
                break;
              default:
                aValue = transactionA.transaction_reference || '';
                bValue = transactionB.transaction_reference || '';
            }
          }

          // Optimized comparison
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          }
          
          // String comparison
          const aStr = String(aValue).toLowerCase();
          const bStr = String(bValue).toLowerCase();
          
          if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
          if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        } catch (error) {
          console.warn('Error comparing items:', error);
          return 0;
        }
      });
    } catch (error) {
      console.error('Error processing data:', error);
      return data;
    }
  }, [data, searchTerm, sortField, sortDirection, type, matchFilter]);

  const SortButton: React.FC<{ field: string; children: React.ReactNode }> = React.memo(({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-gray-900 transition-colors duration-200"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? 
          <ChevronUp className="h-4 w-4" /> : 
          <ChevronDown className="h-4 w-4" />
      )}
    </button>
  ));

  if (!data || data.length === 0) {
    return (
      <div className={`${bgColor} rounded-lg shadow-md p-6 border-2 ${borderColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="relative flex items-center">
              {icon}
              {(type === 'internal-only' || type === 'provider-only') && (
                <div className="relative ml-2">
                  <Info 
                    className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  />
                  {showTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                      {getTooltipText()}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold ml-2">{title}</h3>
          </div>
          <button
            onClick={onFullScreen}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="View in full screen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No transactions in this category</p>
        </div>
      </div>
    );
  }

  // Show only first 10 items in card view
  const displayData = filteredAndSortedData.slice(0, 10);
  const hasMore = filteredAndSortedData.length > 10;

  return (
    <div className={`${bgColor} rounded-lg shadow-md border-2 ${borderColor}`}>
      {/* Enhanced Filters for Matched Transactions - Inside the card */}
      {type === 'matched' && matchStats && (
        <div className="p-4 border-b border-gray-200">
          <MatchedTransactionFilters
            totalMatched={matchStats.total}
            perfectMatches={matchStats.perfect}
            withDiscrepancies={matchStats.discrepancies}
            currentFilter={matchFilter}
            onFilterChange={handleFilterChange}
            onExportPerfect={handleExportPerfectMatches}
            onExportDiscrepancies={handleExportDiscrepanciesSummary}
            onExportDiscrepanciesDetailed={handleExportDiscrepanciesDetailed}
            onExportAllMatched={handleExportAllMatched}
          />
        </div>
      )}

      {/* Header and Search - Inside the card */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
          <div className="flex items-center">
            <div className="relative flex items-center">
              {icon}
              {(type === 'internal-only' || type === 'provider-only') && (
                <div className="relative ml-2">
                  <Info 
                    className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  />
                  {showTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                      {getTooltipText()}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold ml-2">{title}</h3>
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {type === 'matched' ? filteredAndSortedData.length : data.length}
            </span>
            {type === 'matched' && matchFilter !== 'all' && (
              <span className="ml-2 px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                {matchFilter === 'perfect' ? 'Perfect Only' : 'Issues Only'}
              </span>
            )}
          </div>
          <button
            onClick={onFullScreen}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="View in full screen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by transaction reference, description, or currency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="transaction_reference">Reference</SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="amount">Amount</SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Currency
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="timestamp">Timestamp</SortButton>
              </th>
              {type === 'matched' && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match Type
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((item, index) => {
              if (type === 'matched') {
                const match = item as MatchedTransaction;
                return (
                  <tr key={`${match.internal.transaction_reference}-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {match.internal.transaction_reference}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className={match.discrepancies.amount ? 'text-red-600 font-medium' : ''}>
                          {formatAmount(match.internal.amount)}
                        </span>
                        {match.discrepancies.amount && (
                          <span className="text-xs text-red-500">
                            Provider: {formatAmount(match.provider.amount)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className={match.discrepancies.status ? 'text-red-600 font-medium' : ''}>
                          {match.internal.status}
                        </span>
                        {match.discrepancies.status && (
                          <span className="text-xs text-red-500">
                            Provider: {match.provider.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {match.internal.currency}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span>{formatTimestamp(match.internal.timestamp)}</span>
                        {match.discrepancies.timestamp && (
                          <span className="text-xs text-yellow-600">
                            Δ {match.discrepancies.timestamp.differenceMinutes.toFixed(0)} min
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center">
                        {getMatchTypeIcon(match.matchType)}
                        <span className="ml-1 capitalize">{match.matchType}</span>
                      </div>
                    </td>
                  </tr>
                );
              } else {
                const transaction = item as Transaction;
                return (
                  <tr key={`${transaction.transaction_reference}-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {transaction.transaction_reference}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatAmount(transaction.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                        transaction.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.status.toLowerCase() === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {transaction.currency}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatTimestamp(transaction.timestamp)}
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>

      {/* View All Button - Now properly inside the card at the bottom */}
      {hasMore && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onFullScreen}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors duration-200"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            View all {filteredAndSortedData.length} transactions in full screen
          </button>
        </div>
      )}
    </div>
  );
};