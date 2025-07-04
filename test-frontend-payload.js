const axios = require('axios');

// Test with a more realistic frontend-like payload
async function testRealisticFrontendPayload() {
  try {
    console.log('Testing with realistic frontend payload...');
    
    // This payload simulates what the frontend would actually send
    const frontendPayload = {
      design: {
        trackItems: [
          {
            id: "video-track-1",
            type: "video",
            display: {
              from: 0,
              to: 5000  // 5 seconds
            },
            details: {
              src: "http://localhost:3001/uploads/videos/17040ae4-48b2-4910-9081-6a2553a4f9cb.mp4"
            },
            // Additional frontend-specific properties
            name: "Video 1",
            duration: 19440, // original video duration in ms
            metadata: {
              filename: "video1.mp4",
              uploadedAt: new Date().toISOString()
            }
          },
          {
            id: "video-track-2", 
            type: "video",
            display: {
              from: 5000,
              to: 10000  // 5 more seconds
            },
            details: {
              src: "http://localhost:3001/uploads/videos/35f07a69-3caa-4c3b-a7b2-b3fdade1f39d.mp4"
            },
            name: "Video 2",
            duration: 19440,
            metadata: {
              filename: "video2.mp4", 
              uploadedAt: new Date().toISOString()
            }
          }
        ],
        transitions: []
      },
      options: {
        fps: 30,
        size: {
          width: 1920,
          height: 1080
        },
        format: "mp4",
        quality: 70,
        crf: 18
      }
    };
    
    console.log('Sending realistic frontend payload:');
    console.log(JSON.stringify(frontendPayload, null, 2));
    
    // Send the render request
    const renderResponse = await axios.post('http://localhost:3001/render', frontendPayload);
    console.log('Render response:', renderResponse.data);
    
    if (renderResponse.data.renderId) {
      console.log(`✓ Render job started with ID: ${renderResponse.data.renderId}`);
      
      // Monitor the job status
      let status = 'PENDING';
      let attempts = 0;
      const maxAttempts = 30;
      
      while (status === 'PENDING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        
        const statusResponse = await axios.get(`http://localhost:3001/status/${renderResponse.data.renderId}`);
        status = statusResponse.data.video.status;
        
        console.log(`Job status: ${status} (attempt ${attempts}/${maxAttempts})`);
        
        if (status === 'COMPLETED') {
          console.log('✅ Video render completed successfully!');
          console.log('Output URL:', statusResponse.data.video.url);
          break;
        } else if (status === 'FAILED') {
          console.log('❌ Video render failed:', statusResponse.data.video.error);
          break;
        }
      }
      
      if (attempts >= maxAttempts) {
        console.log('⚠ Timeout waiting for render to complete');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testRealisticFrontendPayload();
