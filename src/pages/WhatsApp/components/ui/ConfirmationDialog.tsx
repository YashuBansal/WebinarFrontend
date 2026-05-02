import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';
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
  requireOtpMatch?: boolean;
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
  requireOtpMatch = false,
}: ConfirmationDialogProps) {
  const [otp, setOtp] = useState('');
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    if (isOpen && requireOtpMatch) {
      const value = Math.floor(100000 + Math.random() * 900000).toString();
      setOtp(value);
      setUserInput('');
    }
    if (!isOpen) {
      setOtp('');
      setUserInput('');
    }
  }, [isOpen, requireOtpMatch]);

  const handleConfirm = () => {
    onConfirm();
  };

  const isOtpValid =
    !requireOtpMatch || (userInput.trim() !== '' && userInput.trim() === otp);

  return (
    <Dialog open={isOpen} onOpenChange={isLoading ? undefined : onClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isLoading}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                variant === 'destructive'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2 space-y-3">
            <p>{description}</p>
            {requireOtpMatch && otp && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  To confirm, type the number{' '}
                  <span className="font-semibold text-foreground">{otp}</span>{' '}
                  below.
                </p>
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter the number shown above"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading || !isOtpValid}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
