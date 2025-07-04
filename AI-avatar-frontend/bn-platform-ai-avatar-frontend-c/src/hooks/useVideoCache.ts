import { useState, useEffect } from 'react';
import { CachedVideo } from '@/lib/types';

const CACHE_KEY = 'video_cache_v1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function useVideoCache() {
  const [cachedVideo, setCachedVideo] = useState<CachedVideo | null>(null);

  useEffect(() => {
    loadCachedVideo();
  }, []);

  const loadCachedVideo = async () => {
    try {
      const cache = await caches.open(CACHE_KEY);
      const response = await cache.match('video');
      
      if (response) {
        const data = await response.json();
        
        // Check if cache has expired
        if (Date.now() - data.timestamp > CACHE_DURATION) {
          await clearCache();
          return;
        }
        
        // Convert stored data back to File object
        const file = new File([await (await fetch(data.preview)).blob()], data.file.name, {
          type: data.file.type,
        });
        
        setCachedVideo({
          ...data,
          file,
        });
      }
    } catch (error) {
      console.error('Error loading cached video:', error);
    }
  };

  const cacheVideo = async (video: CachedVideo) => {
    try {
      const cache = await caches.open(CACHE_KEY);
      const data = {
        ...video,
        timestamp: Date.now(),
      };
      
      await cache.put('video', new Response(JSON.stringify(data)));
      setCachedVideo(data);
    } catch (error) {
      console.error('Error caching video:', error);
    }
  };

  const clearCache = async () => {
    try {
      await caches.delete(CACHE_KEY);
      setCachedVideo(null);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  return {
    cachedVideo,
    cacheVideo,
    clearCache,
  };
}