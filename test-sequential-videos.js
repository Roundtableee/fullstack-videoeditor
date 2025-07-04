// Test script for sequential multi-video rendering with proper audio
const axios = require('axios');
const fs = require('fs');

const BACKEND_URL = 'http://localhost:3001';

async function testSequentialMultiVideoRender() {
  console.log('🎬 Testing Sequential Multi-Video Rendering with Audio...');
  
  try {
    // First, let's check what videos are available
    console.log('\n📁 Checking available videos...');
    const filesResponse = await axios.get(`${BACKEND_URL}/upload/list`);
    const videos = filesResponse.data.files.filter(file => 
      file.type === 'video' && file.name.includes('.mp4')
    );
    
    console.log('Available videos:', videos.map(v => v.name));
    
    if (videos.length < 2) {
      console.log('❌ Need at least 2 videos for this test');
      return;
    }
    
    // Use first 3 videos (or all if less than 3)
    const selectedVideos = videos.slice(0, Math.min(3, videos.length));
    console.log('Selected videos:', selectedVideos.map(v => v.name));
    
    // Create sequential payload with proper display.from/to timing
    let currentTime = 0;
    const videoDuration = 5000; // 5 seconds each for testing
    
    const trackItems = selectedVideos.map((video, index) => {
      const from = currentTime;
      const to = currentTime + videoDuration;
      currentTime = to;
      
      console.log(`Video ${index + 1}: ${video.name} - from ${from}ms to ${to}ms`);
      
      return {
        id: `video-${index + 1}`,
        type: 'video',
        details: {
          src: `uploads/video/${video.name}`
        },
        display: {
          from: from,
          to: to
        },
        metadata: {
          duration: videoDuration
        }
      };
    });
    
    const totalDuration = currentTime;
    console.log(`Total timeline duration: ${totalDuration}ms`);
    
    const payload = {
      design: {
        trackItems: trackItems,
        transitions: []
      },
      options: {
        fps: 30,
        size: {
          width: 1920,
          height: 1080
        },
        format: 'mp4',
        crf: 18
      }
    };
    
    console.log('\n🚀 Starting render with payload:', JSON.stringify(payload, null, 2));
    
    // Start render
    const startResponse = await axios.post(`${BACKEND_URL}/render/start`, payload);
    console.log('Render started:', startResponse.data);
    
    const renderId = startResponse.data.renderId;
    
    // Poll for completion
    console.log('\n⏳ Polling for completion...');
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
      
      try {
        const statusResponse = await axios.get(`${BACKEND_URL}/render/status/${renderId}`);
        const status = statusResponse.data;
        
        console.log(`Attempt ${attempts}: Status = ${status.status}, Progress = ${status.progress || 0}%`);
        
        if (status.status === 'completed') {
          completed = true;
          console.log('\n✅ Render completed successfully!');
          console.log('Output URL:', status.video.url);
          console.log('You can download/view at:', `${BACKEND_URL}${status.video.url}`);
          
          // Try to get file info
          if (status.video.url) {
            try {
              const videoResponse = await axios.head(`${BACKEND_URL}${status.video.url}`);
              console.log('Video file size:', videoResponse.headers['content-length'], 'bytes');
            } catch (e) {
              console.log('Could not get video file info');
            }
          }
          
        } else if (status.status === 'failed') {
          console.log('❌ Render failed:', status.error || 'Unknown error');
          completed = true;
        }
      } catch (error) {
        console.log(`Status check attempt ${attempts} failed:`, error.message);
      }
    }
    
    if (!completed) {
      console.log('❌ Render timed out after', maxAttempts * 5, 'seconds');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testSequentialMultiVideoRender().catch(console.error);
