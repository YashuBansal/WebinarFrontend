import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  ChevronDown,
  RefreshCw,
  MessageSquare,
  Settings,
  Video,
  Sparkles,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import ConfiguredTemplatePreviewDialog from '@/components/ui/ConfiguredTemplatePreviewDialog';
import {
  useConfiguredTemplates,
  useDeleteConfiguredTemplate,
  useRefreshConfiguredTemplates
} from '@/hooks/useConfiguredTemplates';
import { useProjectContext } from '@/context/ProjectContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { GetConfiguredTemplatesQuery } from '@/schemas/configuredTemplateSchema';
import ConfirmDeleteModal from '../../../../../components/ConfirmDeleteModal';

export default function ConfiguredTemplatesList() {
  const { selectedProject } = useProjectContext();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewConfiguredTemplate, setPreviewConfiguredTemplate] = useState<any | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<{ id: string, name: string } | null>(null);

  const ITEMS_PER_PAGE = 12;
  const refreshConfiguredTemplates = useRefreshConfiguredTemplates();
  const deleteConfiguredTemplateMutation = useDeleteConfiguredTemplate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const query: GetConfiguredTemplatesQuery = {
    page: currentPage.toString(),
    limit: ITEMS_PER_PAGE.toString(),
  };

  if (searchTerm) query.search = searchTerm;
  if (activeFilter !== 'all') {
    query.isActive = activeFilter === 'active';
  }

  const {
    data: configuredTemplatesResponse,
    isLoading,
    error,
    refetch
  } = useConfiguredTemplates(selectedProject?._id || '', query);

  const configuredTemplates = configuredTemplatesResponse?.data || [];
  const pagination = configuredTemplatesResponse?.pagination;

  const handleDeleteClick = (configuredTemplateId: string, configuredTemplateName: string) => {
    setSelectedForDelete({ id: configuredTemplateId, name: configuredTemplateName });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectId || !selectedForDelete) return;

    try {
      await deleteConfiguredTemplateMutation.mutateAsync({
        projectId,
        configuredTemplateId: selectedForDelete.id,
      });
      setDeleteModalOpen(false);
      setSelectedForDelete(null);
    } catch (error) {
      console.error('Failed to delete configured template:', error);
    }
  };

  const handleRefresh = () => {
    if (selectedProject?._id) {
      refreshConfiguredTemplates(selectedProject._id);
    }
    refetch();
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: 'all' | 'active' | 'inactive') => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openPreview = (ct: any) => {
    setPreviewConfiguredTemplate(ct);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewConfiguredTemplate(null);
  };

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
              <Video className="h-3.5 w-3.5" />
              WhatsApp Automations
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Zoom Templates
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Manage mappings for <span className="text-slate-900 dark:text-white font-bold">Zoom Webhook</span> message automation
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to={`/whatsapp/dashboard/${projectId}/configured-templates/create`}>
              <Button className="h-11 px-6 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-green-600/20 bg-[#22B573] hover:bg-[#1da467] text-white transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-4 w-4" />
                Create Zoom Template
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Search & Filter Area */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search templates by name..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-12 pl-11 pr-4 rounded-2xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 shadow-sm focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-1 gap-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'inactive', label: 'Inactive' }
          ].map((filter) => (
            <Button
              key={filter.key}
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange(filter.key as any)}
              className={`h-10 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeFilter === filter.key
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <main className="container mx-auto pb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[180px] w-full rounded-2xl" />
            ))}
          </div>
        ) : configuredTemplates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl"
          >
            <div className="h-20 w-20 rounded-3xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-6">
              <Sparkles className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Templates Found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mb-8">
              {searchTerm || activeFilter !== 'all'
                ? "We couldn't find any templates matching your criteria."
                : "Start by creating your first configured template to automate your Zoom messaging."}
            </p>
            {!searchTerm && activeFilter === 'all' && (
              <Link to={`/whatsapp/dashboard/${projectId}/configured-templates/create`}>
                <Button className="h-11 px-8 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white transition-all active:scale-95 shadow-xl shadow-slate-900/10">
                  Create First Zoom Template
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {configuredTemplates.map((ct, index) => (
                <motion.div
                  key={ct._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-2xl p-6 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 -mr-12 -mt-12 h-32 w-32 rounded-full bg-green-500/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${ct.isActive ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400'}`}>
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className={`rounded-lg px-2 py-0 h-5 text-[10px] font-black uppercase tracking-wider ${ct.isActive ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400 border-slate-100 dark:border-slate-700/50'}`}>
                        {ct.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="flex-1 min-w-0 mb-6">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white truncate mb-1" title={ct.configuredTemplateName}>
                        {ct.configuredTemplateName}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <Settings className="h-3 w-3" />
                        Base: <span className="text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{ct.templateName}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {ct.variableMappings?.length || 0} Variables
                        </span>
                      </div>

                      <div className="flex items-center bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-1 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPreview(ct)}
                          className="h-9 px-3 rounded-lg flex items-center gap-2 font-bold text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-900/50 hover:shadow-sm transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(ct._id, ct.configuredTemplateName)}
                          className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination Container */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-10 w-10 rounded-xl border-slate-200 dark:border-slate-700/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white">{currentPage}</span>
              <span className="text-sm font-medium text-slate-400">of</span>
              <span className="text-sm font-black text-slate-400">{pagination.pages}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className="h-10 w-10 rounded-xl border-slate-200 dark:border-slate-700/50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Premium Delete Confirmation Modal */}
      {deleteModalOpen && selectedForDelete && (
        <ConfirmDeleteModal
          setModal={(val) => {
            if (!val) {
              setDeleteModalOpen(false);
              setSelectedForDelete(null);
            }
          }}
          triggerDelete={handleDeleteConfirm}
          isLoading={deleteConfiguredTemplateMutation.isPending}
          itemName={selectedForDelete.name}
        />
      )}

      {/* Configured Template Preview Dialog */}
      <ConfiguredTemplatePreviewDialog
        isOpen={isPreviewOpen}
        onClose={closePreview}
        projectId={projectId || selectedProject?._id || ''}
        configuredTemplate={previewConfiguredTemplate}
      />
    </div>
  );
}

