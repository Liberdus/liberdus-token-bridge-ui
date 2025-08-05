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
  supportedChains: {
    "80002": {
      name: "Polygon Amoy",
      chainId: 80002,
      rpcUrl: "https://polygon-amoy.infura.io/v3/",
      wsUrl: "wss://polygon-amoy.infura.io/ws/v3/",
      contractAddress: "0x4EA46e5dD276eeB5D423465b4aFf646AC3f7bd74",
      tssSenderAddress: "0x22443e34ed93D88cAA380f76d8e072998990D221",
      bridgeAddress:
        "22443e34ed93d88caa380f76d8e072998990d221000000000000000000000000",
      gasConfig: {
        gasLimit: 200000,
        gasPriceTiers: [50, 100, 150, 200, 250, 300],
      },
    },
    "11155111": {
      name: "Ethereum Sepolia",
      chainId: 11155111,
      rpcUrl: "https://sepolia.infura.io/v3/",
      wsUrl: "wss://sepolia.infura.io/ws/v3/",
      contractAddress: "0x41f1C8231f369DF894506294841F8836d8320E3c",
      tssSenderAddress: "0xa3267d5cdf6087Ed14BB8c8A158622156b4Bdb12",
      bridgeAddress:
        "a3267d5cdf6087Ed14BB8c8A158622156b4Bdb12000000000000000000000000",
      gasConfig: {
        gasLimit: 200000,
        gasPriceTiers: [10, 20, 30, 40, 50, 60],
      },
    },
    "97": {
      name: "BSC Testnet",
      chainId: 97,
      rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
      wsUrl: "wss://bsc-testnet.publicnode.com",
      contractAddress: "0xCA832C69007f0Abd57164d4244AF2132FB44293D",
      tssSenderAddress: "0x79309245d2BEd1cc8EFcA12F3Dbd2e64aB9591c0",
      bridgeAddress:
        "79309245d2BEd1cc8EFcA12F3Dbd2e64aB9591c0000000000000000000000000",
      gasConfig: {
        gasLimit: 200000,
        gasPriceTiers: [5, 10, 15, 20, 25, 30],
      },
    },
  },
  defaultChain: 80002,
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

// Add enum for mode
export enum Mode {
  Development = "development",
  Production = "production",
}

const mode = Mode.Development || process.env.Mode;
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
export const contractAddress =
  networkConfig.supportedChains["80002"].contractAddress;
export const coordinatorServer = "http://dev.liberdus.com:8000";
export const bridgeInUsername = "liberdusbridge";
export const liberdusExplorer = "https://dev.liberdus.com:3035/tx/";
