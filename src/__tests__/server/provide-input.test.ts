import request from 'supertest';
import app from '../../server/app';
import { jobStore } from '../../server/stores/job-store';

describe('POST /provide_input/:job_id', () => {
  let jobId: string;

  beforeEach(() => {
    // Create a job directly in the store to avoid async processing race conditions
    const job = jobStore.create([{ key: 'userInput', value: 'Test governance action' }]);
    jobStore.updateStatus(job.id, 'running');
    jobId = job.id;
  });

  it('should accept additional input for an active job', async () => {
    const res = await request(app)
      .post(`/provide_input/${jobId}`)
      .send({
        input_data: [
          { key: 'additional_input', value: 'More details about the proposal' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.job_id).toBe(jobId);
    expect(res.body.message).toMatch(/input received/i);
  });

  it('should return 404 for unknown job', async () => {
    const res = await request(app)
      .post('/provide_input/nonexistent-id')
      .send({
        input_data: [{ key: 'additional_input', value: 'data' }],
      });

    expect(res.status).toBe(404);
  });

  it('should return 400 when input_data is missing', async () => {
    const res = await request(app)
      .post(`/provide_input/${jobId}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('should return 409 for completed jobs', async () => {
    // Manually mark job as completed
    jobStore.setResult(jobId, { success: true, data: {} });

    const res = await request(app)
      .post(`/provide_input/${jobId}`)
      .send({
        input_data: [{ key: 'additional_input', value: 'data' }],
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already completed/i);
  });
});
