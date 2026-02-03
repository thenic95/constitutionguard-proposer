import { Router, Request, Response } from 'express';
import { jobStore } from '../stores/job-store';

const router = Router();

// Support both path param and query param
router.get('/status/:job_id?', (req: Request, res: Response) => {
  const jobId = req.params.job_id || (req.query.job_id as string);

  if (!jobId) {
    res.status(400).json({ error: 'Missing job_id parameter.' });
    return;
  }

  const job = jobStore.get(jobId);
  if (!job) {
    res.status(404).json({ error: `Job not found: ${jobId}` });
    return;
  }

  const response: Record<string, unknown> = {
    job_id: job.id,
    status: job.status,
  };

  if (job.result) {
    response.result = job.result;
  }

  res.json(response);
});

export default router;
