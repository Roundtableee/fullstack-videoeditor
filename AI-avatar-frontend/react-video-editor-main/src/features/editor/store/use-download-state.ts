import { IDesign } from "@designcombo/types";
import { create } from "zustand";
import { videoRenderService } from "@/services/video";
import useStore from "./use-store";

interface Output {
  url: string;
  type: string;
}

interface DownloadState {
  projectId: string;
  exporting: boolean;
  exportType: string;
  progress: number;
  output?: Output;
  payload?: IDesign;
  displayProgressModal: boolean;
  currentRenderId?: string;
  actions: {
    setProjectId: (projectId: string) => void;
    setExporting: (exporting: boolean) => void;
    setExportType: (exportType: string) => void;
    setProgress: (progress: number) => void;
    setState: (state: Partial<DownloadState>) => void;
    setOutput: (output: Output) => void;
    setDisplayProgressModal: (displayProgressModal: boolean) => void;
    startExport: () => Promise<void>;
  };
}

// Helper function to get timeline data
const getTimelineData = () => {
  const state = useStore.getState();
  const {
    trackItemIds,
    trackItemsMap,
    trackItemDetailsMap,
    transitionsMap,
    size,
    duration,
    fps
  } = state;

  // Merge track items with their details - FIX: Ensure details.src is preserved
  const mergedTrackItemsMap = { ...trackItemsMap };
  
  console.log('🔍 MERGE DEBUG:');
  console.log('trackItemIds:', trackItemIds);
  console.log('trackItemsMap keys:', Object.keys(trackItemsMap));
  console.log('trackItemDetailsMap keys:', Object.keys(trackItemDetailsMap || {}));
  
  // First, check if trackItemsMap already has details.src
  Object.keys(trackItemsMap).forEach(id => {
    const item = trackItemsMap[id];
    console.log(`trackItemsMap[${id}]:`, {
      type: item.type,
      'details.src': item.details?.src,
      hasDetails: !!item.details
    });
  });
  
  // Then try to merge from trackItemDetailsMap
  Object.keys(trackItemDetailsMap || {}).forEach(id => {
    console.log(`Merging details for ${id}:`, trackItemDetailsMap[id]);
    if (mergedTrackItemsMap[id]) {
      const currentDetails = mergedTrackItemsMap[id].details || {};
      const newDetails = trackItemDetailsMap[id]?.details || {};
      
      mergedTrackItemsMap[id] = {
        ...mergedTrackItemsMap[id],
        details: {
          ...currentDetails,
          ...newDetails
        }
      };
      console.log(`After merge for ${id}:`, {
        'details.src': mergedTrackItemsMap[id].details?.src,
        fullDetails: mergedTrackItemsMap[id].details
      });
    } else {
      console.warn(`⚠️ trackItem ${id} not found in trackItemsMap`);
    }
  });

  // Convert to array format expected by backend
  let trackItems = trackItemIds.map(id => {
    const item = mergedTrackItemsMap[id];
    if (!item) {
      console.warn(`⚠️ trackItem ${id} not found in merged map`);
      return null;
    }
    
    const result = {
      id,
      ...item
    };
    
    console.log(`Final trackItem ${id}:`, {
      type: result.type,
      'details.src': result.details?.src,
      display: result.display
    });
    
    return result;
  }).filter(Boolean);
  
  // FIX: Ensure display.from/to is set correctly for sequential videos
  const videoItems = trackItems.filter(item => item.type === 'video');
  if (videoItems.length > 1) {
    console.log('🎬 Processing multiple videos for sequential playback...');
    
    // Calculate video durations and set proper display.from/to
    let currentTime = 0;
    const estimatedVideoDuration = (duration || 5000) / videoItems.length; // Equal division for now
    
    videoItems.forEach((video, index) => {
      const videoDuration = video.metadata?.duration || estimatedVideoDuration;
      
      // Set display timing for sequential playback
      video.display = {
        ...video.display,
        from: currentTime,
        to: currentTime + videoDuration
      };
      
      console.log(`Video ${index} timing:`, {
        src: video.details?.src,
        from: video.display.from,
        to: video.display.to,
        duration: videoDuration
      });
      
      currentTime += videoDuration;
    });
    
    // Update the timeline duration to match total video duration
    if (currentTime > (duration || 0)) {
      console.log(`Updating timeline duration from ${duration} to ${currentTime}`);
      // Note: We can't update the store here, so we'll pass the corrected duration in return
    }
  }
  
  console.log('🎯 Final trackItems count for backend:', trackItems.length);
  
  // Validate that video items have src URLs
  const videoItemsWithSrc = videoItems.filter(item => item.details?.src);
  
  if (videoItems.length > 0 && videoItemsWithSrc.length !== videoItems.length) {
    console.error('❌ CRITICAL: Some video items are missing src URLs!');
    console.error('Video items without src:', videoItems.filter(item => !item.details?.src));
  } else if (videoItems.length > 0) {
    console.log('✅ All video items have src URLs');
  }

  // Get transitions - ensure they are properly typed
  const transitions = Object.values(transitionsMap || {}).filter(transition => 
    transition && typeof transition === 'object' && 'id' in transition
  );

  // Calculate total duration including all videos
  const totalVideoDuration = videoItems.reduce((total, video) => {
    return total + (video.metadata?.duration || 5000);
  }, 0);
  
  const finalDuration = Math.max(duration || 5000, totalVideoDuration);

  return {
    trackItems,
    transitions,
    size: size || { width: 1920, height: 1080 },
    duration: finalDuration,
    fps: fps || 30
  };
};

interface Output {
  url: string;
  type: string;
}

interface DownloadState {
  projectId: string;
  exporting: boolean;
  exportType: string;
  progress: number;
  output?: Output;
  payload?: IDesign;
  displayProgressModal: boolean;
  currentRenderId?: string;
  actions: {
    setProjectId: (projectId: string) => void;
    setExporting: (exporting: boolean) => void;
    setExportType: (exportType: string) => void;
    setProgress: (progress: number) => void;
    setState: (state: Partial<DownloadState>) => void;
    setOutput: (output: Output) => void;
    setDisplayProgressModal: (displayProgressModal: boolean) => void;
    startExport: () => Promise<void>;
  };
}

export const useDownloadState = create<DownloadState>((set, get) => ({
  projectId: "",
  exporting: false,
  exportType: "mp4",
  progress: 0,
  displayProgressModal: false,
  actions: {
    setProjectId: (projectId) => set({ projectId }),
    setExporting: (exporting) => set({ exporting }),
    setExportType: (exportType) => set({ exportType }),
    setProgress: (progress) => set({ progress }),
    setState: (state) => set({ ...state }),
    setOutput: (output) => set({ output }),
    setDisplayProgressModal: (displayProgressModal) =>
      set({ displayProgressModal }),
    startExport: async () => {
      try {
        // Set exporting to true at the start
        set({ exporting: true, displayProgressModal: true, progress: 0 });

        // Get current timeline data
        const timelineData = getTimelineData();

        console.log("=== EXPORT DEBUG ===");
        console.log("Timeline data:", timelineData);
        console.log("TrackItems details:");
        timelineData.trackItems.forEach((item, index) => {
          console.log(`  ${index}:`, {
            id: item.id,
            type: item.type,
            details: item.details,
            display: item.display,
            metadata: item.metadata
          });
        });
        
        // Additional debug: Check all video items specifically
        const videoItemsInPayload = timelineData.trackItems.filter(item => item.type === 'video');
        console.log(`🎥 VIDEOS IN PAYLOAD: ${videoItemsInPayload.length}`);
        videoItemsInPayload.forEach((video, index) => {
          console.log(`  Video ${index}:`, {
            id: video.id,
            src: video.details?.src,
            from: video.display?.from,
            to: video.display?.to
          });
        });
        
        console.log("====================");

        console.log("Exporting with data:", {
          trackItems: timelineData.trackItems.length,
          transitions: timelineData.transitions.length,
          size: timelineData.size,
          duration: timelineData.duration,
          fps: timelineData.fps
        });

        // Start render job and get renderId
        const startResponse = await videoRenderService.startRender(
          { 
            trackItems: timelineData.trackItems, 
            transitions: timelineData.transitions as any[] // Cast to bypass type check for now
          }, 
          {
            fps: timelineData.fps,
            size: timelineData.size,
            format: "mp4",
          }
        );

        console.log("Render started:", startResponse);
        
        // Store the render ID
        set({ currentRenderId: startResponse.renderId });

        // Poll for status updates
        const finalResponse = await videoRenderService.pollRenderStatus(
          startResponse.renderId,
          (progress, status) => {
            console.log(`Render progress: ${progress}% (${status})`);
            set({ progress });
          }
        );

        console.log("Render completed:", finalResponse);

        // Set the output when completed
        if (finalResponse.video.url) {
          set({
            output: {
              url: finalResponse.video.url,
              type: "mp4"
            },
            progress: 100
          });
        }

        // Notify parent window if running in iframe
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'VIDEO_EXPORT_COMPLETE',
            renderId: startResponse.renderId,
            url: finalResponse.video.url,
            status: finalResponse.video.status
          }, '*');
        }

        // Close the modal and reset state
        set({
          exporting: false,
          displayProgressModal: false,
        });

      } catch (error) {
        console.error("Export failed:", error);
        
        // Notify parent window of error if running in iframe
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'VIDEO_EXPORT_ERROR',
            error: error instanceof Error ? error.message : 'Export failed'
          }, '*');
        }

        set({
          exporting: false,
          displayProgressModal: false,
          progress: 0
        });
        throw error;
      }
    },
  },
}));
