const axios = require('axios');

async function checkRenderStatus() {
  const jobId = '6894117d-c59c-40b0-a2bb-7dc825b87933';
  
  try {
    const response = await axios.get(`http://localhost:3001/status/${jobId}`);
    console.log('Status response:', response.data);
    
    if (response.data.status === 'completed') {
      console.log('✓ Render completed successfully!');
      console.log('Output URL:', response.data.url);
    } else if (response.data.status === 'failed') {
      console.log('✗ Render failed:', response.data.error);
    } else {
      console.log('Status:', response.data.status);
    }
  } catch (error) {
    console.error('Error checking status:', error.response?.data || error.message);
  }
}

checkRenderStatus();
