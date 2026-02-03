import request from 'supertest';
import app from '../../server/app';

describe('GET /status', () => {
  let jobId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/start_job')
      .send({
        input_data: [
          { key: 'userInput', value: 'Test governance action proposal' },
        ],
      });
    jobId = res.body.job_id;
  });

  it('should return job status via path param', async () => {
    const res = await request(app).get(`/status/${jobId}`);

    expect(res.status).toBe(200);
    expect(res.body.job_id).toBe(jobId);
    expect(res.body).toHaveProperty('status');
  });

  it('should return job status via query param', async () => {
    const res = await request(app).get(`/status?job_id=${jobId}`);

    expect(res.status).toBe(200);
    expect(res.body.job_id).toBe(jobId);
  });

  it('should return 404 for unknown job', async () => {
    const res = await request(app).get('/status/nonexistent-id');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when no job_id provided', async () => {
    const res = await request(app).get('/status');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/job_id/);
  });
});
