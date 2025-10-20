"use client";
import "./globals.css";
import { NeynarContextProvider, Theme } from "@neynar/react";
import "@neynar/react/dist/style.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NeynarContextProvider
          settings={{
            clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID!,
            defaultTheme: Theme.Light,
          }}
        >
          {children}
        </NeynarContextProvider>
      </body>
    </html>
  );
}