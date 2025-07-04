const axios = require('axios');

async function testThreeVideoRender() {
  try {
    console.log('Testing three-video render...');
    
    // Use three video files
    const videos = [
      '17040ae4-48b2-4910-9081-6a2553a4f9cb.mp4',
      '35f07a69-3caa-4c3b-a7b2-b3fdade1f39d.mp4',
      '3a3ccf17-2d03-4698-8b03-fca5952e9083.mp4'
    ];
    
    console.log('Using videos:', videos);
    
    // Create a test payload with three videos
    const testPayload = {
      design: {
        trackItems: [
          {
            id: "video1",
            type: "video",
            display: {
              from: 0,
              to: 2000  // 2 seconds
            },
            details: {
              src: `/uploads/videos/${videos[0]}`
            }
          },
          {
            id: "video2", 
            type: "video",
            display: {
              from: 2000,
              to: 4000  // 2 more seconds
            },
            details: {
              src: `/uploads/videos/${videos[1]}`
            }
          },
          {
            id: "video3", 
            type: "video",
            display: {
              from: 4000,
              to: 6000  // 2 more seconds
            },
            details: {
              src: `/uploads/videos/${videos[2]}`
            }
          }
        ],
        transitions: []
      },
      options: {
        size: {
          width: 1280,
          height: 720
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
    
    if (renderResponse.data.renderId) {
      console.log(`✓ Render job started with ID: ${renderResponse.data.renderId}`);
      
      // Monitor the job status
      let status = 'PENDING';
      let attempts = 0;
      const maxAttempts = 30; // 1 minute timeout
      
      while (status === 'PENDING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempts++;
        
        const statusResponse = await axios.get(`http://localhost:3001/status/${renderResponse.data.renderId}`);
        status = statusResponse.data.video.status;
        
        console.log(`Job status: ${status} (attempt ${attempts}/${maxAttempts})`);
        
        if (status === 'COMPLETED') {
          console.log('✓ Video render completed successfully!');
          console.log('Output URL:', statusResponse.data.video.url);
          break;
        } else if (status === 'FAILED') {
          console.log('✗ Video render failed:', statusResponse.data.video.error);
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
testThreeVideoRender();
