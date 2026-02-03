import { Router, Request, Response } from 'express';
import { jobStore } from '../stores/job-store';
import { JobInput } from '../types';

const router = Router();

router.post('/provide_input/:job_id', (req: Request, res: Response) => {
  const { job_id } = req.params;
  const inputData: JobInput[] | undefined = req.body?.input_data;

  if (!inputData || !Array.isArray(inputData) || inputData.length === 0) {
    res.status(400).json({
      error: 'Missing or invalid input_data. Expected array of { key, value } objects.',
    });
    return;
  }

  const job = jobStore.get(job_id);
  if (!job) {
    res.status(404).json({ error: `Job not found: ${job_id}` });
    return;
  }

  if (job.status === 'completed' || job.status === 'failed') {
    res.status(409).json({
      error: `Job already ${job.status}. Cannot provide additional input.`,
    });
    return;
  }

  jobStore.addInput(job_id, inputData);

  res.json({
    job_id: job.id,
    status: job.status,
    message: 'Additional input received.',
  });
});

export default router;
