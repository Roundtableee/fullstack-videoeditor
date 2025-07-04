import { RenderJobData } from '../types';
import { jobStorage } from './storage';

// Simple job queue implementation
// In production, use Bull Queue, BeeQueue, or similar
class JobQueue {
  private queue: string[] = [];
  private processing = false;
  private maxConcurrentJobs: number;

  constructor(maxConcurrentJobs = 2) {
    this.maxConcurrentJobs = maxConcurrentJobs;
  }

  async addJob(job: RenderJobData): Promise<void> {
    await jobStorage.saveJob(job);
    this.queue.push(job.id);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const jobId = this.queue.shift();
      if (!jobId) continue;

      try {
        const job = await jobStorage.getJob(jobId);
        if (!job) continue;

        await this.processJob(job);
      } catch (error) {
        console.error(`Error processing job ${jobId}:`, error);
        await jobStorage.updateJob(jobId, {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    this.processing = false;
  }

  private async processJob(job: RenderJobData): Promise<void> {
    console.log(`Processing job ${job.id}`);
    
    await jobStorage.updateJob(job.id, {
      status: 'PROCESSING',
      progress: 0
    });

    // Import render service dynamically to avoid circular dependencies
    const { renderVideo } = await import('./renderService');
    
    try {
      const result = await renderVideo(job);
      
      await jobStorage.updateJob(job.id, {
        status: 'COMPLETED',
        progress: 100,
        outputPath: result.outputPath
      });

      console.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      
      await jobStorage.updateJob(job.id, {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Render failed'
      });
    }
  }

  async getQueueStatus(): Promise<{ pending: number; processing: boolean }> {
    return {
      pending: this.queue.length,
      processing: this.processing
    };
  }
}

let jobQueue: JobQueue;

export const initializeJobQueue = async (): Promise<void> => {
  const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_RENDERS || '2');
  jobQueue = new JobQueue(maxConcurrent);
  console.log(`🔄 Job queue initialized with max concurrent jobs: ${maxConcurrent}`);
};

export const getJobQueue = (): JobQueue => {
  if (!jobQueue) {
    throw new Error('Job queue not initialized');
  }
  return jobQueue;
};
