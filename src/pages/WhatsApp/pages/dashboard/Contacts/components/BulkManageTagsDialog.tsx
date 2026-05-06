import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TagsSelector } from '@/components/ui/tags-selector';
import { useWabaTags } from '@/hooks/useTags';
import { X, Tag, Settings2, Loader2, Save } from 'lucide-react';

interface BulkManageTagsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  selectedContactsCount: number;
  isLoading?: boolean;
  onSubmit: (payload: { operation: 'add' | 'remove'; tags: string[] }) => Promise<void>;
}

export default function BulkManageTagsDialog({
  isOpen,
  onClose,
  projectId,
  selectedContactsCount,
  isLoading = false,
  onSubmit,
}: BulkManageTagsDialogProps) {
  const [operation, setOperation] = useState<'add' | 'remove'>('add');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { data: wabaTags = [] } = useWabaTags({ projectId });

  useEffect(() => {
    if (!isOpen) {
      setOperation('add');
      setSelectedTags([]);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    await onSubmit({ operation, tags: selectedTags });
  };

  const labelStyles = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[450px] border-0 bg-transparent p-0 shadow-none outline-none"
        onPointerDownOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <div className="relative w-full rounded-2xl p-8 shadow-2xl flex flex-col bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                <Settings2 className="h-3 w-3" />
                Bulk Operation
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Manage Tags
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Targeting {selectedContactsCount} selected contacts
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 transition-colors border border-transparent hover:border-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col">
              <Label className={labelStyles}>
                <Settings2 className="h-3 w-3" />
                Select Action
              </Label>
              <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => setOperation('add')}
                  className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all ${
                    operation === 'add' 
                      ? 'bg-white text-green-600 shadow-sm border border-slate-100' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Add Tags
                </button>
                <button
                  type="button"
                  onClick={() => setOperation('remove')}
                  className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all ${
                    operation === 'remove' 
                      ? 'bg-white text-red-600 shadow-sm border border-slate-100' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Remove Tags
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <Label className={labelStyles}>
                <Tag className="h-3 w-3" />
                Select Tags
              </Label>
              <TagsSelector
                tags={wabaTags}
                value={selectedTags}
                onChange={setSelectedTags}
                disabled={isLoading}
                placeholder="Search and select tags..."
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading}
                className="h-12 px-6 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || selectedTags.length === 0}
                className={`h-12 px-8 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                  operation === 'add' 
                    ? 'bg-[#22B573] hover:bg-[#1da467] text-white shadow-green-600/20' 
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {operation === 'add' ? 'Apply Tags' : 'Remove Tags'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
