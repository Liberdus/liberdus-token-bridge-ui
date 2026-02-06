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

import { colors } from "@/theme/colors";

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div style={{ minHeight: "100vh", background: colors.background.main }}>
            <NavBar>{children}</NavBar>
          </div>
          <ToastContainer />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
