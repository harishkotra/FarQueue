// middleware.ts
import { paymentMiddleware } from 'x402-next';

// Replace with your actual receiving wallet address
const RECEIVING_WALLET_ADDRESS = "0xYourReceivingWalletAddressHere";

export const middleware = paymentMiddleware(
  RECEIVING_WALLET_ADDRESS,
  {
    // Define the route to protect
    '/api/upgrade': {
      // The price is in USD, x402 handles the conversion to ETH
      // 0.01 ETH at ~$3500/ETH is $35, so we will use a small dollar amount for testing.
      // Let's set it to $0.01 for the demo. Adjust as needed.
      price: '$0.001',
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

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/upgrade',
  ]
};