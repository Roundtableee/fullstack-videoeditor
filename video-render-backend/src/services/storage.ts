import { RenderJobData } from '../types';

// Simple in-memory storage for demo purposes
// In production, use Redis, MongoDB, or other persistent storage
class JobStorage {
  private jobs: Map<string, RenderJobData> = new Map();

  async saveJob(job: RenderJobData): Promise<void> {
    this.jobs.set(job.id, { ...job });
  }

  async getJob(id: string): Promise<RenderJobData | undefined> {
    return this.jobs.get(id);
  }

  async updateJob(id: string, updates: Partial<RenderJobData>): Promise<void> {
    const job = this.jobs.get(id);
    if (job) {
      this.jobs.set(id, { ...job, ...updates, updatedAt: new Date() });
    }
  }

  async getAllJobs(): Promise<RenderJobData[]> {
    return Array.from(this.jobs.values());
  }

  async deleteJob(id: string): Promise<void> {
    this.jobs.delete(id);
  }
}

export const jobStorage = new JobStorage();
