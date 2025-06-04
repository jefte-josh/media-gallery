'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Masonry from 'react-masonry-css';
import Image from 'next/image';

interface MediaData {
  src: string;
  type: 'image' | 'video';
  width: number;
  height: number;
  alt?: string;
  size: number;
  lastModified: string;
}

type ViewMode = 'grid' | 'list';

export default function Gallery() {
  const [media, setMedia] = useState<MediaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaData | null>(null);
  const [preloadedMedia, setPreloadedMedia] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [videoLoadingProgress, setVideoLoadingProgress] = useState<Record<string, number>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  // Preload next and previous media
  const preloadAdjacentMedia = useCallback((currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    const prevIndex = currentIndex - 1;
    const newPreloaded = new Set(preloadedMedia);

    if (nextIndex < media.length) {
      newPreloaded.add(media[nextIndex].src);
    }
    if (prevIndex >= 0) {
      newPreloaded.add(media[prevIndex].src);
    }

    setPreloadedMedia(newPreloaded);
  }, [media, preloadedMedia]);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        const response = await fetch('/api/images');
        const data = await response.json();
        setMedia(data);
      } catch (error) {
        console.error('Error loading media:', error);
        setMedia([]);
      } finally {
        setLoading(false);
      }
    };

    loadMedia();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedMedia) return;

      const currentIndex = media.findIndex(m => m.src === selectedMedia.src);
      
      switch (e.key) {
        case 'ArrowRight':
          if (currentIndex < media.length - 1) {
            setSelectedMedia(media[currentIndex + 1]);
            preloadAdjacentMedia(currentIndex + 1);
          }
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            setSelectedMedia(media[currentIndex - 1]);
            preloadAdjacentMedia(currentIndex - 1);
          }
          break;
        case 'Escape':
          setSelectedMedia(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, media, preloadAdjacentMedia]);

  const handleVideoProgress = (src: string, e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const progress = (video.buffered.length > 0) ? (video.buffered.end(video.buffered.length - 1) / video.duration) * 100 : 0;
    setVideoLoadingProgress(prev => ({ ...prev, [src]: progress }));
  };

  const breakpointColumns = {
    default: viewMode === 'grid' ? 4 : 1,
    1280: viewMode === 'grid' ? 3 : 1,
    1024: viewMode === 'grid' ? 2 : 1,
    640: 1
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-4 mb-4">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <Masonry
        breakpointCols={breakpointColumns}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {media.map((item, index) => (
          <div key={index} className={`mb-4 group ${viewMode === 'list' ? 'flex items-center' : ''}`}>
            <div 
              className={`relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                viewMode === 'list' ? 'w-1/3' : 'w-full'
              }`}
              onClick={() => {
                setSelectedMedia(item);
                preloadAdjacentMedia(index);
              }}
            >
              {item.type === 'image' ? (
                <Image
                  src={item.src}
                  alt={item.alt || `Media item ${index + 1}`}
                  width={item.width}
                  height={item.height}
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="relative">
                  <video
                    src={item.src}
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-300"
                    preload="metadata"
                    muted
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                    onProgress={(e) => handleVideoProgress(item.src, e)}
                  />
                  {videoLoadingProgress[item.src] < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${videoLoadingProgress[item.src]}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {item.type === 'image' ? (
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
            {viewMode === 'list' && (
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold">{item.alt}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(item.lastModified).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  {(item.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        ))}
      </Masonry>

      {/* Media Modal */}
      {selectedMedia && (
        <div 
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === modalRef.current) {
              setSelectedMedia(null);
            }
          }}
        >
          <div className="relative max-w-7xl max-h-[90vh]">
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              onClick={() => setSelectedMedia(null)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative">
              {selectedMedia.type === 'image' ? (
                <Image
                  src={selectedMedia.src}
                  alt={selectedMedia.alt || 'Selected media'}
                  width={selectedMedia.width}
                  height={selectedMedia.height}
                  className="max-h-[90vh] w-auto object-contain"
                  priority
                />
              ) : (
                <video
                  src={selectedMedia.src}
                  className="max-h-[90vh] w-auto"
                  controls
                  autoPlay
                  playsInline
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 