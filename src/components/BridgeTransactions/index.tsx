"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { wagmiConfig } from "@/app/wagmi";

export interface Transaction {
  txId: string;
  sender: string;
  value: string;
  type: string;
  tssReceipt: string;
  originalTx: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

function BridgeTransactions() {
  const { isConnected } = useAccount({ config: wagmiConfig });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration - replace with your actual API call
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Replace this with your actual API endpoint
      // const response = await fetch('/api/bridge-transactions');
      // const data = await response.json();

      // Mock data for demonstration
      const mockTransactions: Transaction[] = [
        {
          txId: "0x1234567890abcdef1234567890abcdef12345678",
          sender: "0xabcdef1234567890abcdef1234567890abcdef12",
          value: "1000000000000000000", // 1 ETH in wei
          type: "Bridge In",
          tssReceipt: "0x9876543210fedcba9876543210fedcba98765432",
          originalTx: "0x1111222233334444555566667777888899990000",
          status: "Completed",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          txId: "0x2345678901bcdef12345678901bcdef123456789",
          sender: "0xbcdef12345678901bcdef12345678901bcdef123",
          value: "500000000000000000", // 0.5 ETH in wei
          type: "Bridge Out",
          tssReceipt: "0x8765432109edcba98765432109edcba987654321",
          originalTx: "0x2222333344445555666677778888999900001111",
          status: "Pending",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          txId: "0x3456789012cdef123456789012cdef1234567890",
          sender: "0xcdef123456789012cdef123456789012cdef1234",
          value: "2500000000000000000", // 2.5 ETH in wei
          type: "Bridge In",
          tssReceipt: "0x7654321098dcba987654321098dcba9876543210",
          originalTx: "0x3333444455556666777788889999000011112222",
          status: "Failed",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];

      setTransactions(mockTransactions);
    } catch (err) {
      setError("Failed to fetch bridge transactions");
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchTransactions();
    }
  }, [isConnected]);

  const formatValue = (value: string) => {
    // Convert wei to ETH for display
    try {
      const ethValue = parseFloat(value) / Math.pow(10, 18);
      return ethValue.toFixed(6) + " LIB";
    } catch {
      return value;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "#22c55e";
      case "pending":
        return "#fb923c";
      case "failed":
        return "#ef4444";
      default:
        return "#9ca3af";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "rgba(34, 197, 94, 0.1)";
      case "pending":
        return "rgba(251, 146, 60, 0.1)";
      case "failed":
        return "rgba(239, 68, 68, 0.1)";
      default:
        return "rgba(156, 163, 175, 0.1)";
    }
  };

  const getStatusBorder = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "1px solid rgba(34, 197, 94, 0.2)";
      case "pending":
        return "1px solid rgba(251, 146, 60, 0.2)";
      case "failed":
        return "1px solid rgba(239, 68, 68, 0.2)";
      default:
        return "1px solid rgba(156, 163, 175, 0.2)";
    }
  };

  // if (!isConnected) {
  //   return (
  //     <div
  //       style={{
  //         minHeight: "100vh",
  //         background:
  //           "linear-gradient(135deg, #0f172a 0%, #581c87 20%, #0f172a 80%)",
  //         display: "flex",
  //         alignItems: "center",
  //         justifyContent: "center",
  //         padding: "1rem",
  //         position: "relative",
  //         overflow: "hidden",
  //       }}
  //     >
  //       {/* Background decoration */}
  //       <div
  //         style={{
  //           position: "absolute",
  //           top: "-10rem",
  //           right: "-10rem",
  //           width: "20rem",
  //           height: "20rem",
  //           background: "rgba(168, 85, 247, 0.1)",
  //           borderRadius: "50%",
  //           filter: "blur(60px)",
  //         }}
  //       ></div>
  //       <div
  //         style={{
  //           position: "absolute",
  //           bottom: "-10rem",
  //           left: "-10rem",
  //           width: "20rem",
  //           height: "20rem",
  //           background: "rgba(59, 130, 246, 0.1)",
  //           borderRadius: "50%",
  //           filter: "blur(60px)",
  //         }}
  //       ></div>

  //       <div
  //         style={{
  //           backdropFilter: "blur(20px)",
  //           background: "rgba(255, 255, 255, 0.05)",
  //           border: "1px solid rgba(255, 255, 255, 0.1)",
  //           borderRadius: "1.5rem",
  //           padding: "3rem",
  //           boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  //           textAlign: "center",
  //         }}
  //       >
  //         <div
  //           style={{
  //             display: "inline-flex",
  //             alignItems: "center",
  //             justifyContent: "center",
  //             width: "4rem",
  //             height: "4rem",
  //             background: "linear-gradient(45deg, #a855f7, #3b82f6)",
  //             borderRadius: "1rem",
  //             marginBottom: "1rem",
  //             boxShadow: "0 10px 25px rgba(168, 85, 247, 0.3)",
  //             fontSize: "2rem",
  //           }}
  //         >
  //           💳
  //         </div>
  //         <h2
  //           style={{
  //             fontSize: "1.5rem",
  //             fontWeight: "bold",
  //             background: "linear-gradient(to right, #ffffff, #d1d5db)",
  //             WebkitBackgroundClip: "text",
  //             WebkitTextFillColor: "transparent",
  //             marginBottom: "1rem",
  //           }}
  //         >
  //           Wallet Connection Required
  //         </h2>
  //         <p style={{ color: "#9ca3af", fontSize: "1rem" }}>
  //           Please connect your wallet to view bridge transactions.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div
      style={{
        padding: "2rem 1rem",
        overflow: "auto",
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
          maxWidth: "80rem",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              background: "linear-gradient(to right, #ffffff, #d1d5db)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Bridge Transactions History
          </h1>
          {/* <p
            style={{
              color: "#9ca3af",
              fontSize: "1rem",
            }}
          >
            Track the bridge transaction history
          </p> */}
        </div>

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
          {loading && (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "#a855f7",
                  fontSize: "1.125rem",
                }}
              >
                <div
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    border: "2px solid rgba(168, 85, 247, 0.3)",
                    borderTop: "2px solid #a855f7",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                <span>Loading transactions...</span>
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                textAlign: "center",
                padding: "2rem",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "1rem",
                color: "#ef4444",
                fontSize: "1rem",
                margin: "1rem 0",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!loading && !error && transactions.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "#9ca3af",
                fontSize: "1.125rem",
              }}
            >
              <div
                style={{
                  fontSize: "3rem",
                  marginBottom: "1rem",
                  opacity: 0.5,
                }}
              >
                📝
              </div>
              <p>No bridge transactions found.</p>
            </div>
          )}

          {!loading && !error && transactions.length > 0 && (
            <>
              {/* Desktop Table View */}
              <div
                style={{
                  // display: "block",
                  overflowX: "auto",
                }}
                className="desktop-view"
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0 0.5rem",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#d1d5db",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        Transaction
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#d1d5db",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        Sender
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#d1d5db",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        Value
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#d1d5db",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        Type
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#d1d5db",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#d1d5db",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        Created
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#d1d5db",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, index) => (
                      <tr
                        key={tx.txId}
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          borderRadius: "0.75rem",
                          transition: "all 0.2s",
                          cursor: "pointer",
                        }}
                        className="transaction-row"
                      >
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            color: "#e5e7eb",
                            fontFamily: "monospace",
                            borderRadius: "0.75rem 0 0 0.75rem",
                          }}
                        >
                          <a
                            href={`https://etherscan.io/tx/${tx.txId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#a855f7",
                              textDecoration: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              transition: "color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "#9333ea")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = "#a855f7")
                            }
                          >
                            <span>{formatAddress(tx.txId)}</span>
                            <span style={{ fontSize: "0.75rem" }}>↗</span>
                          </a>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            color: "#e5e7eb",
                            fontFamily: "monospace",
                          }}
                        >
                          {formatAddress(tx.sender)}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            color: "#ffffff",
                            fontWeight: "600",
                          }}
                        >
                          {formatValue(tx.value)}
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.25rem 0.75rem",
                              background:
                                tx.type === "Bridge In"
                                  ? "rgba(34, 197, 94, 0.1)"
                                  : "rgba(59, 130, 246, 0.1)",
                              border:
                                tx.type === "Bridge In"
                                  ? "1px solid rgba(34, 197, 94, 0.2)"
                                  : "1px solid rgba(59, 130, 246, 0.2)",
                              borderRadius: "0.5rem",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              color:
                                tx.type === "Bridge In" ? "#22c55e" : "#3b82f6",
                            }}
                          >
                            {/* <span>{tx.type === "Bridge In" ? "⬇️" : "⬆️"}</span> */}
                            <span>{tx.type === "Bridge In" ? "←" : "→"}</span>

                            <span>{tx.type}</span>
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.25rem 0.75rem",
                              background: getStatusBg(tx.status),
                              border: getStatusBorder(tx.status),
                              borderRadius: "0.5rem",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              color: getStatusColor(tx.status),
                            }}
                          >
                            <div
                              style={{
                                width: "0.5rem",
                                height: "0.5rem",
                                background: getStatusColor(tx.status),
                                borderRadius: "50%",
                              }}
                            ></div>
                            <span>{tx.status}</span>
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            color: "#9ca3af",
                          }}
                        >
                          {formatDate(tx.createdAt)}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            color: "#e5e7eb",
                            fontFamily: "monospace",
                            borderRadius: "0 0.75rem 0.75rem 0",
                          }}
                        >
                          <a
                            href={`https://etherscan.io/tx/${tx.tssReceipt}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#a855f7",
                              textDecoration: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              transition: "color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "#9333ea")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = "#a855f7")
                            }
                          >
                            <span>{formatAddress(tx.tssReceipt)}</span>
                            <span style={{ fontSize: "0.75rem" }}>↗</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Refresh Button */}
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <button
              onClick={fetchTransactions}
              disabled={loading}
              style={{
                padding: "0.75rem 2rem",
                background: loading
                  ? "linear-gradient(to right, #6b7280, #6b7280)"
                  : "linear-gradient(to right, #a855f7, #3b82f6)",
                color: "white",
                fontWeight: "600",
                fontSize: "0.875rem",
                borderRadius: "0.75rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                transform: "scale(1)",
                boxShadow: loading
                  ? "none"
                  : "0 10px 25px rgba(168, 85, 247, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                margin: "0 auto",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = "scale(1.05)";
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
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: "1rem",
                      height: "1rem",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Refresh Transactions</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div
          style={{
            position: "absolute",
            top: "1rem",
            left: "0rem",
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
            top: "1rem",
            right: "0rem",
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
        @keyframes ping {
          75%,
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .transaction-row:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(168, 85, 247, 0.3) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

export { BridgeTransactions };
