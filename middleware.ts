import { paymentMiddleware } from 'x402-next';

const RECEIVING_WALLET_ADDRESS = process.env.RECEIVING_WALLET_ADDRESS;

if (!RECEIVING_WALLET_ADDRESS) {
  throw new Error("RECEIVING_WALLET_ADDRESS is not set in your .env.local file.");
}

export const middleware = paymentMiddleware(
  RECEIVING_WALLET_ADDRESS as `0x${string}`,
  {
    '/api/upgrade': {
      price: '$0.01', // Using a small amount for testing
      network: "base-sepolia",
      config: {
        description: 'Upgrade to unlimited casts'
      }
    },
  },
  {
    url: "https://x402.org/facilitator", // Facilitator for Base Sepolia
  }
);

export const config = {
  matcher: [
    '/api/upgrade',
  ]
};

export const runtime = 'nodejs';