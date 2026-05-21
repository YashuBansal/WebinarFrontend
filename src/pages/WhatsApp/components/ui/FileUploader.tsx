import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, CheckCircle, Loader2, FileText, Image, Video } from 'lucide-react';
import axiosInstance from '@/api/axios';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onUploadSuccess: (result: any) => void;
  onUploadError: (error: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  uploadEndpoint: string;
  uploadFieldName?: string;
  additionalData?: Record<string, any>;
  disabled?: boolean;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  onUploadSuccess,
  onUploadError,
  accept = "*",
  maxSize = 16, // 16MB default
  uploadEndpoint,
  uploadFieldName = 'file',
  additionalData = {},
  disabled = false,
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      const error = `File size too large. Maximum size is ${maxSize}MB.`;
      setErrorMessage(error);
      setUploadStatus('error');
      onUploadError(error);
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
    setErrorMessage('');

    // Call the onFileSelect callback
    onFileSelect(file);

    // Auto-upload the file
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const formData = new FormData();
      formData.append(uploadFieldName, file);
      
      // Add additional data
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await axiosInstance.post(uploadEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus('success');
      onUploadSuccess(response.data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
      setErrorMessage(errorMsg);
      setUploadStatus('error');
      onUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label htmlFor="file-upload">Choose File</Label>
        <Input
          id="file-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          disabled={disabled || isUploading}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Maximum file size: {maxSize}MB
        </p>
      </div>

      {selectedFile && (
        <div className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon(selectedFile)}
              <span className="text-sm font-medium truncate max-w-40">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">
                ({formatFileSize(selectedFile.size)})
              </span>
            </div>
            
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Uploaded</span>
              </div>
            )}
            
            {uploadStatus === 'error' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {isUploading && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          )}

          {uploadStatus === 'error' && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};
