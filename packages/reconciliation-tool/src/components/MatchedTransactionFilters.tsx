import React, { useState, useRef, useEffect } from 'react';
import { Filter, Download, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';

interface MatchedTransactionFiltersProps {
  totalMatched: number;
  perfectMatches: number;
  withDiscrepancies: number;
  currentFilter: 'all' | 'perfect' | 'discrepancies';
  onFilterChange: (filter: 'all' | 'perfect' | 'discrepancies') => void;
  onExportPerfect: () => void;
  onExportDiscrepancies: () => void;
  onExportDiscrepanciesDetailed: () => void;
  onExportAllMatched: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const MatchedTransactionFilters: React.FC<MatchedTransactionFiltersProps> = ({
  totalMatched,
  perfectMatches,
  withDiscrepancies,
  currentFilter,
  onFilterChange,
  onExportPerfect,
  onExportDiscrepancies,
  onExportDiscrepanciesDetailed,
  onExportAllMatched,
  isMinimized = false,
  onToggleMinimize
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle filter changes with proper event handling
  const handleFilterClick = (filter: 'all' | 'perfect' | 'discrepancies') => {
    console.log('Filter clicked:', filter, 'Current:', currentFilter);
    onFilterChange(filter);
  };

  // Simple click handler - no hover conflicts
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(prev => !prev);
  };

  // Smart auto-retract behavior
  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    const handleMouseLeave = (event: MouseEvent) => {
      // Check if mouse is leaving the entire button + dropdown area
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const rect = containerRef.current.getBoundingClientRect();
        const dropdownRect = dropdownRef.current?.getBoundingClientRect();
        
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
            setShowDropdown(false);
          }
        }
      }
    };

    const handleScroll = () => {
      setShowDropdown(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    // Add all event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mousemove', handleMouseLeave);
    document.addEventListener('scroll', handleScroll, true); // Capture scroll events
    document.addEventListener('wheel', handleScroll, true); // Capture wheel events
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseLeave);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('wheel', handleScroll, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown]);

  // Handle export button clicks with dropdown close
  const handleExportClick = (exportFunction: () => void) => {
    exportFunction();
    setShowDropdown(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 transition-all duration-300 relative">
      {/* Header with minimize button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Filter className="h-4 w-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-800">Filters & Export</h3>
          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
            {currentFilter === 'all' ? 'All' : currentFilter === 'perfect' ? 'Perfect' : 'Issues'}
          </span>
        </div>
        {onToggleMinimize && (
          <button
            onClick={onToggleMinimize}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
            title={isMinimized ? 'Expand filters' : 'Minimize filters'}
          >
            {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Collapsible content */}
      <div className={`transition-all duration-300 overflow-hidden ${
        isMinimized ? 'max-h-0' : 'max-h-96'
      }`}>
        <div className="p-4">
          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFilterClick('all');
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentFilter === 'all'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                All ({totalMatched})
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFilterClick('perfect');
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentFilter === 'perfect'
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Perfect ({perfectMatches})
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFilterClick('discrepancies');
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentFilter === 'discrepancies'
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Issues ({withDiscrepancies})
              </button>
            </div>
          </div>

          {/* Export Button with Smart Dropdown */}
          <div ref={containerRef} className="relative mb-4">
            <button 
              ref={buttonRef}
              type="button"
              className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200"
              onClick={handleButtonClick}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Options
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${
                showDropdown ? 'rotate-180' : ''
              }`} />
            </button>
            
            {/* Portal-style Dropdown with Smart Positioning */}
            {showDropdown && (
              <div className="fixed inset-0 z-[9999]">
                {/* Invisible backdrop for click detection */}
                <div 
                  className="absolute inset-0 bg-transparent"
                  onClick={() => setShowDropdown(false)}
                />
                
                {/* Dropdown positioned relative to button */}
                <div 
                  ref={dropdownRef}
                  className="absolute w-80 bg-white rounded-lg shadow-2xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{
                    top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 8 : 0,
                    left: buttonRef.current ? buttonRef.current.getBoundingClientRect().left : 0,
                  }}
                >
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => handleExportClick(onExportAllMatched)}
                      className="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
                    >
                      <Download className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium">All Matched Transactions</div>
                        <div className="text-xs text-gray-500 truncate">Complete dataset ({totalMatched} records)</div>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleExportClick(onExportPerfect)}
                      disabled={perfectMatches === 0}
                      className="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium">Perfect Matches Only</div>
                        <div className="text-xs text-gray-500 truncate">Clean, verified transactions ({perfectMatches} records)</div>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleExportClick(onExportDiscrepancies)}
                      disabled={withDiscrepancies === 0}
                      className="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Eye className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium">Issues Summary</div>
                        <div className="text-xs text-gray-500 truncate">Key discrepancies only ({withDiscrepancies} records)</div>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleExportClick(onExportDiscrepanciesDetailed)}
                      disabled={withDiscrepancies === 0}
                      className="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <EyeOff className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium">Issues Detailed</div>
                        <div className="text-xs text-gray-500 truncate">Complete analysis ({withDiscrepancies} records)</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filter Description */}
          <div className="text-sm text-gray-600">
            {currentFilter === 'all' && (
              <p>Showing all matched transactions including both perfect matches and those with discrepancies.</p>
            )}
            {currentFilter === 'perfect' && (
              <p>Showing only transactions that match perfectly across all fields (amount, status, currency, timing).</p>
            )}
            {currentFilter === 'discrepancies' && (
              <p>Showing only transactions with discrepancies that require attention or investigation.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};