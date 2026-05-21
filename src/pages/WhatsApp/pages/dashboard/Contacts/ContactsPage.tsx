import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  MessageSquare,
  Download,
  Tags,
  History,
  MoreHorizontal,
  Upload,
  Users,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  X,
  XCircle
} from 'lucide-react';
import { useContacts, useContactMutations, useContactStats } from '@/hooks/useContacts';
import { useProjectContext } from '@/context/ProjectContext';
import type { CreateContactPayload, Contact } from '@/schemas/contactSchema';
import { toastUtils } from '@/lib/utils';
import ConfirmDeleteModal from '../../../../../components/ConfirmDeleteModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import ContactsTable from './components/ContactsTable';
import {
  ContactForm,
  ContactSearch,
  ExportDialog,
  BulkManageTagsDialog,
  ImportHistoryDialog,
  ContactStats,
} from './components';
import React, { Suspense, lazy } from 'react';
import DialogFallback from '@/components/ui/dialog-fallback';
import type { ContactColumnFilters } from './components/ContactSearch';
import { Badge } from '@/components/ui/badge';

const LazyCSVImport = lazy<React.ComponentType<any>>(
  () => import('./components/CSVImport').then((m) => ({ default: m.default }))
);

export default function ContactsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedProject } = useProjectContext();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(() => {
    const storedLimit = window.localStorage.getItem('contacts-page-limit');
    const parsed = Number(storedLimit);
    const allowedLimits = [5, 10, 25, 50, 100, 250, 500, 1000];
    if (Number.isFinite(parsed) && allowedLimits.includes(parsed)) {
      return parsed;
    }
    return 25;
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportHistoryDialogOpen, setIsImportHistoryDialogOpen] = useState(false);
  const [deleteContactState, setDeleteContactState] = useState<{ isOpen: boolean, contact: Contact | null }>({ isOpen: false, contact: null });
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isManageTagsDialogOpen, setIsManageTagsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [bulkDeleteFailures, setBulkDeleteFailures] = useState<Array<{ contactId?: string; error?: string }>>([]);
  const [isBulkDeleteFailuresDialogOpen, setIsBulkDeleteFailuresDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ContactColumnFilters>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tags: [],
    tagFilterMode: 'has_any',
  });
  const [debouncedTextFilters, setDebouncedTextFilters] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedTextFilters({
        firstName: filters.firstName.trim(),
        lastName: filters.lastName.trim(),
        email: filters.email.trim(),
        phone: filters.phone.trim(),
      });
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [filters.firstName, filters.lastName, filters.email, filters.phone]);

  const { data: contactsData, isLoading, error } = useContacts({
    page: currentPage,
    limit: pageLimit,
    filters: {
      projectId: selectedProject?._id,
      firstName: debouncedTextFilters.firstName || undefined,
      lastName: debouncedTextFilters.lastName || undefined,
      email: debouncedTextFilters.email || undefined,
      phone: debouncedTextFilters.phone || undefined,
      tags: filters.tags.length ? filters.tags : undefined,
      tagFilterMode: filters.tags.length ? filters.tagFilterMode : undefined,
    },
  });
  const { data: statsData } = useContactStats();
  const { useCreateContact, useBulkCreateContacts, useUpdateContact, useDeleteContact, useBulkDeleteContacts, useBulkUpdateContactTags } = useContactMutations();
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();
  const bulkCreateMutation = useBulkCreateContacts();
  const bulkDeleteMutation = useBulkDeleteContacts();
  const bulkUpdateTagsMutation = useBulkUpdateContactTags();

  const handleCreateContact = async (data: CreateContactPayload) => {
    try {
      await createContactMutation.mutateAsync(data);
      toastUtils.success('Contact created successfully');
      setIsCreateDialogOpen(false);
    } catch (error) {
      throw error; // keep form open
    }
  };

  const handleUpdateContact = async (data: CreateContactPayload) => {
    if (!editingContact) return;

    try {
      await updateContactMutation.mutateAsync({
        contactId: editingContact._id,
        payload: data,
      });
      toastUtils.success('Contact updated successfully');
      setEditingContact(null);
    } catch (error) {
      console.error('Error updating contact:', error);
      toastUtils.error('Failed to update contact');
      throw error; // keep form open
    }
  };

  const requestDeleteContact = useCallback((contact: Contact) => {
    setDeleteContactState({ isOpen: true, contact });
  }, []);

  const confirmDeleteContact = async () => {
    const contact = deleteContactState.contact;
    if (!contact) return;
    try {
      await deleteContactMutation.mutateAsync(contact._id);
      toastUtils.success('Contact deleted successfully');
      setDeleteContactState({ isOpen: false, contact: null });
    } catch (error) {
      console.error('Error deleting contact:', error);
      toastUtils.error('Failed to delete contact');
    }
  };

  const handleEditContact = useCallback((contact: Contact) => {
    setEditingContact(contact);
  }, []);

  const handleImport = async (importData: any) => {
    try {
      const payload = Array.isArray(importData)
        ? { contacts: importData }
        : importData;
      const result = await bulkCreateMutation.mutateAsync(payload);
      if (result.status === 'queued' || result.jobId || result.importHistoryId) {
        toastUtils.success('Import started. You can track progress in Import History.');
        setIsImportHistoryDialogOpen(true);
        return;
      }

      const summary = result.summary;
      if (summary) {
        toastUtils.success(
          `Import ${summary.status.replace('_', ' ')}: ${summary.newCount} new, ${summary.updatedCount} updated, ${summary.failedCount} failed`
        );
      }

      if ((result.failed?.length || 0) > 0) {
        toastUtils.warning(`${result.failed?.length || 0} contacts failed to import`);
      }
    } catch (error) {
      console.error('Import error:', error);
      throw error; // Re-throw to let CSVImport handle the error state
    }
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedContacts([]);
  }, []);


  const requestBulkDelete = useCallback(() => {
    if (selectedContacts.length === 0) {
      toastUtils.warning('Please select contacts to delete');
      return;
    }
    setIsBulkDeleteDialogOpen(true);
  }, [selectedContacts.length]);

  const confirmBulkDelete = async () => {
    try {
      const result = await bulkDeleteMutation.mutateAsync({ contactIds: selectedContacts });
      toastUtils.success(`Successfully deleted ${result.deleted.length} contact(s)`);
      if (result.failed.length > 0) {
        toastUtils.warning(`${result.failed.length} contact(s) failed to delete`);
        setBulkDeleteFailures(result.failed);
        setIsBulkDeleteFailuresDialogOpen(true);
      }
      // Keep failed selected so user can retry / inspect
      const failedIds = new Set(result.failed.map((f) => f.contactId).filter(Boolean) as string[]);
      setSelectedContacts((prev) => prev.filter((id) => failedIds.has(id)));
      setIsBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toastUtils.error('Failed to delete contacts');
    }
  };

  const handleSelectContact = useCallback((contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const contacts = contactsData?.contacts || [];
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(contact => contact._id));
    }
  }, [contactsData?.contacts, selectedContacts.length]);

  const handlePageLimitChange = (newLimit: number) => {
    setPageLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
    setSelectedContacts([]); // Clear selection when changing page
  };

  useEffect(() => {
    window.localStorage.setItem('contacts-page-limit', String(pageLimit));
  }, [pageLimit]);

  const handleFiltersChange = (nextFilters: ContactColumnFilters) => {
    const tagsChanged =
      nextFilters.tags.length !== filters.tags.length ||
      nextFilters.tags.some((tag, idx) => tag !== filters.tags[idx]) ||
      nextFilters.tagFilterMode !== filters.tagFilterMode;

    setFilters(nextFilters);
    if (tagsChanged) {
      setCurrentPage(1);
    }
  };

  const handleBulkSend = () => {
    if (selectedContacts.length === 0) {
      toastUtils.warning('Please select contacts to send messages to');
      return;
    }

    // Get selected contact details
    const selectedContactDetails = contactsData?.contacts.filter(contact =>
      selectedContacts.includes(contact._id)
    ) || [];

    // Navigate to send message page with bulk mode
    navigate(`/whatsapp/dashboard/${projectId}/send-message`, {
      state: {
        bulkMode: true,
        selectedContacts: selectedContactDetails,
        projectId: selectedProject?._id
      }
    });
  };

  const openManageTagsDialog = () => {
    if (selectedContacts.length === 0) {
      toastUtils.warning('Please select contacts to manage tags');
      return;
    }
    setIsManageTagsDialogOpen(true);
  };

  const closeManageTagsDialog = () => {
    setIsManageTagsDialogOpen(false);
  };

  const handleBulkManageTags = async (payload: {
    operation: 'add' | 'remove';
    tags: string[];
  }) => {
    if (!selectedProject?._id) {
      toastUtils.error('Project is required');
      return;
    }
    if (selectedContacts.length === 0) {
      toastUtils.warning('Please select contacts first');
      return;
    }
    if (payload.tags.length === 0) {
      toastUtils.warning('Please select at least one tag');
      return;
    }

    try {
      const result = await bulkUpdateTagsMutation.mutateAsync({
        contactIds: selectedContacts,
        projectId: selectedProject._id,
        tags: payload.tags,
        operation: payload.operation,
      });

      toastUtils.success(
        `Tags ${payload.operation === 'add' ? 'added' : 'removed'} for ${result.modifiedCount} contact(s)`
      );
      setSelectedContacts([]);
      closeManageTagsDialog();
    } catch (error) {
      console.error('Bulk tag management failed:', error);
      toastUtils.error(`Failed to ${payload.operation} tags`);
    }
  };

  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Card className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white dark:bg-slate-800/50 text-center">
          <div className="h-16 w-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
            <X className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Error Loading Contacts</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {error.message || 'An unexpected error occurred while fetching your contacts.'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-widest mb-1">
              <Users className="h-3.5 w-3.5" />
              Audience
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Contact Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Manage your subscribers and customer base for <span className="text-slate-900 dark:text-white font-bold">WhatsApp Campaigns</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsImportDialogOpen(true)}
                variant="outline"
                className="h-10 px-4 rounded-xl border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-xs transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-xs transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 flex items-center gap-2 outline-none">
                    <MoreHorizontal className="w-4 h-4" />
                    More
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <DropdownMenuItem
                    onClick={() => setIsExportDialogOpen(true)}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 flex items-center gap-2 transition-colors cursor-pointer outline-none focus:bg-slate-50 focus:text-slate-900"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    Export Contacts
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsImportHistoryDialogOpen(true)}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 flex items-center gap-2 transition-colors cursor-pointer outline-none focus:bg-slate-50 focus:text-slate-900"
                  >
                    <History className="w-4 h-4 text-slate-400" />
                    Import History
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="h-10 px-5 rounded-xl flex items-center gap-2 bg-[#22B573] hover:bg-[#1da467] text-white font-bold text-xs shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        {/* Stats Section */}
        {statsData && <ContactStats stats={statsData} />}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-green-400/50 dark:hover:border-green-500/50 rounded-2xl p-1 transition-all duration-300 overflow-hidden"
        >
          {/* Decorative background element */}
          {/* Decorative background element removed to avoid white blobs */}

          <div className="relative z-10 flex flex-col h-full">
            {/* Search and Filters Section */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-400">
                  <Filter className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Filter Audience</h3>
              </div>
              <ContactSearch
                projectId={selectedProject?._id}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>

            {/* Table Section */}
            <div className="flex-1 p-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <RefreshCw className="h-10 w-10 animate-spin mb-4 opacity-20" />
                  <p className="font-bold text-xs uppercase tracking-widest">Loading contacts...</p>
                </div>
              ) : (
                <ContactsTable
                  data={contactsData}
                  isLoading={isLoading}
                  onPageChange={handlePageChange}
                  onEdit={handleEditContact}
                  onDelete={requestDeleteContact}
                  selectedContacts={selectedContacts}
                  onSelectContact={handleSelectContact}
                  onSelectAll={handleSelectAll}
                  pageLimit={pageLimit}
                  onPageLimitChange={handlePageLimitChange}
                  onBulkDelete={requestBulkDelete}
                  onBulkSend={handleBulkSend}
                  onBulkTags={openManageTagsDialog}
                  isBulkDeleting={bulkDeleteMutation.isPending}
                />
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Contact Form Dialogs */}
      <ContactForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateContact}
        isLoading={createContactMutation.isPending}
        projectId={selectedProject?._id || ''}
      />

      <ContactForm
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        onSubmit={handleUpdateContact}
        isLoading={updateContactMutation.isPending}
        contact={editingContact}
        projectId={selectedProject?._id || ''}
      />

      {isImportDialogOpen && (
        <Suspense fallback={<DialogFallback title="Loading Importer..." />}>
          <LazyCSVImport
            onOpenChange={setIsImportDialogOpen}
            onImport={handleImport}
            isLoading={bulkCreateMutation.isPending}
            projectId={selectedProject?._id || ''}
          />
        </Suspense>
      )}

      <ImportHistoryDialog
        isOpen={isImportHistoryDialogOpen}
        onClose={() => setIsImportHistoryDialogOpen(false)}
        projectId={selectedProject?._id}
      />

      {deleteContactState.isOpen && deleteContactState.contact && (
        <ConfirmDeleteModal
          setModal={(val) => {
            if (!val) setDeleteContactState({ isOpen: false, contact: null });
          }}
          triggerDelete={confirmDeleteContact}
          isLoading={deleteContactMutation.isPending}
          itemName={deleteContactState.contact.firstName}
        />
      )}

      {isBulkDeleteDialogOpen && (
        <ConfirmDeleteModal
          setModal={(val) => {
            if (!val) setIsBulkDeleteDialogOpen(false);
          }}
          triggerDelete={confirmBulkDelete}
          isLoading={bulkDeleteMutation.isPending}
          title={`Are you sure you want to delete ${selectedContacts.length} selected contact(s)?`}
          itemName={`${selectedContacts.length} Contacts`}
        />
      )}

      <Dialog
        open={isBulkDeleteFailuresDialogOpen}
        onOpenChange={(open) => !open && setIsBulkDeleteFailuresDialogOpen(false)}
      >
        <DialogContent
          className="sm:max-w-[600px] border-0 bg-transparent p-0 shadow-none outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          <div className="relative w-full rounded-2xl p-8 shadow-2xl flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-rose-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                  <XCircle className="h-3 w-3" />
                  Action Failed
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Bulk Deletion Issues
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                  The following contacts couldn't be removed. They remain selected for retry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkDeleteFailuresDialogOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-400 transition-colors border border-transparent hover:border-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/30 dark:bg-slate-900">
              <div className="max-h-[300px] overflow-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="bg-white dark:bg-slate-800 sticky top-0 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-700/50">
                    <tr className="text-left">
                      <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Target Contact</th>
                      <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Rejection Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {bulkDeleteFailures.map((f, index) => (
                      <tr key={f.contactId || index} className="hover:bg-white dark:hover:bg-slate-900/50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono text-[11px] font-bold text-slate-400">#{f.contactId || "Unknown"}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                            {f.error || "Deletions failed"}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {bulkDeleteFailures.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-12 text-center text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                onClick={() => setIsBulkDeleteFailuresDialogOpen(false)}
                className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-lg shadow-slate-900/10"
              >
                Dismiss Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BulkManageTagsDialog
        isOpen={isManageTagsDialogOpen}
        onClose={closeManageTagsDialog}
        projectId={selectedProject?._id}
        selectedContactsCount={selectedContacts.length}
        isLoading={bulkUpdateTagsMutation.isPending}
        onSubmit={handleBulkManageTags}
      />

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        contacts={contactsData?.contacts || []}
      />
    </div>
  );
}
