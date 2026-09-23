import React, { useState } from 'react';
import { Music, Disc, User } from 'lucide-react';
import { useDataSaver } from '../../context/DataSaverContext';

interface OptimizedImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackType?: 'music' | 'album' | 'artist';
  aspectRatio?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackType = 'music',
  aspectRatio = 'aspect-square',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { isDataSaverEnabled } = useDataSaver();

  const handleImageError = () => {
    setHasError(true);
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  // Render placeholder fallback icon
  const renderFallback = () => {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500 p-2 ${aspectRatio} ${className}`}
      >
        {fallbackType === 'artist' ? (
          <User className="w-1/3 h-1/3 stroke-[1.5px] text-slate-400" />
        ) : fallbackType === 'album' ? (
          <Disc className="w-1/3 h-1/3 stroke-[1.5px] text-slate-400" />
        ) : (
          <Music className="w-1/3 h-1/3 stroke-[1.5px] text-slate-400" />
        )}
      </div>
    );
  };

  // If no source or error occurred, show fallback
  if (!src || hasError) {
    return renderFallback();
  }

  // Under Data Saver mode, if it's an external uncompressed image, show lightweight styled canvas fallback or placeholder
  if (isDataSaverEnabled && (src.includes('unsplash.com') || src.includes('http'))) {
    // Append quality parameters if unsplash
    if (src.includes('unsplash.com')) {
      const saverSrc = src.replace(/w=\d+/, 'w=150').replace(/q=\d+/, 'q=40');
      return (
        <div className={`relative overflow-hidden ${aspectRatio} ${className}`}>
          <img
            src={saverSrc}
            alt={alt}
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      );
    }
  }

  return (
    <div className={`relative overflow-hidden bg-slate-800/60 ${aspectRatio} ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center text-slate-600">
          <Music className="w-5 h-5 opacity-40" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
