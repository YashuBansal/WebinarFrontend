import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TagsSelector } from '@/components/ui/tags-selector';
import { useWabaTags } from '@/hooks/useTags';

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Tags ({selectedContactsCount} contacts)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Operation</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={operation === 'add' ? 'default' : 'outline'}
                onClick={() => setOperation('add')}
              >
                Add Tags
              </Button>
              <Button
                type="button"
                variant={operation === 'remove' ? 'default' : 'outline'}
                onClick={() => setOperation('remove')}
              >
                Remove Tags
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Tags</Label>
            <TagsSelector
              tags={wabaTags}
              value={selectedTags}
              onChange={setSelectedTags}
              disabled={isLoading}
              placeholder="Select tags..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || selectedTags.length === 0}
            >
              {isLoading ? 'Updating...' : operation === 'add' ? 'Add Tags' : 'Remove Tags'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
