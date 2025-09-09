import React, { useState } from 'react';
import { Scale, Upload, FileText, AlertTriangle, CheckCircle, X, Copy, ArrowLeft } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { SummaryStatistics } from './components/SummaryStatistics';
import { TransactionTable } from './components/TransactionTable';
import { DuplicateTransactionTable } from './components/DuplicateTransactionTable';
import { FullScreenTransactionView } from './components/FullScreenTransactionView';
import { ExportSection } from './components/ExportSection';
import { CircleChart } from './components/CircleChart';

import { FileUploadState, ReconciliationResult, TransactionTableType, Transaction, MatchedTransaction } from './types/transaction';
import { reconcileTransactions } from './utils/reconciliation';
import { detectDuplicates } from './utils/duplicateDetection';



interface AuthContextType {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface ReconciliationFeatureProps {
  // Authentication context (passed from dashboard shell)
  authContext?: AuthContextType;
  // Optional back navigation
  onNavigateBack?: () => void;
}

export function ReconciliationFeature(props: ReconciliationFeatureProps) {
  const { authContext, onNavigateBack } = props;
  const [internalUpload, setInternalUpload] = useState<FileUploadState>({
    file: null,
    data: null,
    loading: false,
    error: null
  });

  const [providerUpload, setProviderUpload] = useState<FileUploadState>({
    file: null,
    data: null,
    loading: false,
    error: null
  });

  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  
  // Full screen view state
  const [fullScreenView, setFullScreenView] = useState<{
    isOpen: boolean;
    type: TransactionTableType | null;
    title: string;
    data: Transaction[] | MatchedTransaction[];
    icon: React.ReactNode;
  }>({
    isOpen: false,
    type: null,
    title: '',
    data: [],
    icon: null
  });

  const canProcess = internalUpload.data && providerUpload.data && !isProcessing;

  const handleReconcile = async () => {
    if (!internalUpload.data || !providerUpload.data) return;

    setIsProcessing(true);
    
    // Simulate processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      console.log('Starting reconciliation with:', {
        internal: internalUpload.data.length,
        provider: providerUpload.data.length
      });
      
      const result = reconcileTransactions(internalUpload.data, providerUpload.data);
      setReconciliationResult(result);
      
      console.log('Reconciliation completed:', result);
    } catch (error) {
      console.error('Reconciliation error:', error);
      // Handle error appropriately
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    setInternalUpload({ file: null, data: null, loading: false, error: null });
    setProviderUpload({ file: null, data: null, loading: false, error: null });
    setReconciliationResult(null);
    setFullScreenView({ isOpen: false, type: null, title: '', data: [], icon: null });
  };

  const openFullScreen = (type: TransactionTableType, title: string, data: Transaction[] | MatchedTransaction[], icon: React.ReactNode) => {
    console.log('Opening full screen for:', { type, title, dataLength: data.length });
    setFullScreenView({
      isOpen: true,
      type,
      title,
      data,
      icon
    });
  };

  const closeFullScreen = () => {
    setFullScreenView({
      isOpen: false,
      type: null,
      title: '',
      data: [],
      icon: null
    });
  };

  // Calculate duplicate analysis for chart
  const duplicateAnalysis = reconciliationResult ? {
    internal: detectDuplicates(reconciliationResult.internalOnly),
    provider: detectDuplicates(reconciliationResult.providerOnly),
    matched: detectDuplicates(reconciliationResult.matched.map(m => m.internal))
  } : null;

  const totalDuplicatesForChart = duplicateAnalysis ? 
    duplicateAnalysis.internal.totalDuplicates + 
    duplicateAnalysis.provider.totalDuplicates + 
    duplicateAnalysis.matched.totalDuplicates : 0;



  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Minimal Header with Back Button */}
      {onNavigateBack && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={onNavigateBack}
              className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors duration-200"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Feature Header - Removed full-page layout elements */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white py-6 px-6">
        <div className="max-w-7xl mx-auto">
                      <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 mr-3" />
              <h2 className="text-2xl font-bold">Transaction Reconciliation Tool</h2>
            </div>
          <p className="text-emerald-100 text-base max-w-3xl">
            Upload your internal system export and provider statement to automatically identify matches, 
            discrepancies, duplicates, and missing transactions with detailed analysis and reporting.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* File Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FileUpload
            title="Internal System Export"
            subtitle="Upload your internal transaction export (CSV, Excel, or LibreOffice format)"
            uploadState={internalUpload}
            onFileUpload={setInternalUpload}
          />
          <FileUpload
            title="Provider Statement"
            subtitle="Upload your provider transaction statement (CSV, Excel, or LibreOffice format)"
            uploadState={providerUpload}
            onFileUpload={setProviderUpload}
          />
        </div>

        {/* Processing Section - Properly Fitted and Responsive */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing Controls</h3>
              <p className="text-gray-600">
                {canProcess ? 
                  'Ready to reconcile transactions. Click analyze to begin.' :
                  'Upload both files to enable transaction reconciliation.'
                }
              </p>
            </div>
            
            {/* Button Container - Properly Responsive */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {reconciliationResult && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 order-2 sm:order-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </button>
              )}
              <button
                onClick={handleReconcile}
                disabled={!canProcess}
                className="flex items-center justify-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 order-1 sm:order-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Analyze Transactions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {reconciliationResult && (
          <>
            {/* Summary Statistics */}
            <SummaryStatistics result={reconciliationResult} />

            {/* Transaction Analysis Overview - Horizontal Layout */}
            <div className="mb-8">
              <CircleChart
                totalTransactions={reconciliationResult.summary.totalInternal + reconciliationResult.summary.totalProvider}
                matched={reconciliationResult.matched.filter(m => m.matchType === 'perfect').length}
                mismatched={reconciliationResult.matched.filter(m => m.matchType !== 'perfect').length}
                duplicates={totalDuplicatesForChart}
                internalOnly={reconciliationResult.internalOnly.length}
                providerOnly={reconciliationResult.providerOnly.length}
              />
            </div>

            {/* Transaction Tables - Below Analysis Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              <TransactionTable
                title="Matched Transactions"
                data={reconciliationResult.matched}
                type="matched"
                icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                bgColor="bg-green-50"
                borderColor="border-green-200"
                onFullScreen={() => openFullScreen(
                  'matched',
                  'Matched Transactions',
                  reconciliationResult.matched,
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              />
              <TransactionTable
                title="Internal Only"
                data={reconciliationResult.internalOnly}
                type="internal-only"
                icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />}
                bgColor="bg-yellow-50"
                borderColor="border-yellow-200"
                onFullScreen={() => openFullScreen(
                  'internal-only',
                  'Internal Only',
                  reconciliationResult.internalOnly,
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
              />
              <TransactionTable
                title="Provider Only"
                data={reconciliationResult.providerOnly}
                type="provider-only"
                icon={<X className="h-5 w-5 text-red-600" />}
                bgColor="bg-red-50"
                borderColor="border-red-200"
                onFullScreen={() => openFullScreen(
                  'provider-only',
                  'Provider Only',
                  reconciliationResult.providerOnly,
                  <X className="h-5 w-5 text-red-600" />
                )}
              />
            </div>

            {/* Duplicate Transactions Section */}
            {reconciliationResult.duplicates.totalCount > 0 && (
              <div className="mb-8">
                <DuplicateTransactionTable
                  duplicateGroups={duplicateAnalysis ? [
                    ...duplicateAnalysis.internal.duplicateGroups,
                    ...duplicateAnalysis.provider.duplicateGroups,
                    ...duplicateAnalysis.matched.duplicateGroups
                  ] : []}
                  duplicateTransactions={[
                    ...reconciliationResult.duplicates.internal,
                    ...reconciliationResult.duplicates.provider
                  ]}
                  onFullScreen={() => openFullScreen(
                    'duplicates',
                    'Duplicate Transactions',
                    [...reconciliationResult.duplicates.internal, ...reconciliationResult.duplicates.provider],
                    <Copy className="h-5 w-5 text-purple-600" />
                  )}
                />
              </div>
            )}

            {/* Export Section */}
            <ExportSection result={reconciliationResult} />
          </>
        )}

        {/* Instructions */}
        {!reconciliationResult && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-teal-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-teal-600" />
              How to Use This Tool
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Supported File Formats</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                    <span><strong>CSV Files:</strong> Comma-separated values</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                    <span><strong>Excel Files:</strong> .xlsx and .xls formats</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                    <span><strong>LibreOffice:</strong> .ods spreadsheets</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h5 className="font-medium text-gray-800 mb-2">Required Columns</h5>
                  <p className="text-xs text-gray-600">
                    transaction_reference, amount, currency, status, timestamp, description
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">What This Tool Does</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Matches transactions by reference ID</li>
                  <li>• Identifies amount and status discrepancies</li>
                  <li>• Detects duplicate transactions</li>
                  <li>• Highlights timing differences</li>
                  <li>• Exports detailed reconciliation reports</li>
                  <li>• Supports multiple file formats</li>
                  <li>• Provides actionable insights for resolution</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Screen Transaction View */}
      {fullScreenView.isOpen && fullScreenView.type && (
        <FullScreenTransactionView
          isOpen={fullScreenView.isOpen}
          onClose={closeFullScreen}
          title={fullScreenView.title}
          data={fullScreenView.data}
          type={fullScreenView.type}
          icon={fullScreenView.icon}
          reconciliationResult={reconciliationResult || undefined}
        />
      )}


    </div>
  );
}