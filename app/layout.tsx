"use client";
import "./globals.css";
import { NeynarContextProvider, Theme } from "@neynar/react";
import "@neynar/react/dist/style.css";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi";
import { Footer } from "@/app/components/Footer";

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <NeynarContextProvider
              settings={{
                clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID!,
                defaultTheme: Theme.Light,
              }}
            >
              {children}
            </NeynarContextProvider>
          </QueryClientProvider>
        </WagmiProvider>
        <Footer />
      </body>
    </html>
  );
}