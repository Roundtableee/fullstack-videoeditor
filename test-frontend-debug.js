// Test script for frontend multi-video timeline
// This simulates user adding multiple videos to timeline and exporting

async function testFrontendMultiVideo() {
  console.log('Testing frontend multi-video export...');
  
  // First, let's check what the current browser console shows
  // And see what trackItems are actually in the timeline
  
  try {
    // Attempt to access the global store if available
    if (typeof window !== 'undefined' && window.useStore) {
      const state = window.useStore.getState();
      console.log('Current store state:', {
        trackItemIds: state.trackItemIds,
        trackItemsMap: state.trackItemsMap,
        trackItemDetailsMap: state.trackItemDetailsMap
      });
    }
    
    // Check if we can access the export function
    if (typeof window !== 'undefined' && window.downloadState) {
      console.log('Download state available:', window.downloadState);
    }
    
  } catch (error) {
    console.error('Error accessing frontend state:', error);
  }
}

// Run the test
testFrontendMultiVideo();
