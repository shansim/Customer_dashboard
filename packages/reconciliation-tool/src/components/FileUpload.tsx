import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileCheck, AlertCircle, X, FileSpreadsheet } from 'lucide-react';
import { FileUploadState } from '../types/transaction';
import { parseFile, validateFile, getFileTypeDescription } from '../utils/fileParser';

interface FileUploadProps {
  title: string;
  subtitle: string;
  uploadState: FileUploadState;
  onFileUpload: (state: FileUploadState) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  title,
  subtitle,
  uploadState,
  onFileUpload
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onFileUpload({
        file: null,
        data: null,
        loading: false,
        error: validationError
      });
      return;
    }

    onFileUpload({
      file,
      data: null,
      loading: true,
      error: null
    });

    try {
      const data = await parseFile(file);
      onFileUpload({
        file,
        data,
        loading: false,
        error: null
      });
    } catch (error) {
      onFileUpload({
        file: null,
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to parse file'
      });
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const clearFile = useCallback((e: React.MouseEvent) => {
    // Prevent event bubbling and default behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Clear the file input value to prevent re-triggering
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Reset the upload state
    onFileUpload({
      file: null,
      data: null,
      loading: false,
      error: null
    });
  }, [onFileUpload]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-100 hover:border-teal-200 transition-colors duration-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-teal-400 bg-teal-50'
            : uploadState.error
            ? 'border-red-300 bg-red-50'
            : uploadState.data
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-teal-300 hover:bg-teal-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.ods"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadState.loading}
        />

        {uploadState.loading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-3"></div>
            <p className="text-teal-700 font-medium">Processing file...</p>
            <p className="text-sm text-teal-600 mt-1">Parsing spreadsheet data</p>
          </div>
        ) : uploadState.data ? (
          <div className="flex flex-col items-center">
            <FileCheck className="h-8 w-8 text-green-600 mb-3" />
            <p className="text-green-700 font-medium mb-2">File uploaded successfully</p>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-green-200 mb-3">
              <div className="flex items-center mb-1">
                <FileSpreadsheet className="h-4 w-4 text-gray-500 mr-2" />
                <p className="text-sm font-medium text-gray-800">{uploadState.file?.name}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{uploadState.file ? getFileTypeDescription(uploadState.file.name) : ''}</span>
                <span>{uploadState.file ? formatFileSize(uploadState.file.size) : ''}</span>
              </div>
              <p className="text-xs text-green-600 mt-1 font-medium">
                {uploadState.data.length} transactions loaded
              </p>
            </div>
            <button
              onClick={clearFile}
              className="inline-flex items-center px-3 py-1 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors duration-200 z-10 relative"
              type="button"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </button>
          </div>
        ) : uploadState.error ? (
          <div className="flex flex-col items-center">
            <AlertCircle className="h-8 w-8 text-red-600 mb-3" />
            <p className="text-red-700 font-medium mb-2">Upload Error</p>
            <p className="text-sm text-red-600 mb-3 text-center max-w-xs">{uploadState.error}</p>
            <button
              onClick={clearFile}
              className="inline-flex items-center px-3 py-1 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors duration-200 z-10 relative"
              type="button"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-8 w-8 text-gray-400 mb-3" />
            <p className="text-gray-700 font-medium mb-2">Drop your file here</p>
            <p className="text-sm text-gray-500 mb-3">or click to browse</p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Supported formats:</p>
              <p>CSV, Excel (.xlsx, .xls), LibreOffice (.ods)</p>
              <p>Max file size: 10MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};