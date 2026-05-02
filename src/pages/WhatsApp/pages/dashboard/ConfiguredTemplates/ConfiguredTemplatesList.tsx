import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  ChevronDown,
  RefreshCw,
  MessageSquare,
  Settings
} from 'lucide-react';
import ConfiguredTemplatePreviewDialog from '@/components/ui/ConfiguredTemplatePreviewDialog';
import { 
  useConfiguredTemplates, 
  useDeleteConfiguredTemplate, 
  useRefreshConfiguredTemplates 
} from '@/hooks/useConfiguredTemplates';
import { useProjectContext } from '@/context/ProjectContext';
import { Link, useParams } from 'react-router-dom';
import type { GetConfiguredTemplatesQuery } from '@/schemas/configuredTemplateSchema';

export default function ConfiguredTemplatesList() {
  const { selectedProject } = useProjectContext();
  const { projectId } = useParams<{ projectId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewConfiguredTemplate, setPreviewConfiguredTemplate] = useState<any | null>(null);
  
  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    configuredTemplateId: string;
    configuredTemplateName: string;
  }>({
    isOpen: false,
    configuredTemplateId: '',
    configuredTemplateName: '',
  });

  const ITEMS_PER_PAGE = 12;
  const refreshConfiguredTemplates = useRefreshConfiguredTemplates();
  const deleteConfiguredTemplateMutation = useDeleteConfiguredTemplate();

  // Build query object
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

  // Handle delete confirmation
  const handleDeleteClick = (configuredTemplateId: string, configuredTemplateName: string) => {
    setConfirmationDialog({
      isOpen: true,
      configuredTemplateId,
      configuredTemplateName,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!projectId || !confirmationDialog.configuredTemplateId) return;

    try {
      await deleteConfiguredTemplateMutation.mutateAsync({
        projectId,
        configuredTemplateId: confirmationDialog.configuredTemplateId,
      });
      
      setConfirmationDialog({
        isOpen: false,
        configuredTemplateId: '',
        configuredTemplateName: '',
      });
    } catch (error) {
      console.error('Failed to delete configured template:', error);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmationDialog({
      isOpen: false,
      configuredTemplateId: '',
      configuredTemplateName: '',
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    if (selectedProject?._id) {
      refreshConfiguredTemplates(selectedProject._id);
    }
    refetch();
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle filter change
  const handleFilterChange = (filter: 'all' | 'active' | 'inactive') => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle page change
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load configured templates</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configured Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your pre-configured WhatsApp templates with variable mappings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link to={`/whatsapp/dashboard/${projectId}/configured-templates/create`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search configured templates..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <div className="flex gap-1">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'active', label: 'Active' },
                      { key: 'inactive', label: 'Inactive' }
                    ].map((filter) => (
                      <Button
                        key={filter.key}
                        variant={activeFilter === filter.key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange(filter.key as 'all' | 'active' | 'inactive')}
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} configured templates
          </span>
          <div className="flex items-center gap-2">
            <span>Page {pagination.page} of {pagination.pages}</span>
          </div>
        </div>
      )}

      {/* Configured Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : configuredTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No configured templates found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || activeFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first configured template to get started.'
              }
            </p>
            {!searchTerm && activeFilter === 'all' && (
              <Link to={`/whatsapp/dashboard/${projectId}/configured-templates/create`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Configured Template
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configuredTemplates.map((configuredTemplate) => (
            <Card key={configuredTemplate._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {configuredTemplate.configuredTemplateName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Based on: {configuredTemplate.templateName}
                    </CardDescription>
                  </div>
                 
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>
                        {configuredTemplate.variableMappings.length} variable{configuredTemplate.variableMappings.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPreview(configuredTemplate)}
                        aria-label={`Preview ${configuredTemplate.configuredTemplateName}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(configuredTemplate._id, configuredTemplate.configuredTemplateName)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" aria-label={`Delete ${configuredTemplate.configuredTemplateName}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Configured Template"
        description={`Are you sure you want to delete "${confirmationDialog.configuredTemplateName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteConfiguredTemplateMutation.isPending}
      />

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

