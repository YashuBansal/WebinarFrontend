import { useState, useEffect } from 'react'
import { Button } from '@zoom/components/ui/button'
import { Alert, AlertDescription } from '@zoom/components/ui/alert'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void | Promise<void>
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

export default function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}: ConfirmationDialogProps) {
  const [verificationCode, setVerificationCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [error, setError] = useState('')

  // Generate random 6-digit code when dialog opens
  useEffect(() => {
    if (open) {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      setVerificationCode(code)
      setInputCode('')
      setError('')
    }
  }, [open])

  const handleConfirm = async () => {
    if (inputCode !== verificationCode) {
      setError('Verification code does not match')
      return
    }

    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('Confirmation failed:', error)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    setInputCode('')
    setError('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={handleCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          
          {/* Verification Code Display */}
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg inline-block">
              {verificationCode}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Please enter the verification code above to confirm this action
            </p>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <label htmlFor="verification-input" className="text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              id="verification-input"
              type="text"
              value={inputCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setInputCode(e.target.value)
                setError('')
              }}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || inputCode.length !== 6}
            >
              {isLoading ? 'Processing...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
