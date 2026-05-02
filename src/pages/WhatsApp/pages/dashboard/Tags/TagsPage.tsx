import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useWabaTags, useWabaTagMutations } from '@/hooks/useTags';
import type { CreateWabaTagPayload, WabaTag } from '@/schemas/tagSchema';
import { useProjectContext } from '@/context/ProjectContext';
import { TagsTable, TagForm } from './components';

// Toast notifications - you may want to add a toast library like sonner
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

  const { data: tags = [], isLoading, error } = useWabaTags({
    search: searchTerm || undefined,
    projectId: selectedProject?._id,
  });

  const { useCreateWabaTag, useUpdateWabaTag, useDeleteWabaTag } = useWabaTagMutations();
  const createWabaTagMutation = useCreateWabaTag();
  const updateWabaTagMutation = useUpdateWabaTag();
  const deleteWabaTagMutation = useDeleteWabaTag();

  const handleCreateWabaTag = async (data: CreateWabaTagPayload) => {
    try {
      await createWabaTagMutation.mutateAsync(data);
      toast.success('WABA Tag created successfully');
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
      toast.success('WABA Tag updated successfully');
      setEditingTag(null);
    } catch (error) {
      toast.error('Failed to update WABA tag');
      console.error('Update WABA tag error:', error);
    }
  };

  const handleDeleteWabaTag = async (tagId: string) => {
    try {
      await deleteWabaTagMutation.mutateAsync(tagId);
      toast.success('WABA Tag deleted successfully');
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

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error loading tags</p>
              <p className="text-sm text-gray-500">
                {error.message || 'Something went wrong'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">WABA Tags</h1>
          <p className="text-gray-600 mt-2">
            Manage your WABA tags for organizing contacts and messages
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create WABA Tag
        </Button>
      </div>

      <TagsTable
        tags={tags}
        isLoading={isLoading}
        isDeleting={deleteWabaTagMutation.isPending}
        onEdit={handleEditWabaTag}
        onDelete={handleDeleteWabaTag}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

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
