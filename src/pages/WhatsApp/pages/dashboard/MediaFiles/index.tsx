import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  CheckCircle
} from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import { useMediaAssets, useDeleteMediaAsset, useUploadMediaAsset } from '@/hooks/useMediaAssets';
import { toastUtils } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import PaginationControls from './components/PaginationControls';
import FileThumbnail from './components/FileThumbnail';
import PreviewDialog from './components/PreviewDialog';

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
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a project to view media files.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Media Files
          </h1>
          <p className="text-muted-foreground">
            Manage your media files for {selectedProject.projectName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewType(viewType === 'grid' ? 'list' : 'grid')}
          >
            {viewType === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            {viewType === 'grid' ? 'List View' : 'Grid View'}
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMediaAssetMutation.isPending}
          >
            {uploadMediaAssetMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload Media
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/jpeg,image/png,image/jpg,video/mp4,video/3gpp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
      />

      {/* Upload Drop Zone Card */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        } ${uploadMediaAssetMutation.isPending ? 'opacity-75 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center text-center">
            {uploadMediaAssetMutation.isPending ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-sm font-medium">Uploading {selectedFile?.name}...</p>
                <p className="text-xs text-muted-foreground mt-1">Please wait</p>
              </>
            ) : selectedFile ? (
              <>
                <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelectedFile}
                  className="mt-2 text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">
                  Drag and drop a file here, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:underline font-medium"
                  >
                    browse
                  </button>
                </p>
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center justify-center gap-2">
                    <ImageIcon className="h-3 w-3" />
                    Images: jpeg, png, jpg (max 2MB)
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <VideoIcon className="h-3 w-3" />
                    Videos: mp4, 3gpp (max 16MB)
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <FileText className="h-3 w-3" />
                    Documents: pdf, word, excel, ppt (max 16MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Files</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by filename..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>File Type</Label>
            <div className="flex gap-2 flex-wrap">
              {(['ALL', 'IMAGE', 'VIDEO', 'DOCUMENT'] as FilterType[]).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange(type)}
                  className="flex items-center gap-2"
                >
                  {type === 'ALL' && <FileText className="h-4 w-4" />}
                  {type === 'IMAGE' && <ImageIcon className="h-4 w-4" />}
                  {type === 'VIDEO' && <VideoIcon className="h-4 w-4" />}
                  {type === 'DOCUMENT' && <FileText className="h-4 w-4" />}
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {mediaAssetsData ? (
              <>
                Showing {filteredFiles.length} of {mediaAssetsData.total} files
                {filterType !== 'ALL' && ` (${filterType.toLowerCase()} files only)`}
                {mediaAssetsData.total > limit && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (Page {mediaAssetsData.page} of {Math.ceil(mediaAssetsData.total / limit)})
                  </span>
                )}
              </>
            ) : (
              'Loading files...'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
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
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No files found</p>
              <p className="text-sm">
                {searchTerm 
                  ? `No files match "${searchTerm}"`
                  : `No ${filterType.toLowerCase()} files available`
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full">
              <div className={viewType === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                {filteredFiles.map((file) => (
                  <div
                    key={file._id}
                    className={`p-4 border rounded-lg transition-all hover:shadow-sm ${
                      viewType === 'grid' 
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-800' 
                        : 'flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {viewType === 'grid' ? (
                      <div className="space-y-3">
                        <FileThumbnail file={file} size="large" rounded={true} />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block" title={file.fileName}>
                              {file.fileName}
                            </span>
                            <div className="text-xs text-muted-foreground mt-1">
                              <span>Size: {formatFileSize(file.fileSize)}</span>
                              <span className="ml-2">Uploaded: {formatDate(file.createdAt)}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(file)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handlePreview(file)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleCopyUrl(file.filePath)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy URL
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-shrink-0">
                          <FileThumbnail file={file} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate max-w-40" title={file.fileName}>
                              {file.fileName}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(file.fileSize)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(file.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(file)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyUrl(file.filePath)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(file)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {mediaAssetsData && (
            <PaginationControls
              page={mediaAssetsData.page}
              total={mediaAssetsData.total}
              limit={limit}
              onChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen && fileToDelete}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Media File"
        description={`Are you sure you want to delete "${fileToDelete?.fileName || 'this file'}"? This action cannot be undone.`}
        confirmText="Delete File"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMediaAssetMutation.isPending}
      />

      <PreviewDialog
        file={previewFile}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </div>
  );
};

export default MediaFiles;


