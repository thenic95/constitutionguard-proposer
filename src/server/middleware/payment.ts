import { Request, Response, NextFunction } from 'express';

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || '';
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY || '';

export async function verifyPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Skip payment verification in dev mode (no payment service configured)
  if (!PAYMENT_SERVICE_URL) {
    next();
    return;
  }

  const paymentId = req.body?.payment_id;
  if (!paymentId) {
    res.status(402).json({ error: 'Payment required. Provide payment_id in request body.' });
    return;
  }

  try {
    const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${PAYMENT_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      res.status(402).json({ error: 'Payment verification failed.' });
      return;
    }

    const payment = await response.json() as { status: string };
    if (payment.status !== 'completed') {
      res.status(402).json({ error: `Payment not completed. Status: ${payment.status}` });
      return;
    }

    next();
  } catch (error) {
    res.status(502).json({ error: 'Unable to verify payment with payment service.' });
  }
}
