import { Router, Request, Response } from 'express';

const router = Router();

router.get('/availability', (_req: Request, res: Response) => {
  res.json({
    available: true,
    service: 'constitutionguard-proposer',
    version: '0.1.0',
  });
});

export default router;
