import { useCallback } from "react";
import { useDownloadState } from "../store/use-download-state";
import useStore from "../store/use-store";
import { merge } from "lodash";

export const useVideoExport = () => {
  const {
    exporting,
    progress,
    displayProgressModal,
    output,
    actions: {
      setDisplayProgressModal,
      startExport,
      setState,
      setOutput
    }
  } = useDownloadState();

  const {
    trackItemIds,
    trackItemsMap,
    trackItemDetailsMap,
    transitionsMap,
    size,
    duration,
    fps
  } = useStore();

  const exportVideo = useCallback(async () => {
    try {
      // Prepare the design payload
      const mergedTrackItemsMap = merge(trackItemsMap, trackItemDetailsMap);
      
      const trackItems = trackItemIds.map(id => ({
        ...mergedTrackItemsMap[id],
        id
      }));

      const transitions = Object.values(transitionsMap || {});

      const payload = {
        trackItems,
        transitions,
        size,
        duration,
        fps
      };

      // Set the payload in the store
      setState({ payload });

      // Start the export process
      await startExport();

    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    }
  }, [
    trackItemIds,
    trackItemsMap,
    trackItemDetailsMap,
    transitionsMap,
    size,
    duration,
    fps,
    setState,
    startExport
  ]);

  const openProgressModal = useCallback(() => {
    setDisplayProgressModal(true);
  }, [setDisplayProgressModal]);

  const closeProgressModal = useCallback(() => {
    setDisplayProgressModal(false);
  }, [setDisplayProgressModal]);

  const downloadVideo = useCallback(() => {
    if (output?.url) {
      const link = document.createElement('a');
      link.href = output.url;
      link.download = `video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [output]);

  return {
    // State
    exporting,
    progress,
    displayProgressModal,
    output,
    
    // Actions
    exportVideo,
    openProgressModal,
    closeProgressModal,
    downloadVideo,
    
    // Utils
    canExport: trackItemIds.length > 0,
    isCompleted: output?.url && !exporting
  };
};
