import { getDefaultConfig } from "@rainbow-me/rainbowkit";

import {
  mainnet,
  polygon,
  polygonAmoy,
  polygonMumbai,
  sepolia,
  bsc,
  bscTestnet,
} from "wagmi/chains";

export const localchain = {
  id: 31337, // Chain ID for Hardhat
  name: "Localhost",
  network: "localhost",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"], // Change this to your local RPC URL if needed
    },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "http://127.0.0.1:8545" }, // No block explorer for localhost
  },
  testnet: true, // Mark it as a testnet
};

// Network configuration with all chain details
export const networkConfig = {
  coordinatorUrl: "http://127.0.0.1:8000",
  supportedChains: {
    "80002": {
      name: "Polygon Amoy Testnet",
      chainId: 80002,
      rpcUrl: "https://polygon-amoy.infura.io/v3/",
      wsUrl: "wss://polygon-amoy.infura.io/ws/v3/",
      contractAddress: "0xD5409531c857AfD1b2fF6Cd527038e9981ef4863",
      tssSenderAddress: "0x35576352AABCBCe19AeCE1fFD376f7C49F022706",
      bridgeAddress:
        "22443e34ed93d88caa380f76d8e072998990d221000000000000000000000000",
      gasConfig: {
        gasLimit: 200000,
        gasPriceTiers: [50, 100, 150, 200, 250, 300],
      },
      supportsBridgeChainId: false,
      deploymentBlock: 34134604,
      useBridgeVault: true,
      vaultContractAddress: "0x1469f20C91da50BF9Cc82d7cFB9A8D9EF1dEe86a",
      vaultDeploymentBlock: 34186958,
    },
    "97": {
      name: "BSC Testnet",
      chainId: 97,
      rpcUrl: "https://bsc-testnet.infura.io/v3/",
      wsUrl: "wss://bsc-testnet.publicnode.com",
      contractAddress: "0xA8Da42C5C915384e5d0938A0CbeC5720af736E27",
      tssSenderAddress: "0x43178f0E762433E8Aa0E50EB6d691a3254f957EE",
      bridgeAddress:
        "79309245d2bed1cc8efca12f3dbd2e64ab9591c0000000000000000000000000",
      gasConfig: {
        gasLimit: 200000,
        gasPriceTiers: [5, 10, 15, 20, 25, 30],
      },
      supportsBridgeChainId: true,
      deploymentBlock: 91260194,
    },
  },
  defaultChain: 80002,
  secondaryChain: 97, // It would be LIBERDUS_CHAIN_ID when Liberdus Mainnet is live
  enableLiberdusNetwork: false,
  liberdusNetworkId:
    "7440f5161ffc77eed9ee91d6fbb406083192d1fe4d7e64b2f0814c0e067dcab4",
};

// Explorer URL mapping based on chain ID
export const getExplorerUrl = (chainId: number, txHash: string): string => {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io/tx/", // Ethereum Mainnet
    11155111: "https://sepolia.etherscan.io/tx/", // Ethereum Sepolia
    137: "https://polygonscan.com/tx/", // Polygon Mainnet
    80001: "https://mumbai.polygonscan.com/tx/", // Polygon Mumbai (deprecated)
    80002: "https://amoy.polygonscan.com/tx/", // Polygon Amoy
    56: "https://bscscan.com/tx/", // BSC Mainnet
    97: "https://testnet.bscscan.com/tx/", // BSC Testnet
    31337: "http://127.0.0.1:8545/tx/", // Local development
  };

  // Default to Liberdus explorer if chain ID not found or if it's a Liberdus transaction
  const explorerUrl = explorers[chainId];
  if (!explorerUrl || !txHash.startsWith("0x")) {
    return `${liberdusExplorer}${txHash}`;
  }

  return `${explorerUrl}${txHash}`;
};

// Helper function to get contract address for current chain
export const getContractAddress = (chainId: number): string => {
  const config = networkConfig.supportedChains[chainId.toString()];
  return (
    config?.contractAddress ||
    networkConfig.supportedChains["80002"].contractAddress
  );
};

// Helper function to check if chain is supported
export const isSupportedChain = (chainId: number): boolean => {
  if (!chainId) return false;
  return chainId.toString() in networkConfig.supportedChains;
};

// Helper function to get all supported chain IDs
export const getSupportedChainIds = (): number[] => {
  return Object.keys(networkConfig.supportedChains).map((id) => parseInt(id));
};

// Helper function to get chain name
export const getChainName = (chainId: number): string => {
  if (!chainId) return "Unsupported Network";
  const config = networkConfig.supportedChains[chainId.toString()];
  return config?.name || "Unsupported Network";
};

// Helper function to check if chain supports destination chain ID in bridgeOut
export const supportsBridgeChainId = (chainId: number): boolean => {
  if (!chainId) return false;
  const config = networkConfig.supportedChains[chainId.toString()];
  return config?.supportsBridgeChainId ?? false;
};

// Helper function to check if chain uses vault contract for bridging
export const isVaultChain = (chainId: number): boolean => {
  if (!chainId) return false;
  const config = networkConfig.supportedChains[chainId.toString()];
  return config?.useBridgeVault === true;
};

// Helper function to get vault contract address for a chain (null if not a vault chain or not configured)
export const getVaultContractAddress = (chainId: number): string | null => {
  if (!chainId) return null;
  const config = networkConfig.supportedChains[chainId.toString()];
  if (config?.useBridgeVault && config.vaultContractAddress) {
    return config.vaultContractAddress;
  }
  return null;
};

// Helper function to check if Liberdus Network is enabled as bridge destination
export const isLiberdusNetworkEnabled = (): boolean => {
  return networkConfig.enableLiberdusNetwork;
};

// Liberdus network chain ID (matches DEFAULT_CHAIN_ID in the token contract)
export const LIBERDUS_CHAIN_ID = 0;

// Add enum for mode
export enum Mode {
  Development = "development",
  Production = "production",
}

const mode = process.env.NEXT_PUBLIC_MODE || Mode.Development;
export const wagmiConfig = getDefaultConfig({
  appName: "Liberdus Token Bridge",
  projectId: "a456240005ff39a4d2dc51d18ffa4ad9",
  chains:
    mode === Mode.Production
      ? [mainnet, polygon, polygonMumbai, bsc]
      : [sepolia, polygonAmoy, bscTestnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

// Legacy exports for backward compatibility
export const bridgeInUsername = "liberdusbridge";
export const liberdusExplorer = "https://dev.liberdus.com:3035/tx/";
