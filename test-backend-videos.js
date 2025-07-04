const axios = require('axios');

async function testBackendVideos() {
  try {
    console.log('🔍 Checking available videos on backend...');
    const response = await axios.get('http://localhost:3001/upload/list');
    const videos = response.data.files.filter(f => f.type === 'video');
    
    console.log('\n📹 Available videos on backend:');
    videos.forEach((v, i) => {
      console.log(`  ${i + 1}: ${v.name} (${(v.size / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log(`\nTotal videos: ${videos.length}`);
    
    if (videos.length >= 2) {
      console.log('\n🧪 Testing multi-video payload...');
      await testMultiVideoPayload(videos.slice(0, 3));
    } else {
      console.log('\n⚠️  Need at least 2 videos for multi-video test');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testMultiVideoPayload(videos) {
  // Create sequential payload
  let currentTime = 0;
  const videoDuration = 5000; // 5 seconds each
  
  const trackItems = videos.map((video, index) => {
    const from = currentTime;
    const to = currentTime + videoDuration;
    currentTime = to;
    
    console.log(`Video ${index + 1}: ${video.name} - from ${from}ms to ${to}ms`);
    
    return {
      id: `video-item-${index + 1}`,
      type: 'video',
      name: video.name,
      details: {
        src: `uploads/video/${video.name}` // Backend expects this format
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
  
  console.log('\n📦 Sending payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await axios.post('http://localhost:3001/render', payload);
    console.log('\n✅ Render started successfully:', response.data);
    
    // Poll for completion
    if (response.data.renderId) {
      await pollRenderStatus(response.data.renderId);
    }
  } catch (error) {
    console.error('\n❌ Render failed:', error.response?.data || error.message);
  }
}

async function pollRenderStatus(renderId) {
  console.log('\n⏳ Polling render status...');
  let attempts = 0;
  const maxAttempts = 30; // 2.5 minutes max
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    attempts++;
    
    try {
      const response = await axios.get(`http://localhost:3001/render/status/${renderId}`);
      const status = response.data;
      
      console.log(`Attempt ${attempts}: Status = ${status.status}, Progress = ${status.progress || 0}%`);
      
      if (status.status === 'completed') {
        console.log('\n🎉 Render completed successfully!');
        console.log('Output URL:', status.video.url);
        return;
      } else if (status.status === 'failed') {
        console.log('\n❌ Render failed:', status.error || 'Unknown error');
        return;
      }
    } catch (error) {
      console.log(`Status check attempt ${attempts} failed:`, error.message);
    }
  }
  
  console.log('\n⏰ Render timed out');
}

// Run the test
testBackendVideos().catch(console.error);
