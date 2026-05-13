import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTemplates, useDeleteTemplate, useSyncTemplates } from '@/hooks/useTemplates';
import { useProjectContext } from '@/context/ProjectContext';
import { Link, useParams } from 'react-router-dom';
import { toastUtils } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, LayoutGrid, Zap } from 'lucide-react';
import { useQuickReplies } from '@/hooks/useQuickReplies';

// Import modular components
import {
  TemplateHeader,
  TemplateTabs,
  TemplateSearch,
  TemplateCard,
  TemplateEmptyState,
  TemplateErrorState,
  TemplateLoadingState,
  TemplateStats
} from './components';

export default function Templates() {
  const { selectedProject } = useProjectContext();
  const { projectId } = useParams<{ projectId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'rejected' | 'session'>('approved');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; isQuickReply?: boolean } | null>(null);
  const [pendingClone, setPendingClone] = useState<any | null>(null);

  const {
    data: templatesResponse,
    isLoading,
    isRefetching,
    error,
    refetch
  } = useTemplates(selectedProject?._id || '', {});

  const deleteTemplateMutation = useDeleteTemplate();
  const syncTemplatesMutation = useSyncTemplates();
  const { 
    quickReplies, 
    isLoading: isQuickRepliesLoading, 
    createQuickReply, 
    deleteQuickReply 
  } = useQuickReplies(selectedProject?._id || '');

  const allTemplates = templatesResponse?.data || [];

  // Get last synced time from first template (all templates have same sync time)
  const lastSyncedAt = useMemo(() => {
    return allTemplates.length > 0 ? allTemplates[0]?.last_synced_at : null;
  }, [allTemplates]);

  // Simple filtering
  const filteredTemplates = useMemo(() => {
    if (activeTab === 'session') {
      return quickReplies.filter(qr => 
        !searchTerm || 
        qr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qr.content.toLowerCase().includes(searchTerm.toLowerCase())
      ).map(qr => ({
        id: qr._id,
        name: qr.name,
        status: 'SESSION',
        category: 'SESSION',
        language: qr.language || 'en_US',
        components: qr.components && qr.components.length > 0 
          ? qr.components 
          : [{ type: 'BODY', text: qr.content }],
        isQuickReply: true
      }));
    }

    return allTemplates.filter(template => {
      const matchesTab = template.status === activeTab.toUpperCase();
      const matchesSearch = !searchTerm ||
        template.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [allTemplates, activeTab, searchTerm, quickReplies]);

  const handleDeleteTemplate = (templateId: string, templateName: string, isQuickReply?: boolean) => {
    if (!selectedProject?._id) return;
    setPendingDelete({ id: templateId, name: templateName, isQuickReply });
  };

  const confirmDelete = async () => {
    if (!selectedProject?._id || !pendingDelete) return;
    try {
      if (pendingDelete.isQuickReply) {
        await deleteQuickReply(pendingDelete.id);
      } else {
        await deleteTemplateMutation.mutateAsync({
          projectId: selectedProject._id,
          deletePayload: { hsm_id: pendingDelete.id, name: pendingDelete.name },
        });
      }
      toastUtils.success(`${pendingDelete.isQuickReply ? 'Quick reply' : 'Template'} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete:', error);
      toastUtils.error('Failed to delete. Please try again.');
    } finally {
      setPendingDelete(null);
    }
  };

  const handleCloneToSession = async (template: any) => {
    if (!selectedProject?._id) return;
    
    const bodyContent = template.components?.find((c: any) => c.type === 'BODY')?.text || '';
    
    try {
      await createQuickReply({
        projectId: selectedProject._id,
        name: `${template.name}_session`,
        content: bodyContent,
      });
      setActiveTab('session');
    } catch (error) {
      console.error('Failed to clone template:', error);
    }
  };

  const copyTemplateName = (name: string) => {
    navigator.clipboard.writeText(name);
    toastUtils.success(`Template name "${name}" copied to clipboard`);
  };

  const handleSyncTemplates = async () => {
    if (!selectedProject?._id) return;

    try {
      await syncTemplatesMutation.mutateAsync({ projectId: selectedProject._id });
    } catch (error) {
      console.error('Failed to sync templates:', error);
      // Error is already handled by the hook's onError
    }
  };

  const hasPendingTemplates = allTemplates.some(t => t.status === 'PENDING');

  useEffect(() => {
    let interval: any;

    if (hasPendingTemplates && selectedProject?._id) {
      interval = setInterval(() => {
        // Only trigger sync if we are not already syncing
        if (!syncTemplatesMutation.isPending) {
          handleSyncTemplates();
        }
      }, 10 * 60 * 1000); // Sync pending templates every 10 minutes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hasPendingTemplates, selectedProject?._id, syncTemplatesMutation.isPending]);

  if (!selectedProject) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white dark:bg-slate-900/60">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 dark:text-white mb-2">No Project Selected</AlertTitle>
          <AlertDescription className="text-slate-500 dark:text-slate-400 font-medium">
            Please select a project to view templates.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Header */}
      <TemplateHeader
        projectName={selectedProject.projectName}
        projectId={projectId || ''}
        isLoading={isLoading}
        isSyncing={syncTemplatesMutation.isPending}
        isRefreshing={isRefetching}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => refetch()}
        onSync={handleSyncTemplates}
        activeTab={activeTab}
      />

      <div className="container mx-auto mb-6 px-4 sm:px-0">
        <TemplateStats
          totalTemplates={allTemplates.length}
          approvedTemplates={allTemplates.filter(t => t.status === 'APPROVED').length}
          pendingTemplates={allTemplates.filter(t => t.status === 'PENDING').length}
          rejectedTemplates={allTemplates.filter(t => t.status === 'REJECTED').length}
        />
      </div>

      <main className="container mx-auto space-y-6 pb-12">
        {/* Search & Tabs Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <TemplateTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            approvedCount={allTemplates.filter(t => t.status === 'APPROVED').length}
            pendingCount={allTemplates.filter(t => t.status === 'PENDING').length}
            rejectedCount={allTemplates.filter(t => t.status === 'REJECTED').length}
            sessionCount={quickReplies.length}
          />
          <div className="w-full lg:w-72">
            <TemplateSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>
        </div>

        {/* Templates List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + searchTerm}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? (
              <TemplateLoadingState />
            ) : error ? (
              <TemplateErrorState error={error} onRetry={() => refetch()} />
            ) : filteredTemplates.length === 0 ? (
              <TemplateEmptyState
                activeTab={activeTab}
                hasTemplatesInTab={allTemplates.filter(t => t.status === (activeTab === 'session' ? 'SESSION' : activeTab.toUpperCase())).length > 0}
                projectId={projectId || ''}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onCopy={copyTemplateName}
                    onDelete={(id, name) => handleDeleteTemplate(id, name, (template as any).isQuickReply)}
                    onCloneToSession={handleCloneToSession}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <ConfirmationDialog
        isOpen={!!pendingDelete}
        onClose={() => (deleteTemplateMutation.isPending ? null : setPendingDelete(null))}
        onConfirm={confirmDelete}
        title="Delete template?"
        description={
          pendingDelete
            ? `Are you sure you want to delete "${pendingDelete.name}"?`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteTemplateMutation.isPending}
      />
    </div>
  );
}