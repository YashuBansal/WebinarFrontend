import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Users, LayoutList, ChevronDown, RefreshCw, Trash2, MessageSquare, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Contact, PaginatedContactsResponse } from '@/schemas/contactSchema';
import ContactRow from './ContactRow';

interface ContactsTableProps {
  data?: PaginatedContactsResponse;
  isLoading: boolean;
  onPageChange?: (page: number) => void;
  pageLimit?: number;
  onPageLimitChange?: (limit: number) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  selectedContacts?: string[];
  onSelectContact?: (contactId: string) => void;
  onSelectAll?: () => void;
  onBulkDelete?: () => void;
  onBulkSend?: () => void;
  onBulkTags?: () => void;
  isBulkDeleting?: boolean;
}

export default function ContactsTable({ 
  data, 
  isLoading, 
  onPageChange, 
  pageLimit = 25,
  onPageLimitChange,
  onEdit, 
  onDelete,
  selectedContacts = [],
  onSelectContact,
  onSelectAll,
  onBulkDelete,
  onBulkSend,
  onBulkTags,
  isBulkDeleting
}: ContactsTableProps) {
  const contacts = data?.contacts || [];
  const pagination = data?.pagination;
  const selectedSet = useMemo(() => new Set(selectedContacts), [selectedContacts]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <RefreshCw className="h-10 w-10 animate-spin mb-4 opacity-20" />
        <p className="font-bold text-xs uppercase tracking-widest">Fetching Audience...</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mb-6">
          <Users className="h-8 w-8 opacity-20" />
        </div>
        <p className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white mb-1">No Contacts Found</p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Create your first contact or import from CSV to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* List Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-400">
              <LayoutList className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.15em]">Contacts List</h3>
              {pagination && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {pagination.totalCount} Total
                </p>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedContacts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2 pl-6 border-l border-slate-100 dark:border-slate-700/50"
              >
                <div className="flex items-center gap-1.5 p-1 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBulkDelete}
                    disabled={isBulkDeleting}
                    className="h-8 px-3 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-black text-[10px] uppercase tracking-wider flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete ({selectedContacts.length})
                  </Button>

                  <div className="w-px h-3 bg-slate-200 dark:bg-slate-700/50 mx-0.5" />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBulkSend}
                    className="h-8 px-3 rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 font-black text-[10px] uppercase tracking-wider flex items-center gap-2"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Send Message
                  </Button>

                  <div className="w-px h-3 bg-slate-200 dark:bg-slate-700/50 mx-0.5" />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBulkTags}
                    className="h-8 px-3 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60 font-black text-[10px] uppercase tracking-wider flex items-center gap-2"
                  >
                    <Tags className="w-3 h-3" />
                    Manage Tags
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {onPageLimitChange && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rows per page</span>
            <Select
              value={String(pageLimit)}
              onValueChange={(v) => onPageLimitChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-green-500/10 transition-all cursor-pointer">
                <SelectValue placeholder={pageLimit} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 dark:border-slate-700/50 shadow-xl min-w-[70px]">
                {[5, 10, 25, 50, 100, 250, 500, 1000].map(limit => (
                  <SelectItem 
                    key={limit} 
                    value={String(limit)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 focus:bg-slate-50 rounded-lg my-0.5"
                  >
                    {limit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800/50">
        <div ref={scrollRef} className="flex-1 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-900">
              <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-700/50">
                {onSelectAll && (
                  <TableHead className="w-12 px-6">
                    <Checkbox
                      checked={contacts.length > 0 && selectedContacts.length === contacts.length}
                      onCheckedChange={onSelectAll}
                      className="rounded-md border-slate-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                  </TableHead>
                )}
                <TableHead className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Identity</TableHead>
                <TableHead className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Last Name</TableHead>
                <TableHead className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Contact Info</TableHead>
                <TableHead className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Phone</TableHead>
                <TableHead className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Tags</TableHead>
                <TableHead className="px-4 py-4 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paddingTop > 0 && (
                <TableRow>
                  <TableCell colSpan={onSelectAll ? 7 : 6} style={{ height: `${paddingTop}px` }} className="p-0" />
                </TableRow>
              )}

              {virtualItems.map((virtualRow) => {
                const contact = contacts[virtualRow.index];
                if (!contact) return null;
                return (
                  <ContactRow
                    key={contact._id}
                    contact={contact}
                    isSelected={selectedSet.has(contact._id)}
                    onSelectContact={onSelectContact}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                );
              })}

              {paddingBottom > 0 && (
                <TableRow>
                  <TableCell colSpan={onSelectAll ? 7 : 6} style={{ height: `${paddingBottom}px` }} className="p-0" />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {pagination && pagination.totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-900/40">
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Page {pagination.page} of {pagination.totalPages}
              </p>
            </div>
            
            <Pagination className="w-auto mx-0">
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => pagination.hasPrevPage && onPageChange(pagination.page - 1)}
                    className={`h-9 w-9 p-0 rounded-xl border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 transition-all [&_span]:hidden ${!pagination.hasPrevPage ? 'opacity-50 pointer-events-none' : 'hover:bg-white dark:hover:bg-slate-900/50 hover:shadow-sm cursor-pointer'}`}
                  />
                </PaginationItem>
                
                {/* Simplified pagination for premium look */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const startPage = Math.max(1, pagination.page - 2);
                  const pageNum = startPage + i;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => onPageChange(pageNum)}
                        isActive={pageNum === pagination.page}
                        className={`h-9 w-9 rounded-xl border-none font-bold text-xs transition-all cursor-pointer ${pageNum === pagination.page ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => pagination.hasNextPage && onPageChange(pagination.page + 1)}
                    className={`h-9 w-9 p-0 rounded-xl border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 transition-all [&_span]:hidden ${!pagination.hasNextPage ? 'opacity-50 pointer-events-none' : 'hover:bg-white dark:hover:bg-slate-900/50 hover:shadow-sm cursor-pointer'}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
