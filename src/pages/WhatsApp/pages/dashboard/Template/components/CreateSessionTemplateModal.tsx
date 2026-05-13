import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Label } from '../../../../components/ui/label';
import { useQuickReplies } from '../../../../hooks/useQuickReplies';
import { Zap, Loader2 } from 'lucide-react';

interface CreateSessionTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function CreateSessionTemplateModal({
  isOpen,
  onClose,
  projectId,
}: CreateSessionTemplateModalProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const { createQuickReply, isCreating } = useQuickReplies(projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    try {
      await createQuickReply({
        projectId,
        name: name.trim().toLowerCase().replace(/\s+/g, '_'),
        content: content.trim()
      });
      onClose();
      setName('');
      setContent('');
    } catch (error) {
      console.error('Failed to create session template:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[32px] overflow-hidden">
        <DialogHeader className="bg-slate-50/80 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Create Session Template</DialogTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">No Meta approval required for session messages.</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Template Name</Label>
            <Input
              id="name"
              placeholder="e.g. follow_up_message"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-2xl border-slate-200 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Message Content</Label>
            <Textarea
              id="content"
              placeholder="Type your session message here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] rounded-2xl border-slate-200 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium resize-none p-4"
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-12 rounded-2xl font-bold text-slate-500 hover:text-slate-700 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !name.trim() || !content.trim()}
              className="h-12 px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xl shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Template'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
