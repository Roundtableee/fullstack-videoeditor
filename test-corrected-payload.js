const axios = require('axios');

// Test with corrected payload that includes details.src
async function testCorrectedPayload() {
  try {
    console.log('Testing with corrected payload (includes details.src)...');
    
    // Fixed payload with proper details.src URLs
    const correctedPayload = {
      design: {
        trackItems: [
          {
            id: "zoAmJuOPfwGeMyU8",
            type: "video",
            name: "video",
            display: {
              from: 0,
              to: 2898.936170212766
            },
            duration: 2898.936170212766,
            details: {
              // ⭐ This is what was missing! 
              src: "http://localhost:3001/uploads/videos/17040ae4-48b2-4910-9081-6a2553a4f9cb.mp4",
              width: 480,
              height: 360,
              opacity: 100
            },
            playbackRate: 1,
            trim: {
              from: 0,
              to: 2898.936170212768
            }
          },
          {
            id: "K1gEoIyfFIOuel",
            type: "video", 
            name: "video",
            display: {
              from: 2898.936170212766, // ⭐ Fixed: start after first video ends
              to: 2898.936170212766 + 3723.404255319149
            },
            duration: 3723.404255319149,
            isMain: false,
            details: {
              // ⭐ This is what was missing!
              src: "http://localhost:3001/uploads/videos/35f07a69-3caa-4c3b-a7b2-b3fdade1f39d.mp4",
              width: 960,
              height: 720,
              opacity: 100
            },
            playbackRate: 1,
            trim: {
              from: 0,
              to: 3723.4042553191507
            }
          }
        ],
        transitions: []
      },
      options: {
        fps: 30,
        size: {
          width: 1080,
          height: 1920
        },
        format: "mp4",
        quality: 70,
        crf: 18
      }
    };
    
    console.log('📤 Sending corrected payload:');
    console.log('- Video 1: from 0 to', correctedPayload.design.trackItems[0].display.to);
    console.log('- Video 2: from', correctedPayload.design.trackItems[1].display.from, 'to', correctedPayload.design.trackItems[1].display.to);
    console.log('- Video 1 src:', correctedPayload.design.trackItems[0].details.src);
    console.log('- Video 2 src:', correctedPayload.design.trackItems[1].details.src);
    
    // Send the render request
    const renderResponse = await axios.post('http://localhost:3001/render', correctedPayload);
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
testCorrectedPayload();
