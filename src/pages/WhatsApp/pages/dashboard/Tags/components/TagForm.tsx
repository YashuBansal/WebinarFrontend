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
import { Tag, Save, Loader2 } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-white" showCloseButton={true}>
        <div className="p-8">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
              <Tag className="h-3.5 w-3.5" />
              {editingTag ? 'Edit Tag' : 'New Tag'}
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              {editingTag ? 'Update WABA Tag' : 'Create WABA Tag'}
            </DialogTitle>
            <p className="text-slate-500 text-sm font-medium mt-1">
              {editingTag 
                ? 'Update the name of your tag for better organization.' 
                : 'Define a new tag to categorize your WhatsApp contacts.'}
            </p>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tag Name</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-colors">
                          <Tag className="h-4 w-4" />
                        </div>
                        <Input
                          placeholder="e.g. Premium Customer, Lead..."
                          {...field}
                          disabled={isLoading}
                          className="pl-11 h-12 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-green-500/10 transition-all"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs font-bold text-red-500" />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="h-12 px-6 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 px-8 rounded-xl font-bold bg-[#22B573] hover:bg-[#1da467] text-white shadow-lg shadow-green-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingTag ? 'Update Tag' : 'Create Tag'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
