import { IDesign } from "@designcombo/types";
import { create } from "zustand";
import { videoRenderService } from "@/services/video";
import useStore from "./use-store";

interface Output {
  url: string;
  type: string;
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

  // Merge track items with their details
  const mergedTrackItemsMap = { ...trackItemsMap };
  Object.keys(trackItemDetailsMap || {}).forEach(id => {
    if (mergedTrackItemsMap[id]) {
      mergedTrackItemsMap[id] = {
        ...mergedTrackItemsMap[id],
        details: {
          ...mergedTrackItemsMap[id].details,
          ...trackItemDetailsMap[id]?.details
        }
      };
    }
  });

  // Convert to array format expected by backend
  const trackItems = trackItemIds.map(id => ({
    id,
    ...mergedTrackItemsMap[id]
  })).filter(Boolean);

  // Get transitions - ensure they are properly typed
  const transitions = Object.values(transitionsMap || {}).filter(transition => 
    transition && typeof transition === 'object' && 'id' in transition
  );

  return {
    trackItems,
    transitions,
    // Use store size or fallback to same resolution for consistency
    // This ensures preview composition and export output have identical resolution
    size: size || { width: 1920, height: 1080 }, // Must match store default
    duration: duration || 5000,
    fps: fps || 30
  };
};

interface DownloadState {
  projectId: string;
  exporting: boolean;
  exportType: string;
  progress: number;
  output?: Output;
  payload?: IDesign;
  displayProgressModal: boolean;
  showCompletionModal: boolean;
  currentRenderId?: string;
  actions: {
    setProjectId: (projectId: string) => void;
    setExporting: (exporting: boolean) => void;
    setExportType: (exportType: string) => void;
    setProgress: (progress: number) => void;
    setState: (state: Partial<DownloadState>) => void;
    setOutput: (output: Output) => void;
    setDisplayProgressModal: (displayProgressModal: boolean) => void;
    setShowCompletionModal: (showCompletionModal: boolean) => void;
    startExport: () => Promise<void>;
  };
}

export const useDownloadState = create<DownloadState>((set, get) => ({
  projectId: "",
  exporting: false,
  exportType: "mp4",
  progress: 0,
  displayProgressModal: false,
  showCompletionModal: false,
  actions: {
    setProjectId: (projectId) => set({ projectId }),
    setExporting: (exporting) => set({ exporting }),
    setExportType: (exportType) => set({ exportType }),
    setProgress: (progress) => set({ progress }),
    setState: (state) => set({ ...state }),
    setOutput: (output) => set({ output }),
    setDisplayProgressModal: (displayProgressModal) =>
      set({ displayProgressModal }),
    setShowCompletionModal: (showCompletionModal) =>
      set({ showCompletionModal }),
    startExport: async () => {
      try {
        // Set exporting to true at the start
        set({ exporting: true, displayProgressModal: true, progress: 0, showCompletionModal: false });

        // Show export started notification
        import('sonner').then(({ toast }) => {
          toast.info('🎬 Starting video render...', {
            description: 'Your video export has begun.',
            duration: 3000
          });
        });

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

          // Show completion notification
          showRenderCompleteNotification(finalResponse.video.url);
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

        // Close progress modal and show completion modal
        set({
          exporting: false,
          displayProgressModal: false,
          showCompletionModal: true,
        });

      } catch (error) {
        console.error("Export failed:", error);
        
        // Show error notification
        import('sonner').then(({ toast }) => {
          toast.error('❌ Export Failed', {
            description: error instanceof Error ? error.message : 'An error occurred during export.',
            duration: 8000
          });
        });
        
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
          showCompletionModal: false,
          progress: 0
        });
        throw error;
      }
    },
  },
}));

// Helper function to show render complete notification
const showRenderCompleteNotification = (videoUrl: string) => {
  // Import toast dynamically to avoid issues
  import('sonner').then(({ toast }) => {
    toast.success('🎬 Video Render Complete!', {
      description: 'Your video has been rendered successfully.',
      action: {
        label: 'Download',
        onClick: () => {
          window.open(videoUrl, '_blank');
        }
      },
      duration: 10000, // 10 seconds
    });
  });

  // Browser notification (if permission granted)
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('🎬 Video Render Complete!', {
      body: 'Your video has been rendered successfully. Click to download.',
      icon: '/favicon.ico',
      tag: 'video-render-complete'
    });

    notification.onclick = () => {
      window.open(videoUrl, '_blank');
      notification.close();
    };
  }
  
  // Console notification
  console.log('🎉 Video render complete!', videoUrl);
};

// Request notification permission on module load
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}
