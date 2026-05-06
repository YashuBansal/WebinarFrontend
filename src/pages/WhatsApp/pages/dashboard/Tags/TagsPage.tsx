import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Plus,
  Tag as TagIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useWabaTags, useWabaTagMutations } from '@/hooks/useTags';
import type { CreateWabaTagPayload, WabaTag } from '@/schemas/tagSchema';
import { useProjectContext } from '@/context/ProjectContext';
import { TagsTable, TagForm } from './components';

// Toast notifications
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message),
  warning: (message: string) => console.warn('⚠️', message),
};

export default function TagsPage() {
  const { selectedProject } = useProjectContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<WabaTag | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: tags = [], isLoading, error } = useWabaTags({
    search: searchTerm || undefined,
    projectId: selectedProject?._id,
  });

  const { useCreateWabaTag, useUpdateWabaTag, useDeleteWabaTag } = useWabaTagMutations();
  const createWabaTagMutation = useCreateWabaTag();
  const updateWabaTagMutation = useUpdateWabaTag();
  const deleteWabaTagMutation = useDeleteWabaTag();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCreateWabaTag = async (data: CreateWabaTagPayload) => {
    try {
      await createWabaTagMutation.mutateAsync(data);
      setSuccessMessage('WABA Tag created successfully');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error('Failed to create WABA tag');
      console.error('Create WABA tag error:', error);
    }
  };

  const handleUpdateWabaTag = async (data: CreateWabaTagPayload) => {
    if (!editingTag) return;

    try {
      await updateWabaTagMutation.mutateAsync({
        tagId: editingTag._id,
        payload: data,
      });
      setSuccessMessage('WABA Tag updated successfully');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      setEditingTag(null);
    } catch (error) {
      toast.error('Failed to update WABA tag');
      console.error('Update WABA tag error:', error);
    }
  };

  const handleDeleteWabaTag = async (tagId: string) => {
    try {
      await deleteWabaTagMutation.mutateAsync(tagId);
      setSuccessMessage('WABA Tag deleted successfully');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      toast.error('Failed to delete WABA tag');
      console.error('Delete WABA tag error:', error);
    }
  };

  const handleEditWabaTag = (tag: WabaTag) => {
    setEditingTag(tag);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const handleCloseEditDialog = () => {
    setEditingTag(null);
  };

  if (!selectedProject) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 mb-2">No Project Selected</AlertTitle>
          <AlertDescription className="text-slate-500 font-medium">
            Please select a project to manage its WABA tags.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 mb-2">Error Loading Tags</AlertTitle>
          <AlertDescription className="text-slate-500 font-medium">
            {error.message || 'Something went wrong while fetching your tags.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest mb-1">
              <TagIcon className="h-3.5 w-3.5" />
              Tags Management
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              WABA Tags
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              Organize and categorize your contacts with custom <span className="text-slate-900 font-bold">WABA Tags</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-10 px-5 rounded-xl flex items-center gap-2 bg-[#22B573] hover:bg-[#1da467] text-white font-bold text-xs shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Create Tag
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Alert className="bg-green-50 border-green-200 rounded-2xl mb-6">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 font-bold">Success</AlertTitle>
                <AlertDescription className="text-green-700 font-medium">{successMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TagsTable
            tags={tags}
            isLoading={isLoading}
            isDeleting={deleteWabaTagMutation.isPending}
            onEdit={handleEditWabaTag}
            onDelete={handleDeleteWabaTag}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </motion.div>
      </main>

      {/* Create WABA Tag Dialog */}
      <TagForm
        isOpen={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
        onSubmit={handleCreateWabaTag}
        isLoading={createWabaTagMutation.isPending}
      />

      {/* Edit WABA Tag Dialog */}
      <TagForm
        isOpen={!!editingTag}
        onClose={handleCloseEditDialog}
        onSubmit={handleUpdateWabaTag}
        isLoading={updateWabaTagMutation.isPending}
        editingTag={editingTag}
      />
    </div>
  );
}
