import React from 'react';
import { 
  Dialog, 
  DialogContent, 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Copy, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon,
  Calendar,
  HardDrive,
  X,
  Eye,
  ArrowRight
} from 'lucide-react';
import { toastUtils } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

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
      <DialogContent 
        className="max-w-4xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden rounded-[24px] shadow-2xl"
        showCloseButton={false}
      >
        <div className="relative w-full overflow-hidden flex flex-col">
          {/* Premium Header */}
          <div className="bg-slate-50 dark:bg-slate-950 px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                {isImage && <ImageIcon className="h-6 w-6 text-blue-500" />}
                {isVideo && <VideoIcon className="h-6 w-6 text-purple-500" />}
                {!isImage && !isVideo && <FileText className="h-6 w-6 text-orange-500" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1 max-w-md">
                  {file.fileName}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <HardDrive className="h-3 w-3" />
                    {formatFileSize(file.fileSize)}
                  </div>
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Calendar className="h-3 w-3" />
                    {formatDate(file.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-10 w-10 rounded-xl hover:bg-black/5 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="p-8 flex-1 overflow-auto bg-[#fafafa] dark:bg-slate-950">
            <div className="min-h-[400px] flex items-center justify-center bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-inner overflow-hidden relative group">
              {isImage && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={file.filePath}
                  alt={file.fileName}
                  className="max-w-full max-h-[60vh] object-contain transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              {isVideo && (
                <video
                  src={file.filePath}
                  className="max-w-full max-h-[60vh] object-contain"
                  controls
                  autoPlay
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              {!isImage && !isVideo && (
                <div className="flex flex-col items-center justify-center text-center p-12 space-y-6">
                  <div className="h-24 w-24 rounded-[32px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm">
                    <FileText className="h-12 w-12 text-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-slate-900 dark:text-white">Preview not available</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-sm mx-auto">
                      This file type cannot be previewed in the browser. You can download it or copy the URL to access it.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest shadow-sm">
                  {file.mimeType}
                </Badge>
              </div>
            </div>
          </div>

          {/* Premium Footer */}
          <div className="px-8 py-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-none font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest">
                ID: {file._id.slice(-8)}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleCopyUrl}
                className="h-11 px-5 rounded-xl border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy URL
              </Button>
              <Button
                onClick={handleDownload}
                className="h-11 px-6 rounded-xl flex items-center gap-2 text-white font-bold text-sm shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: "#22B573" }}
              >
                <Download className="h-4 w-4" />
                Download File
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDialog;


