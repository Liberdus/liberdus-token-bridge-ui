"use client";

import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState, useCallback, useRef } from "react";
import { ethers } from "ethers";
import {
  wagmiConfig,
  networkConfig,
  getContractAddress,
  isSupportedChain,
  getChainName,
  getSupportedChainIds,
  supportsBridgeChainId,
} from "@/app/wagmi";
import { abi as LiberdusABI } from "../../utils/abis/Liberdus.json";
import { abi as LiberdusSecondaryABI } from "../../utils/abis/LiberdusSecondary.json";
import { toast } from "react-toastify";
import { useAccount, useSwitchChain } from "wagmi";
import { colors } from "@/theme/colors";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// SVG Refresh Icon Component
const RefreshIcon = ({ size = 12, isLoading = false }: { size?: number; isLoading?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{
      display: "inline-block",
      animation: isLoading ? "spin 1s linear infinite" : "none",
      transition: "transform 0.2s ease",
    }}
  >
    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
  </svg>
);

// Swap Icon Component
const SwapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
  </svg>
);

// Chain Selector Dropdown
function ChainSelector({
  label,
  selectedChainId,
  excludeChainId,
  onSelect,
  disabled,
}: {
  label: string;
  selectedChainId: number | null;
  excludeChainId: number | null;
  onSelect: (chainId: number) => void;
  disabled?: boolean;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const chainIds = getSupportedChainIds().filter((id) => id !== excludeChainId);

  return (
    <div style={{ flex: 1 }}>
      <p
        style={{
          fontSize: "0.75rem",
          color: colors.text.muted,
          margin: "0 0 0.5rem 0",
          fontWeight: "500",
        }}
      >
        {label}
      </p>
      <div style={{ position: "relative" }} ref={dropdownRef}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.625rem 0.875rem",
            background: colors.background.input,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: "0.75rem",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: disabled ? 0.5 : 1,
          }}
          onClick={() => {
            if (!disabled) setShowDropdown(!showDropdown);
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = colors.border.focus;
              e.currentTarget.style.background = colors.background.hover;
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = colors.border.subtle;
              e.currentTarget.style.background = colors.background.input;
            }
          }}
        >
          <div
            style={{
              width: "1.5rem",
              height: "1.5rem",
              background: selectedChainId
                ? colors.gradients.primary
                : colors.text.muted,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.625rem",
              color: "white",
              fontWeight: "600",
              flexShrink: 0,
            }}
          >
            {selectedChainId ? getChainName(selectedChainId).charAt(0) : "?"}
          </div>
          <span
            style={{
              color: colors.text.primary,
              fontSize: "0.875rem",
              fontWeight: "500",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedChainId ? getChainName(selectedChainId) : "Select Chain"}
          </span>
          <span
            style={{
              color: colors.text.muted,
              fontSize: "0.625rem",
              transition: "transform 0.2s ease",
              transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </span>
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              left: "0",
              right: "0",
              background: colors.background.card,
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: "0.75rem",
              boxShadow: colors.shadows.xl,
              zIndex: 100,
              padding: "0.5rem",
              minWidth: "100%",
            }}
          >
            {chainIds.map((cId) => (
              <div
                key={cId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  background:
                    selectedChainId === cId
                      ? colors.action.selected
                      : "transparent",
                  borderRadius: "0.5rem",
                  cursor: selectedChainId === cId ? "default" : "pointer",
                  transition: "all 0.2s ease",
                  border:
                    selectedChainId === cId
                      ? `1px solid ${colors.primary.border}`
                      : "1px solid transparent",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (cId !== selectedChainId) {
                    onSelect(cId);
                    setShowDropdown(false);
                  }
                }}
                onMouseEnter={(e) => {
                  if (cId !== selectedChainId) {
                    e.currentTarget.style.background = colors.action.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (cId !== selectedChainId) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    background:
                      selectedChainId === cId
                        ? colors.gradients.primary
                        : colors.text.muted,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6rem",
                    color: "white",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  {getChainName(cId).charAt(0)}
                </div>
                <span
                  style={{
                    color: selectedChainId === cId ? colors.primary.light : colors.text.secondary,
                    fontSize: "0.875rem",
                    fontWeight: selectedChainId === cId ? "600" : "500",
                  }}
                >
                  {getChainName(cId)}
                </span>
                {selectedChainId === cId && (
                  <span
                    style={{
                      marginLeft: "auto",
                      color: colors.primary.light,
                      fontSize: "0.75rem",
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CrossChain() {
  const { isConnected, chainId: walletChainId } = useAccount({
    config: wagmiConfig,
  });
  const { switchChain } = useSwitchChain();
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [chainId, setChainId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [amountError, setAmountError] = useState<string>("");
  const amountRef = useRef(amount);

  // Cross-chain specific state
  const supportedIds = getSupportedChainIds();
  const [fromChainId, setFromChainId] = useState<number | null>(networkConfig.defaultChain);
  const [toChainId, setToChainId] = useState<number | null>(networkConfig.secondaryChain);

  const isCurrentChainSupported = chainId ? isSupportedChain(chainId) : false;

  // Sync fromChainId when wallet chain changes externally
  useEffect(() => {
    if (walletChainId && isSupportedChain(walletChainId)) {
      setFromChainId(walletChainId);
      // If toChainId is the same as the new fromChainId, swap it
      if (toChainId === walletChainId) {
        const otherChains = supportedIds.filter((id) => id !== walletChainId);
        if (otherChains.length > 0) {
          setToChainId(otherChains[0]);
        }
      }
    }
  }, [walletChainId]);

  // Handle "From" chain selection
  const handleFromChainSelect = async (newFromChainId: number) => {
    setFromChainId(newFromChainId);
    // If toChainId conflicts, pick another
    if (toChainId === newFromChainId) {
      const otherChains = supportedIds.filter((id) => id !== newFromChainId);
      if (otherChains.length > 0) {
        setToChainId(otherChains[0]);
      }
    }
    // Switch wallet network
    try {
      await switchChain({ chainId: newFromChainId });
    } catch (error) {
      console.error("Failed to switch chain:", error);
    }
  };

  // Handle "To" chain selection
  const handleToChainSelect = (newToChainId: number) => {
    setToChainId(newToChainId);
  };

  // Swap From and To chains
  const handleSwapChains = async () => {
    if (!fromChainId || !toChainId) return;
    const prevFrom = fromChainId;
    const prevTo = toChainId;
    setFromChainId(prevTo);
    setToChainId(prevFrom);
    // Switch wallet to the new From chain
    try {
      await switchChain({ chainId: prevTo });
    } catch (error) {
      console.error("Failed to switch chain:", error);
    }
  };

  // Validate amount function
  const validateAmount = useCallback(
    (value: string) => {
      setAmountError("");

      if (!value || value === "0" || parseFloat(value) === 0) {
        setAmountError("Amount must be greater than 0");
        return false;
      }

      if (parseFloat(value) > parseFloat(balance)) {
        setAmountError("Amount exceeds balance");
        return false;
      }

      return true;
    },
    [balance]
  );

  // Debounced balance fetching function
  const fetchBalance = useCallback(async () => {
    if (
      !contract ||
      !signer?.address ||
      !chainId ||
      !isSupportedChain(chainId)
    ) {
      setBalance("0");
      setAmount("");
      return;
    }

    setIsLoadingBalance(true);
    try {
      const contractAddress = getContractAddress(chainId);
      const contractAbi = supportsBridgeChainId(chainId) ? LiberdusSecondaryABI : LiberdusABI;
      const freshProvider = new ethers.BrowserProvider(window.ethereum);
      const freshContract = new ethers.Contract(
        contractAddress,
        contractAbi,
        freshProvider
      );

      const balance = await freshContract.balanceOf(signer.address);
      const formatted = ethers.formatEther(balance);
      setBalance(formatted);

      const currentAmount = amountRef.current;
      if (currentAmount && parseFloat(currentAmount) > 0) {
        if (parseFloat(currentAmount) > parseFloat(formatted)) {
          setAmountError("Amount exceeds balance");
        } else {
          setAmountError("");
        }
      }
    } catch (error: any) {
      console.error("Error getting balance:", error);
      setBalance("0");
      setAmount("");
      if (!error?.message?.includes("network changed")) {
        toast.error("Failed to fetch balance");
      }
    } finally {
      setIsLoadingBalance(false);
    }
  }, [contract, signer?.address, chainId]);

  // Manual refresh balance function
  const refreshBalance = useCallback(async () => {
    if (!isLoadingBalance) {
      await fetchBalance();
      toast.success("Balance refreshed!");
    }
  }, [fetchBalance, isLoadingBalance]);

  // Initialize provider and check connection status on mount
  useEffect(() => {
    async function initializeProvider() {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);

        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            setSigner(signer);
          }
        } catch (error) {
          console.error("Error checking connection status:", error);
        }

        try {
          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));
        } catch (error) {
          console.error("Error getting network:", error);
        }
      }
    }

    initializeProvider();
  }, []);

  // Update provider when connection status changes
  useEffect(() => {
    if (!isConnected) {
      setSigner(null);
      setBalance("0");
      setAmount("");
      setAmountError("");
      return;
    }

    if (window.ethereum && !provider) {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);
    }
  }, [isConnected, provider]);

  useEffect(() => {
    async function getChainIdAndSetup() {
      if (!provider) return;

      try {
        const network = await provider.getNetwork();
        const newChainId = Number(network.chainId);

        if (chainId !== null && chainId !== newChainId) {
          setBalance("0");
          setAmount("");
          setAmountError("");
          setContract(null);
        }

        setChainId(newChainId);
      } catch (error: any) {
        if (!error.message?.includes("network changed")) {
          console.error("Error getting network:", error);
        }
      }
    }

    getChainIdAndSetup();

    if (window.ethereum) {
      const handleChainChanged = async (newChainId: string) => {
        const chainIdNum = Number(newChainId);

        setBalance("0");
        setAmount("");
        setAmountError("");
        setContract(null);
        setChainId(chainIdNum);

        try {
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(newProvider);

          if (isConnected) {
            const newSigner = await newProvider.getSigner();
            setSigner(newSigner);
          }
        } catch (error) {
          console.error(
            "Error setting up new provider after chain change:",
            error
          );
        }
      };

      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          setSigner(null);
          setBalance("0");
          setAmount("");
          setAmountError("");
        } else if (provider) {
          try {
            const signer = await provider.getSigner();
            setSigner(signer);
          } catch (error) {
            console.error("Error getting signer after account change:", error);
          }
        }
      };

      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener("chainChanged", handleChainChanged);
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
        }
      };
    }
  }, [provider, chainId, isConnected]);

  // Update contract when chain changes
  useEffect(() => {
    if (provider && chainId && isSupportedChain(chainId)) {
      try {
        const contractAddress = getContractAddress(chainId);
        const contractAbi = supportsBridgeChainId(chainId) ? LiberdusSecondaryABI : LiberdusABI;
        const timer = setTimeout(() => {
          const newContract = new ethers.Contract(
            contractAddress,
            contractAbi,
            provider
          );
          setContract(newContract);
        }, 100);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Error creating contract:", error);
        setContract(null);
      }
    } else {
      setContract(null);
      setBalance("0");
      setAmount("");
      setAmountError("");
    }
  }, [provider, chainId]);

  // Fetch balance when contract or signer changes
  useEffect(() => {
    if (contract && signer?.address && isCurrentChainSupported) {
      const timer = setTimeout(() => {
        fetchBalance();
      }, 200);

      return () => clearTimeout(timer);
    } else {
      setBalance("0");
      setAmount("");
      setAmountError("");
    }
  }, [
    contract,
    signer?.address,
    isCurrentChainSupported,
    chainId,
    fetchBalance,
  ]);

  // Get signer when provider is available and user is connected
  useEffect(() => {
    async function getSigner() {
      if (provider && isConnected) {
        try {
          const signer = await provider.getSigner();
          setSigner(signer);
        } catch (error) {
          console.error("Error getting signer:", error);
        }
      }
    }

    getSigner();
  }, [provider, isConnected]);

  const submitBridgeOut = async () => {
    if (!isCurrentChainSupported) {
      toast.error("Please switch to a supported network");
      return;
    }

    if (!validateAmount(amount)) {
      return;
    }

    if (!toChainId) {
      toast.error("Please select a destination chain");
      return;
    }

    setIsLoading(true);
    try {
      if (!contract || !signer) throw new Error("Contract or signer not ready");

      const contractWithSigner = contract.connect(signer) as any;
      const bridgeAmount = ethers.parseUnits(amount, 18);

      toast.info("Initiating cross-chain bridge transaction...");

      // Check if this chain's contract supports destinationChainId parameter
      const tx = supportsBridgeChainId(chainId!)
        ? await contractWithSigner.bridgeOut(
            bridgeAmount,
            signer.address,
            chainId,
            toChainId
          )
        : await contractWithSigner.bridgeOut(
            bridgeAmount,
            signer.address,
            chainId
          );

      if (tx == null) {
        throw new Error("Transaction not submitted");
      }

      toast.info(
        `Transaction submitted: ${tx.hash}. Waiting for confirmation...`
      );

      const receipt = await tx.wait();

      const rawLogs = receipt.logs;
      const contractAddress = getContractAddress(chainId!);

      const events = rawLogs
        .filter(
          (log: any) =>
            log.address.toLowerCase() === contractAddress.toLowerCase()
        )
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch (error) {
            return null;
          }
        })
        .filter((event: any) => event !== null);

      console.log("Decoded Events:", events);

      events.forEach((event: any) => {
        console.log(`Event ${event.name} emitted with args:`, event.args);
      });

      toast.success(`Bridge transaction completed! Hash: ${tx.hash}`);

      await fetchBalance();
      setAmount("");
      setAmountError("");
    } catch (e: any) {
      console.error("Bridge transaction error:", e);

      if (e.code === 4001) {
        toast.error("Transaction rejected by user");
      } else if (e.code === -32603) {
        toast.error("Internal JSON-RPC error. Please try again.");
      } else if (e.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds for transaction");
      } else if (e.message?.includes("gas")) {
        toast.error("Gas estimation failed. Please try again.");
      } else {
        toast.error(e.message || "Transaction failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  function onAmountChange(e: any) {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      amountRef.current = value;
      if (amountError) {
        setAmountError("");
      }
      if (value && parseFloat(value) > 0) {
        validateAmount(value);
      }
    }
  }

  const setMaxAmount = () => {
    if (balance && parseFloat(balance) > 0) {
      setAmount(balance);
      amountRef.current = balance;
      setAmountError("");
    }
  };

  const isButtonDisabled =
    isLoading ||
    isLoadingBalance ||
    ((isConnected || signer) &&
      (!amount || parseFloat(amount) === 0 || !!amountError)) ||
    ((isConnected || signer) && (!balance || parseFloat(balance) === 0));

  return (
    <div
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "32rem",
          margin: "5rem auto",
        }}
      >
        {/* Main Card */}
        <div
          style={{
            background: colors.background.card,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: "1.25rem",
            padding: "1.75rem",
            boxShadow: colors.shadows.card,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                background: colors.gradients.primary,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "0.375rem",
                marginTop: "0",
              }}
            >
              LIB Cross-Chain Bridge
            </h1>
            <p
              style={{
                color: colors.text.muted,
                fontSize: "0.8125rem",
                margin: 0,
              }}
            >
              Transfer LIB across networks
            </p>
          </div>

          {/* Chain Selectors */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "0.5rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* From Chain */}
            <ChainSelector
              label="From"
              selectedChainId={fromChainId}
              excludeChainId={toChainId}
              onSelect={handleFromChainSelect}
              disabled={!isConnected && !signer}
            />

            {/* Swap Button */}
            <button
              onClick={handleSwapChains}
              disabled={!fromChainId || !toChainId || (!isConnected && !signer)}
              style={{
                width: "2.25rem",
                height: "2.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: colors.primary.bg,
                border: `1px solid ${colors.primary.border}`,
                borderRadius: "50%",
                color: colors.primary.main,
                cursor:
                  !fromChainId || !toChainId || (!isConnected && !signer)
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0,
                marginBottom: "0.05rem",
                opacity:
                  !fromChainId || !toChainId || (!isConnected && !signer)
                    ? 0.4
                    : 1,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = colors.primary.bgHover;
                  e.currentTarget.style.transform = "rotate(180deg)";
                  e.currentTarget.style.borderColor = colors.border.focus;
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = colors.primary.bg;
                  e.currentTarget.style.transform = "rotate(0deg)";
                  e.currentTarget.style.borderColor = colors.primary.border;
                }
              }}
            >
              <SwapIcon />
            </button>

            {/* To Chain */}
            <ChainSelector
              label="To"
              selectedChainId={toChainId}
              excludeChainId={fromChainId}
              onSelect={handleToChainSelect}
              disabled={!isConnected && !signer}
            />
          </div>

          {/* Amount Section */}
          {isCurrentChainSupported && isConnected && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: colors.text.secondary,
                  }}
                >
                  You Send
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: colors.text.secondary,
                  }}
                >
                  <span>
                    Balance: {isLoadingBalance ? "Loading..." : balance}
                  </span>
                  {parseFloat(balance) > 0 && (
                    <>
                      <button
                        onClick={setMaxAmount}
                        style={{
                          background: colors.primary.bg,
                          border: `1px solid ${colors.primary.border}`,
                          borderRadius: "0.25rem",
                          padding: "0.25rem 0.5rem",
                          color: colors.primary.light,
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            colors.primary.bgHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            colors.primary.bg;
                        }}
                      >
                        MAX
                      </button>
                      <button
                        onClick={refreshBalance}
                        disabled={isLoadingBalance}
                        title={
                          isLoadingBalance
                            ? "Refreshing balance..."
                            : "Refresh balance"
                        }
                        style={{
                          background: colors.status.successBg,
                          border: `1px solid ${colors.status.successBorder}`,
                          borderRadius: "0.25rem",
                          padding: "0.25rem 0.5rem",
                          color: colors.status.success,
                          fontSize: "0.75rem",
                          cursor: isLoadingBalance
                            ? "not-allowed"
                            : "pointer",
                          transition: "all 0.2s",
                          opacity: isLoadingBalance ? 0.6 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "2rem",
                        }}
                        onMouseEnter={(e) => {
                          if (!isLoadingBalance) {
                            e.currentTarget.style.background =
                              colors.status.successBorder;
                            e.currentTarget.style.transform = "scale(1.05)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLoadingBalance) {
                            e.currentTarget.style.background =
                              colors.status.successBg;
                            e.currentTarget.style.transform = "scale(1)";
                          }
                        }}
                      >
                        <RefreshIcon size={12} isLoading={isLoadingBalance} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  name="amount"
                  id="crosschain-amount"
                  placeholder="0.0"
                  value={amount}
                  onChange={onAmountChange}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    background: colors.background.input,
                    border: amountError
                      ? `1px solid ${colors.status.error}`
                      : `1px solid ${colors.border.subtle}`,
                    borderRadius: "0.75rem",
                    color: colors.text.primary,
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    if (!amountError) {
                      e.target.style.borderColor = colors.border.focus;
                      e.target.style.boxShadow =
                        `0 0 0 3px ${colors.border.focusRing}`;
                    }
                  }}
                  onBlur={(e) => {
                    if (!amountError) {
                      e.target.style.borderColor = colors.border.subtle;
                      e.target.style.boxShadow = "none";
                    }
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: colors.text.muted,
                    fontWeight: "600",
                  }}
                >
                  LIB
                </div>
              </div>
              {/* Error message */}
              {amountError && (
                <p
                  style={{
                    color: colors.status.error,
                    fontSize: "0.875rem",
                    margin: 0,
                    paddingLeft: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  {amountError}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== "loading";
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === "authenticated");

              return (
                <div
                  style={{
                    width: "100%",
                  }}
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  <button
                    onClick={!connected ? openConnectModal : submitBridgeOut}
                    disabled={
                      connected &&
                      (isButtonDisabled || !isCurrentChainSupported)
                    }
                    style={{
                      width: "100%",
                      padding: "1rem",
                      background:
                        connected && !isCurrentChainSupported
                          ? colors.gradients.error
                          : colors.gradients.primary,
                      color: colors.text.inverse,
                      fontWeight: "600",
                      fontSize: "1rem",
                      borderRadius: "0.75rem",
                      border: "none",
                      cursor:
                        connected &&
                        (isButtonDisabled || !isCurrentChainSupported)
                          ? "not-allowed"
                          : "pointer",
                      transition: "all 0.2s",
                      transform: "scale(1)",
                      boxShadow:
                        connected &&
                        (isButtonDisabled || !isCurrentChainSupported)
                          ? "none"
                          : connected && !isCurrentChainSupported
                          ? "0 10px 25px rgba(220, 38, 38, 0.3)"
                          : colors.shadows.button,
                      opacity:
                        connected &&
                        (isButtonDisabled || !isCurrentChainSupported)
                          ? 0.6
                          : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.transform = "scale(1.02)";
                        e.currentTarget.style.background =
                          connected && !isCurrentChainSupported
                            ? colors.gradients.errorHover
                            : colors.gradients.primaryHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.background =
                          connected && !isCurrentChainSupported
                            ? colors.gradients.error
                            : colors.gradients.primary;
                      }
                    }}
                    onMouseDown={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.transform = "scale(0.98)";
                      }
                    }}
                    onMouseUp={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.transform = "scale(1.02)";
                      }
                    }}
                  >
                    {isLoading ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <div
                          style={{
                            width: "1.25rem",
                            height: "1.25rem",
                            border: "2px solid rgba(255, 255, 255, 0.3)",
                            borderTop: "2px solid white",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        ></div>
                        <span>Processing...</span>
                      </div>
                    ) : isLoadingBalance ? (
                      "Loading Balance..."
                    ) : !connected ? (
                      "Connect Wallet"
                    ) : !isCurrentChainSupported ? (
                      "Switch to Supported Network"
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              );
            }}
          </ConnectButton.Custom>

          {/* Footer Info */}
          <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
            <p
              style={{
                fontSize: "0.75rem",
                color: colors.text.muted,
                margin: 0,
              }}
            >
              Transaction typically completes in 2-5 minutes
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div
          style={{
            position: "absolute",
            top: "-0.5rem",
            left: "-0.5rem",
            width: "1rem",
            height: "1rem",
            background: colors.decorative.dotLeft,
            borderRadius: "50%",
            animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            bottom: "-0.5rem",
            right: "-0.5rem",
            width: "1rem",
            height: "1rem",
            background: colors.decorative.dotRight,
            borderRadius: "50%",
            animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
            animationDelay: "1s",
          }}
        ></div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes ping {
          75%,
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export { CrossChain };
