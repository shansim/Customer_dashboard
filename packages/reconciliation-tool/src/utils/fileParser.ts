import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Transaction } from '../types/transaction';

export const parseFile = (file: File): Promise<Transaction[]> => {
  const fileExtension = file.name.toLowerCase().split('.').pop();
  
  switch (fileExtension) {
    case 'csv':
      return parseCSV(file);
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    case 'ods':
      return parseLibreOffice(file);
    default:
      return Promise.reject(new Error('Unsupported file format. Please upload CSV, Excel (.xlsx, .xls), or LibreOffice (.ods) files.'));
  }
};

const parseCSV = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy', // Skip completely empty lines
      dynamicTyping: false, // Keep all values as strings initially
      transformHeader: (header: string) => {
        // Normalize header names to match expected format
        return header.trim().toLowerCase().replace(/\s+/g, '_');
      },
      complete: (results) => {
        console.log('CSV Parse Results:', {
          data: results.data,
          errors: results.errors,
          meta: results.meta
        });

        if (results.errors.length > 0) {
          console.error('CSV parsing errors:', results.errors);
          // Only reject if there are critical errors, not warnings
          const criticalErrors = results.errors.filter(error => error.type === 'Delimiter');
          if (criticalErrors.length > 0) {
            reject(new Error(`CSV parsing error: ${criticalErrors[0].message}`));
            return;
          }
        }

        try {
          const data = results.data as any[];
          console.log('Raw CSV data sample:', data.slice(0, 5));
          
          const validatedData = validateAndCleanData(data);
          console.log('Validated CSV data sample:', validatedData.slice(0, 5));
          
          resolve(validatedData);
        } catch (error) {
          console.error('Error processing CSV data:', error);
          reject(error);
        }
      },
      error: (error) => {
        console.error('Papa Parse error:', error);
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
};

const parseExcel = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('Excel file contains no worksheets'));
          return;
        }
        
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false
        }) as string[][];
        
        if (jsonData.length < 2) {
          reject(new Error('Excel file must contain at least a header row and one data row'));
          return;
        }
        
        // Convert to objects using first row as headers
        const headers = jsonData[0].map(header => 
          String(header).trim().toLowerCase().replace(/\s+/g, '_')
        );
        const transactions: Transaction[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const transaction: any = {};
          
          headers.forEach((header, index) => {
            let value = row[index] || '';
            
            // Handle numeric fields
            if (header === 'amount' || header === 'fees') {
              if (typeof value === 'number') {
                transaction[header] = value;
              } else {
                const cleanValue = String(value).trim();
                if (!cleanValue) {
                  transaction[header] = 0;
                } else {
                  const numericValue = cleanValue.replace(/[^\d.-]/g, '');
                  const parsedValue = parseFloat(numericValue);
                  transaction[header] = isNaN(parsedValue) ? 0 : parsedValue;
                }
              }
            } else {
              transaction[header] = String(value).trim();
            }
          });
          
          transactions.push(transaction as Transaction);
        }
        
        const validatedData = validateAndCleanData(transactions);
        resolve(validatedData);
        
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

const parseLibreOffice = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('LibreOffice file contains no worksheets'));
          return;
        }
        
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false
        }) as string[][];
        
        if (jsonData.length < 2) {
          reject(new Error('LibreOffice file must contain at least a header row and one data row'));
          return;
        }
        
        // Convert to objects using first row as headers
        const headers = jsonData[0].map(header => 
          String(header).trim().toLowerCase().replace(/\s+/g, '_')
        );
        const transactions: Transaction[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const transaction: any = {};
          
          headers.forEach((header, index) => {
            let value = row[index] || '';
            
            // Handle numeric fields
            if (header === 'amount' || header === 'fees') {
              if (typeof value === 'number') {
                transaction[header] = value;
              } else {
                const cleanValue = String(value).trim();
                if (!cleanValue) {
                  transaction[header] = 0;
                } else {
                  const numericValue = cleanValue.replace(/[^\d.-]/g, '');
                  const parsedValue = parseFloat(numericValue);
                  transaction[header] = isNaN(parsedValue) ? 0 : parsedValue;
                }
              }
            } else {
              transaction[header] = String(value).trim();
            }
          });
          
          transactions.push(transaction as Transaction);
        }
        
        const validatedData = validateAndCleanData(transactions);
        resolve(validatedData);
        
      } catch (error) {
        reject(new Error(`Failed to parse LibreOffice file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read LibreOffice file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

const validateAndCleanData = (data: any[]): Transaction[] => {
  console.log('Starting validation with data:', data.slice(0, 5));

  if (!data || data.length === 0) {
    throw new Error('File contains no data');
  }

  // Check if data is an array of objects
  if (!Array.isArray(data)) {
    throw new Error('Invalid data format');
  }

  // Filter out completely empty rows (rows where all values are empty)
  const nonEmptyData = data.filter(row => {
    if (!row || typeof row !== 'object') return false;
    
    // Check if the row has at least some meaningful data
    const values = Object.values(row);
    const hasData = values.some(value => {
      if (value === null || value === undefined) return false;
      const stringValue = String(value).trim();
      return stringValue !== '' && stringValue !== 'undefined' && stringValue !== 'null';
    });
    
    return hasData;
  });

  console.log(`Filtered from ${data.length} to ${nonEmptyData.length} non-empty rows`);

  if (nonEmptyData.length === 0) {
    throw new Error('File contains no valid data rows');
  }

  // Get all available field names from the first few rows
  const allFields = new Set<string>();
  nonEmptyData.slice(0, 10).forEach(row => {
    Object.keys(row).forEach(key => allFields.add(key.toLowerCase().trim()));
  });

  console.log('Available fields in data:', Array.from(allFields));

  // Clean and validate data - be more permissive with required fields
  const validData = nonEmptyData.map((row, index) => {
    try {
      // Create a normalized transaction object
      const transaction: any = {};
      
      // Map fields with flexible field name matching
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().trim();
        const value = row[key];
        
        // Skip completely empty values
        if (value === null || value === undefined || String(value).trim() === '') {
          return;
        }
        
        // Map to standard field names
        if (normalizedKey.includes('transaction_reference') || 
            normalizedKey === 'transaction_reference' ||
            normalizedKey.includes('reference') || 
            normalizedKey === 'reference' ||
            normalizedKey === 'ref' || 
            normalizedKey === 'id' || 
            normalizedKey.includes('transaction_id') ||
            normalizedKey === 'txn_ref') {
          transaction.transaction_reference = String(value).trim();
        } else if (normalizedKey === 'internal_amount' || normalizedKey === 'amount') {
          const cleanValue = String(value).replace(/[^\d.-]/g, '');
          const numValue = parseFloat(cleanValue);
          transaction.amount = isNaN(numValue) ? 0 : numValue;
        } else if (normalizedKey === 'provider_amount' && !transaction.amount) {
          // If we don't have internal_amount, use provider_amount as amount
          const cleanValue = String(value).replace(/[^\d.-]/g, '');
          const numValue = parseFloat(cleanValue);
          transaction.amount = isNaN(numValue) ? 0 : numValue;
        } else if (normalizedKey === 'internal_currency' || normalizedKey === 'currency') {
          transaction.currency = String(value).trim().toUpperCase();
        } else if (normalizedKey === 'provider_currency' && !transaction.currency) {
          transaction.currency = String(value).trim().toUpperCase();
        } else if (normalizedKey === 'internal_status' || normalizedKey === 'status') {
          transaction.status = String(value).trim();
        } else if (normalizedKey === 'provider_status' && !transaction.status) {
          transaction.status = String(value).trim();
        } else if (normalizedKey === 'internal_timestamp' || 
                   normalizedKey === 'timestamp' || 
                   normalizedKey.includes('date') || 
                   normalizedKey.includes('time')) {
          transaction.timestamp = String(value).trim();
        } else if (normalizedKey === 'provider_timestamp' && !transaction.timestamp) {
          transaction.timestamp = String(value).trim();
        } else if (normalizedKey === 'internal_description' || normalizedKey === 'description') {
          transaction.description = String(value).trim();
        } else if (normalizedKey === 'provider_description' && !transaction.description) {
          transaction.description = String(value).trim();
        } else if (normalizedKey === 'internal_customer_id' || 
                   (normalizedKey.includes('customer') && normalizedKey.includes('id'))) {
          transaction.customer_id = String(value).trim();
        } else if (normalizedKey === 'provider_id' || 
                   (normalizedKey.includes('provider') && normalizedKey.includes('id'))) {
          transaction.provider_id = String(value).trim();
        } else if (normalizedKey === 'internal_fees' || normalizedKey === 'fees' || normalizedKey === 'fee') {
          const cleanValue = String(value).replace(/[^\d.-]/g, '');
          const numValue = parseFloat(cleanValue);
          transaction.fees = isNaN(numValue) ? 0 : numValue;
        } else if (normalizedKey === 'provider_fees' && transaction.fees === undefined) {
          const cleanValue = String(value).replace(/[^\d.-]/g, '');
          const numValue = parseFloat(cleanValue);
          transaction.fees = isNaN(numValue) ? 0 : numValue;
        } else {
          // Keep other fields as-is for debugging
          transaction[normalizedKey] = value;
        }
      });

      // Only include transactions that have a valid transaction reference
      if (!transaction.transaction_reference || transaction.transaction_reference.trim() === '') {
        console.log(`Skipping row ${index + 1}: No transaction reference`);
        return null;
      }

      // Set reasonable defaults for missing required fields
      if (transaction.amount === undefined || isNaN(transaction.amount)) {
        transaction.amount = 0;
      }
      if (!transaction.currency) {
        transaction.currency = 'UNKNOWN';
      }
      if (!transaction.status) {
        transaction.status = 'unknown';
      }
      if (!transaction.timestamp) {
        transaction.timestamp = new Date().toISOString();
      }
      if (!transaction.description) {
        transaction.description = '';
      }

      console.log(`Processed row ${index + 1}:`, transaction);
      return transaction as Transaction;
    } catch (error) {
      console.warn(`Error processing row ${index + 1}:`, error, row);
      return null;
    }
  }).filter((transaction): transaction is Transaction => {
    if (!transaction) return false;
    
    // Final validation - ensure critical fields are present and valid
    const isValid = Boolean(transaction.transaction_reference && 
                   transaction.transaction_reference.trim() !== '' &&
                   transaction.amount !== undefined && 
                   !isNaN(transaction.amount) &&
                   transaction.currency && 
                   transaction.currency.trim() !== '' &&
                   transaction.status && 
                   transaction.status.trim() !== '');
    
    if (!isValid) {
      console.log('Invalid transaction filtered out:', transaction);
    }
    
    return isValid;
  });

  console.log('Final validated data:', {
    originalCount: data.length,
    nonEmptyCount: nonEmptyData.length,
    validCount: validData.length,
    sample: validData.slice(0, 3)
  });

  if (validData.length === 0) {
    throw new Error('No valid transactions found in file. Please check that your file contains rows with valid transaction_reference, amount, currency, status, and timestamp values.');
  }

  return validData;
};

export const validateFile = (file: File): string | null => {
  const allowedExtensions = ['csv', 'xlsx', 'xls', 'ods'];
  const fileExtension = file.name.toLowerCase().split('.').pop();
  
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return 'Please upload a CSV, Excel (.xlsx, .xls), or LibreOffice (.ods) file';
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return 'File size must be less than 10MB';
  }
  
  return null;
};

export const getFileTypeDescription = (filename: string): string => {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'csv':
      return 'CSV File';
    case 'xlsx':
      return 'Excel Workbook';
    case 'xls':
      return 'Excel 97-2003 Workbook';
    case 'ods':
      return 'LibreOffice Calc Spreadsheet';
    default:
      return 'Unknown File Type';
  }
};