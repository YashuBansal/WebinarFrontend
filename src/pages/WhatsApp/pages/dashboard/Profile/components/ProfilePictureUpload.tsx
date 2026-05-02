import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Loader2, AlertCircle, Camera, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export const ProfilePictureUpload = ({ 
  currentImageUrl, 
  onUpload, 
  isUploading 
}: ProfilePictureUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please use JPEG, PNG, or WebP.');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 5MB.');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onUpload(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const displayImageUrl = previewUrl || currentImageUrl;

  return (
    <div className="space-y-6">
      <div 
        className={`relative group h-64 rounded-[32px] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden ${
          dragActive ? 'border-green-500 bg-green-50/30' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {displayImageUrl ? (
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={displayImageUrl}
                alt="Profile"
                className="w-32 h-32 rounded-[40px] object-cover border-4 border-white shadow-2xl transition-transform duration-500 group-hover:scale-105"
              />
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[40px] backdrop-blur-[2px]">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              ) : (
                <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-green-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                  <Check className="h-5 w-5" />
                </div>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preview Active</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-[28px] bg-white shadow-lg flex items-center justify-center text-slate-300">
              <Camera className="h-10 w-10" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">Upload Identity</p>
              <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-widest">Drag & Drop or click below</p>
            </div>
          </div>
        )}
        
        {/* Progress Overlay */}
        <AnimatePresence>
          {dragActive && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-green-500/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none"
            >
              <div className="h-16 w-16 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          {displayImageUrl ? "Change Photo" : "Select Business Image"}
        </Button>
        <p className="text-[9px] text-center font-black uppercase tracking-[0.2em] text-slate-400">
          JPG, PNG, WEBP (Max 5MB)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />

      {error && (
        <Alert variant="destructive" className="rounded-2xl border-none bg-red-50 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
