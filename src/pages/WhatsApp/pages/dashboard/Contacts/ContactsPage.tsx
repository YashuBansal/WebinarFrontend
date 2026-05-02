import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, MessageSquare, Download, Tags, History, MoreHorizontal, Upload } from 'lucide-react';
import { useContacts, useContactMutations } from '@/hooks/useContacts';
import { useProjectContext } from '@/context/ProjectContext';
import type { CreateContactPayload, Contact } from '@/schemas/contactSchema';
import { toastUtils } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ContactsTable from './components/ContactsTable';
import { 
  ContactForm,
  ContactSearch,
  ExportDialog,
  BulkManageTagsDialog,
  ImportHistoryDialog,
} from './components';
import React, { Suspense, lazy } from 'react';
import DialogFallback from '@/components/ui/dialog-fallback';
import type { ContactColumnFilters } from './components/ContactSearch';

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
  const [deleteContactState, setDeleteContactState] = useState<{isOpen: boolean, contact: Contact | null}>({ isOpen: false, contact: null });
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isManageTagsDialogOpen, setIsManageTagsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [bulkDeleteFailures, setBulkDeleteFailures] = useState<Array<{ contactId: string; error: string }>>([]);
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
      const failedIds = new Set(result.failed.map((f) => f.contactId));
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
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Error loading contacts: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your contact list</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedContacts.length > 0 && (
            <>
              <Button 
                variant="destructive" 
                onClick={requestBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedContacts.length})
              </Button>
              
              <Button 
                onClick={handleBulkSend}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send ({selectedContacts.length})
              </Button>

              <Button onClick={openManageTagsDialog} variant="outline" size="sm">
                <Tags className="w-4 h-4 mr-2" />
                Tags ({selectedContacts.length})
              </Button>
            </>
          )}
          
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>

          <details className="relative">
            <summary className="list-none">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <MoreHorizontal className="w-4 h-4 mr-2" />
                  More
                </span>
              </Button>
            </summary>
            <div className="absolute right-0 mt-2 w-44 rounded-md border bg-background shadow-md z-20 p-1">
              <button
                type="button"
                onClick={() => setIsExportDialogOpen(true)}
                className="w-full text-left px-3 py-2 rounded-sm text-sm hover:bg-muted flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                type="button"
                onClick={() => setIsImportHistoryDialogOpen(true)}
                className="w-full text-left px-3 py-2 rounded-sm text-sm hover:bg-muted flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                Import History
              </button>
            </div>
          </details>

          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      <ContactSearch
        projectId={selectedProject?._id}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Contacts Table */}
      <div className="flex-1 min-h-[600px]">
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
        />
      </div>

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

      <ConfirmationDialog
        isOpen={deleteContactState.isOpen}
        onClose={() => setDeleteContactState({ isOpen: false, contact: null })}
        onConfirm={confirmDeleteContact}
        title="Delete Contact"
        description={`Are you sure you want to delete ${deleteContactState.contact?.firstName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteContactMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Contacts"
        description={`Are you sure you want to delete ${selectedContacts.length} contact(s)? This action cannot be undone.`}
        confirmText="Delete Contacts"
        variant="destructive"
        isLoading={bulkDeleteMutation.isPending}
        requireOtpMatch={selectedContacts.length >= 50}
      />

      <Dialog
        open={isBulkDeleteFailuresDialogOpen}
        onOpenChange={(open) => setIsBulkDeleteFailuresDialogOpen(open)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[70vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Some deletions failed</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            These contacts couldn’t be deleted. They remain selected so you can retry.
          </p>
          <div className="rounded-lg border overflow-hidden mt-3">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-left border-b">
                  <th className="py-2 px-3 font-medium">Contact ID</th>
                  <th className="py-2 px-3 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {bulkDeleteFailures.map((f) => (
                  <tr key={f.contactId} className="border-b last:border-0">
                    <td className="py-2 px-3 font-mono text-xs">{f.contactId}</td>
                    <td className="py-2 px-3">{f.error}</td>
                  </tr>
                ))}
                {bulkDeleteFailures.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-muted-foreground">
                      No failures to show.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
