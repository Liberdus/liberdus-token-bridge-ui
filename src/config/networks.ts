import {
    mainnet,
    polygon,
    polygonAmoy,
    polygonMumbai,
    sepolia,
    bsc,
} from "wagmi/chains";
import { localchain } from "@/app/wagmi";

// Define all supported networks in one place
export const supportedNetworks = [
    { id: 1, name: "Ethereum", chain: mainnet },
    { id: 137, name: "Polygon", chain: polygon },
    { id: 56, name: "Binance", chain: bsc },
    { id: 80002, name: "Polygon Amoy", chain: polygonAmoy },
    { id: 80001, name: "Polygon Mumbai", chain: polygonMumbai },
    { id: 11155111, name: "Sepolia", chain: sepolia },
    { id: 31337, name: "Localhost", chain: localchain },
];

// Convenience list of just the chain IDs for quick checks
export const supportedChainIds = supportedNetworks.map(network => network.id);

// Function to check if a network is supported
export const isNetworkSupported = (chainId: number | null): boolean => {
    if (chainId === null) return false;
    return supportedChainIds.includes(chainId);
};

// Get network details by chain ID
export const getNetworkByChainId = (chainId: number | null) => {
    if (chainId === null) return null;
    return supportedNetworks.find(network => network.id === chainId);
};
