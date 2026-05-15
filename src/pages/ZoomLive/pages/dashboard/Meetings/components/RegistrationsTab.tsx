import { motion } from "framer-motion";
import { Alert, AlertDescription } from '@zoom/components/ui/alert';
import { Button } from '@zoom/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@zoom/components/ui/select';
import RegistrantsTable from './RegistrantsTable';
import { getQueryErrorMessage } from '@zoom/lib/apiErrors';
import { Users, Filter } from 'lucide-react';
import { cn } from "@zoom/lib/utils";

interface PaginationData {
  page: number;
  pageSize: number;
  totalRecords: number;
  pageCount: number;
}

interface RegistrationsTabProps {
  registrants: any[];
  totalRegistrations: number;
  isRegLoading: boolean;
  regError: any;
  pagination?: PaginationData;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function RegistrationsTab({
  registrants,
  totalRegistrations,
  isRegLoading,
  regError,
  pagination,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: RegistrationsTabProps) {
  const totalPages = pagination?.pageCount ?? 1;
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Registrants List</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1.5">Approved participants</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100/50 dark:bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Total:</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{pagination?.totalRecords ?? totalRegistrations}</span>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
            >
              <SelectTrigger className="w-[85px] h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700">
                <SelectItem value="10" className="text-xs font-bold py-2">10 Items</SelectItem>
                <SelectItem value="30" className="text-xs font-bold py-2">30 Items</SelectItem>
                <SelectItem value="60" className="text-xs font-bold py-2">60 Items</SelectItem>
                <SelectItem value="100" className="text-xs font-bold py-2">100 Items</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50 rounded-[28px] overflow-hidden shadow-sm">
        {isRegLoading ? (
          <div className="p-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-100 dark:bg-slate-900/50 rounded-xl w-full" />
              <div className="h-64 bg-slate-50 dark:bg-slate-900/30 rounded-2xl w-full" />
            </div>
          </div>
        ) : regError ? (
          <div className="p-8">
            <Alert className="bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 rounded-2xl">
              <AlertDescription className="text-rose-600 dark:text-rose-400 font-bold text-sm">
                {getQueryErrorMessage(regError, 'Failed to load registrants.')}
              </AlertDescription>
            </Alert>
          </div>
        ) : registrants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-3xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100 dark:border-slate-800">
              <Users className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">No registrants found</h4>
            <p className="text-slate-500 text-sm max-w-xs mt-1">
              Once participants register for your meeting, they will appear in this list.
            </p>
          </div>
        ) : (
          <>
            <RegistrantsTable rows={registrants} />
            
            {totalPages > 1 && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4 bg-slate-50/20 dark:bg-slate-900/10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPrevPage}
                  onClick={() => onPageChange(page - 1)}
                  className="rounded-xl font-bold text-xs h-9 px-4 border-slate-200 dark:border-slate-700"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    {page}
                  </span>
                  <span className="text-xs font-bold text-slate-400">of {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNextPage}
                  onClick={() => onPageChange(page + 1)}
                  className="rounded-xl font-bold text-xs h-9 px-4 border-slate-200 dark:border-slate-700"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
