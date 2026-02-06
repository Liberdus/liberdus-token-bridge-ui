"use client";

import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  wagmiConfig,
  getChainName,
  isSupportedChain,
  getSupportedChainIds,
} from "./wagmi";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { colors } from "@/theme/colors";

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
    padding: "0.5rem 1.25rem",
    borderRadius: "9999px",
    background: colors.base.slate100,
    border: `1px solid ${colors.border.subtle}`,
    color: colors.text.secondary,
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap" as const,
  };

  const navItemHoverStyle = {
    background: colors.primary.bg,
    borderColor: colors.primary.border,
    color: colors.primary.main,
    transform: "translateY(-1px)",
    boxShadow: colors.shadows.sm,
  };

  const connectButtonStyle = {
    padding: "0.5rem 1.25rem",
    borderRadius: "9999px",
    background: colors.gradients.primary,
    border: "none",
    color: colors.base.white,
    fontSize: "0.875rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: colors.shadows.button,
  };

  const connectButtonHoverStyle = {
    background: colors.gradients.primaryHover,
    boxShadow: `0 4px 12px ${colors.primary.ring}`,
    transform: "translateY(-1px)",
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
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${colors.border.subtle}`,
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
            padding: "0 0",
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
                background: colors.gradients.primary,
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                boxShadow: `0 4px 12px ${colors.primary.ring}`,
              }}
            ></div>
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                background: colors.gradients.primary,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
              }}
            >
              Liberdus Token Bridge
            </h2>
          </div>

          {/* Center - Navigation Items */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <div
              style={navItemStyle}
              onClick={() => router.push("/crossChain")}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, navItemHoverStyle)
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, navItemStyle)
              }
            >
              Cross Chain
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

          {/* Right Side - Network & Wallet */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            {/* Network Selector */}
            {isConnected && chainId && (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    background: colors.background.card,
                    border: `1px solid ${colors.border.subtle}`,
                    borderRadius: "9999px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNetworkDropdown(!showNetworkDropdown);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.border.default;
                    e.currentTarget.style.boxShadow = colors.shadows.sm;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border.subtle;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      width: "0.5rem",
                      height: "0.5rem",
                      background: isCurrentChainSupported
                        ? colors.base.success
                        : colors.base.error,
                      borderRadius: "50%",
                      boxShadow: isCurrentChainSupported
                        ? `0 0 6px ${colors.base.success}80`
                        : `0 0 6px ${colors.base.error}80`,
                    }}
                  ></div>
                  <span
                    style={{
                      color: colors.text.primary,
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
                      color: colors.text.muted,
                      fontSize: "0.625rem",
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
                      background: colors.background.card,
                      border: `1px solid ${colors.border.subtle}`,
                      borderRadius: "0.75rem",
                      boxShadow: colors.shadows.xl,
                      zIndex: 1000,
                      padding: "0.5rem",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        padding: "0.75rem",
                        borderBottom: `1px solid ${colors.border.subtle}`,
                        marginBottom: "0.5rem",
                      }}
                    >
                      <p
                        style={{
                          color: colors.text.secondary,
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
                              ? colors.action.selected
                              : "transparent",
                          borderRadius: "0.5rem",
                          cursor:
                            chainId === supportedChainId
                              ? "default"
                              : "pointer",
                          transition: "all 0.2s ease",
                          border:
                            chainId === supportedChainId
                              ? `1px solid ${colors.primary.light}4d`
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
                            e.currentTarget.style.background = colors.action.hover;
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
                                ? colors.primary.main
                                : colors.base.slate400,
                            borderRadius: "50%",
                          }}
                        ></div>
                        <span
                          style={{
                            color:
                              chainId === supportedChainId
                                ? colors.primary.main
                                : colors.text.primary,
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
                              color: colors.primary.main,
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
            {isConnected && address ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: colors.background.card,
                  border: `1px solid ${colors.border.subtle}`,
                  borderRadius: "9999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.875rem",
                  }}
                >
                  <div
                    style={{
                      width: "0.5rem",
                      height: "0.5rem",
                      background: colors.primary.main,
                      borderRadius: "50%",
                      boxShadow: `0 0 6px ${colors.primary.main}80`,
                    }}
                  ></div>
                  <span
                    style={{
                      color: colors.text.primary,
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatAddress(address)}
                  </span>
                </div>

                <div
                  style={{
                    width: "1px",
                    height: "1.5rem",
                    background: colors.border.subtle,
                  }}
                ></div>

                <button
                  onClick={() => disconnect()}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "transparent",
                    border: "none",
                    color: colors.text.muted,
                    fontSize: "0.8rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.base.error;
                    e.currentTarget.style.background = `${colors.base.error}0d`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.text.muted;
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
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
                      {...(!ready && {
                        "aria-hidden": true,
                        style: {
                          opacity: 0,
                          pointerEvents: "none",
                          userSelect: "none",
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              style={connectButtonStyle}
                              onMouseEnter={(e) =>
                                Object.assign(
                                  e.currentTarget.style,
                                  connectButtonHoverStyle
                                )
                              }
                              onMouseLeave={(e) =>
                                Object.assign(
                                  e.currentTarget.style,
                                  connectButtonStyle
                                )
                              }
                            >
                              Connect Wallet
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
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
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 0.75rem !important;
          }

          nav > div > div:first-child h2 {
            font-size: 1.125rem !important;
          }
        }
      `}</style>
    </div>
  );
}