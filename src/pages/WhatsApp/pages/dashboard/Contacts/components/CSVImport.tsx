import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, ArrowLeft, ArrowRight, Loader2, Info, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { toastUtils } from '@/lib/utils';
import type { CreateContactPayload } from '@/schemas/contactSchema';

// Define the stages for the modal workflow
const MODAL_STAGES = {
  UPLOAD_FILE: 'uploadFile',
  PREVIEW_DATA: 'previewData',
  MAP_FIELDS: 'mapFields',
};

// Define the fields that can be mapped
const FIELDS_TO_MAP = [
  {
    name: 'firstName',
    label: 'First Name',
    keywords: ['firstname', 'first name', 'name'],
    required: false,
  },
  {
    name: 'lastName',
    label: 'Last Name',
    keywords: ['lastname', 'last name', 'surname'],
    required: false,
  },
  {
    name: 'phone',
    label: 'Phone Number',
    keywords: ['phone', 'phone number', 'phonenumber', 'mobile'],
    required: true,
  },
  {
    name: 'email',
    label: 'Email',
    keywords: ['email', 'email address'],
    required: false,
  },
  {
    name: 'tags',
    label: 'Tags',
    keywords: ['tags', 'tag'],
    required: false,
  },
];

const MAX_PREVIEW_ROWS = 20;
const MAX_PREVIEW_COLS = 8;

// Country codes for phone number normalization
const COUNTRY_CODES = [
  { code: 'IN', name: 'India (+91)', flag: '🇮🇳' },
  { code: 'US', name: 'United States (+1)', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom (+44)', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada (+1)', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia (+61)', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany (+49)', flag: '🇩🇪' },
  { code: 'FR', name: 'France (+33)', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil (+55)', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico (+52)', flag: '🇲🇽' },
  { code: 'JP', name: 'Japan (+81)', flag: '🇯🇵' },
  { code: 'CN', name: 'China (+86)', flag: '🇨🇳' },
  { code: 'RU', name: 'Russia (+7)', flag: '🇷🇺' },
];

// Phone number formatting utility function
const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return "";
  
  // Convert to string first to handle all input types
  let phoneStr = String(phoneNumber).trim();
  
  // Handle scientific notation (e.g., "1.234E+10", "1.234e+10")
  if (phoneStr.includes("E") || phoneStr.includes("e")) {
    try {
      // Convert scientific notation to number, then to fixed decimal string
      const num = Number(phoneStr);
      if (!isNaN(num)) {
        // Use toFixed(0) to remove decimal places, then convert back to string
        phoneStr = num.toFixed(0);
      }
    } catch (error) {
      console.warn('Error converting scientific notation:', error);
      return "";
    }
  }
  
  // Remove all non-numeric characters
  const cleanedPhoneNumber = phoneStr.replace(/[^0-9]/g, "");
  
  // Handle different phone number formats
  if (cleanedPhoneNumber.length === 12) {
    // Remove country code if it's 12 digits (e.g., "911234567890" -> "1234567890")
    return cleanedPhoneNumber.slice(2);
  }
  
  if (cleanedPhoneNumber.length === 11 && cleanedPhoneNumber.startsWith("0")) {
    // Remove leading zero if it's 11 digits starting with 0
    return cleanedPhoneNumber.slice(1);
  }
  
  return cleanedPhoneNumber;
};

const normalizeTag = (tag: string): string => {
  return String(tag).trim().toLowerCase().replace(/\s+/g, '_');
};

interface CSVImportProps {
  onOpenChange: (open: boolean) => void;
  onImport: (importData: any) => Promise<void>;
  isLoading?: boolean;
  projectId: string;
}

export default function CSVImport({ 
  onOpenChange,
  onImport,
  isLoading = false,
  projectId 
}: CSVImportProps) {
  // Component state
  const [stage, setStage] = useState(MODAL_STAGES.UPLOAD_FILE);
  const [headerRowNumber, setHeaderRowNumber] = useState('1');
  const [rawSheetData, setRawSheetData] = useState<any[][]>([]);
  const [previewDisplayData, setPreviewDisplayData] = useState<string[][]>([]);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [defaultCountryCode, setDefaultCountryCode] = useState<string>(COUNTRY_CODES[0].code);
  const [replaceTags, setReplaceTags] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [sourceType, setSourceType] = useState<'csv' | 'xlsx' | 'unknown'>('unknown');
  const [actualColumns, setActualColumns] = useState<number>(MAX_PREVIEW_COLS);
  const [actualRows, setActualRows] = useState<number>(MAX_PREVIEW_ROWS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Utility function to get best header match
  const getBestHeaderMatch = (keywords: string[], headers: string[]): string | null => {
    for (const keyword of keywords) {
      const match = headers.find(header => 
        header.toLowerCase().includes(keyword.toLowerCase())
      );
      if (match) return match;
    }
    return null;
  };

  // Stage 1: File Upload Handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'csv' && fileExtension !== 'xlsx') {
      toastUtils.error('Please upload a CSV or XLSX file');
      event.target.value = '';
      return;
    }

    setFileName(file.name);
    setSourceType(fileExtension === 'csv' ? 'csv' : fileExtension === 'xlsx' ? 'xlsx' : 'unknown');
    setIsParsingFile(true);

    if (fileExtension === 'csv') {
      // Handle CSV files with PapaParse
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const jsonData = results.data as string[][];
            
            if (!jsonData || jsonData.length === 0) {
              toastUtils.error('The uploaded file is empty or could not be read');
              setRawSheetData([]);
              setPreviewDisplayData([]);
              setIsParsingFile(false);
              return;
            }

            setRawSheetData(jsonData);

            // Calculate the actual number of rows and columns to display
            const actualRows = Math.min(jsonData.length, MAX_PREVIEW_ROWS);
            const actualColumns = Math.min(
              Math.max(...jsonData.map(row => Array.isArray(row) ? row.length : 0)),
              MAX_PREVIEW_COLS
            );
            
            // Create preview data
            const preview = jsonData.slice(0, actualRows).map(row => {
              const newRow: string[] = [];
              const currentRow = Array.isArray(row) ? row : [];
              for (let i = 0; i < Math.min(currentRow.length, actualColumns); i++) {
                newRow.push(currentRow[i] === null || currentRow[i] === undefined ? '' : String(currentRow[i]));
              }
              return newRow;
            });
            
            setActualRows(actualRows);
            setActualColumns(actualColumns);
            setPreviewDisplayData(preview);
            setHeaderRowNumber('1');
            setStage(MODAL_STAGES.PREVIEW_DATA);
            toastUtils.success('File parsed successfully. Please select the header row.');
          } catch (error) {
            console.error('Error processing CSV data:', error);
            toastUtils.error('Error processing file data');
            setRawSheetData([]);
            setPreviewDisplayData([]);
          } finally {
            setIsParsingFile(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        },
        error: (error) => {
          console.error('PapaParse error:', error);
          toastUtils.error('Error parsing CSV file');
          setRawSheetData([]);
          setPreviewDisplayData([]);
          setIsParsingFile(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
      });
    } else if (fileExtension === 'xlsx') {
      // Handle XLSX files with proper XLSX library
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert worksheet to JSON array
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, // Use first row as headers
            defval: null, // Default value for empty cells (preserves data types)
            raw: true // Keep original data types for better precision
          }) as any[][];
          
          if (!jsonData || jsonData.length === 0) {
            toastUtils.error('The uploaded XLSX file is empty or could not be read');
            setRawSheetData([]);
            setPreviewDisplayData([]);
            setIsParsingFile(false);
            return;
          }

          setRawSheetData(jsonData);

          // Calculate the actual number of rows and columns to display
          const actualRows = Math.min(jsonData.length, MAX_PREVIEW_ROWS);
          const actualColumns = Math.min(
            Math.max(...jsonData.map(row => Array.isArray(row) ? row.length : 0)),
            MAX_PREVIEW_COLS
          );
          
          // Create preview data
          const preview = jsonData.slice(0, actualRows).map(row => {
            const newRow: string[] = [];
            const currentRow = Array.isArray(row) ? row : [];
            for (let i = 0; i < Math.min(currentRow.length, actualColumns); i++) {
              // Handle different data types properly
              const cellValue = currentRow[i];
              if (cellValue === null || cellValue === undefined) {
                newRow.push('');
              } else if (typeof cellValue === 'number') {
                // For numbers, convert to string but preserve precision
                newRow.push(String(cellValue));
              } else {
                newRow.push(String(cellValue));
              }
            }
            return newRow;
          });
          
          setActualRows(actualRows);
          setActualColumns(actualColumns);
          setPreviewDisplayData(preview);
          setHeaderRowNumber('1');
          setStage(MODAL_STAGES.PREVIEW_DATA);
          toastUtils.success('XLSX file parsed successfully. Please select the header row.');
        } catch (error) {
          console.error('Error processing XLSX data:', error);
          toastUtils.error('Error processing XLSX file. Please ensure it contains valid tabular data.');
          setRawSheetData([]);
          setPreviewDisplayData([]);
        } finally {
          setIsParsingFile(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      
      reader.onerror = () => {
        toastUtils.error('Error reading XLSX file');
        setIsParsingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      
      reader.readAsBinaryString(file);
    }
  };

  // Stage 2: Preview Data and Header Row Confirmation
  const handlePreviewAndProceedToMap = () => {
    const rowNum = parseInt(headerRowNumber, 10);
    if (isNaN(rowNum) || rowNum < 1) {
      toastUtils.error('Header row number must be a positive integer');
      return;
    }
    if (rowNum > rawSheetData.length) {
      toastUtils.error(`Header row ${rowNum} is out of bounds. File has ${rawSheetData.length} rows.`);
      return;
    }

    const adjustedHeaderRowIndex = rowNum - 1;
    const actualHeaderRowArray = rawSheetData[adjustedHeaderRowIndex];

    const uniqueHeaders: string[] = [];
    const seenHeaders = new Set<string>();
    if (actualHeaderRowArray) {
      actualHeaderRowArray.forEach(h => {
        if (h !== null && h !== undefined) {
          const headerStr = String(h).trim();
          if (headerStr !== '' && !seenHeaders.has(headerStr)) {
            uniqueHeaders.push(headerStr);
            seenHeaders.add(headerStr);
          }
        }
      });
    }

    if (uniqueHeaders.length === 0) {
      toastUtils.error(`No valid headers found in selected row ${rowNum}`);
      return;
    }

    const dataRowsAfterHeader = rawSheetData.slice(adjustedHeaderRowIndex + 1);
    const formattedDataObjects = dataRowsAfterHeader.map(dataRowArray => {
      const obj: Record<string, any> = {};
      actualHeaderRowArray.forEach((headerValue, cellIndex) => {
        if (headerValue !== null && headerValue !== undefined) {
          const headerString = String(headerValue).trim();
          if (headerString !== '') {
            obj[headerString] = dataRowArray[cellIndex];
          }
        }
      });
      return obj;
    });

    setParsedHeaders(uniqueHeaders);
    setParsedData(formattedDataObjects);

    // Auto-fill mapping
    const autoMapping: Record<string, string> = {};
    FIELDS_TO_MAP.forEach(field => {
      const match = getBestHeaderMatch(field.keywords, uniqueHeaders);
      if (match) {
        autoMapping[field.name] = match;
      }
    });
    setFieldMapping(autoMapping);

    if (formattedDataObjects.length === 0) {
      toastUtils.warning('Header row confirmed, but no data rows found after it');
    } else {
      toastUtils.success('Header row confirmed. Map fields below.');
    }

    setStage(MODAL_STAGES.MAP_FIELDS);
  };

  // Stage 3: Enhanced Import Data
  const handleImport = async () => {
    // Validate required mappings
    const requiredFields = FIELDS_TO_MAP.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !fieldMapping[field.name] || fieldMapping[field.name] === '');
    
    if (missingFields.length > 0) {
      toastUtils.error(`Please map the following required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    const contacts: CreateContactPayload[] = [];
    let validCount = 0;
    let invalidCount = 0;
    const invalidRecordsSample: Array<{
      rowNumber: number;
      phoneRaw?: string;
      reason: string;
      sourceRow?: Record<string, unknown>;
    }> = [];

    parsedData.forEach((row, index) => {
      const rowNumber = index + 1;
      const firstName = fieldMapping.firstName && fieldMapping.firstName !== '' ? String(row[fieldMapping.firstName] || '').trim() : '';
      // Handle phone number with proper type conversion
      let rawPhone = '';
      if (fieldMapping.phone && fieldMapping.phone !== '') {
        const phoneValue = row[fieldMapping.phone];
        if (phoneValue !== null && phoneValue !== undefined) {
          rawPhone = String(phoneValue).trim();
        }
      }
      const email = fieldMapping.email && fieldMapping.email !== '' ? String(row[fieldMapping.email] || '').trim() : '';

      const formattedPhone = formatPhoneNumber(rawPhone);
      const isValidPhone = /^\d{10}$/.test(formattedPhone);

      if (isValidPhone) {
        const contact: CreateContactPayload = {
          projectId,
          phone: formattedPhone,
          firstName: firstName || undefined,
          lastName: fieldMapping.lastName && fieldMapping.lastName !== '' ? String(row[fieldMapping.lastName] || '').trim() : undefined,
          email: email || undefined,
          tags: fieldMapping.tags && fieldMapping.tags !== '' && row[fieldMapping.tags]
            ? String(row[fieldMapping.tags]).split('|').map(normalizeTag).filter(Boolean)
            : [],
        };
        contacts.push(contact);
        validCount++;
      } else {
        invalidCount++;
        if (invalidRecordsSample.length < 100) {
          invalidRecordsSample.push({
            rowNumber,
            phoneRaw: rawPhone || undefined,
            reason: 'Invalid or missing phone number',
            sourceRow: row,
          });
        }
      }
    });

    if (contacts.length === 0) {
      toastUtils.error('No valid contacts found. Please check your field mappings.');
      return;
    }

    try {
      // Use enhanced CSV import with options
      const importPayload = {
        contacts,
        defaultCountryCode: defaultCountryCode === 'no-country' ? undefined : defaultCountryCode,
        replaceTags: replaceTags,
        sourceType,
        fileName,
        totalRows: parsedData.length,
        clientInvalidRows: invalidCount,
        clientInvalidRecordsSample: invalidRecordsSample,
      };
      
      await onImport(importPayload);
      handleCloseModal();
    } catch (error) {
      console.error('Import error:', error);
      toastUtils.error('Failed to import contacts');
    }
  };

  const handleCloseModal = () => {
    setStage(MODAL_STAGES.UPLOAD_FILE);
    setRawSheetData([]);
    setPreviewDisplayData([]);
    setParsedHeaders([]);
    setParsedData([]);
    setHeaderRowNumber('1');
    setIsParsingFile(false);
    setFieldMapping({});
    setDefaultCountryCode('');
    setReplaceTags(false);
    setFileName('');
    setSourceType('unknown');
    setActualColumns(MAX_PREVIEW_COLS);
    setActualRows(MAX_PREVIEW_ROWS);
    onOpenChange(false);
  };

  const overallLoading = isLoading || isParsingFile;

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import CSV/XLSX
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-blue-500 !w-full !max-w-[60vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Import Contacts from CSV/XLSX</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">

        {/* Stage 1: Upload File */}
        {stage === MODAL_STAGES.UPLOAD_FILE && (
          <div className="space-y-6 py-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-muted-foreground/50 transition-colors">
              {isParsingFile ? (
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Parsing file...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-16 h-16 mx-auto text-muted-foreground/50" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      <span className="text-primary">Select a CSV or XLSX file</span> or drag and drop here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Choose a CSV or XLSX file to import your contacts
                    </p>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                    disabled={overallLoading}
                    className="max-w-xs mx-auto"
                  />
                </div>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">File Requirements:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Supported formats:</strong> CSV (.csv) and Excel (.xlsx)</p>
                <p><strong>Required columns:</strong> phone</p>
                <p><strong>Optional columns:</strong> firstName, email, lastName, tags (pipe-separated)</p>
              </div>
            </div>
          </div>
        )}

        {/* Stage 2: Preview Data & Select Header Row */}
        {stage === MODAL_STAGES.PREVIEW_DATA && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Select Header Row</h3>
                <p className="text-sm text-muted-foreground">
                  Preview of your CSV file (showing first {actualRows} rows, {actualColumns} columns)
                </p>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Select</TableHead>
                      {Array.from({ length: actualColumns }).map((_, i) => (
                        <TableHead key={i} className="min-w-[120px]">
                          Column {i + 1}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewDisplayData.map((row, rowIndex) => (
                      <TableRow
                        key={rowIndex}
                        onClick={() => setHeaderRowNumber(String(rowIndex + 1))}
                        className={`cursor-pointer transition-colors ${
                          parseInt(headerRowNumber, 10) === rowIndex + 1 
                            ? 'bg-primary/10 border-primary/20' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="headerRowSelect"
                              checked={parseInt(headerRowNumber, 10) === rowIndex + 1}
                              onChange={() => setHeaderRowNumber(String(rowIndex + 1))}
                              className="h-4 w-4 text-primary"
                            />
                            <span>Row {rowIndex + 1}</span>
                          </div>
                        </TableCell>
                        {row.slice(0, actualColumns).map((cell, cellIndex) => (
                          <TableCell key={cellIndex} className="max-w-[120px] truncate" title={cell}>
                            {cell || <span className="text-muted-foreground italic">empty</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <label className="font-medium text-sm">
                  Header Row Number:
                </label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={headerRowNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      const number = Number(value);
                      if (value === '' || (number >= 1 && number <= 20)) {
                        setHeaderRowNumber(value);
                      }
                    }
                  }}
                  className="w-24"
                  disabled={overallLoading}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStage(MODAL_STAGES.UPLOAD_FILE)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handlePreviewAndProceedToMap}
                  disabled={overallLoading || !headerRowNumber || parseInt(headerRowNumber, 10) < 1}
                >
                  Next: Map Fields
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stage 3: Enhanced Field Mapping */}
        {stage === MODAL_STAGES.MAP_FIELDS && (
          <div className="space-y-6 py-4">
            {/* File Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <CardTitle className="text-lg">File Uploaded Successfully</CardTitle>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setStage(MODAL_STAGES.UPLOAD_FILE)}>
                    Change File
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">File Name:</span>
                    <Badge variant="secondary">{fileName}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Contacts Detected:</span>
                    <Badge variant="outline">{parsedData.length} contacts</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Field Mapping Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Header Identifiers</h3>
                <p className="text-sm text-muted-foreground">
                  Map your CSV columns to contact fields. Required fields are marked with *
                </p>
              </div>
              
              <div className="space-y-4">
                {/* Field Mapping Table */}
                <div className="space-y-3">
                  {FIELDS_TO_MAP.map((field) => (
                    <div key={field.name} className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                      {/* Field Label */}
                      <div className="w-60 flex-shrink-0">
                        <Label className="text-sm font-medium flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-destructive">*</span>}
                        </Label>
                      </div>
                      
                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      
                      {/* CSV Header Selection */}
                      <div className="flex-1">
                        <Select
                          value={fieldMapping[field.name] || undefined}
                          onValueChange={(value) => {
                            setFieldMapping(prev => ({
                              ...prev,
                              [field.name]: value === 'unmapped' ? '' : value
                            }));
                          }}
                          disabled={overallLoading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={field.required ? `Select CSV column for ${field.label}` : 'Optional'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unmapped">{field.required ? `Select CSV column for ${field.label}` : 'Optional'}</SelectItem>
                            {parsedHeaders.map(header => (
                              <SelectItem key={header} value={header}>
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">{header}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Sample: {parsedData.length > 0 ? (
                                      (() => {
                                        const sampleRow = parsedData.find(row => 
                                          row[header] !== undefined && 
                                          row[header] !== null && 
                                          String(row[header]).trim() !== ''
                                        );
                                        return sampleRow ? String(sampleRow[header]).substring(0, 20) + (String(sampleRow[header]).length > 20 ? '...' : '') : 'Empty';
                                      })()
                                    ) : 'No data'}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Status Indicator */}
                      <div className="w-8 flex-shrink-0 flex justify-center">
                        {fieldMapping[field.name] ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : field.required ? (
                          <span className="text-destructive text-xs">*</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Available CSV Headers Summary */}
                <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Available CSV Headers:</h5>
                  <div className="flex flex-wrap gap-2">
                    {parsedHeaders.map((header, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {header}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Options Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Default Country Code */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Default Country Code
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Label>
                  <Select
                    value={defaultCountryCode}
                    onValueChange={setDefaultCountryCode}
                    disabled={overallLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country code for phone numbers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-country">No country code</SelectItem>
                      {COUNTRY_CODES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Phone numbers will be normalized based on the selected country code
                  </p>
                </div>

                {/* Replace Tags Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Replace Tags
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Label>
                    <Checkbox
                      checked={replaceTags}
                      onCheckedChange={(checked) => setReplaceTags(checked === true)}
                      disabled={overallLoading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {replaceTags 
                      ? 'Existing tags will be replaced with new tags from CSV'
                      : 'New tags will be appended to existing tags'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section - Commented out for now */}
            {/* 
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Important Notes:</p>
                  <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                    <li>• Enter the header name present in your file corresponding to designated field. If the field is not present in the file leave it empty.</li>
                    <li>• If a phone number already exists in contacts then it will be updated with new data.</li>
                    <li>• Tag names should be pipe separated (|) in the CSV file.</li>
                    <li>• Contacts from countries which are not listed in WhatsApp, will be ignored.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            */}

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {parsedData.length > 0 ? (
                  <span>Ready to import {parsedData.length} contacts</span>
                ) : (
                  <span className="text-destructive">No data rows found</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStage(MODAL_STAGES.PREVIEW_DATA)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={overallLoading || parsedData.length === 0}
                  className="bg-primary hover:bg-primary/90"
                >
                  {overallLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
