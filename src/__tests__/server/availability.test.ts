import request from 'supertest';
import app from '../../server/app';

describe('GET /availability', () => {
  it('should return 200 with available status', async () => {
    const res = await request(app).get('/availability');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      available: true,
      service: 'constitutionguard-proposer',
      version: '0.1.0',
    });
  });

  it('should have correct content-type', async () => {
    const res = await request(app).get('/availability');

    expect(res.headers['content-type']).toMatch(/json/);
  });
});
