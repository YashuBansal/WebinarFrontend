import React from 'react';
import { Image, Video, FileText } from 'lucide-react';

type MediaFile = {
  mimeType?: string;
  filePath?: string;
  fileName?: string;
};

type Props = {
  file: MediaFile;
  size?: 'small' | 'large';
  rounded?: boolean;
};

const getFileIcon = (mimeType?: string) => {
  if (mimeType?.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (mimeType?.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
  return <FileText className="h-5 w-5 text-green-500" />;
};

const FileThumbnail: React.FC<Props> = ({ file, size = 'small', rounded = true }) => {
  const baseClass = size === 'large' ? 'w-full h-40' : 'w-12 h-12';
  const radiusClass = rounded ? 'rounded-lg' : '';
  const containerClass = `${baseClass} ${radiusClass} overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0`;

  if (!file || !file.mimeType) {
    return (
      <div className={`${baseClass} ${radiusClass} bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0`}>
        <FileText className="h-5 w-5 text-slate-300" />
      </div>
    );
  }

  if (file.mimeType.startsWith('image/')) {
    return (
      <div className={containerClass}>
        <img
          src={file.filePath}
          alt={file.fileName}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
            if (nextElement) {
              nextElement.style.display = 'flex';
            }
          }}
        />
        <div className="w-full h-full flex items-center justify-center" style={{ display: 'none' }}>
          {getFileIcon(file.mimeType)}
        </div>
      </div>
    );
  }

  if (file.mimeType.startsWith('video/')) {
    return (
      <div className={`${containerClass} relative`}>
        <video
          src={file.filePath}
          className="w-full h-full object-cover"
          muted
          preload="metadata"
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
              const img = video.nextElementSibling as HTMLImageElement;
              if (img) {
                img.src = thumbnailUrl;
                img.style.display = 'block';
                video.style.display = 'none';
              }
            }
          }}
          onError={() => {
            const video = document.querySelector(`video[src="${file.filePath}"]`) as HTMLVideoElement;
            if (video) {
              video.style.display = 'none';
              const iconDiv = video.nextElementSibling?.nextElementSibling as HTMLElement;
              if (iconDiv) {
                iconDiv.style.display = 'flex';
              }
            }
          }}
        />
        <img
          src=""
          alt={file.fileName}
          className="w-full h-full object-cover"
          style={{ display: 'none' }}
          loading="lazy"
        />
        <div className="w-full h-full flex items-center justify-center" style={{ display: 'none' }}>
          {getFileIcon(file.mimeType)}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClass} ${radiusClass} bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0`}>
      {getFileIcon(file.mimeType)}
    </div>
  );
};

export default FileThumbnail;


