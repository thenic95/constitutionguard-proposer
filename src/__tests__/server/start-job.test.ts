import request from 'supertest';
import app from '../../server/app';

describe('POST /start_job', () => {
  it('should create a job and return job_id with queued status', async () => {
    const res = await request(app)
      .post('/start_job')
      .send({
        input_data: [
          { key: 'userInput', value: 'I want to request 500000 ADA from the treasury for a DeFi liquidity program' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('job_id');
    expect(res.body.status).toBe('queued');
    expect(typeof res.body.job_id).toBe('string');
  });

  it('should return 400 when input_data is missing', async () => {
    const res = await request(app)
      .post('/start_job')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when input_data is empty array', async () => {
    const res = await request(app)
      .post('/start_job')
      .send({ input_data: [] });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when userInput key is missing', async () => {
    const res = await request(app)
      .post('/start_job')
      .send({
        input_data: [{ key: 'wrongKey', value: 'some value' }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userInput/);
  });

  it('should return 400 when userInput value is empty', async () => {
    const res = await request(app)
      .post('/start_job')
      .send({
        input_data: [{ key: 'userInput', value: '' }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userInput/);
  });
});
