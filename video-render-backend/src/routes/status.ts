import { Router, Request, Response } from 'express';
import { jobStorage } from '../services/storage';

const router = Router();

// Get render status by ID
router.get('/:renderId', async (req: Request, res: Response) => {
  try {
    const { renderId } = req.params;
    
    const job = await jobStorage.getJob(renderId);
    
    if (!job) {
      return res.status(404).json({ 
        error: 'Render job not found' 
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const response = {
      video: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        ...(job.outputPath && { url: `${baseUrl}/outputs/${job.id}.mp4` }),
        ...(job.error && { error: job.error })
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting render status:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get all render jobs (for admin/debugging)
router.get('/', async (req: Request, res: Response) => {
  try {
    const jobs = await jobStorage.getAllJobs();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const response = jobs.map(job => ({
      id: job.id,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      ...(job.outputPath && { url: `${baseUrl}/outputs/${job.id}.mp4` }),
      ...(job.error && { error: job.error })
    }));

    res.json(response);

  } catch (error) {
    console.error('Error getting all render jobs:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export default router;
