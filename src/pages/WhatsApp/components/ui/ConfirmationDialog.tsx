import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
} from './dialog';
import { Button } from './button';
import { X, Loader2 } from 'lucide-react';
import { Input } from './input';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
  /** When true, require typing a random number shown in the dialog to enable confirm. */
  requireSecurityCode?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
  requireSecurityCode = false,
}: ConfirmationDialogProps) {
  const [securityCode, setSecurityCode] = useState('');
  const [targetCode, setTargetCode] = useState('');

  // Generate a random 6-digit number when opened
  useEffect(() => {
    if (isOpen && requireSecurityCode) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setTargetCode(code);
      setSecurityCode('');
    }
  }, [isOpen, requireSecurityCode]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-sm border-0 bg-transparent p-0 shadow-none outline-none"
        showCloseButton={false}
      >
        <div className="relative w-full rounded-2xl p-6 shadow-2xl flex flex-col bg-white border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-900">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-6 mb-8">
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              {description}
            </p>

            {requireSecurityCode && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    Security Verification
                  </label>
                  <span className="text-lg font-black tracking-[0.3em] text-slate-900 select-none bg-white px-3 py-1 rounded-lg border border-slate-200">
                    {targetCode}
                  </span>
                </div>
                <Input
                  type="text"
                  placeholder="Type the 6-digit code above"
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value)}
                  className="h-12 text-center text-lg font-bold tracking-[0.2em] bg-white border-slate-200 rounded-xl focus:ring-slate-500/20"
                  maxLength={6}
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-auto w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl px-4 py-2.5 font-medium border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading || (requireSecurityCode && securityCode !== targetCode)}
              className={`rounded-xl px-6 py-2.5 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-white shadow-lg ${
                variant === 'destructive' 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                  : 'bg-[#22B573] hover:bg-[#1da467] shadow-green-600/20'
              }`}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
