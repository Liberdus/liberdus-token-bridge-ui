"use client";

import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contractAddress, wagmiConfig } from "@/app/wagmi";
import { abi } from "../../../abi.json";
import { toast } from "react-toastify";
import { useAccount } from "wagmi";

function BridgeOut() {
  const { isConnected } = useAccount({ config: wagmiConfig });

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const contract = provider
    ? new ethers.Contract(contractAddress, abi, provider)
    : null;

  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const [amount, setAmount] = useState("0");
  const [balance, setBalance] = useState("0");
  const [chainId, setChainId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected) return;
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, [isConnected]);

  useEffect(() => {
    async function getChainId() {
      if (provider) {
        const network = await provider.getNetwork();
        console.log("network", network.chainId);
        setChainId(Number(network.chainId));
      }
    }

    getChainId();

    // Optional: listen for network changes
    if (window.ethereum) {
      window.ethereum.on("chainChanged", (newChainId: string) => {
        setChainId(Number(newChainId));
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("chainChanged", () => {
          console.log("chainChanged listener removed");
        });
      }
    };
  }, [provider]);

  useEffect(() => {
    async function getBalance() {
      if (contract && signer) {
        const balance = await contract.balanceOf(signer?.address);
        setBalance(ethers.formatEther(balance));
      }
    }

    if (isConnected) {
      getBalance();
    }
  }, [signer, contract, isConnected]);

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  };

  const submitBridgeOut = async () => {
    setIsLoading(true);
    try {
      if (!contract || !signer) throw new Error("Contract or signer not ready");

      const contractWithSigner = contract.connect(signer) as any;
      const bridgeAmount = ethers.parseUnits(amount, 18);
      const tx = await contractWithSigner.bridgeOut(
        bridgeAmount,
        signer.address,
        chainId
      );
      if (tx == null) {
        throw new Error("Transaction not submitted");
      }

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      // Access the raw logs from the receipt
      const rawLogs = receipt.logs;

      // Parse and decode the logs using the contract interface
      const events = rawLogs
        // Filter logs emitted by your contract (optional but recommended)
        .filter(
          (log) => log.address.toLowerCase() === contractAddress.toLowerCase()
        )
        .map((log) => {
          try {
            // Parse the log to get the event object
            return contract.interface.parseLog(log);
          } catch (error) {
            // If the log is not from your contract's events, ignore it
            return null;
          }
        })
        // Remove any null entries resulting from failed parses
        .filter((event) => event !== null);

      // Now you have an array of decoded events
      console.log("Decoded Events:", events);

      // You can process the events as needed
      events.forEach((event) => {
        console.log(`Event ${event.name} emitted with args:`, event.args);
      });

      toast(`Submitted Signature: ${tx.hash}`);

      const balance = await contract.balanceOf(signer?.address);
      setBalance(ethers.formatEther(balance));
      setAmount("0");
    } catch (e: any) {
      console.error(e);
      toast(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (provider) {
      provider.getSigner().then(setSigner);
    }
  }, [provider]);

  function onAmountChange(e: any) {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      {/* <div
        style={{
          position: "absolute",
          top: "-10rem",
          right: "-10rem",
          width: "20rem",
          height: "20rem",
          background: "rgba(168, 85, 247, 0.1)",
          borderRadius: "50%",
          filter: "blur(60px)",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          bottom: "-10rem",
          left: "-10rem",
          width: "20rem",
          height: "20rem",
          background: "rgba(59, 130, 246, 0.1)",
          borderRadius: "50%",
          filter: "blur(60px)",
        }}
      ></div> */}

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "28rem",
          margin: "5rem auto",
        }}
      >
        {/* Main Card */}
        <div
          style={{
            backdropFilter: "blur(20px)",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "1.5rem",
            padding: "2rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "4rem",
                height: "4rem",
                background: "linear-gradient(45deg, #a855f7, #3b82f6)",
                borderRadius: "1rem",
                marginBottom: "1rem",
                boxShadow: "0 10px 25px rgba(168, 85, 247, 0.3)",
                fontSize: "2rem",
                fontWeight: "bold",
              }}
            >
              ⟷
            </div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: "bold",
                background: "linear-gradient(to right, #ffffff, #d1d5db)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "0.5rem",
              }}
            >
              Bridge Out
            </h1>
            <p
              style={{
                color: "#9ca3af",
                fontSize: "0.875rem",
              }}
            >
              Convert Liberdus tokens to coins
            </p>
          </div>

          {/* Connection Status */}
          <div style={{ marginBottom: "1.5rem" }}>
            {isConnected ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  background: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                  borderRadius: "0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      background: "#22c55e",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      color: "white",
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <p
                      style={{
                        color: "#22c55e",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        margin: 0,
                      }}
                    >
                      Wallet Connected
                    </p>
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "0.75rem",
                        margin: 0,
                      }}
                    >
                      {formatAddress(signer?.address)}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    width: "1.25rem",
                    height: "1.25rem",
                    background: "#22c55e",
                    borderRadius: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    color: "white",
                  }}
                >
                  💳
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  background: "rgba(251, 146, 60, 0.1)",
                  border: "1px solid rgba(251, 146, 60, 0.2)",
                  borderRadius: "0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      background: "#fb923c",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      color: "white",
                    }}
                  >
                    !
                  </div>
                  <p
                    style={{
                      color: "#fb923c",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      margin: 0,
                    }}
                  >
                    {provider ? "Wallet Ready" : "Need to Connect Wallet"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chain ID Display */}
          {/* {chainId && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Network Chain ID</span>
                <span style={{ color: 'white', fontWeight: '600' }}>{chainId}</span>
              </div>
            </div>
          )} */}

          {/* Form Fields */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Target Address */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#d1d5db",
                }}
              >
                Destination Address
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  name="target"
                  id="target"
                  placeholder="Target address"
                  value={signer?.address}
                  disabled
                  style={{
                    width: "100%",
                    padding: "1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "0.75rem",
                    color: "white",
                    fontSize: "0.875rem",
                    outline: "none",
                    opacity: signer?.address ? 1 : 0.6,
                    transition: "all 0.2s",
                  }}
                />
                {signer?.address && (
                  <div
                    style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "0.5rem",
                      height: "0.5rem",
                      background: "#22c55e",
                      borderRadius: "50%",
                      animation: "pulse 2s infinite",
                    }}
                  ></div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
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
                    color: "#d1d5db",
                  }}
                >
                  Amount
                </label>
                <div
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#d1d5db",
                  }}
                >
                  Balance: {balance}
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  name="amount"
                  id="amount"
                  placeholder="Amount"
                  value={amount}
                  onChange={onAmountChange}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "0.75rem",
                    color: "white",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(168, 85, 247, 0.5)";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(168, 85, 247, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    fontWeight: "600",
                  }}
                >
                  LIB
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={!isConnected ? connectWallet : submitBridgeOut}
            disabled={
              isLoading ||
              (isConnected && (amount === "0" || !amount)) ||
              (isConnected && (balance === "0" || !balance))
            }
            style={{
              width: "100%",
              marginTop: "2rem",
              padding: "1rem",
              background: "linear-gradient(to right, #a855f7, #3b82f6)",
              // background: !isConnected
              //   ? "linear-gradient(to right, #6b7280, #6b7280)"
              //   : "linear-gradient(to right, #a855f7, #3b82f6)",
              color: "white",
              fontWeight: "600",
              fontSize: "1rem",
              borderRadius: "0.75rem",
              border: "none",
              cursor:
                isLoading ||
                (isConnected && (amount === "0" || !amount)) ||
                (isConnected && (balance === "0" || !balance))
                  ? "not-allowed"
                  : "pointer",
              transition: "all 0.2s",
              transform: "scale(1)",
              boxShadow:
                isLoading ||
                (isConnected && (amount === "0" || !amount)) ||
                (isConnected && (balance === "0" || !balance))
                  ? "none"
                  : "0 10px 25px rgba(168, 85, 247, 0.3)",
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.background =
                  "linear-gradient(to right, #9333ea, #2563eb)";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background =
                  "linear-gradient(to right, #a855f7, #3b82f6)";
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
            ) : !isConnected ? (
              "Connect Wallet"
            ) : (
              "Bridge Tokens"
            )}
          </button>

          {/* Footer Info */}
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Transaction typically completes in 2-5 minutes
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                fontSize: "0.75rem",
                color: "#9ca3af",
              }}
            >
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a855f7")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                <span>View on Explorer</span>
                <span>↗</span>
              </button>
              <span>•</span>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a855f7")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                <span>Learn more</span>
                <span>↗</span>
              </button>
            </div>
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
            background: "rgba(168, 85, 247, 0.3)",
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
            background: "rgba(59, 130, 246, 0.3)",
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

export { BridgeOut };
