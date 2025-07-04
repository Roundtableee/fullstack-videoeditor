import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getJobQueue } from '../services/jobQueue';
import { RenderJobData, ITrackItem, ITransition, VideoRenderOptions } from '../types';

const router = Router();

interface RenderRequest {
  design: {
    trackItems: ITrackItem[];
    transitions: ITransition[];
  };
  options: VideoRenderOptions;
}

// Start a new render job
router.post('/', async (req: Request, res: Response) => {
  try {
    const { design, options }: RenderRequest = req.body;

    console.log('=== RENDER REQUEST DEBUG ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Design trackItems count:', design?.trackItems?.length || 0);
    console.log('TrackItems details:');
    design?.trackItems?.forEach((item, index) => {
      console.log(`  ${index}: type=${item.type}, details.src=${item.details?.src}, display=${JSON.stringify(item.display)}`);
      console.log(`      full details:`, JSON.stringify(item.details, null, 4));
      console.log(`      has metadata:`, !!(item as any).metadata);
    });
    
    // ตรวจสอบปัญหาเฉพาะ
    const videoItems = design?.trackItems?.filter(item => item.type === 'video') || [];
    console.log(`🎬 Video items found: ${videoItems.length}`);
    
    const itemsWithSrc = videoItems.filter(item => item.details?.src);
    console.log(`📁 Video items with src: ${itemsWithSrc.length}`);
    
    if (itemsWithSrc.length !== videoItems.length) {
      console.warn('⚠️ WARNING: Some video items are missing src URLs!');
      videoItems.forEach((item, index) => {
        if (!item.details?.src) {
          console.warn(`   - Video ${index} (${item.id}) has no src URL`);
        }
      });
    }
    
    console.log('============================');

    // Validate request
    if (!design || !Array.isArray(design.trackItems) || design.trackItems.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid design data: trackItems array is required and cannot be empty' 
      });
    }

    if (!options || !options.size) {
      return res.status(400).json({ 
        error: 'Invalid options: size is required' 
      });
    }

    // Create job
    const jobId = uuidv4();
    const job: RenderJobData = {
      id: jobId,
      design,
      options: {
        fps: options.fps || 30,
        size: options.size,
        format: options.format || 'mp4',
        quality: options.quality || 70,
        crf: options.crf || 18
      },
      status: 'PENDING',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add job to queue
    const jobQueue = getJobQueue();
    await jobQueue.addJob(job);

    // Return job ID immediately
    res.json({
      renderId: jobId,
      status: 'PENDING',
      message: 'Render job has been queued'
    });

  } catch (error) {
    console.error('Error starting render:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get queue status
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const jobQueue = getJobQueue();
    const status = await jobQueue.getQueueStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export default router;
