import { Router, Request, Response } from 'express';
import { jobStore } from '../stores/job-store';
import { JobInput } from '../types';
import { prepareGovernanceAction } from '../../index';

const router = Router();

router.post('/start_job', async (req: Request, res: Response) => {
  const inputData: JobInput[] | undefined = req.body?.input_data;

  if (!inputData || !Array.isArray(inputData) || inputData.length === 0) {
    res.status(400).json({
      error: 'Missing or invalid input_data. Expected array of { key, value } objects.',
    });
    return;
  }

  const userInputEntry = inputData.find((item) => item.key === 'userInput');
  if (!userInputEntry || !userInputEntry.value) {
    res.status(400).json({
      error: 'Missing required input key "userInput".',
    });
    return;
  }

  const job = jobStore.create(inputData);

  // Return immediately, process async
  res.status(201).json({
    job_id: job.id,
    status: 'queued',
  });

  // Run the governance action preparation asynchronously
  setImmediate(async () => {
    try {
      jobStore.updateStatus(job.id, 'running');
      const result = await prepareGovernanceAction(userInputEntry.value);
      jobStore.setResult(job.id, {
        success: result.success,
        data: {
          intake: result.intake,
          compliance: result.compliance,
          generation: result.generation,
          validation: result.validation,
        },
        error: result.error,
      });
    } catch (error) {
      jobStore.setResult(job.id, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
});

export default router;
