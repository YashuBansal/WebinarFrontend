import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { createWabaTagFormSchema, type CreateWabaTagFormData, type CreateWabaTagPayload, type WabaTag } from '@/schemas/tagSchema';
import { useProjectContext } from '@/context/ProjectContext';
import { useEffect } from 'react';

interface TagFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWabaTagPayload) => void;
  isLoading: boolean;
  editingTag?: WabaTag | null;
}

export function TagForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingTag,
}: TagFormProps) {
  const { selectedProject } = useProjectContext();
  
  const form = useForm<CreateWabaTagFormData>({
    resolver: zodResolver(createWabaTagFormSchema),
    defaultValues: {
      name: editingTag?.name || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: editingTag?.name || '',
      });
    }
  }, [isOpen, editingTag, form]);

  const handleSubmit = (data: CreateWabaTagFormData) => {
    // Automatically inject projectId from context
    const payload: CreateWabaTagPayload = {
      ...data,
      projectId: selectedProject?._id || editingTag?.projectId || '',
    };
    onSubmit(payload);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingTag ? 'Edit WABA Tag' : 'Create New WABA Tag'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter tag name..."
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : editingTag ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
