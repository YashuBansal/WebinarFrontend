import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Image, Video, FileText, Upload, Eye, Copy, X, CheckCircle } from 'lucide-react';
import { toastUtils } from '@/lib/utils';
import PreviewDialog from '@/pages/dashboard/MediaFiles/components/PreviewDialog';
import FileThumbnail from '@/pages/dashboard/MediaFiles/components/FileThumbnail';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useUploadMediaAsset } from '@/hooks/useMediaAssets';
import { useProjectContext } from '@/context/ProjectContext';

interface MediaFile {
  _id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface MediaFileDialogProps {
  children: React.ReactNode;
  mediaFiles: MediaFile[];
  isLoading: boolean;
  error: any;
  selectedFile: MediaFile | null;
  onFileSelect: (file: MediaFile) => void;
  onUploadNew: () => void;
  fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null;
  title?: string;
}

export const MediaFileDialog: React.FC<MediaFileDialogProps> = ({
  children,
  mediaFiles,
  isLoading,
  error,
  selectedFile,
  onFileSelect,
  fileType,
  title = "Select Media File"
}) => {
  const { selectedProject } = useProjectContext();
  const uploadMediaAssetMutation = useUploadMediaAsset();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  
  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filter files based on search term and file type
  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !fileType || (
      fileType === 'IMAGE' && file.mimeType.startsWith('image/') ||
      fileType === 'VIDEO' && file.mimeType.startsWith('video/') ||
      fileType === 'DOCUMENT' && file.mimeType.startsWith('application/')
    );
    return matchesSearch && matchesType;
  });

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
    return <FileText className="h-5 w-5 text-green-500" />;
  };

  // Upload handlers
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/jpg',
    'video/mp4', 'video/3gpp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!allowedMimeTypes.includes(file.type)) {
      return 'Invalid file type. Only images (jpeg, png), videos (mp4, 3gpp), and documents (pdf, word, excel, ppt) are allowed.';
    }
    
    const isImage = file.type.startsWith('image/');
    const maxSize = isImage ? 2 * 1024 * 1024 : 16 * 1024 * 1024; // 2MB for images, 16MB for others
    
    if (file.size > maxSize) {
      return `File size too large. Maximum size for ${isImage ? 'images' : 'videos/documents'} is ${isImage ? '2MB' : '16MB'}.`;
    }
    
    return null;
  };

  const handleFileSelectForUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toastUtils.error(validationError);
      return;
    }

    setSelectedFileForUpload(file);
    
    if (!selectedProject?._id) {
      toastUtils.error('No project selected');
      return;
    }

    try {
      const res = await uploadMediaAssetMutation.mutateAsync({
        file,
        projectId: selectedProject._id,
      });
      toastUtils.success(`"${file.name}" uploaded successfully`);
      setSelectedFileForUpload(null);
      
      // Auto-select the newly uploaded file
      if (res.data) {
        onFileSelect(res.data);
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Upload failed';
      toastUtils.error(errorMsg);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelectForUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelectForUpload(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFileForUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (file: MediaFile) => {
    onFileSelect(file);
    setIsOpen(false);
  };

  const handleUploadNew = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-[90vw] w-[90vw] lg:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(`image/${fileType?.toLowerCase() || 'file'}`)}
            {title}
            {fileType && (
              <Badge variant="secondary">
                {fileType.toLowerCase()} files only
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/jpeg,image/png,image/jpg,video/mp4,video/3gpp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
          />

          {/* Search and Upload */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleUploadNew} 
              variant="outline"
              disabled={uploadMediaAssetMutation.isPending}
            >
              {uploadMediaAssetMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload New
            </Button>
          </div>

          {/* Upload Status */}
          {selectedFileForUpload && (
            <div className={`border rounded-lg p-3 ${
              uploadMediaAssetMutation.isPending 
                ? 'border-primary bg-primary/10' 
                : uploadMediaAssetMutation.isSuccess
                ? 'border-green-500 bg-green-50 dark:bg-green-900'
                : 'border-muted'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {uploadMediaAssetMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : uploadMediaAssetMutation.isSuccess ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{selectedFileForUpload.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatFileSize(selectedFileForUpload.size)})
                  </span>
                </div>
                {!uploadMediaAssetMutation.isPending && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelectedFile}
                    className="h-7"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {uploadMediaAssetMutation.isPending && (
                <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
              )}
            </div>
          )}

          {/* File Grid */}
          <div 
            className={`min-h-[300px] transition-colors ${
              isDragging ? 'border-2 border-dashed border-primary bg-primary/10 rounded-lg' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading media files...</span>
              </div>
            ) : error ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load media files. Please try again.
                </AlertDescription>
              </Alert>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Image className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-1">No files found</p>
                <p className="text-sm text-muted-foreground mb-2">
                  {searchTerm 
                    ? `No files match "${searchTerm}"`
                    : `No ${fileType?.toLowerCase() || 'media'} files available`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop a file here or click "Upload New" to add files
                </p>
              </div>
            ) : (
              <ScrollArea className={`h-[400px] rounded-md border ${
                isDragging ? 'border-primary' : ''
              }`}>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredFiles.map((file) => (
                      <div
                        key={file._id}
                        className={`group relative p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedFile?._id === file._id 
                            ? 'border-primary bg-primary/10' 
                            : 'hover:border-primary'
                        }`}
                        onClick={() => handleFileSelect(file)}
                      >
                        {/* Thumbnail */}
                        <div className="aspect-square w-full rounded-md bg-muted overflow-hidden mb-2 flex items-center justify-center">
                          <FileThumbnail file={file} size="large" rounded={true} />
                        </div>

                        {/* File Name */}
                        <div className="h-8 mb-2">
                          <p className="text-xs font-medium line-clamp-2" title={file.fileName}>
                            {file.fileName}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewFile(file);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 flex-1"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await navigator.clipboard.writeText(file.filePath);
                                toastUtils.success('URL copied to clipboard');
                              } catch (err) {
                                toastUtils.error('Failed to copy URL');
                              }
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} found
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              {selectedFile && (
                <Button onClick={() => handleFileSelect(selectedFile)}>
                  Select File
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <PreviewDialog file={previewFile} open={previewOpen} onOpenChange={setPreviewOpen} />
    </Dialog>
  );
};
