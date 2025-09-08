import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Search, AlertTriangle, CheckCircle, Clock, Copy, Download, Menu, Filter } from 'lucide-react';
import { Transaction, MatchedTransaction, TransactionTableType, ReconciliationResult } from '../types/transaction';
import { MatchedTransactionFilters } from './MatchedTransactionFilters';
import { 
  exportToCSV, 
  formatMatchedForExport, 
  formatTransactionsForExport, 
  formatPerfectMatchesForExport,
  formatDiscrepanciesSummaryForExport,
  formatDiscrepanciesDetailedForExport,
  generateExportFilename 
} from '../utils/csvExport';
import { formatDuplicatesForExport, detectDuplicates } from '../utils/duplicateDetection';

interface FullScreenTransactionViewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Transaction[] | MatchedTransaction[];
  type: TransactionTableType;
  icon: React.ReactNode;
  reconciliationResult?: ReconciliationResult;
}

export const FullScreenTransactionView: React.FC<FullScreenTransactionViewProps> = ({
  isOpen,
  onClose,
  title,
  data,
  type,
  icon,
  reconciliationResult
}) => {
  const [sortField, setSortField] = useState<string>('transaction_reference');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [matchFilter, setMatchFilter] = useState<'all' | 'perfect' | 'discrepancies'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isFilterMinimized, setIsFilterMinimized] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  // Use useRef for timeout to prevent memory leaks
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 50;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setMatchFilter('all');
      setShowExportDropdown(false);
      setIsFilterMinimized(false);
      setIsMobileFiltersOpen(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [isOpen]);

  // Smart auto-retract behavior for export dropdown
  useEffect(() => {
    if (!showExportDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node) &&
          exportButtonRef.current && !exportButtonRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    const handleMouseLeave = (event: MouseEvent) => {
      // Check if mouse is leaving the entire button + dropdown area
      if (exportContainerRef.current && !exportContainerRef.current.contains(event.target as Node)) {
        const rect = exportContainerRef.current.getBoundingClientRect();
        const dropdownRect = exportDropdownRef.current?.getBoundingClientRect();
        
        // If mouse is outside both button and dropdown areas
        if (dropdownRect) {
          const combinedRect = {
            left: Math.min(rect.left, dropdownRect.left),
            right: Math.max(rect.right, dropdownRect.right),
            top: Math.min(rect.top, dropdownRect.top),
            bottom: Math.max(rect.bottom, dropdownRect.bottom)
          };
          
          if (event.clientX < combinedRect.left || 
              event.clientX > combinedRect.right || 
              event.clientY < combinedRect.top || 
              event.clientY > combinedRect.bottom) {
            setShowExportDropdown(false);
          }
        }
      }
    };

    const handleScroll = () => {
      setShowExportDropdown(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowExportDropdown(false);
      }
    };

    // Add all event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mousemove', handleMouseLeave);
    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('wheel', handleScroll, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseLeave);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('wheel', handleScroll, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showExportDropdown]);

  // Close mobile filters when clicking outside
  useEffect(() => {
    if (!isMobileFiltersOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const filtersPanel = document.getElementById('mobile-filters-panel');
      const filtersButton = document.getElementById('mobile-filters-button');
      
      if (filtersPanel && !filtersPanel.contains(event.target as Node) && 
          filtersButton && !filtersButton.contains(event.target as Node)) {
        setIsMobileFiltersOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileFiltersOpen]);

  if (!isOpen) return null;

  // Debounced search handler with proper cleanup
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setIsSearching(true);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(value);
      setCurrentPage(1);
      setIsSearching(false);
      searchTimeoutRef.current = null;
    }, 300);
  }, []);

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
    setCurrentPage(1);
  }, []);

  const formatAmount = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  const formatAmountDifferenceWithSource = useCallback((match: MatchedTransaction): React.ReactNode => {
    if (!match.discrepancies.amount) {
      return <span className="text-gray-400 text-xs">No difference</span>;
    }

    const difference = match.discrepancies.amount.difference;
    const percentage = match.discrepancies.amount.percentage;
    const internalAmount = match.internal.amount;
    const providerAmount = match.provider.amount;
    const currency = match.internal.currency;

    const isInternalHigher = internalAmount > providerAmount;

    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className={`font-medium text-xs sm:text-sm ${
            isInternalHigher ? 'text-red-600' : 'text-blue-600'
          }`}>
            {formatAmount(difference)} {currency}
          </span>
          <span className="ml-1 text-xs text-gray-500">
            ({percentage.toFixed(1)}%)
          </span>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          <span className={isInternalHigher ? 'text-red-600 font-medium' : 'text-gray-600'}>
            Int: {formatAmount(internalAmount)}
          </span>
          <span className="mx-1">vs</span>
          <span className={!isInternalHigher ? 'text-blue-600 font-medium' : 'text-gray-600'}>
            Prov: {formatAmount(providerAmount)}
          </span>
        </div>
        <div className="text-xs mt-1">
          <span className={`px-1 py-0.5 rounded text-xs font-medium ${
            isInternalHigher 
              ? 'bg-red-100 text-red-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {isInternalHigher ? 'Int' : 'Prov'} higher
          </span>
        </div>
      </div>
    );
  }, [formatAmount]);

  const formatTimestamp = useCallback((timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      // Mobile-friendly shorter format
      return window.innerWidth < 640 ? 
        date.toLocaleDateString() : 
        date.toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  }, []);

  const getMatchTypeIcon = useCallback((matchType: string) => {
    switch (matchType) {
      case 'perfect':
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />;
      case 'minor':
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />;
      case 'major':
        return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />;
      default:
        return null;
    }
  }, []);

  // Calculate match statistics (stable reference)
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

  // Calculate duplicate information for duplicates view
  const duplicateInfo = useMemo(() => {
    if (type !== 'duplicates' || !data) return null;
    
    const transactions = data as Transaction[];
    const duplicateAnalysis = detectDuplicates(transactions);
    
    return {
      groups: duplicateAnalysis.duplicateGroups,
      totalDuplicates: duplicateAnalysis.totalDuplicates
    };
  }, [data, type]);

  // Step 1: Apply match filter (most selective first)
  const matchFilteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (type !== 'matched') return data;
    
    const matchedData = data as MatchedTransaction[];
    
    switch (matchFilter) {
      case 'perfect':
        return matchedData.filter(m => m.matchType === 'perfect');
      case 'discrepancies':
        return matchedData.filter(m => m.matchType !== 'perfect');
      default:
        return matchedData;
    }
  }, [data, type, matchFilter]);

  // Step 2: Apply search filter - Enhanced to include currency
  const searchFilteredData = useMemo(() => {
    if (!matchFilteredData || matchFilteredData.length === 0) return [];
    if (!debouncedSearchTerm.trim()) return matchFilteredData;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    
    return matchFilteredData.filter(item => {
      try {
        if (type === 'matched') {
          const match = item as MatchedTransaction;
          return (
            (match.internal.transaction_reference || '').toLowerCase().includes(searchLower) ||
            (match.internal.description || '').toLowerCase().includes(searchLower) ||
            (match.internal.status || '').toLowerCase().includes(searchLower) ||
            (match.internal.currency || '').toLowerCase().includes(searchLower) ||
            (match.provider.currency || '').toLowerCase().includes(searchLower)
          );
        } else {
          const transaction = item as Transaction;
          return (
            (transaction.transaction_reference || '').toLowerCase().includes(searchLower) ||
            (transaction.description || '').toLowerCase().includes(searchLower) ||
            (transaction.status || '').toLowerCase().includes(searchLower) ||
            (transaction.currency || '').toLowerCase().includes(searchLower)
          );
        }
      } catch (error) {
        console.warn('Error filtering item:', error);
        return false;
      }
    });
  }, [matchFilteredData, debouncedSearchTerm, type]);

  // Step 3: Apply sorting
  const sortedData = useMemo(() => {
    if (!searchFilteredData || searchFilteredData.length === 0) return [];

    try {
      return [...searchFilteredData].sort((a, b) => {
        let aValue: any, bValue: any;

        try {
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
              case 'amount_difference':
                aValue = matchA.discrepancies.amount?.difference || 0;
                bValue = matchB.discrepancies.amount?.difference || 0;
                break;
              case 'timestamp':
                aValue = new Date(matchA.internal.timestamp || 0).getTime();
                bValue = new Date(matchB.internal.timestamp || 0).getTime();
                break;
              case 'status':
                aValue = matchA.internal.status || '';
                bValue = matchB.internal.status || '';
                break;
              case 'currency':
                aValue = matchA.internal.currency || '';
                bValue = matchB.internal.currency || '';
                break;
              case 'description':
                aValue = matchA.internal.description || '';
                bValue = matchB.internal.description || '';
                break;
              case 'match_type':
                aValue = matchA.matchType || '';
                bValue = matchB.matchType || '';
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
              case 'status':
                aValue = transactionA.status || '';
                bValue = transactionB.status || '';
                break;
              case 'currency':
                aValue = transactionA.currency || '';
                bValue = transactionB.currency || '';
                break;
              case 'description':
                aValue = transactionA.description || '';
                bValue = transactionB.description || '';
                break;
              case 'customer_id':
                aValue = transactionA.customer_id || transactionA.provider_id || '';
                bValue = transactionB.customer_id || transactionB.provider_id || '';
                break;
              case 'fees':
                aValue = Number(transactionA.fees) || 0;
                bValue = Number(transactionB.fees) || 0;
                break;
              case 'duplicate_count':
                // For duplicates view, we'll handle this separately
                if (type === 'duplicates') {
                  const countA = getDuplicateCount(transactionA.transaction_reference);
                  const countB = getDuplicateCount(transactionB.transaction_reference);
                  aValue = countA;
                  bValue = countB;
                } else {
                  aValue = 1;
                  bValue = 1;
                }
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
      console.error('Error sorting data:', error);
      return searchFilteredData;
    }
  }, [searchFilteredData, sortField, sortDirection, type]);

  // Step 4: Pagination
  const paginationData = useMemo(() => {
    const totalItems = sortedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedData = sortedData.slice(startIndex, endIndex);
    
    return {
      totalPages,
      startIndex,
      endIndex,
      paginatedData,
      totalItems
    };
  }, [sortedData, currentPage, itemsPerPage]);

  // Export handlers for non-matched transaction types with proper mouse event handling
  const handleExportInternalOnly = useCallback(() => {
    if (type !== 'internal-only') return;
    const exportData = formatTransactionsForExport(data as Transaction[], 'internal');
    const filename = generateExportFilename('internal_only');
    exportToCSV(exportData, filename);
    setShowExportDropdown(false);
  }, [data, type]);

  const handleExportProviderOnly = useCallback(() => {
    if (type !== 'provider-only') return;
    const exportData = formatTransactionsForExport(data as Transaction[], 'provider');
    const filename = generateExportFilename('provider_only');
    exportToCSV(exportData, filename);
    setShowExportDropdown(false);
  }, [data, type]);

  const handleExportDuplicates = useCallback(() => {
    if (type !== 'duplicates' || !duplicateInfo) return;
    const exportData = formatDuplicatesForExport(duplicateInfo.groups);
    const filename = generateExportFilename('duplicates_analysis');
    exportToCSV(exportData, filename);
    setShowExportDropdown(false);
  }, [type, duplicateInfo]);

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

  const handleFilterChange = useCallback((filter: 'all' | 'perfect' | 'discrepancies') => {
    console.log('TransactionTable: Filter change requested:', filter, 'Current:', matchFilter);
    setMatchFilter(filter);
  }, [matchFilter]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, paginationData.totalPages)));
  }, [paginationData.totalPages]);

  const handleToggleFilterMinimize = useCallback(() => {
    setIsFilterMinimized(prev => !prev);
  }, []);

  // Simple click handler for export button - no hover conflicts
  const handleExportButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowExportDropdown(prev => !prev);
  };

  // Get duplicate count for duplicates view
  const getDuplicateCount = useCallback((reference: string) => {
    if (type !== 'duplicates' || !duplicateInfo) return 1;
    const group = duplicateInfo.groups.find(g => g.reference === reference.toUpperCase());
    return group ? group.count : 1;
  }, [type, duplicateInfo]);

  const SortButton: React.FC<{ field: string; children: React.ReactNode }> = React.memo(({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-gray-900 transition-colors duration-200 font-medium text-xs sm:text-sm"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? 
          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : 
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
      )}
    </button>
  ));

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-none max-h-none flex flex-col">
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-teal-600 to-emerald-700 text-white rounded-t-lg">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex items-center min-w-0">
              {icon}
              <h2 className="text-base sm:text-lg md:text-xl font-bold ml-2 truncate">{title}</h2>
              <span className="ml-2 sm:ml-3 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                {paginationData.totalItems}
              </span>
              {type === 'matched' && matchFilter !== 'all' && (
                <span className="hidden sm:inline-block ml-2 px-2 py-1 bg-white bg-opacity-30 rounded-full text-xs font-medium">
                  {matchFilter === 'perfect' ? 'Perfect Only' : 'Issues Only'}
                </span>
              )}
              {type === 'duplicates' && duplicateInfo && (
                <span className="hidden sm:inline-block ml-2 px-2 py-1 bg-white bg-opacity-30 rounded-full text-xs font-medium">
                  {duplicateInfo.groups.length} groups
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* Mobile Filters Button for Matched Transactions */}
            {type === 'matched' && (
              <button
                id="mobile-filters-button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="sm:hidden p-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-white hover:bg-opacity-30 transition-colors duration-200"
              >
                <Filter className="h-4 w-4" />
              </button>
            )}
            
            {/* Export Button for Non-Matched Types - Smart Auto-Retract */}
            {type !== 'matched' && (
              <div ref={exportContainerRef} className="relative">
                <button 
                  ref={exportButtonRef}
                  type="button"
                  className="flex items-center justify-center px-2 sm:px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-white hover:bg-opacity-30 transition-colors duration-200"
                  onClick={handleExportButtonClick}
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className={`h-4 w-4 ml-1 sm:ml-2 transition-transform duration-200 ${
                    showExportDropdown ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {/* Portal-style Dropdown with Smart Auto-Retract */}
                {showExportDropdown && (
                  <div className="fixed inset-0 z-[9999]">
                    {/* Backdrop */}
                    <div 
                      className="absolute inset-0 bg-transparent"
                      onClick={() => setShowExportDropdown(false)}
                    />
                    
                    {/* Dropdown positioned relative to button */}
                    <div 
                      ref={exportDropdownRef}
                      className="absolute w-72 bg-white rounded-lg shadow-2xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200"
                      style={{
                        top: exportButtonRef.current ? exportButtonRef.current.getBoundingClientRect().bottom + 8 : 0,
                        right: exportButtonRef.current ? window.innerWidth - exportButtonRef.current.getBoundingClientRect().right : 0,
                      }}
                    >
                      <div className="p-2">
                        {type === 'internal-only' && (
                          <button
                            type="button"
                            onClick={handleExportInternalOnly}
                            className="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
                          >
                            <Download className="h-4 w-4 mr-2 text-yellow-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900">Internal Only Transactions</div>
                              <div className="text-xs text-gray-500 truncate">Missing from provider ({paginationData.totalItems} records)</div>
                            </div>
                          </button>
                        )}
                        
                        {type === 'provider-only' && (
                          <button
                            type="button"
                            onClick={handleExportProviderOnly}
                            className="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
                          >
                            <Download className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900">Provider Only Transactions</div>
                              <div className="text-xs text-gray-500 truncate">Missing from internal ({paginationData.totalItems} records)</div>
                            </div>
                          </button>
                        )}
                        
                        {type === 'duplicates' && (
                          <button
                            type="button"
                            onClick={handleExportDuplicates}
                            className="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
                          >
                            <Download className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900">Duplicate Analysis</div>
                              <div className="text-xs text-gray-500 truncate">Complete duplicate report ({duplicateInfo?.groups.length || 0} groups)</div>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Filters Overlay for Matched Transactions */}
        {type === 'matched' && isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileFiltersOpen(false)} />
            <div 
              id="mobile-filters-panel"
              className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 transform transition-transform duration-300 ease-in-out"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Filters & Export</h3>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                
                {matchStats && (
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
                    isMinimized={false}
                    onToggleMinimize={undefined}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Filters for Matched Transactions - Desktop Only */}
        {type === 'matched' && matchStats && (
          <div className={`hidden sm:block border-b border-gray-200 bg-gray-50 transition-all duration-300 ${
            isFilterMinimized ? 'pb-0' : 'pb-4'
          }`}>
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
              isMinimized={isFilterMinimized}
              onToggleMinimize={handleToggleFilterMinimize}
            />
          </div>
        )}

        {/* Search and Controls - Mobile Optimized */}
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                </div>
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
              Showing {paginationData.startIndex + 1}-{paginationData.endIndex} of {paginationData.totalItems}
            </div>
          </div>
        </div>

        {/* Table - Mobile Responsive */}
        <div className="flex-1 overflow-auto">
          {paginationData.totalItems === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No transactions found</p>
                <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <SortButton field="transaction_reference">Reference</SortButton>
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <SortButton field="amount">Amount</SortButton>
                    </th>
                    {type === 'matched' && (
                      <th className="hidden md:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        <SortButton field="amount_difference">Difference</SortButton>
                      </th>
                    )}
                    <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <SortButton field="status">Status</SortButton>
                    </th>
                    <th className="hidden sm:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <SortButton field="currency">Currency</SortButton>
                    </th>
                    <th className="hidden lg:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <SortButton field="timestamp">Timestamp</SortButton>
                    </th>
                    <th className="hidden xl:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <SortButton field="description">Description</SortButton>
                    </th>
                    {type === 'matched' && (
                      <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        <SortButton field="match_type">Match</SortButton>
                      </th>
                    )}
                    {type === 'duplicates' && (
                      <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        <SortButton field="duplicate_count">Count</SortButton>
                      </th>
                    )}
                    {type !== 'matched' && type !== 'duplicates' && (
                      <>
                        <th className="hidden lg:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <SortButton field="customer_id">Customer ID</SortButton>
                        </th>
                        <th className="hidden xl:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <SortButton field="fees">Fees</SortButton>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginationData.paginatedData.map((item, index) => {
                    if (type === 'matched') {
                      const match = item as MatchedTransaction;
                      
                      return (
                        <tr key={`${match.internal.transaction_reference}-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                            <div className="truncate max-w-[120px] sm:max-w-none">
                              {match.internal.transaction_reference}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span className={match.discrepancies.amount ? 'text-red-600 font-medium' : ''}>
                                {formatAmount(match.internal.amount)}
                              </span>
                              {match.discrepancies.amount && (
                                <span className="text-xs text-red-500 sm:hidden">
                                  Prov: {formatAmount(match.provider.amount)}
                                </span>
                              )}
                            </div>
                          </td>
                          {type === 'matched' && (
                            <td className="hidden md:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                              {formatAmountDifferenceWithSource(match)}
                            </td>
                          )}
                          <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span className={`inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full ${
                                match.internal.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                                match.internal.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                match.internal.status.toLowerCase() === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              } ${match.discrepancies.status ? 'border-2 border-red-300' : ''}`}>
                                {match.internal.status}
                              </span>
                              {match.discrepancies.status && (
                                <span className="text-xs text-red-500 mt-1 sm:hidden">
                                  Prov: {match.provider.status}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                            <span className={match.discrepancies.currency ? 'text-red-600 font-medium' : ''}>
                              {match.internal.currency}
                            </span>
                            {match.discrepancies.currency && (
                              <div className="text-xs text-red-500">
                                Prov: {match.provider.currency}
                              </div>
                            )}
                          </td>
                          <td className="hidden lg:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span>{formatTimestamp(match.internal.timestamp)}</span>
                              {match.discrepancies.timestamp && (
                                <span className="text-xs text-yellow-600">
                                  Δ {match.discrepancies.timestamp.differenceMinutes.toFixed(0)} min
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="hidden xl:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 max-w-xs truncate">
                            {match.internal.description}
                          </td>
                          <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                            <div className="flex items-center">
                              {getMatchTypeIcon(match.matchType)}
                              <span className="ml-1 sm:ml-2 capitalize text-xs sm:text-sm">{match.matchType}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    } else {
                      const transaction = item as Transaction;
                      const duplicateCount = type === 'duplicates' ? getDuplicateCount(transaction.transaction_reference) : 1;
                      const isHighRisk = duplicateCount > 3;
                      
                      return (
                        <tr key={`${transaction.transaction_reference}-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <div className="truncate max-w-[120px] sm:max-w-none">
                                {transaction.transaction_reference}
                              </div>
                              {type === 'duplicates' && isHighRisk && (
                                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 ml-1 sm:ml-2 flex-shrink-0" />
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                            {formatAmount(transaction.amount)}
                          </td>
                          <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                            <span className={`inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                              transaction.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              transaction.status.toLowerCase() === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                            {transaction.currency}
                          </td>
                          <td className="hidden lg:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                            {formatTimestamp(transaction.timestamp)}
                          </td>
                          <td className="hidden xl:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 max-w-xs truncate">
                            {transaction.description}
                          </td>
                          {type === 'duplicates' && (
                            <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                              <span className={`inline-flex items-center px-1 sm:px-2 py-1 text-xs font-semibold rounded-full ${
                                duplicateCount > 3 ? 'bg-red-100 text-red-800' :
                                duplicateCount > 2 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                <Copy className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                {duplicateCount}x
                              </span>
                            </td>
                          )}
                          {(type === 'internal-only' || type === 'provider-only') && (
                            <>
                              <td className="hidden lg:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                                {transaction.customer_id || transaction.provider_id || '-'}
                              </td>
                              <td className="hidden xl:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                                {transaction.fees ? formatAmount(transaction.fees) : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination - Mobile Optimized */}
        {paginationData.totalPages > 1 && (
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-600">
                Page {currentPage} of {paginationData.totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 text-xs sm:text-sm rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === paginationData.totalPages}
                  className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 text-xs sm:text-sm rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};