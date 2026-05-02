import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTemplates, useDeleteTemplate, useSyncTemplates } from '@/hooks/useTemplates';
import { useProjectContext } from '@/context/ProjectContext';
import { Link, useParams } from 'react-router-dom';
import { toastUtils } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

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
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const { 
    data: templatesResponse, 
    isLoading, 
    isRefetching,
    error, 
    refetch 
  } = useTemplates(selectedProject?._id || '', {});

  const deleteTemplateMutation = useDeleteTemplate();
  const syncTemplatesMutation = useSyncTemplates();

  const allTemplates = templatesResponse?.data || [];
  
  // Get last synced time from first template (all templates have same sync time)
  const lastSyncedAt = useMemo(() => {
    return allTemplates.length > 0 ? allTemplates[0]?.last_synced_at : null;
  }, [allTemplates]);

  // Simple filtering
  const filteredTemplates = allTemplates.filter(template => {
    const matchesTab = template.status === activeTab.toUpperCase();
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    if (!selectedProject?._id) return;
    setPendingDelete({ id: templateId, name: templateName });
  };

  const confirmDelete = async () => {
    if (!selectedProject?._id || !pendingDelete) return;
    try {
      await deleteTemplateMutation.mutateAsync({
        projectId: selectedProject._id,
        deletePayload: { hsm_id: pendingDelete.id, name: pendingDelete.name },
      });
      toastUtils.success('Template deleted successfully');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toastUtils.error('Failed to delete template. Please try again.');
    } finally {
      setPendingDelete(null);
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
    let interval: NodeJS.Timeout;
    
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Project Selected</h2>
            <p className="text-gray-600 mb-6">Please select a project to view templates.</p>
            <Link to="/whatsapp">
              <Button>Go to Projects</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50 p-4 sm:p-6 overflow-y-auto">
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
      />
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

      {/* Tabs */}
      <TemplateTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        approvedCount={allTemplates.filter(t => t.status === 'APPROVED').length}
        pendingCount={allTemplates.filter(t => t.status === 'PENDING').length}
        rejectedCount={allTemplates.filter(t => t.status === 'REJECTED').length}
      />

              {/* Search */}
      <TemplateSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

        {/* Templates List */}
        {isLoading ? (
        <TemplateLoadingState />
        ) : error ? (
        <TemplateErrorState error={error} onRetry={() => refetch()} />
      ) : filteredTemplates.length === 0 ? (
        <TemplateEmptyState
          activeTab={activeTab}
          hasTemplatesInTab={allTemplates.filter(t => t.status === activeTab.toUpperCase()).length > 0}
          projectId={projectId || ''}
        />
      ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onCopy={copyTemplateName}
              onDelete={handleDeleteTemplate}
            />
          ))}
          </div>
        )}

        {/* Stats */}
      <TemplateStats
        totalTemplates={allTemplates.length}
        approvedTemplates={allTemplates.filter(t => t.status === 'APPROVED').length}
        pendingTemplates={allTemplates.filter(t => t.status === 'PENDING').length}
        rejectedTemplates={allTemplates.filter(t => t.status === 'REJECTED').length}
      />
    </div>
  );
}