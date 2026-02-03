import { Router, Request, Response } from 'express';

const router = Router();

const inputSchema = {
  type: 'object',
  description: 'Input for ConstitutionGuard Proposer governance action preparation',
  properties: {
    input_data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            enum: ['userInput'],
            description: 'Input field key',
          },
          value: {
            type: 'string',
            description:
              'Natural language description of the governance action proposal. Should include: action type, title, motivation, rationale, and any financial details for treasury withdrawals.',
          },
        },
        required: ['key', 'value'],
      },
      minItems: 1,
    },
  },
  required: ['input_data'],
};

router.get('/input_schema', (_req: Request, res: Response) => {
  res.json(inputSchema);
});

export default router;
