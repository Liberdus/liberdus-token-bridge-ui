"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { wagmiConfig } from "./wagmi";
import NavBar from "./NavBar";

import { ReactNode } from "react";
import { ToastContainer } from "react-toastify";

const queryClient = new QueryClient();

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div
            style={{
              minHeight: "100vh",
              background:
                "linear-gradient(135deg, #0f172a 0%, #581c87 20%, #0f172a 80%)",
            }}
          >
            <NavBar>{children}</NavBar>
          </div>

          <ToastContainer
            position="bottom-right"
            theme="dark"
            style={{
              fontSize: "0.875rem",
            }}
            toastStyle={{
              background: "rgba(0, 0, 0, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "0.75rem",
              color: "#ffffff",
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
