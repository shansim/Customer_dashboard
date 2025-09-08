import React from 'react';
import { Download } from 'lucide-react';
import { ReconciliationResult } from '../types/transaction';
import { 
  exportToCSV, 
  formatMatchedForExport, 
  formatTransactionsForExport, 
  formatAllDiscrepanciesForExport,
  generateExportFilename 
} from '../utils/csvExport';

interface ExportSectionProps {
  result: ReconciliationResult;
}

export const ExportSection: React.FC<ExportSectionProps> = ({ result }) => {
  const handleExportMatched = () => {
    const data = formatMatchedForExport(result.matched);
    const filename = generateExportFilename('matched');
    exportToCSV(data, filename);
  };

  const handleExportInternalOnly = () => {
    const data = formatTransactionsForExport(result.internalOnly, 'internal');
    const filename = generateExportFilename('internal_only');
    exportToCSV(data, filename);
  };

  const handleExportProviderOnly = () => {
    const data = formatTransactionsForExport(result.providerOnly, 'provider');
    const filename = generateExportFilename('provider_only');
    exportToCSV(data, filename);
  };

  const handleExportDiscrepancies = () => {
    // Filter matched transactions that have discrepancies
    const matchedWithIssues = result.matched.filter(m => m.matchType !== 'perfect');
    
    // Use the new comprehensive export function
    const discrepancies = formatAllDiscrepanciesForExport(
      matchedWithIssues,
      result.internalOnly,
      result.providerOnly
    );
    
    const filename = generateExportFilename('discrepancies');
    exportToCSV(discrepancies, filename);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Download className="h-5 w-5 mr-2 text-gray-600" />
        Export Results
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={handleExportMatched}
          disabled={result.matched.length === 0}
          className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <Download className="h-4 w-4 mr-2" />
          <div className="text-left">
            <div className="text-sm font-medium">Matched</div>
            <div className="text-xs opacity-90">{result.matched.length} records</div>
          </div>
        </button>

        <button
          onClick={handleExportInternalOnly}
          disabled={result.internalOnly.length === 0}
          className="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <Download className="h-4 w-4 mr-2" />
          <div className="text-left">
            <div className="text-sm font-medium">Internal Only</div>
            <div className="text-xs opacity-90">{result.internalOnly.length} records</div>
          </div>
        </button>

        <button
          onClick={handleExportProviderOnly}
          disabled={result.providerOnly.length === 0}
          className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <Download className="h-4 w-4 mr-2" />
          <div className="text-left">
            <div className="text-sm font-medium">Provider Only</div>
            <div className="text-xs opacity-90">{result.providerOnly.length} records</div>
          </div>
        </button>

        <button
          onClick={handleExportDiscrepancies}
          disabled={result.summary.totalDiscrepancies === 0}
          className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <Download className="h-4 w-4 mr-2" />
          <div className="text-left">
            <div className="text-sm font-medium">All Issues</div>
            <div className="text-xs opacity-90">{result.summary.totalDiscrepancies} records</div>
          </div>
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Export Format:</strong> CSV files will include all relevant columns with comparison details.
          Timestamps are in your local timezone. All Issues export combines matched discrepancies, internal-only, and provider-only transactions.
        </p>
      </div>
    </div>
  );
};