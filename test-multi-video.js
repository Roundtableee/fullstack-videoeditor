const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test multi-video rendering
async function testMultiVideoRender() {
  try {
    console.log('Testing multi-video render...');
    
    // Use known video files
    const videos = [
      '17040ae4-48b2-4910-9081-6a2553a4f9cb.mp4',
      '35f07a69-3caa-4c3b-a7b2-b3fdade1f39d.mp4'
    ];
    
    console.log('Using videos:', videos);
    
    // Create a test payload with multiple videos
    const testPayload = {
      design: {
        trackItems: [
          {
            id: "video1",
            type: "video",
            display: {
              from: 0,
              to: 3000  // 3 seconds
            },
            details: {
              src: `/uploads/videos/${videos[0]}`
            }
          },
          {
            id: "video2", 
            type: "video",
            display: {
              from: 3000,
              to: 6000  // 3 more seconds
            },
            details: {
              src: `/uploads/videos/${videos[1]}`
            }
          }
        ],
        transitions: []
      },
      options: {
        size: {
          width: 1920,
          height: 1080
        },
        fps: 30,
        crf: 18
      }
    };
    
    console.log('Sending render request with payload:');
    console.log(JSON.stringify(testPayload, null, 2));
    
    // Send the render request
    const renderResponse = await axios.post('http://localhost:3001/render', testPayload);
    console.log('Render response:', renderResponse.data);
    
    if (renderResponse.data.jobId) {
      console.log(`✓ Render job started with ID: ${renderResponse.data.jobId}`);
      
      // Monitor the job status
      let status = 'processing';
      while (status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const statusResponse = await axios.get(`http://localhost:3001/status/${renderResponse.data.jobId}`);
        status = statusResponse.data.status;
        
        console.log(`Job status: ${status}`);
        
        if (status === 'completed') {
          console.log('✓ Video render completed successfully!');
          console.log('Output URL:', statusResponse.data.url);
          break;
        } else if (status === 'failed') {
          console.log('✗ Video render failed:', statusResponse.data.error);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMultiVideoRender();
