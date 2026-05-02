import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Loader2 } from 'lucide-react';

interface DialogFallbackProps {
  title?: string;
}

export default function DialogFallback({ title = 'Loading...' }: DialogFallbackProps) {
  return (
    <Dialog open>
      <DialogContent className="flex flex-col items-center justify-center gap-3">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Loader2 className="h-6 w-6 animate-spin" />
      </DialogContent>
    </Dialog>
  );
}



