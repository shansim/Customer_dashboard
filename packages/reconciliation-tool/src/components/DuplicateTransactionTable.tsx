import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Download, AlertTriangle, Maximize2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Transaction } from '../types/transaction';
import { DuplicateGroup, formatDuplicatesForExport } from '../utils/duplicateDetection';
import { exportToCSV, generateExportFilename } from '../utils/csvExport';

interface DuplicateTransactionTableProps {
  duplicateGroups: DuplicateGroup[];
  duplicateTransactions: Transaction[];
  onFullScreen: () => void;
}

export const DuplicateTransactionTable: React.FC<DuplicateTransactionTableProps> = ({
  duplicateGroups,
  duplicateTransactions,
  onFullScreen
}) => {
  const [sortField, setSortField] = useState<string>('transaction_reference');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleExportDuplicates = useCallback(() => {
    const exportData = formatDuplicatesForExport(duplicateGroups);
    const filename = generateExportFilename('duplicates_analysis');
    exportToCSV(exportData, filename);
  }, [duplicateGroups]);

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

  const filteredAndSortedData = useMemo(() => {
    let filtered = duplicateTransactions;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction => {
        return (
          (transaction.transaction_reference || '').toLowerCase().includes(searchLower) ||
          (transaction.description || '').toLowerCase().includes(searchLower) ||
          (transaction.status || '').toLowerCase().includes(searchLower) ||
          (transaction.currency || '').toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'transaction_reference':
          aValue = a.transaction_reference || '';
          bValue = b.transaction_reference || '';
          break;
        case 'amount':
          aValue = Number(a.amount) || 0;
          bValue = Number(b.amount) || 0;
          break;
        case 'timestamp':
          aValue = new Date(a.timestamp || 0).getTime();
          bValue = new Date(b.timestamp || 0).getTime();
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'currency':
          aValue = a.currency || '';
          bValue = b.currency || '';
          break;
        default:
          aValue = a.transaction_reference || '';
          bValue = b.transaction_reference || '';
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
    });
  }, [duplicateTransactions, searchTerm, sortField, sortDirection]);

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

  if (duplicateTransactions.length === 0) {
    return (
      <div className="bg-purple-50 rounded-lg shadow-md p-6 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Copy className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold">Duplicate Transactions</h3>
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
          <Copy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No duplicate transactions detected</p>
          <p className="text-sm text-gray-500 mt-1">All transaction references are unique</p>
        </div>
      </div>
    );
  }

  // Show only first 10 items in card view
  const displayData = filteredAndSortedData.slice(0, 10);
  const hasMore = filteredAndSortedData.length > 10;

  // Get duplicate count for each transaction reference
  const getDuplicateCount = (reference: string) => {
    const group = duplicateGroups.find(g => g.reference === reference.toUpperCase());
    return group ? group.count : 1;
  };

  return (
    <div className="bg-purple-50 rounded-lg shadow-md border-2 border-purple-200">
      <div className="p-4 border-b border-purple-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
          <div className="flex items-center">
            <Copy className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold">Duplicate Transactions</h3>
            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {duplicateTransactions.length}
            </span>
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              {duplicateGroups.length} groups
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportDuplicates}
              className="flex items-center px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
            <button
              onClick={onFullScreen}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="View in full screen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by transaction reference number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-purple-100 border-b border-purple-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                <SortButton field="transaction_reference">Reference</SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                <SortButton field="amount">Amount</SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                <SortButton field="status">Status</SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                <SortButton field="currency">Currency</SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                <SortButton field="timestamp">Timestamp</SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                Duplicate Count
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-purple-100">
            {displayData.map((transaction, index) => {
              const duplicateCount = getDuplicateCount(transaction.transaction_reference);
              const isHighRisk = duplicateCount > 3;
              
              return (
                <tr key={`${transaction.transaction_reference}-${index}`} className="hover:bg-purple-50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <span>{transaction.transaction_reference}</span>
                      {isHighRisk && (
                        <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                      )}
                    </div>
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
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      duplicateCount > 3 ? 'bg-red-100 text-red-800' :
                      duplicateCount > 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      <Copy className="h-3 w-3 mr-1" />
                      {duplicateCount}x
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="p-4 border-t border-purple-200 bg-purple-50">
          <button
            onClick={onFullScreen}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded-lg hover:bg-purple-200 transition-colors duration-200"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            View all {filteredAndSortedData.length} duplicate transactions in full screen
          </button>
        </div>
      )}
    </div>
  );
};