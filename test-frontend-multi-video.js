// Test script to add multiple videos to timeline via frontend
// This should be run in browser console when frontend is open

// Function to simulate adding multiple videos to timeline
function addMultipleVideosToTimeline() {
  console.log('🎬 Testing Multiple Videos Addition to Timeline...');
  
  // Get current store state
  const currentState = window.useStore?.getState();
  if (!currentState) {
    console.error('❌ useStore not available. Make sure frontend is loaded.');
    return;
  }
  
  console.log('Current state:', {
    trackItemIds: currentState.trackItemIds,
    trackItemsMapKeys: Object.keys(currentState.trackItemsMap)
  });
  
  // Mock video files
  const mockVideos = [
    {
      id: 'video-1',
      name: 'video1.mp4',
      type: 'video',
      url: '/uploads/videos/video1.mp4',
      size: 1024000,
      mimetype: 'video/mp4'
    },
    {
      id: 'video-2', 
      name: 'video2.mp4',
      type: 'video',
      url: '/uploads/videos/video2.mp4',
      size: 2048000,
      mimetype: 'video/mp4'
    },
    {
      id: 'video-3',
      name: 'video3.mp4',
      type: 'video',
      url: '/uploads/videos/video3.mp4',
      size: 1536000,
      mimetype: 'video/mp4'
    }
  ];
  
  // Simulate sequential video addition
  let currentPosition = 0;
  const videoDuration = 5000; // 5 seconds each
  const gap = 0; // No gap between videos for sequential playback
  
  const newTrackItemIds = [...currentState.trackItemIds];
  const newTrackItemsMap = { ...currentState.trackItemsMap };
  
  mockVideos.forEach((video, index) => {
    const itemId = `video-item-${Date.now()}-${index}`;
    const startTime = currentPosition;
    const endTime = currentPosition + videoDuration;
    
    console.log(`Adding video ${index + 1}: ${video.name} from ${startTime}ms to ${endTime}ms`);
    
    const trackItem = {
      id: itemId,
      type: 'video',
      name: video.name,
      display: {
        from: startTime,
        to: endTime
      },
      details: {
        src: video.url,
        size: video.size,
        mimetype: video.mimetype
      },
      metadata: {
        duration: videoDuration
      },
      playbackRate: 1,
      animations: {
        in: undefined,
        out: undefined
      }
    };
    
    newTrackItemIds.push(itemId);
    newTrackItemsMap[itemId] = trackItem;
    
    currentPosition = endTime + gap;
  });
  
  // Update store state
  currentState.setState({
    trackItemIds: newTrackItemIds,
    trackItemsMap: newTrackItemsMap,
    duration: currentPosition // Update total duration
  });
  
  console.log('✅ Added multiple videos to timeline');
  console.log('New state:', {
    trackItemIds: newTrackItemIds,
    totalDuration: currentPosition,
    videoCount: mockVideos.length
  });
  
  // Now try to export
  console.log('🚀 Starting export test...');
  const downloadState = window.useDownloadState?.getState();
  if (downloadState) {
    downloadState.actions.startExport();
  } else {
    console.warn('Download state not available');
  }
}

// Also add a function to check current timeline state
function checkTimelineState() {
  const currentState = window.useStore?.getState();
  if (!currentState) {
    console.error('❌ useStore not available');
    return;
  }
  
  console.log('📊 Current Timeline State:');
  console.log('Track Item IDs:', currentState.trackItemIds);
  console.log('Track Items Map Keys:', Object.keys(currentState.trackItemsMap));
  console.log('Duration:', currentState.duration);
  
  // Check each track item
  currentState.trackItemIds.forEach((id, index) => {
    const item = currentState.trackItemsMap[id];
    console.log(`Item ${index}:`, {
      id: id,
      type: item?.type,
      name: item?.name,
      display: item?.display,
      'details.src': item?.details?.src
    });
  });
}

// Make functions available globally
window.addMultipleVideosToTimeline = addMultipleVideosToTimeline;
window.checkTimelineState = checkTimelineState;

console.log('🔧 Debug functions loaded. Available commands:');
console.log('- addMultipleVideosToTimeline() - Add 3 mock videos to timeline');
console.log('- checkTimelineState() - Check current timeline state');
