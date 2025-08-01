"use client";

import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import {
  wagmiConfig,
  getChainName,
  isSupportedChain,
  getSupportedChainIds,
} from "./wagmi";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function NavBar({ children }: { children: React.ReactNode }) {
  const { address, isConnected, chainId } = useAccount({ config: wagmiConfig });
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const router = useRouter();
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleNetworkSwitch = async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId });
      setShowNetworkDropdown(false);
    } catch (error) {
      console.error("Failed to switch chain:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNetworkDropdown(false);
      }
    };

    if (showNetworkDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNetworkDropdown]);

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

  const isCurrentChainSupported = chainId ? isSupportedChain(chainId) : false;

  return (
    <div>
      {/* Navigation Bar */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "1rem 0",
        }}
      >
        <div
          style={{
            maxWidth: "100rem",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2rem",
            padding: "0 1rem",
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
            {isConnected && chainId && (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    background: isCurrentChainSupported
                      ? "rgba(34, 197, 94, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                    border: isCurrentChainSupported
                      ? "1px solid rgba(34, 197, 94, 0.2)"
                      : "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "0.75rem",
                    backdropFilter: "blur(10px)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNetworkDropdown(!showNetworkDropdown);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 0, 0, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      width: "0.5rem",
                      height: "0.5rem",
                      background: isCurrentChainSupported
                        ? "#22c55e"
                        : "#ef4444",
                      borderRadius: "50%",
                      animation: "pulse 2s infinite",
                    }}
                  ></div>
                  <span
                    style={{
                      color: isCurrentChainSupported ? "#22c55e" : "#ef4444",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      maxWidth: "120px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getChainName(chainId)}
                  </span>
                  <span
                    style={{
                      color: isCurrentChainSupported ? "#22c55e" : "#ef4444",
                      fontSize: "0.75rem",
                      transition: "transform 0.2s ease",
                      transform: showNetworkDropdown
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </div>

                {/* Network Dropdown */}
                {showNetworkDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 0.5rem)",
                      right: "0",
                      minWidth: "200px",
                      background: "rgba(0, 0, 0, 0.9)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "0.75rem",
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                      zIndex: 1000,
                      padding: "0.5rem",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <p
                        style={{
                          color: "#d1d5db",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          margin: 0,
                        }}
                      >
                        Switch Network
                      </p>
                    </div>
                    {getSupportedChainIds().map((supportedChainId) => (
                      <div
                        key={supportedChainId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.75rem",
                          background:
                            chainId === supportedChainId
                              ? "rgba(168, 85, 247, 0.2)"
                              : "transparent",
                          borderRadius: "0.5rem",
                          cursor:
                            chainId === supportedChainId
                              ? "default"
                              : "pointer",
                          transition: "all 0.2s ease",
                          border:
                            chainId === supportedChainId
                              ? "1px solid rgba(168, 85, 247, 0.3)"
                              : "1px solid transparent",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (chainId !== supportedChainId) {
                            handleNetworkSwitch(supportedChainId);
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (chainId !== supportedChainId) {
                            e.currentTarget.style.background =
                              "rgba(255, 255, 255, 0.05)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (chainId !== supportedChainId) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <div
                          style={{
                            width: "0.75rem",
                            height: "0.75rem",
                            background:
                              chainId === supportedChainId
                                ? "#a855f7"
                                : "#6b7280",
                            borderRadius: "50%",
                          }}
                        ></div>
                        <span
                          style={{
                            color:
                              chainId === supportedChainId
                                ? "#a855f7"
                                : "#d1d5db",
                            fontSize: "0.875rem",
                            fontWeight:
                              chainId === supportedChainId ? "600" : "500",
                          }}
                        >
                          {getChainName(supportedChainId)}
                        </span>
                        {chainId === supportedChainId && (
                          <span
                            style={{
                              marginLeft: "auto",
                              color: "#a855f7",
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
            )}

            {/* Wallet Section */}
            {isConnected && address && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
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
                      background: "#3b82f6",
                      borderRadius: "50%",
                      animation: "pulse 2s infinite",
                    }}
                  ></div>
                  <span
                    style={{
                      color: "#3b82f6",
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
            order: 3 !important;
          }

          nav > div > div:last-child > div:nth-child(2) {
            order: 1 !important;
            width: 100% !important;
            justify-content: center !important;
          }

          nav > div > div:last-child > div:last-child {
            order: 2 !important;
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}
