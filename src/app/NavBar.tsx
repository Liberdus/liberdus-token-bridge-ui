"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useChainId, useSwitchChain } from "wagmi";
import { wagmiConfig } from "./wagmi";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { supportedNetworks, isNetworkSupported } from "@/config/networks";

export default function NavBar({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount({ config: wagmiConfig });
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const chainId = useChainId({ config: wagmiConfig });
  const { switchChain } = useSwitchChain({ config: wagmiConfig });
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const networks = supportedNetworks;

  // Check if current network is supported
  const isCurrentNetworkSupported = isNetworkSupported(chainId);
  
  // Always display the actual current network, even if unsupported
  const currentNetwork = networks.find(network => network.id === chainId) || { 
    id: chainId, 
    name: `Unknown Network (${chainId})` 
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNetworkDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const navItemStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "0.75rem",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#e5e7eb",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    backdropFilter: "blur(10px)",
    whiteSpace: "nowrap" as const,
  };

  const navItemHoverStyle = {
    background: "rgba(168, 85, 247, 0.15)",
    borderColor: "rgba(168, 85, 247, 0.3)",
    color: "#ffffff",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 12px rgba(168, 85, 247, 0.2)",
  };

  return (
    <div>
      {/* Navigation Bar */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(20px)",
          // background:
          //   "linear-gradient(135deg, #0f172a 0%, #581c87 20%, #0f172a 100%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "1rem 0",
        }}
      >
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2rem",
          }}
        >
          {/* Left Side - Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                background: "linear-gradient(45deg, #a855f7, #3b82f6)",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                boxShadow: "0 4px 12px rgba(168, 85, 247, 0.3)",
              }}
            ></div>
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                background: "linear-gradient(to right, #ffffff, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
              }}
            >
              Liberdus Token Bridge
            </h2>
          </div>

          {/* Right Side - Navigation & Wallet */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            {/* Navigation Items */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <div
                style={navItemStyle}
                onClick={() => router.push("/")}
                onMouseEnter={(e) =>
                  Object.assign(e.currentTarget.style, navItemHoverStyle)
                }
                onMouseLeave={(e) =>
                  Object.assign(e.currentTarget.style, navItemStyle)
                }
              >
                Bridge Out
              </div>
              <div
                style={navItemStyle}
                onClick={() => router.push("/bridgeIn")}
                onMouseEnter={(e) =>
                  Object.assign(e.currentTarget.style, navItemHoverStyle)
                }
                onMouseLeave={(e) =>
                  Object.assign(e.currentTarget.style, navItemStyle)
                }
              >
                Bridge In
              </div>
              <div
                style={navItemStyle}
                onClick={() => router.push("/bridgeTxns")}
                onMouseEnter={(e) =>
                  Object.assign(e.currentTarget.style, navItemHoverStyle)
                }
                onMouseLeave={(e) =>
                  Object.assign(e.currentTarget.style, navItemStyle)
                }
              >
                Bridge Txns
              </div>
            </div>

            {/* Network Selector */}
            {isConnected && (
              <div
                style={{
                  position: "relative",
                  marginRight: "0.5rem"
                }}
                ref={dropdownRef}
              >
                {!isCurrentNetworkSupported && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-2.5rem",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: "0.5rem",
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      color: "#ef4444",
                      whiteSpace: "nowrap",
                      backdropFilter: "blur(10px)",
                      zIndex: 100,
                    }}
                  >
                    Unsupported network ⚠️
                  </div>
                )}
                <div
                  onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    background: isCurrentNetworkSupported 
                      ? "rgba(79, 70, 229, 0.1)" 
                      : "rgba(239, 68, 68, 0.1)",
                    border: isCurrentNetworkSupported 
                      ? "1px solid rgba(79, 70, 229, 0.2)" 
                      : "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "0.75rem",
                    color: isCurrentNetworkSupported ? "#818cf8" : "#ef4444",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    backdropFilter: "blur(10px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isCurrentNetworkSupported
                      ? "rgba(79, 70, 229, 0.15)"
                      : "rgba(239, 68, 68, 0.15)";
                    e.currentTarget.style.borderColor = isCurrentNetworkSupported
                      ? "rgba(79, 70, 229, 0.3)"
                      : "rgba(239, 68, 68, 0.3)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isCurrentNetworkSupported
                      ? "rgba(79, 70, 229, 0.1)"
                      : "rgba(239, 68, 68, 0.1)";
                    e.currentTarget.style.borderColor = isCurrentNetworkSupported
                      ? "rgba(79, 70, 229, 0.2)"
                      : "rgba(239, 68, 68, 0.2)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      width: "0.5rem",
                      height: "0.5rem",
                      background: isNetworkSupported ? "#818cf8" : "#ef4444",
                      borderRadius: "50%",
                      animation: isNetworkSupported ? undefined : "pulse 2s infinite",
                    }}
                  ></div>
                  <span>{currentNetwork.name}</span>
                  {!isNetworkSupported && (
                    <span style={{ fontSize: "0.75rem", marginLeft: "0.25rem" }}>⚠️</span>
                  )}
                  <span style={{ fontSize: "0.75rem", marginLeft: "0.25rem" }}>
                    {showNetworkDropdown ? "▲" : "▼"}
                  </span>
                </div>

                {/* Network Dropdown */}
                {showNetworkDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 0.5rem)",
                      left: 0,
                      width: "10rem",
                      background: "rgba(15, 23, 42, 0.95)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "0.75rem",
                      padding: "0.5rem",
                      zIndex: 100,
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    {networks.map((network) => (
                      <div
                        key={network.id}
                        onClick={() => {
                          // Always call switchChain, even if it's the "same" network
                          // This handles the case where the wallet is on an unsupported network
                          // but the UI shows a supported one due to previous selection
                          switchChain({ chainId: network.id });
                          setShowNetworkDropdown(false);
                        }}
                        style={{
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          color: network.id === chainId ? "#818cf8" : "#d1d5db",
                          background: network.id === chainId ? "rgba(79, 70, 229, 0.1)" : "transparent",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (network.id !== chainId) {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (network.id !== chainId) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <div
                          style={{
                            width: "0.4rem",
                            height: "0.4rem",
                            background: network.id === chainId ? "#818cf8" : "#6b7280",
                            borderRadius: "50%",
                          }}
                        ></div>
                        <span>{network.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wallet Section */}
            {isConnected && address && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem",
                  background: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                  borderRadius: "0.75rem",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "0.5rem",
                      height: "0.5rem",
                      background: "#22c55e",
                      borderRadius: "50%",
                      animation: "pulse 2s infinite",
                    }}
                  ></div>
                  <span
                    style={{
                      color: "#22c55e",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatAddress(address)}
                  </span>
                </div>

                <button
                  onClick={() => disconnect()}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "0.5rem",
                    color: "#ef4444",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    backdropFilter: "blur(10px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                    e.currentTarget.style.borderColor =
                      "rgba(239, 68, 68, 0.4)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(239, 68, 68, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                    e.currentTarget.style.borderColor =
                      "rgba(239, 68, 68, 0.2)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Disconnect
                </button>
              </div>
            )}

            {/* Not Connected State */}
            {/* {!isConnected && (
              <div
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "rgba(251, 146, 60, 0.1)",
                  border: "1px solid rgba(251, 146, 60, 0.2)",
                  borderRadius: "0.75rem",
                  color: "#fb923c",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: "0.5rem",
                    height: "0.5rem",
                    background: "#fb923c",
                    borderRadius: "50%",
                    animation: "pulse 2s infinite",
                  }}
                ></div>
                Wallet Not Connected
              </div>
            )} */}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main
        style={{
          minHeight: "calc(100vh - 100px)",
        }}
      >
        {children}
      </main>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          nav > div {
            flex-direction: column !important;
            gap: 1rem !important;
          }

          nav > div > div:first-child h2 {
            font-size: 1.25rem !important;
          }

          nav > div > div:last-child {
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 0.5rem !important;
          }

          nav > div > div:last-child > div:first-child {
            order: 2 !important;
          }

          nav > div > div:last-child > div:last-child {
            order: 1 !important;
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}
