import React from 'react';
import { CheckCircle, AlertTriangle, X, Copy } from 'lucide-react';

interface CircleChartProps {
  totalTransactions: number;
  matched: number;
  mismatched: number;
  duplicates: number;
  internalOnly: number;
  providerOnly: number;
}

export const CircleChart: React.FC<CircleChartProps> = ({
  totalTransactions,
  matched,
  mismatched,
  duplicates,
  internalOnly,
  providerOnly
}) => {
  // Calculate percentages based on total unique transactions (not combined total)
  const totalUniqueTransactions = matched + mismatched + internalOnly + providerOnly;
  const totalMatchedTransactions = matched + mismatched; // All matched (perfect + with issues)
  
  const matchedPercentage = totalUniqueTransactions > 0 ? (matched / totalUniqueTransactions) * 100 : 0;
  const mismatchedPercentage = totalUniqueTransactions > 0 ? (mismatched / totalUniqueTransactions) * 100 : 0;
  const duplicatesPercentage = totalUniqueTransactions > 0 ? (duplicates / totalUniqueTransactions) * 100 : 0;
  const internalOnlyPercentage = totalUniqueTransactions > 0 ? (internalOnly / totalUniqueTransactions) * 100 : 0;
  const providerOnlyPercentage = totalUniqueTransactions > 0 ? (providerOnly / totalUniqueTransactions) * 100 : 0;

  // Calculate overall match rate (all matched transactions vs total unique)
  const overallMatchRate = totalUniqueTransactions > 0 ? (totalMatchedTransactions / totalUniqueTransactions) * 100 : 0;

  // Calculate cumulative percentages for stroke positioning
  const matchedOffset = 0;
  const mismatchedOffset = matchedPercentage;
  const duplicatesOffset = matchedPercentage + mismatchedPercentage;
  const internalOnlyOffset = matchedPercentage + mismatchedPercentage + duplicatesPercentage;
  const providerOnlyOffset = matchedPercentage + mismatchedPercentage + duplicatesPercentage + internalOnlyPercentage;

  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  const createStrokeDasharray = (percentage: number) => {
    const strokeLength = (percentage / 100) * circumference;
    return `${strokeLength} ${circumference}`;
  };

  const createStrokeDashoffset = (offsetPercentage: number) => {
    return -((offsetPercentage / 100) * circumference);
  };

  const formatPercentage = (value: number) => value.toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 md:mb-6 text-center">
        Transaction Analysis Overview
      </h3>
      
      {/* Mobile-first responsive layout */}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Circle Chart */}
        <div className="flex-shrink-0">
          <div className="relative">
            {/* Background circle */}
            <svg width="200" height="200" className="transform -rotate-90">
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="12"
              />
              
              {/* Perfect matches */}
              {matchedPercentage > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={createStrokeDasharray(matchedPercentage)}
                  strokeDashoffset={createStrokeDashoffset(matchedOffset)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              )}
              
              {/* Matched with issues */}
              {mismatchedPercentage > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeDasharray={createStrokeDasharray(mismatchedPercentage)}
                  strokeDashoffset={createStrokeDashoffset(mismatchedOffset)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ animationDelay: '0.2s' }}
                />
              )}
              
              {/* Duplicate transactions */}
              {duplicatesPercentage > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="12"
                  strokeDasharray={createStrokeDasharray(duplicatesPercentage)}
                  strokeDashoffset={createStrokeDashoffset(duplicatesOffset)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ animationDelay: '0.4s' }}
                />
              )}
              
              {/* Internal only transactions */}
              {internalOnlyPercentage > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeDasharray={createStrokeDasharray(internalOnlyPercentage)}
                  strokeDashoffset={createStrokeDashoffset(internalOnlyOffset)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ animationDelay: '0.6s' }}
                />
              )}
              
              {/* Provider only transactions */}
              {providerOnlyPercentage > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="12"
                  strokeDasharray={createStrokeDasharray(providerOnlyPercentage)}
                  strokeDashoffset={createStrokeDashoffset(providerOnlyOffset)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ animationDelay: '0.8s' }}
                />
              )}
            </svg>
            
            {/* Center text - Now shows overall match rate */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-800">{formatPercentage(overallMatchRate)}%</div>
              <div className="text-sm text-gray-600 text-center">Overall<br/>Match Rate</div>
            </div>
          </div>
        </div>

        {/* Legend - Responsive grid */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Perfect Matches</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-800">{matched.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-800">Matched w/ Issues</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-yellow-800">{mismatched.toLocaleString()}</div>
              </div>
            </div>

            {duplicates > 0 && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center">
                  <Copy className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-800">Duplicates</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-purple-800">{duplicates.toLocaleString()}</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center">
                <X className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-800">Internal Only</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-red-800">{internalOnly.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center">
                <X className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-800">Provider Only</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-red-800">{providerOnly.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Summary explanation */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600">
              <div className="flex justify-between items-center mb-1">
                <span><strong>Total Matched:</strong> {totalMatchedTransactions.toLocaleString()}</span>
                <span><strong>Total Unique:</strong> {totalUniqueTransactions.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary - Only show duplicates warning if present */}
      {duplicates > 0 && (
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 text-center">
            <strong>⚠️ {duplicates} duplicate(s) detected</strong> - Review recommended
          </div>
        </div>
      )}
    </div>
  );
};