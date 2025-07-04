import { useCallback } from "react";
import useStore from "../store/use-store";
import { UploadedFile } from "@/services/upload";

export const useMediaImport = () => {
  const { 
    setTrackItems, 
    setTrackItemsMap, 
    trackItemIds,
    trackItemsMap,
    setState,
    duration,
    setDuration
  } = useStore();

  const addMediaToTimeline = useCallback((file: UploadedFile, position = 0) => {
    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine item type and default properties
    let itemType: 'video' | 'audio' | 'image';
    let defaultDuration = 5000; // 5 seconds default
    let defaultProperties = {};

    switch (file.type) {
      case 'video':
        itemType = 'video';
        defaultDuration = 10000; // 10 seconds for videos
        defaultProperties = {
          width: 1920,
          height: 1080,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 1
        };
        break;
      case 'audio':
        itemType = 'audio';
        defaultDuration = 30000; // 30 seconds for audio
        defaultProperties = {
          volume: 1,
          pan: 0
        };
        break;
      case 'image':
        itemType = 'image';
        defaultDuration = 5000; // 5 seconds for images
        defaultProperties = {
          width: 1920,
          height: 1080,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 1
        };
        break;
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Create new track item
    const newTrackItem = {
      id: itemId,
      type: itemType,
      display: {
        from: position,
        to: position + defaultDuration
      },
      trim: {
        from: 0,
        to: defaultDuration
      },
      details: {
        src: file.url,
        originalFilename: file.filename,
        fileId: file.id,
        fileSize: file.size,
        mimetype: file.mimetype,
        ...defaultProperties
      },
      playbackRate: 1,
      animations: {
        in: undefined,
        out: undefined
      }
    };

    // Add to timeline
    const newTrackItemIds = [...trackItemIds, itemId];
    const newTrackItemsMap = {
      ...trackItemsMap,
      [itemId]: newTrackItem
    };

    // Update timeline duration if necessary
    const newEndTime = position + defaultDuration;
    if (newEndTime > duration) {
      setDuration(newEndTime);
    }

    // Update store
    setState({
      trackItemIds: newTrackItemIds,
      trackItemsMap: newTrackItemsMap
    });

    return itemId;
  }, [trackItemIds, trackItemsMap, duration, setState, setDuration]);

  const addMultipleMediaToTimeline = useCallback((files: UploadedFile[], startPosition = 0) => {
    let currentPosition = startPosition;
    const addedItemIds: string[] = [];

    files.forEach(file => {
      const itemId = addMediaToTimeline(file, currentPosition);
      addedItemIds.push(itemId);
      
      // Move position for next item (with 500ms gap)
      currentPosition += 5000 + 500;
    });

    return addedItemIds;
  }, [addMediaToTimeline]);

  const removeMediaFromTimeline = useCallback((itemId: string) => {
    const newTrackItemIds = trackItemIds.filter(id => id !== itemId);
    const newTrackItemsMap = { ...trackItemsMap };
    delete newTrackItemsMap[itemId];

    setState({
      trackItemIds: newTrackItemIds,
      trackItemsMap: newTrackItemsMap
    });
  }, [trackItemIds, trackItemsMap, setState]);

  const getTimelineData = useCallback(() => {
    const { trackItemDetailsMap, transitionsMap } = useStore.getState();
    
    // Merge track items with their details
    const mergedTrackItemsMap = { ...trackItemsMap };
    Object.keys(trackItemDetailsMap).forEach(id => {
      if (mergedTrackItemsMap[id]) {
        mergedTrackItemsMap[id] = {
          ...mergedTrackItemsMap[id],
          details: {
            ...mergedTrackItemsMap[id].details,
            ...trackItemDetailsMap[id].details
          }
        };
      }
    });

    // Convert to array format
    const trackItems = trackItemIds.map(id => ({
      id,
      ...mergedTrackItemsMap[id]
    })).filter(Boolean);

    // Get transitions
    const transitions = Object.values(transitionsMap || {});

    return {
      trackItems,
      transitions
    };
  }, [trackItemIds, trackItemsMap]);

  return {
    addMediaToTimeline,
    addMultipleMediaToTimeline,
    removeMediaFromTimeline,
    getTimelineData
  };
};
