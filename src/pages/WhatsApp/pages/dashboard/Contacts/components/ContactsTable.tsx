import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Users } from 'lucide-react';
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
  onSelectAll
}: ContactsTableProps) {
  const contacts = data?.contacts || [];
  const pagination = data?.pagination;
  const selectedSet = useMemo(() => new Set(selectedContacts), [selectedContacts]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,
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
      <Card>
        <CardHeader>
          <CardTitle>Contacts List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading contacts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contacts List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No contacts found</p>
            <p className="text-sm text-muted-foreground">Create your first contact or import from CSV</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>
            Contacts List 
            {pagination && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({pagination.totalCount} total)
              </span>
            )}
            {selectedContacts.length > 0 && (
              <span className="text-sm font-normal text-primary ml-2">
                ({selectedContacts.length} selected)
              </span>
            )}
          </CardTitle>
          {onPageLimitChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="pageLimit" className="text-sm font-medium text-gray-700">
                Show:
              </label>
              <select
                id="pageLimit"
                value={pageLimit}
                onChange={(e) => onPageLimitChange(Number(e.target.value))}
                className="h-9 px-3 py-1 border border-gray-300 rounded-md bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
              <span className="text-sm text-gray-500">per page</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div ref={scrollRef} className="rounded-md border flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {onSelectAll && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={contacts.length > 0 && selectedContacts.length === contacts.length}
                      onCheckedChange={onSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Tags</TableHead>
                {/* <TableHead>Status</TableHead> */}
                <TableHead>Actions</TableHead>
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
          <div className="flex justify-center pt-4 flex-shrink-0">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => pagination.hasPrevPage && onPageChange(pagination.page - 1)}
                    className={!pagination.hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {/* Show first page */}
                {pagination.page > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => onPageChange(1)}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {pagination.page > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}
                
                {/* Show pages around current page */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const startPage = Math.max(1, pagination.page - 2);
                  const pageNum = startPage + i;
                  
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => onPageChange(pageNum)}
                        isActive={pageNum === pagination.page}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {/* Show last page */}
                {pagination.page < pagination.totalPages - 2 && (
                  <>
                    {pagination.page < pagination.totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => onPageChange(pagination.totalPages)}
                        className="cursor-pointer"
                      >
                        {pagination.totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => pagination.hasNextPage && onPageChange(pagination.page + 1)}
                    className={!pagination.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
