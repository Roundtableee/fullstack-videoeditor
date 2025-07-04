// Test script to programmatically add multiple videos to timeline and export
// This script should be run in the browser console on the frontend

async function testMultiVideoTimeline() {
  console.log('🧪 Testing multi-video timeline...');
  
  try {
    // 1. Check if we can access the Zustand store
    if (typeof window.useStore === 'undefined') {
      console.error('❌ useStore not available on window object');
      return;
    }
    
    const store = window.useStore.getState();
    console.log('✅ Store accessible:', Object.keys(store));
    
    // 2. Get available videos from uploads
    const backendUrl = 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/upload/list`);
    const uploads = await response.json();
    console.log('📁 Available uploads:', uploads);
    
    if (!uploads.videos || uploads.videos.length < 2) {
      console.error('❌ Need at least 2 videos for testing');
      return;
    }
    
    // 3. Clear current timeline
    console.log('🧹 Clearing timeline...');
    window.useStore.setState({ 
      trackItemIds: [],
      trackItemsMap: {},
      trackItemDetailsMap: {}
    });
    
    // 4. Simulate adding multiple videos to timeline
    console.log('➕ Adding videos to timeline...');
    
    const videos = uploads.videos.slice(0, 3); // Take first 3 videos
    let currentTime = 0;
    
    videos.forEach((videoFilename, index) => {
      const videoId = `video-${index + 1}`;
      const videoUrl = `${backendUrl}/uploads/videos/${videoFilename}`;
      const duration = 3000; // 3 seconds each
      
      console.log(`Adding video ${index + 1}: ${videoFilename}`);
      
      // Add to trackItemIds
      const currentIds = window.useStore.getState().trackItemIds || [];
      window.useStore.setState({
        trackItemIds: [...currentIds, videoId]
      });
      
      // Add to trackItemsMap
      const currentMap = window.useStore.getState().trackItemsMap || {};
      window.useStore.setState({
        trackItemsMap: {
          ...currentMap,
          [videoId]: {
            id: videoId,
            type: 'video',
            display: {
              from: currentTime,
              to: currentTime + duration
            }
          }
        }
      });
      
      // Add to trackItemDetailsMap
      const currentDetailsMap = window.useStore.getState().trackItemDetailsMap || {};
      window.useStore.setState({
        trackItemDetailsMap: {
          ...currentDetailsMap,
          [videoId]: {
            details: {
              src: videoUrl
            }
          }
        }
      });
      
      currentTime += duration;
    });
    
    // 5. Update timeline duration
    window.useStore.setState({
      duration: currentTime,
      size: { width: 1920, height: 1080 },
      fps: 30
    });
    
    console.log('✅ Timeline setup complete');
    console.log('📊 Final state:', {
      trackItemIds: window.useStore.getState().trackItemIds,
      trackItemsMap: window.useStore.getState().trackItemsMap,
      trackItemDetailsMap: window.useStore.getState().trackItemDetailsMap,
      duration: window.useStore.getState().duration
    });
    
    // 6. Try to export
    console.log('🎬 Starting export...');
    
    if (window.downloadState && window.downloadState.startExport) {
      await window.downloadState.startExport();
      console.log('✅ Export started successfully');
    } else {
      console.error('❌ Export function not available');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Make function available globally
window.testMultiVideoTimeline = testMultiVideoTimeline;

console.log('🚀 Test function loaded. Run testMultiVideoTimeline() to start the test.');
