import { Request, Response, NextFunction } from 'express';

const MERCHANT_ADDRESS = process.env.MERCHANT_WALLET!;

export function paywall(req: Request, res: Response, next: NextFunction) {
  // Only block POST requests that create/continue stories
  if (req.method !== 'POST') return next();
  if (!req.path.match(/^\/stories(\/[^/]+\/chapters)?$/)) return next();

  res.status(402).json({
    error: 'Payment Required',
    message: 'This generation requires payment. $0.01 USDC on Celo Sepolia.',
    payment: {
      amount: '10000',
      asset: 'USDC',
      assetAddress: '0x01C5C0122039549AD1493B8220cABEdD739BC44E',
      network: 'celo-sepolia',
      chainId: 44787,
      payTo: MERCHANT_ADDRESS,
    },
  });
}
