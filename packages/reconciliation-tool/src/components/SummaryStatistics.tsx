import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { ReconciliationResult } from '../types/transaction';

interface SummaryStatisticsProps {
  result: ReconciliationResult;
}

export const SummaryStatistics: React.FC<SummaryStatisticsProps> = ({ result }) => {
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculate the actual match rate based on unique transactions
  const totalUniqueTransactions = result.matched.length + result.internalOnly.length + result.providerOnly.length;
  const totalMatchedTransactions = result.matched.length; // All matched transactions (perfect + with issues)
  const actualMatchRate = totalUniqueTransactions > 0 ? (totalMatchedTransactions / totalUniqueTransactions) * 100 : 0;

  const getMatchRateColor = (rate: number): string => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchRateBgColor = (rate: number): string => {
    if (rate >= 95) return 'bg-green-600';
    if (rate >= 85) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
        Reconciliation Summary
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Internal Transactions */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Internal Transactions</p>
              <p className="text-2xl font-bold text-blue-900">{result.summary.totalInternal.toLocaleString()}</p>
              <p className="text-sm text-blue-700">Total: {formatAmount(result.summary.totalInternalAmount)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Total Provider Transactions */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Provider Transactions</p>
              <p className="text-2xl font-bold text-purple-900">{result.summary.totalProvider.toLocaleString()}</p>
              <p className="text-sm text-purple-700">Total: {formatAmount(result.summary.totalProviderAmount)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        {/* Match Rate - Now consistent with circle chart */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-green-800">Overall Match Rate</p>
              <p className={`text-2xl font-bold ${getMatchRateColor(actualMatchRate)}`}>
                {actualMatchRate.toFixed(1)}%
              </p>
              <p className="text-xs text-green-700">
                {totalMatchedTransactions} of {totalUniqueTransactions} unique transactions
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getMatchRateBgColor(actualMatchRate)}`}
              style={{ width: `${actualMatchRate}%` }}
            ></div>
          </div>
        </div>

        {/* Total Discrepancies */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Total Discrepancies</p>
              <p className="text-2xl font-bold text-red-900">{result.summary.totalDiscrepancies.toLocaleString()}</p>
              <p className="text-sm text-red-700">
                {result.summary.totalDiscrepancies === 0 ? 'Perfect match!' : 'Requires attention'}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-lg font-bold text-green-800">{result.matched.length}</p>
          <p className="text-sm text-green-600">Total Matched</p>
          <p className="text-xs text-green-500">Perfect + With Issues</p>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-lg font-bold text-yellow-800">{result.internalOnly.length}</p>
          <p className="text-sm text-yellow-600">Internal Only</p>
          <p className="text-xs text-yellow-500">Missing from Provider</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-lg font-bold text-red-800">{result.providerOnly.length}</p>
          <p className="text-sm text-red-600">Provider Only</p>
          <p className="text-xs text-red-500">Missing from Internal</p>
        </div>
      </div>
    </div>
  );
};