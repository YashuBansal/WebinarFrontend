import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Trash2,
  Eye,
  Copy,
  Filter,
  Grid,
  List,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  LayoutGrid,
  File,
  HardDrive,
  Calendar,
  Layers
} from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import { useMediaAssets, useDeleteMediaAsset, useUploadMediaAsset, type MediaAsset } from '@/hooks/useMediaAssets';
import { toastUtils } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import ConfirmDeleteModal from '../../../../../components/ConfirmDeleteModal';
import PaginationControls from './components/PaginationControls';
import FileThumbnail from './components/FileThumbnail';
import PreviewDialog from './components/PreviewDialog';
import { Badge } from '@/components/ui/badge';

type FilterType = 'ALL' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
type ViewType = 'grid' | 'list';

const MediaFiles: React.FC = () => {
  const { selectedProject } = useProjectContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 12;
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { data: mediaAssetsData, isLoading, error } = useMediaAssets({
    projectId: selectedProject?._id || '',
    page: currentPage,
    limit: limit,
    type: filterType,
  });

  const deleteMediaAssetMutation = useDeleteMediaAsset();
  const uploadMediaAssetMutation = useUploadMediaAsset();

  const filteredFiles = (mediaAssetsData?.data || []).filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || (
      filterType === 'IMAGE' && file.mimeType.startsWith('image/') ||
      filterType === 'VIDEO' && file.mimeType.startsWith('video/') ||
      filterType === 'DOCUMENT' && file.mimeType.startsWith('application/')
    );
    return matchesSearch && matchesType;
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilterType(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!fileToDelete || !selectedProject?._id) return;
    try {
      await deleteMediaAssetMutation.mutateAsync({
        projectId: selectedProject._id,
        mediaAssetId: fileToDelete._id,
      });
      toastUtils.success(`File "${fileToDelete.fileName}" deleted successfully`);
      setDeleteDialogOpen(false);
    } catch (error) {
      toastUtils.error('Failed to delete file');
    }
  };

  const openDeleteDialog = (file: any) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handlePreview = (file: any) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toastUtils.success('URL copied to clipboard');
    } catch (e) {
      toastUtils.error('Failed to copy URL');
    }
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

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toastUtils.error(validationError);
      return;
    }

    setSelectedFile(file);

    if (!selectedProject?._id) return;

    try {
      await uploadMediaAssetMutation.mutateAsync({
        file,
        projectId: selectedProject._id,
      });
      toastUtils.success(`"${file.name}" uploaded successfully`);
      setSelectedFile(null);
      setCurrentPage(1); // Reset to first page to see the new upload
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Upload failed';
      toastUtils.error(errorMsg);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
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
      handleFileSelect(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!selectedProject) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 mb-2">No Project Selected</AlertTitle>
          <AlertDescription className="text-slate-500 font-medium">
            Please select a project to manage its media assets.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest mb-1">
              <Layers className="h-3.5 w-3.5" />
              Media Library
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Media Management
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              Manage your brand assets and media files for <span className="text-slate-900 font-bold">{selectedProject.projectName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewType('grid')}
                className={`h-9 w-9 rounded-lg transition-all duration-300 ${
                  viewType === 'grid' 
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewType('list')}
                className={`h-9 w-9 rounded-lg transition-all duration-300 ${
                  viewType === 'list' 
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMediaAssetMutation.isPending}
              className="h-11 px-6 rounded-xl flex items-center gap-2 bg-[#22B573] hover:bg-[#1da467] text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {uploadMediaAssetMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload Media
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/jpeg,image/png,image/jpg,video/mp4,video/3gpp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
        />

        {/* Upload Drop Zone Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`group relative bg-white border-2 border-dashed rounded-[24px] p-8 transition-all duration-300 overflow-hidden ${isDragging
            ? 'border-green-500 bg-green-50/50 shadow-xl shadow-green-900/5'
            : 'border-slate-200 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-900/5'
            } ${uploadMediaAssetMutation.isPending ? 'opacity-75 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="absolute top-0 right-0 -mr-24 -mt-24 h-64 w-64 rounded-full bg-green-500/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {uploadMediaAssetMutation.isPending ? (
              <div className="py-4">
                <div className="relative mb-4">
                  <div className="h-20 w-20 rounded-2xl bg-green-50 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Uploading File...</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Please wait while we process "{selectedFile?.name}"</p>
              </div>
            ) : selectedFile ? (
              <div className="py-4">
                <div className="relative mb-4">
                  <div className="h-20 w-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedFile.name}</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  Ready to upload ({formatFileSize(selectedFile.size)})
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelectedFile}
                  className="mt-4 h-9 rounded-xl border-slate-200 text-slate-600 font-bold text-xs"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="py-2">
                <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:bg-green-50 group-hover:border-green-100 transition-all duration-500">
                  <Upload className="h-8 w-8 text-slate-400 group-hover:text-green-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Upload New Assets</h3>
                <p className="text-slate-500 text-sm font-medium mb-6">
                  Drag and drop your files here, or <button onClick={() => fileInputRef.current?.click()} className="text-green-600 font-bold hover:underline">browse files</button>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-blue-500 shadow-sm">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Images</p>
                      <p className="text-xs font-bold text-slate-600">Max 2MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-purple-500 shadow-sm">
                      <VideoIcon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Videos</p>
                      <p className="text-xs font-bold text-slate-600">Max 16MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-orange-500 shadow-sm">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Docs</p>
                      <p className="text-xs font-bold text-slate-600">Max 16MB</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Filters & Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                <Search className="h-3 w-3" />
                Find Assets
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Search by filename..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-green-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                <Filter className="h-3 w-3" />
                Filter by Type
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['ALL', 'IMAGE', 'VIDEO', 'DOCUMENT'] as FilterType[]).map((type) => (
                  <Button
                    key={type}
                    variant={filterType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange(type)}
                    className={`h-11 px-4 rounded-xl flex items-center gap-2 font-bold text-xs transition-all ${filterType === type
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {type === 'ALL' && <LayoutGrid className="h-3.5 w-3.5" />}
                    {type === 'IMAGE' && <ImageIcon className="h-3.5 w-3.5" />}
                    {type === 'VIDEO' && <VideoIcon className="h-3.5 w-3.5" />}
                    {type === 'DOCUMENT' && <FileText className="h-3.5 w-3.5" />}
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Media Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {mediaAssetsData ? (
                  <>
                    Showing <span className="text-green-600">{filteredFiles.length}</span> of {mediaAssetsData.total} files
                  </>
                ) : (
                  'Scanning media library...'
                )}
              </h2>
              {filterType !== 'ALL' && (
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Filtered by {filterType.toLowerCase()}s</p>
              )}
            </div>

            {mediaAssetsData && mediaAssetsData.total > limit && (
              <Badge variant="secondary" className="bg-slate-100 border-none text-slate-600 font-bold px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest">
                Page {mediaAssetsData.page} / {Math.ceil(mediaAssetsData.total / limit)}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-slate-50 border-t-green-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <HardDrive className="h-8 w-8 text-slate-200" />
                </div>
              </div>
              <p className="mt-6 text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Media Assets</p>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="rounded-2xl border-none shadow-lg bg-white p-6">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <AlertTitle className="text-red-900 font-bold">Connection Error</AlertTitle>
              <AlertDescription className="text-red-600 font-medium mt-1">
                We couldn't load your media files. Please refresh the page and try again.
              </AlertDescription>
            </Alert>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm text-center px-4">
              <div className="h-20 w-20 bg-slate-50 rounded-[24px] flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No files found</h3>
              <p className="text-slate-500 font-medium max-w-xs mx-auto">
                {searchTerm
                  ? `We couldn't find any assets matching "${searchTerm}"`
                  : `Your ${filterType.toLowerCase()} library is currently empty. Start by uploading some assets.`
                }
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-6 rounded-xl border-slate-200 font-bold text-slate-600">
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className={viewType === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-3'}>
              <AnimatePresence mode="popLayout">
                {filteredFiles.map((file: MediaAsset, idx) => (
                  <motion.div
                    key={file._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className={`group relative bg-white border border-slate-200 rounded-[20px] transition-all duration-300 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-900/5 overflow-hidden ${viewType === 'list' ? 'flex items-center p-3 gap-4' : ''
                      }`}
                  >
                    {viewType === 'grid' ? (
                      <div className="flex flex-col h-full">
                        <div className="relative aspect-video overflow-hidden bg-slate-50 group/thumb">
                          <FileThumbnail file={file} size="large" rounded={false} />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-9 w-9 rounded-xl bg-white/90 hover:bg-white text-slate-900 border-none shadow-xl scale-90 group-hover/thumb:scale-100 transition-all duration-300"
                              onClick={() => handlePreview(file)}
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-9 w-9 rounded-xl bg-white/90 hover:bg-white text-slate-900 border-none shadow-xl scale-90 group-hover/thumb:scale-100 transition-all duration-300 delay-[50ms]"
                              onClick={() => handleCopyUrl(file.filePath)}
                            >
                              <Copy className="h-4.5 w-4.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-green-600 transition-colors" title={file.fileName}>
                                {file.fileName}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  {formatFileSize(file.fileSize)}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(file)}
                              className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Calendar className="h-3 w-3" />
                              <span className="text-[10px] font-medium">{formatDate(file.createdAt)}</span>
                            </div>
                            <Badge variant="outline" className="text-[9px] h-5 rounded-md border-slate-100 text-slate-400 font-black uppercase tracking-widest bg-slate-50/50">
                              {file.mimeType.split('/')[1].toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                          <FileThumbnail file={file} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate" title={file.fileName}>
                            {file.fileName}
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {formatFileSize(file.fileSize)}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {formatDate(file.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(file)}
                            className="h-9 w-9 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyUrl(file.filePath)}
                            className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                          >
                            <Copy className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(file)}
                            className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {mediaAssetsData && mediaAssetsData.total > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <PaginationControls
                page={mediaAssetsData.page}
                total={mediaAssetsData.total}
                limit={limit}
                onChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </main>

      {deleteDialogOpen && fileToDelete && (
        <ConfirmDeleteModal
          setModal={(val) => {
            if (!val) {
              setDeleteDialogOpen(false);
              setFileToDelete(null);
            }
          }}
          triggerDelete={handleDelete}
          isLoading={deleteMediaAssetMutation.isPending}
          itemName={fileToDelete.fileName}
          title="Delete Media File"
        />
      )}

      <PreviewDialog
        file={previewFile}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </div>
  );
};

export default MediaFiles;


