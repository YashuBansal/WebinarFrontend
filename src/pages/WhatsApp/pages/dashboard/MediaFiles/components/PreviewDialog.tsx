import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Copy, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon,
  Calendar,
  HardDrive
} from 'lucide-react';
import { toastUtils } from '@/lib/utils';

type MediaFile = {
  _id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
};

type Props = {
  file: MediaFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PreviewDialog: React.FC<Props> = ({ file, open, onOpenChange }) => {
  const isImage = !!file?.mimeType?.startsWith('image/');
  const isVideo = !!file?.mimeType?.startsWith('video/');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCopyUrl = async () => {
    if (!file?.filePath) return;
    try {
      await navigator.clipboard.writeText(file.filePath);
      toastUtils.success('URL copied to clipboard');
    } catch (e) {
      toastUtils.error('Failed to copy URL');
    }
  };

  const handleDownload = () => {
    if (!file?.filePath) return;
    const link = document.createElement('a');
    link.href = file.filePath;
    link.download = file.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastUtils.success('Download started');
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold truncate" title={file.fileName}>
                {file.fileName}
              </DialogTitle>
              <DialogDescription className="mt-2 space-y-1">
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-2">
                    {isImage && <ImageIcon className="h-4 w-4" />}
                    {isVideo && <VideoIcon className="h-4 w-4" />}
                    {!isImage && !isVideo && <FileText className="h-4 w-4" />}
                    <span>{file.mimeType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span>{formatFileSize(file.fileSize)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(file.createdAt)}</span>
                  </div>
                </div>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg">
            {isImage && (
              <div className="w-full flex items-center justify-center">
                <img
                  src={file.filePath}
                  alt={file.fileName}
                  className="max-w-full max-h-[calc(90vh-300px)] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            {isVideo && (
              <div className="w-full flex items-center justify-center">
                <video
                  src={file.filePath}
                  className="max-w-full max-h-[calc(90vh-300px)] object-contain rounded-lg shadow-lg"
                  controls
                  autoPlay
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            {!isImage && !isVideo && (
              <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="p-6 rounded-full bg-muted">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">Preview not available</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    This file type cannot be previewed. Use the download or copy URL button to access the file.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDialog;


