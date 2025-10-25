"use client";

import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";

// Export the config so it can be used everywhere
export const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});