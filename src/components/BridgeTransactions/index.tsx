"use client";

import { useEffect, useState, useRef } from "react";
import { coordinatorServer } from "@/app/wagmi";
import { ethers } from "ethers";
import { toEthereumAddress } from "@/utils/transformAddress";
import moment from "moment";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("transaction");
  const [searchError, setSearchError] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchTransactions = async ({
    page = 1,
    txId,
    sender,
    type,
    status,
  }: {
    page?: number;
    txId?: string;
    sender?: string;
    type?: string;
    status?: string;
  } = {}) => {
    setLoading(true);
    setError(null);
    setTransactions([]);

    let txURL = `${coordinatorServer}/transaction`;
    if (txId) {
      txURL += `?txId=${txId}`;
    } else if (sender) {
      txURL += `?senderAddress=${sender}` + `&page=${page}`;
    } else if (type) {
      txURL += `?type=${type}` + `&page=${page}`;
    } else if (status) {
      txURL += `?status=${status}` + `&page=${page}`;
    } else if (page) {
      txURL += `?page=${page}`;
    }

    try {
      // Replace this with your actual API endpoint
      const response = await fetch(txURL);
      const data = await response.json();
      setTransactions(
        data.Ok.transactions.map((tx: Transaction) =>
          tx.type === "coinToToken"
            ? { ...tx, type: "Bridge In" }
            : { ...tx, type: "Bridge Out" }
        )
      );
      setTotalPages(1);
    } catch (err) {
      setError("Failed to fetch bridge transactions");
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const searchTypes = [
    {
      value: "transaction",
      label: "Transaction ID",
      placeholder: "Enter transaction ID...",
    },
    {
      value: "sender",
      label: "Sender Address",
      placeholder: "Enter sender address...",
    },
    {
      value: "type",
      label: "Bridge Type",
      placeholder:
        "Enter bridge transaction type... ( in: bridge in, out: bridge out )",
    },
    {
      value: "status",
      label: "Transaction Status",
      placeholder:
        "Enter transaction status... ( 0: pending, 1: completed, 2: failed )",
    },
  ];

  const currentSearchType = searchTypes.find(
    (type) => type.value === searchType
  );

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase().trim();
    // validate query
    switch (searchType) {
      case "transaction":
        if (
          query.length !== 64 &&
          !(query.startsWith("0x") && query.length === 66)
        ) {
          setSearchError("Invalid transaction ID format");
          return;
        }
        fetchTransactions({ txId: query });
        break;
      case "sender":
        if (!ethers.isAddress(query)) {
          setSearchError("Invalid sender address format");
          return;
        }
        fetchTransactions({ sender: query, page: 1 });
        break;
      case "type":
        if (query !== "in" && query !== "out") {
          setSearchError("Invalid bridge type. Use 'in' or 'out'.");
          return;
        }
        fetchTransactions({
          type: query === "in" ? "coinToToken" : "tokenToCoin",
          page: 1,
        });
        break;
      case "status":
        if (!["0", "1", "2"].includes(query)) {
          setSearchError("Invalid status. Use '0', '1', or '2'.");
          return;
        }
        fetchTransactions({ status: query, page: 1 });
        break;
      default:
        setSearchError("Invalid search");
        return;
    }
    setSearchError("");
    setIsSearchActive(true);
  }, [searchQuery, searchType]);

  const clearAllFilters = () => {
    setIsSearchActive(false);
    setSearchQuery("");
    fetchTransactions({ page: 1 });
  };

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const formatValue = (value: string) => {
    // Convert wei to ETH for display
    try {
      const amount = BigInt(value);
      const ethValue = ethers.formatEther(amount);
      return ethValue + " LIB";
    } catch {
      return value;
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    const ethAddress = toEthereumAddress(address);
    return `${ethAddress.slice(0, 6)}...${ethAddress.slice(-4)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const localTime = moment
      .utc(dateString)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");
    return moment(localTime).fromNow();
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

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
      fetchTransactions();
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
      fetchTransactions();
    }
  };

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
        {/* <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              background: "linear-gradient(to right, #ffffff, #d1d5db)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Bridge Transactions
          </h1>
        </div> */}

        {/* Search Filters */}
        <div
          style={{
            backdropFilter: "blur(20px)",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            position: "relative",
            zIndex: 49, // Lower than the nav bar
          }}
        >
          <div style={{ position: "relative" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#d1d5db",
                marginBottom: "0.5rem",
              }}
            >
              Search Transactions
            </label>
            <div
              style={{
                display: "flex",
                position: "relative",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "0.5rem",
                overflow: "visible",
              }}
            >
              {/* Search Type Dropdown */}
              <div
                ref={dropdownRef}
                style={{ position: "relative", zIndex: 101 }}
              >
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    padding: "0.75rem 1rem",
                    background: isDropdownOpen
                      ? "rgba(168, 85, 247, 0.2)"
                      : "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                    minWidth: "140px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDropdownOpen) {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDropdownOpen) {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.1)";
                    }
                  }}
                >
                  <span>{currentSearchType?.label}</span>
                  <span
                    style={{
                      transform: isDropdownOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s",
                      fontSize: "0.75rem",
                    }}
                  >
                    ▼
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "0",
                      minWidth: "200px",
                      background: "rgba(17, 24, 39, 0.98)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "0.5rem",
                      marginTop: "0.25rem",
                      zIndex: 1001,
                      boxShadow: "0 20px 40px -5px rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    {searchTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          console.log("Clicked:", type.value); // Debug log
                          setSearchType(type.value);
                          setIsDropdownOpen(false);
                          setSearchQuery(""); // Clear search when changing type
                        }}
                        style={{
                          width: "100%",
                          padding: "0.75rem 1rem",
                          background:
                            searchType === type.value
                              ? "rgba(168, 85, 247, 0.3)"
                              : "transparent",
                          border: "none",
                          color:
                            searchType === type.value ? "#ffffff" : "#d1d5db",
                          fontSize: "0.875rem",
                          fontWeight: searchType === type.value ? "600" : "400",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                        onMouseEnter={(e) => {
                          if (searchType !== type.value) {
                            e.currentTarget.style.background =
                              "rgba(255, 255, 255, 0.1)";
                            e.currentTarget.style.color = "#ffffff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (searchType !== type.value) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#d1d5db";
                          }
                        }}
                      >
                        <span>{type.label}</span>
                        {searchType === type.value && (
                          <span
                            style={{ color: "#a855f7", fontSize: "0.75rem" }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentSearchType?.placeholder}
                style={{
                  flex: "1",
                  padding: "0.75rem 1rem",
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />

              {/* Clear Button */}
              {isSearchActive && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    padding: "0.75rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "none",
                    borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#ef4444",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Search Results Info */}
            {isSearchActive && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1rem",
                  background: searchError
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(59, 130, 246, 0.1)",
                  border: searchError
                    ? "1px solid rgba(239, 68, 68, 0.2)"
                    : "1px solid rgba(59, 130, 246, 0.2)",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  color: searchError ? "#ef4444" : "#3b82f6",
                }}
              >
                {loading
                  ? "Searching for transactions..."
                  : searchError
                  ? `Error: ${searchError}`
                  : `Found ${transactions.length} transactions`}{" "}
                {searchQuery &&
                  ` • ${currentSearchType?.label}: "${searchQuery}"`}
              </div>
            )}
          </div>
        </div>

        {/* Main Card */}
        <div
          style={{
            backdropFilter: "blur(20px)",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "1.5rem",
            padding: "0.75rem 2rem",
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

          {(!loading && !error && !isSearchActive) ||
            (!loading &&
              !error &&
              isSearchActive &&
              transactions.length === 0 && (
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
                    {isSearchActive ? "🔍" : "📝"}
                  </div>
                  <p>
                    {isSearchActive
                      ? "No transactions match your search criteria."
                      : "No bridge transactions found."}
                  </p>
                </div>
              ))}

          {!loading && !error && transactions.length > 0 && (
            <>
              {/* Desktop Table View */}
              <div
                style={{
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
                            href={
                              tx.txId.startsWith("0x")
                                ? `https://amoy.polygonscan.com/tx/${tx.txId}`
                                : `https://dev.liberdus.com:3035/tx/${tx.txId}`
                            }
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
                          {tx.tssReceipt == "" ? (
                            "-"
                          ) : (
                            <a
                              href={
                                tx.tssReceipt?.startsWith("0x")
                                  ? `https://amoy.polygonscan.com/tx/${tx.tssReceipt}`
                                  : `https://dev.liberdus.com:3035/tx/${tx.tssReceipt}`
                              }
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
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {!loading && !error && transactions.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "0.5rem 0",
                gap: "0.5rem",
              }}
            >
              <button
                onClick={handlePreviousPage}
                disabled={page === 1}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "linear-gradient(to right, #a855f7, #3b82f6)",
                  border: "none",
                  borderRadius: "0.5rem",
                  color: "#e5e7eb",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  transform: "scale(1)",
                  boxShadow: "0 10px 25px rgba(168, 85, 247, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
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
                <span>←</span>
                <span>Prev</span>
              </button>
              <span
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "0.5rem",
                  color: "#e5e7eb",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginLeft: "0.5rem",
                  marginRight: "0.5rem",
                }}
              >
                Page {page} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "linear-gradient(to right, #a855f7, #3b82f6)",
                  border: "none",
                  borderRadius: "0.5rem",
                  color: "#e5e7eb",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  transform: "scale(1)",
                  boxShadow: "0 10px 25px rgba(168, 85, 247, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
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
                <span>Next</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>

        {/* Decorative Elements */}
        <div
          style={{
            position: "absolute",
            top: "7.5rem",
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
            top: "7.5rem",
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
