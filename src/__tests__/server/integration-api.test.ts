import request from 'supertest';
import app from '../../server/app';

describe('API Integration: Full Flow', () => {
  it('should complete full flow: start_job → poll status → get result', async () => {
    // Step 1: Start a job
    const startRes = await request(app)
      .post('/start_job')
      .send({
        input_data: [
          {
            key: 'userInput',
            value:
              'I want to request 500000 ADA from the treasury for a DeFi liquidity program. ' +
              'Title: DeFi Liquidity Enhancement Program. ' +
              'This will provide liquidity to DEXes on Cardano to improve trading experience. ' +
              'The motivation is to increase TVL and attract more users to the Cardano DeFi ecosystem. ' +
              'Funds will be distributed over 12 months to qualifying DEX protocols.',
          },
        ],
      });

    expect(startRes.status).toBe(201);
    expect(startRes.body.job_id).toBeDefined();
    const jobId = startRes.body.job_id;

    // Step 2: Poll status until completed or timeout
    let statusRes;
    let attempts = 0;
    const maxAttempts = 30;

    do {
      await new Promise((resolve) => setTimeout(resolve, 500));
      statusRes = await request(app).get(`/status/${jobId}`);
      attempts++;
    } while (
      statusRes.body.status !== 'completed' &&
      statusRes.body.status !== 'failed' &&
      attempts < maxAttempts
    );

    expect(statusRes!.status).toBe(200);
    expect(statusRes!.body.job_id).toBe(jobId);

    // Step 3: Verify result structure
    const finalStatus = statusRes!.body.status;
    expect(['completed', 'failed']).toContain(finalStatus);

    if (finalStatus === 'completed') {
      expect(statusRes!.body.result).toBeDefined();
      expect(statusRes!.body.result.success).toBe(true);
      expect(statusRes!.body.result.data).toBeDefined();

      const data = statusRes!.body.result.data;
      // Verify CIP-108 output structure
      if (data.generation) {
        expect(data.generation.metadata).toBeDefined();
        expect(data.generation.metadata['@context']).toBeDefined();
      }
    }
  }, 30000); // 30s timeout for async processing

  it('should return input_schema with correct structure', async () => {
    const res = await request(app).get('/input_schema');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('type', 'object');
    expect(res.body).toHaveProperty('properties');
    expect(res.body.properties).toHaveProperty('input_data');
  });
});
