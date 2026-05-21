import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  X,
  FileSpreadsheet,
  Search,
  Table as TableIcon,
  Globe,
  Tag,
  Mail,
  User,
  Phone,
  Settings2,
  AlertCircle
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { toastUtils } from '@/lib/utils';
import type { CreateContactPayload } from '@/schemas/contactSchema';

// Define the stages for the modal workflow
const MODAL_STAGES = {
  UPLOAD_FILE: 'uploadFile',
  PREVIEW_DATA: 'previewData',
  MAP_FIELDS: 'mapFields',
} as const;

// Define the fields that can be mapped
const FIELDS_TO_MAP = [
  {
    name: 'firstName',
    label: 'First Name',
    keywords: ['firstname', 'first name', 'name'],
    required: false,
    icon: <User className="h-3 w-3" />
  },
  {
    name: 'lastName',
    label: 'Last Name',
    keywords: ['lastname', 'last name', 'surname'],
    required: false,
    icon: <User className="h-3 w-3 opacity-50" />
  },
  {
    name: 'phone',
    label: 'Phone Number',
    keywords: ['phone', 'phone number', 'phonenumber', 'mobile'],
    required: true,
    icon: <Phone className="h-3 w-3" />
  },
  {
    name: 'email',
    label: 'Email',
    keywords: ['email', 'email address'],
    required: false,
    icon: <Mail className="h-3 w-3" />
  },
  {
    name: 'tags',
    label: 'Tags',
    keywords: ['tags', 'tag'],
    required: false,
    icon: <Tag className="h-3 w-3" />
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

const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return "";
  let phoneStr = String(phoneNumber).trim();
  if (phoneStr.includes("E") || phoneStr.includes("e")) {
    try {
      const num = Number(phoneStr);
      if (!isNaN(num)) phoneStr = num.toFixed(0);
    } catch (error) {
      return "";
    }
  }
  const cleanedPhoneNumber = phoneStr.replace(/[^0-9]/g, "");
  if (cleanedPhoneNumber.length === 12) return cleanedPhoneNumber.slice(2);
  if (cleanedPhoneNumber.length === 11 && cleanedPhoneNumber.startsWith("0")) return cleanedPhoneNumber.slice(1);
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
  const [stage, setStage] = useState<typeof MODAL_STAGES[keyof typeof MODAL_STAGES]>(MODAL_STAGES.UPLOAD_FILE);
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

  const getBestHeaderMatch = (keywords: string[], headers: string[]): string | null => {
    for (const keyword of keywords) {
      const match = headers.find(header => header.toLowerCase().includes(keyword.toLowerCase()));
      if (match) return match;
    }
    return null;
  };

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
    setSourceType(fileExtension === 'csv' ? 'csv' : 'xlsx');
    setIsParsingFile(true);

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const jsonData = results.data as string[][];
            if (!jsonData || jsonData.length === 0) {
              toastUtils.error('The file is empty');
              setIsParsingFile(false);
              return;
            }
            setRawSheetData(jsonData);
            const actualRows = Math.min(jsonData.length, MAX_PREVIEW_ROWS);
            const actualColumns = Math.min(Math.max(...jsonData.map(row => Array.isArray(row) ? row.length : 0)), MAX_PREVIEW_COLS);
            const preview = jsonData.slice(0, actualRows).map(row => (Array.isArray(row) ? row : []).slice(0, actualColumns).map(c => c === null || c === undefined ? '' : String(c)));
            setActualRows(actualRows);
            setActualColumns(actualColumns);
            setPreviewDisplayData(preview);
            setHeaderRowNumber('1');
            setStage(MODAL_STAGES.PREVIEW_DATA);
          } catch (error) {
            toastUtils.error('Error processing CSV');
          } finally {
            setIsParsingFile(false);
          }
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: null, raw: true }) as any[][];
          if (!jsonData || jsonData.length === 0) {
            toastUtils.error('The file is empty');
            setIsParsingFile(false);
            return;
          }
          setRawSheetData(jsonData);
          const actualRows = Math.min(jsonData.length, MAX_PREVIEW_ROWS);
          const actualColumns = Math.min(Math.max(...jsonData.map(row => Array.isArray(row) ? row.length : 0)), MAX_PREVIEW_COLS);
          const preview = jsonData.slice(0, actualRows).map(row => (Array.isArray(row) ? row : []).slice(0, actualColumns).map(c => c === null || c === undefined ? '' : String(c)));
          setActualRows(actualRows);
          setActualColumns(actualColumns);
          setPreviewDisplayData(preview);
          setHeaderRowNumber('1');
          setStage(MODAL_STAGES.PREVIEW_DATA);
        } catch (error) {
          toastUtils.error('Error processing XLSX');
        } finally {
          setIsParsingFile(false);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handlePreviewAndProceedToMap = () => {
    const rowNum = parseInt(headerRowNumber, 10);
    if (isNaN(rowNum) || rowNum < 1 || rowNum > rawSheetData.length) {
      toastUtils.error('Invalid header row');
      return;
    }
    const adjustedHeaderRowIndex = rowNum - 1;
    const actualHeaderRowArray = rawSheetData[adjustedHeaderRowIndex];
    const uniqueHeaders = actualHeaderRowArray ? Array.from(new Set(actualHeaderRowArray.filter(h => h !== null && h !== undefined && String(h).trim() !== '').map(h => String(h).trim()))) : [];
    if (uniqueHeaders.length === 0) {
      toastUtils.error('No valid headers found');
      return;
    }
    const formattedDataObjects = rawSheetData.slice(adjustedHeaderRowIndex + 1).map(dataRowArray => {
      const obj: Record<string, any> = {};
      actualHeaderRowArray.forEach((h, i) => { if (h) obj[String(h).trim()] = dataRowArray[i]; });
      return obj;
    });
    setParsedHeaders(uniqueHeaders);
    setParsedData(formattedDataObjects);
    const autoMapping: Record<string, string> = {};
    FIELDS_TO_MAP.forEach(f => {
      const match = getBestHeaderMatch(f.keywords, uniqueHeaders);
      if (match) autoMapping[f.name] = match;
    });
    setFieldMapping(autoMapping);
    setStage(MODAL_STAGES.MAP_FIELDS);
  };

  const handleImportInternal = async () => {
    const missingFields = FIELDS_TO_MAP.filter(f => f.required && (!fieldMapping[f.name] || fieldMapping[f.name] === ''));
    if (missingFields.length > 0) {
      toastUtils.error(`Map required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }
    const contacts: CreateContactPayload[] = [];
    let invalidCount = 0;
    const invalidRecordsSample: any[] = [];
    parsedData.forEach((row, index) => {
      const rawPhone = fieldMapping.phone ? String(row[fieldMapping.phone] || '').trim() : '';
      const formattedPhone = formatPhoneNumber(rawPhone);
      if (/^\d{10}$/.test(formattedPhone)) {
        contacts.push({
          projectId,
          phone: formattedPhone,
          firstName: fieldMapping.firstName ? String(row[fieldMapping.firstName] || '').trim() : undefined,
          lastName: fieldMapping.lastName ? String(row[fieldMapping.lastName] || '').trim() : undefined,
          email: fieldMapping.email ? String(row[fieldMapping.email] || '').trim() : undefined,
          tags: fieldMapping.tags && row[fieldMapping.tags] ? String(row[fieldMapping.tags]).split('|').map(normalizeTag).filter(Boolean) : [],
        });
      } else {
        invalidCount++;
        if (invalidRecordsSample.length < 100) invalidRecordsSample.push({ rowNumber: index + 1, phoneRaw: rawPhone, reason: 'Invalid Phone', sourceRow: row });
      }
    });
    if (contacts.length === 0) {
      toastUtils.error('No valid contacts');
      return;
    }
    try {
      await onImport({ contacts, defaultCountryCode: defaultCountryCode === 'no-country' ? undefined : defaultCountryCode, replaceTags, sourceType, fileName, totalRows: parsedData.length, clientInvalidRows: invalidCount, clientInvalidRecordsSample: invalidRecordsSample });
      handleCloseModal();
    } catch (error) {
      toastUtils.error('Import failed');
    }
  };

  const handleCloseModal = () => {
    setStage(MODAL_STAGES.UPLOAD_FILE);
    onOpenChange(false);
  };

  const labelStyles = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5";
  const overallLoading = isLoading || isParsingFile;

  return (
    <Dialog open={true} onOpenChange={handleCloseModal}>
      <DialogContent
        className="w-[95vw] !max-w-[95vw] sm:!max-w-[900px] border-0 bg-transparent p-0 shadow-none outline-none"
        onPointerDownOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <div className="relative w-full rounded-2xl shadow-2xl flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[95vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
            <div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                <Upload className="h-3 w-3" />
                Ingestion Engine
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Import Audience
              </DialogTitle>
              <DialogDescription className="sr-only">
                Multi-step workflow for uploading and mapping contact datasets.
              </DialogDescription>
              <div className="flex items-center gap-4 mt-1">
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${stage === 'uploadFile' ? 'text-green-600 dark:text-green-400' : 'text-slate-300'}`}>
                  <span className={`h-4 w-4 rounded-full flex items-center justify-center border ${stage === 'uploadFile' ? 'border-green-600 bg-green-50 dark:bg-green-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>1</span>
                  Upload
                </div>
                <div className="w-4 h-px bg-slate-100 dark:bg-slate-900/60" />
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${stage === 'previewData' ? 'text-green-600 dark:text-green-400' : 'text-slate-300'}`}>
                  <span className={`h-4 w-4 rounded-full flex items-center justify-center border ${stage === 'previewData' ? 'border-green-600 bg-green-50 dark:bg-green-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>2</span>
                  Headers
                </div>
                <div className="w-4 h-px bg-slate-100 dark:bg-slate-900/60" />
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${stage === 'mapFields' ? 'text-green-600 dark:text-green-400' : 'text-slate-300'}`}>
                  <span className={`h-4 w-4 rounded-full flex items-center justify-center border ${stage === 'mapFields' ? 'border-green-600 bg-green-50 dark:bg-green-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>3</span>
                  Mapping
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseModal}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-400 transition-colors border border-transparent hover:border-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="p-6">
              {stage === MODAL_STAGES.UPLOAD_FILE && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-green-400 rounded-2xl p-8 text-center transition-all cursor-pointer bg-slate-50/30 dark:bg-slate-900/40 hover:bg-green-50/10"
                  >
                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="hidden" />
                    {isParsingFile ? (
                      <div className="flex flex-col items-center py-4">
                        <Loader2 className="h-12 w-12 animate-spin text-green-600 dark:text-green-400 mb-4 opacity-40" />
                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Parsing File...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="h-20 w-20 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <FileSpreadsheet className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Drop your dataset here</h4>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                          Choose a <span className="text-green-600 dark:text-green-400 font-bold">CSV</span> or <span className="text-green-600 dark:text-green-400 font-bold">Excel</span> file to begin the audience ingestion.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-[10px] uppercase tracking-widest mb-4">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        Requirements
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Phone Column</span>
                          <span className="text-slate-900 dark:text-white font-bold uppercase tracking-tighter bg-white dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700/50">Mandatory</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">File Formats</span>
                          <span className="text-slate-900 dark:text-white font-bold uppercase tracking-tighter bg-white dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700/50">.csv / .xlsx</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Batch Limit</span>
                          <span className="text-slate-900 dark:text-white font-bold uppercase tracking-tighter bg-white dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700/50">Unlimited</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-[10px] uppercase tracking-widest mb-4">
                        <Settings2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        Optional Columns
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['First Name', 'Last Name', 'Email', 'Tags'].map(tag => (
                          <span key={tag} className="px-3 py-1 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 shadow-sm">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stage === MODAL_STAGES.PREVIEW_DATA && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Define Header Row</h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Select the row containing column labels for mapping.</p>
                    </div>
                    <div className="flex items-center gap-3 p-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="pl-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Row Number</span>
                      <Input
                        type="number"
                        min={1}
                        value={headerRowNumber}
                        onChange={(e) => setHeaderRowNumber(e.target.value)}
                        className="w-20 h-9 rounded-lg border-slate-200 dark:border-slate-700/50 focus:ring-green-500/20 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50/50">
                            <TableHead className="w-24 px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Pick</TableHead>
                            {Array.from({ length: actualColumns }).map((_, i) => (
                              <TableHead key={i} className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Col {i + 1}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewDisplayData.map((row, rowIndex) => (
                            <TableRow
                              key={rowIndex}
                              onClick={() => setHeaderRowNumber(String(rowIndex + 1))}
                              className={`group cursor-pointer transition-colors ${parseInt(headerRowNumber, 10) === rowIndex + 1 ? 'bg-green-600' : 'hover:bg-slate-50/50'
                                }`}
                            >
                              <TableCell className="px-6 py-4">
                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${parseInt(headerRowNumber, 10) === rowIndex + 1 ? 'border-white bg-white' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                                   }`}>
                                  {parseInt(headerRowNumber, 10) === rowIndex + 1 && <div className="h-1.5 w-1.5 rounded-full bg-green-600" />}
                                </div>
                              </TableCell>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex} className="px-4 py-4">
                                  <span className={`text-xs font-medium truncate max-w-[120px] block ${cell ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 italic'}`}>
                                    {cell || 'empty'}
                                  </span>
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {stage === MODAL_STAGES.MAP_FIELDS && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-4 p-6 rounded-2xl bg-green-50/30 dark:bg-green-500/10 border border-green-100/50 dark:border-green-500/20">
                    <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm border border-green-50 dark:border-green-500/20">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{fileName}</h4>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-0.5">{parsedData.length} Records Detected • Ready to map</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {FIELDS_TO_MAP.map((field) => (
                      <div key={field.name} className="group relative flex flex-col md:flex-row md:items-center gap-6 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/20 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-800 transition-all">
                        <div className="w-full md:w-56">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-2">
                            {field.icon}
                            {field.label}
                            {field.required && <span className="text-rose-500 font-black">•</span>}
                          </Label>
                          <div className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">Target CRM Field</div>
                        </div>

                        <div className="flex-1">
                          <Select
                            value={fieldMapping[field.name] || undefined}
                            onValueChange={(val) => setFieldMapping(prev => ({ ...prev, [field.name]: val === 'unmapped' ? '' : val }))}
                          >
                            <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-700/50 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-xs">
                              <SelectValue placeholder={field.required ? "Select mandatory column..." : "Optional: Skip field"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-700/50 shadow-2xl p-2 max-h-64">
                              <SelectItem value="unmapped" className="text-xs font-bold text-slate-400">Skip Field</SelectItem>
                              {parsedHeaders.map(h => (
                                <SelectItem key={h} value={h} className="rounded-xl m-1">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-bold">{h}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Sample: {String(parsedData[0]?.[h] || 'Empty').slice(0, 30)}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-12 flex justify-center">
                          {fieldMapping[field.name] ? (
                            <div className="h-8 w-8 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          ) : field.required ? (
                            <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                              <AlertCircle className="h-4 w-4" />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl bg-blue-50/30 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/20">
                    <Label className={labelStyles}>
                      <Globe className="h-3 w-3" />
                      Normalization Context
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Default Country Code</p>
                        <Select value={defaultCountryCode} onValueChange={setDefaultCountryCode}>
                          <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl shadow-xl max-h-64">
                            {COUNTRY_CODES.map(c => (
                              <SelectItem key={c.code} value={c.code} className="m-1 rounded-lg">
                                {c.flag} {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 h-11">
                          <Checkbox id="replaceTags" checked={replaceTags} onCheckedChange={(v) => setReplaceTags(!!v)} />
                          <Label htmlFor="replaceTags" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Wipe existing tags</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="py-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between sticky bottom-0 z-20">
            {stage !== MODAL_STAGES.UPLOAD_FILE ? (
              <Button
                variant="outline"
                onClick={() => setStage(stage === MODAL_STAGES.MAP_FIELDS ? MODAL_STAGES.PREVIEW_DATA : MODAL_STAGES.UPLOAD_FILE)}
                className="h-12 px-6 rounded-xl font-bold text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : <div />}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="h-12 px-6 rounded-xl font-bold text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all"
              >
                Cancel
              </Button>
              {stage === MODAL_STAGES.UPLOAD_FILE ? (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 px-8 rounded-xl font-bold bg-[#22B573] hover:bg-[#1da467] text-white shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Select Dataset
                </Button>
              ) : stage === MODAL_STAGES.PREVIEW_DATA ? (
                <Button
                  onClick={handlePreviewAndProceedToMap}
                  className="h-12 px-8 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 transition-all flex items-center gap-2"
                >
                  Confirm Headers
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleImportInternal}
                  disabled={overallLoading}
                  className="h-12 px-8 rounded-xl font-bold bg-[#22B573] hover:bg-[#1da467] text-white shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                >
                  {overallLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Execute Import
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
