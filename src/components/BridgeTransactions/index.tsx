"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { coordinatorServer, getChainName, getExplorerUrl } from "@/app/wagmi";
import { ethers } from "ethers";
import { toEthereumAddress } from "@/utils/transformAddress";
import moment from "moment";

export interface Transaction {
  txId: string;
  sender: string;
  value: string;
  type: TransactionType;
  txTimestamp: number;
  chainId: number;
  status: TransactionStatus;
  receipt: string;
  reason?: string | null; // Optional field for error reason
  createdAt?: string;
  updatedAt?: string;
}

export enum TransactionStatus {
  PENDING = 0,
  PROCESSING = 1,
  COMPLETED = 2,
  FAILED = 3,
}

export enum TransactionType {
  BRIDGE_IN = 0, // COIN to TOKEN
  BRIDGE_OUT = 1, // TOKEN to COIN
}

export function isTransactionType(value: unknown): value is TransactionType {
  return (
    value === TransactionType.BRIDGE_IN || value === TransactionType.BRIDGE_OUT
  );
}

export function isTransactionStatus(
  value: unknown
): value is TransactionStatus {
  return (
    value === TransactionStatus.PENDING ||
    value === TransactionStatus.PROCESSING ||
    value === TransactionStatus.COMPLETED ||
    value === TransactionStatus.FAILED
  );
}

function BridgeTransactions() {
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
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
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({
    x: 0,
    y: 0,
    showBelow: false,
  });
  const [tooltipReady, setTooltipReady] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    type?: TransactionType;
    status?: TransactionStatus;
  } = {}) => {
    setLoading(true);
    setError(null);
    setTransactions([]);
    setTotalTransactions(0);

    let txURL = `${coordinatorServer}/transaction`;
    if (txId) {
      txURL += `?txId=${txId}`;
    } else if (sender) {
      txURL += `?sender=${toEthereumAddress(sender)}` + `&page=${page}`;
    } else if (isTransactionType(type)) {
      txURL += `?type=${type}` + `&page=${page}`;
    } else if (isTransactionStatus(status)) {
      txURL += `?status=${status}` + `&page=${page}`;
    } else if (page) {
      txURL += `?page=${page}`;
    }

    try {
      // Replace this with your actual API endpoint
      const response = await fetch(txURL);
      const data = await response.json();
      setTransactions(data.Ok.transactions);
      setTotalTransactions(data.Ok.totalTranactions);
      setTotalPages(data.Ok.totalPages);
    } catch (err) {
      setError("Failed to fetch bridge transactions");
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

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
        "Enter transaction status... ( 0: pending, 1: processing, 2: completed, 3: failed )",
    },
  ];

  const currentSearchType = searchTypes.find(
    (type) => type.value === searchType
  );

  const validateSearchQuery = useCallback(
    (searchType: string, query: string, page = 1): boolean => {
      switch (searchType) {
        case "transaction":
          if (
            query.length !== 64 &&
            !(query.startsWith("0x") && query.length === 66)
          ) {
            setSearchError("Invalid transaction ID format");
            return false;
          }
          fetchTransactions({ txId: query });
          break;

        case "sender":
          if (!ethers.isAddress(query)) {
            setSearchError("Invalid sender address format");
            return false;
          }
          fetchTransactions({ sender: query, page });
          break;

        case "type":
          if (query !== "in" && query !== "out") {
            setSearchError("Invalid bridge type. Use 'in' or 'out'.");
            return false;
          }
          fetchTransactions({
            type:
              query === "in"
                ? TransactionType.BRIDGE_IN
                : TransactionType.BRIDGE_OUT,
            page,
          });
          break;

        case "status":
          const queryAsNumber = parseInt(query);
          if (!isTransactionStatus(queryAsNumber)) {
            setSearchError("Invalid status. Use '0', '1', '2' or '3'.");
            return false;
          }
          fetchTransactions({ status: queryAsNumber, page });
          break;

        default:
          setSearchError("Invalid search");
          return false;
      }

      return true; // ✅ passed validation
    },
    []
  );

  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timeout = setTimeout(() => {
      const query = searchQuery.toLowerCase().trim();
      const isValid = validateSearchQuery(searchType, query, 1);
      setIsSearchActive(true);
      if (isValid) {
        setSearchError(null);
      }
    }, 500); // debounce

    return () => clearTimeout(timeout);
  }, [searchQuery, searchType, validateSearchQuery]);

  const clearAllFilters = () => {
    setIsSearchActive(false);
    setSearchQuery("");
    setPage(1);
    fetchTransactions({ page: 1 });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    if (isSearchActive && searchQuery.trim()) {
      // Refresh the current search query
      const query = searchQuery.toLowerCase().trim();
      validateSearchQuery(searchType, query, page);
    } else {
      // Refresh all transactions
      await fetchTransactions({ page });
    }

    // Add a small delay to show the refresh animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
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

  const formatDate = (txTimestamp?: number) => {
    if (!txTimestamp) return "N/A";
    return moment(txTimestamp).fromNow();
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return "#22c55e";
      case TransactionStatus.PENDING:
        return "#fb923c";
      case TransactionStatus.FAILED:
        return "#ef4444";
      default:
        return "#9ca3af";
    }
  };

  const getStatusBg = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return "rgba(34, 197, 94, 0.1)";
      case TransactionStatus.PENDING:
        return "rgba(251, 146, 60, 0.1)";
      case TransactionStatus.FAILED:
        return "rgba(239, 68, 68, 0.1)";
      default:
        return "rgba(156, 163, 175, 0.1)";
    }
  };

  const getStatusBorder = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return "1px solid rgba(34, 197, 94, 0.2)";
      case TransactionStatus.PENDING:
        return "1px solid rgba(251, 146, 60, 0.2)";
      case TransactionStatus.FAILED:
        return "1px solid rgba(239, 68, 68, 0.2)";
      default:
        return "1px solid rgba(156, 163, 175, 0.2)";
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      if (isSearchActive) {
        const query = searchQuery.toLowerCase().trim();
        const valid = validateSearchQuery(searchType, query, nextPage);
        if (valid) setPage(nextPage);
      } else {
        setPage(nextPage);
        fetchTransactions({ page: nextPage });
      }
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      const prevPage = page - 1;
      if (isSearchActive) {
        const query = searchQuery.toLowerCase().trim();
        const valid = validateSearchQuery(searchType, query, prevPage);
        if (valid) setPage(prevPage);
      } else {
        fetchTransactions({ page: prevPage });
        setPage(prevPage);
      }
    }
  };

  const handleTooltipShow = (txId: string, event: React.MouseEvent) => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipWidth = 420; // Increased width for long messages
    const tooltipMaxHeight = 300; // Maximum height before scrolling
    const padding = 20; // Padding from window edges

    let x = rect.left + rect.width / 2;
    let y = rect.top - 10;
    let showBelow = false;

    // Adjust horizontal position if tooltip would exceed window width
    if (x + tooltipWidth / 2 > window.innerWidth - padding) {
      x = window.innerWidth - tooltipWidth / 2 - padding;
    } else if (x - tooltipWidth / 2 < padding) {
      x = tooltipWidth / 2 + padding;
    }

    // Calculate if there's enough space above for the tooltip
    const spaceAbove = rect.top - padding;
    const spaceBelow = window.innerHeight - rect.bottom - padding;

    // Show below if there's not enough space above, or if there's more space below
    if (spaceAbove < tooltipMaxHeight || spaceBelow > spaceAbove) {
      y = rect.bottom + 10;
      showBelow = true;
    }

    // Set position first, then make visible
    setTooltipPosition({ x, y, showBelow });
    setTooltipReady(false); // Reset ready state

    // Use requestAnimationFrame to ensure position is set before showing
    requestAnimationFrame(() => {
      setTooltipVisible(txId);
      requestAnimationFrame(() => {
        setTooltipReady(true);
      });
    });
  };

  const handleTooltipHide = () => {
    // Add a small delay before hiding to allow mouse to move to tooltip
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipVisible(null);
      setTooltipReady(false);
    }, 300);
  };

  const handleTooltipMouseEnter = () => {
    // Clear the hide timeout when mouse enters tooltip
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    // Hide immediately when mouse leaves tooltip
    setTooltipVisible(null);
    setTooltipReady(false);
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
          {/* Header with Title, Total Transactions, and Refresh Button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#d1d5db",
              }}
            >
              Search Transactions
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              {/* Total Transactions Display */}
              {!isSearchActive && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0.5rem 0.75rem",
                    background: "rgba(59, 130, 246, 0.1)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "400",
                    color: "#F9FAFB",
                  }}
                >
                  Total Transactions: {totalTransactions.toLocaleString()}
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                style={{
                  padding: "0.25rem",
                  background:
                    loading || isRefreshing
                      ? "rgba(156, 163, 175, 0.1)"
                      : "rgba(34, 197, 94, 0.1)",
                  border:
                    loading || isRefreshing
                      ? "1px solid rgba(156, 163, 175, 0.2)"
                      : "1px solid rgba(34, 197, 94, 0.2)",
                  borderRadius: "0.5rem",
                  color: loading || isRefreshing ? "#9ca3af" : "#22c55e",
                  cursor: loading || isRefreshing ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2rem",
                  height: "2rem",
                }}
                onMouseEnter={(e) => {
                  if (!loading && !isRefreshing) {
                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.2)";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && !isRefreshing) {
                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.1)";
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
                title={
                  loading || isRefreshing
                    ? "Refreshing..."
                    : "Refresh transactions"
                }
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    animation: isRefreshing
                      ? "spin 1s linear infinite"
                      : "none",
                  }}
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </button>
            </div>
          </div>

          <div style={{ position: "relative" }}>
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
                  : `Found ${totalTransactions} transactions`}{" "}
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

          {(!loading &&
            !error &&
            !isSearchActive &&
            transactions.length === 0) ||
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
                        Chain
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
                        Issued
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
                    {transactions.map((tx) => (
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
                            href={getExplorerUrl(tx.chainId, tx.txId)}
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
                              background: "rgba(99, 102, 241, 0.1)",
                              border: "1px solid rgba(99, 102, 241, 0.2)",
                              borderRadius: "0.5rem",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              color: "#6366f1",
                            }}
                          >
                            <div
                              style={{
                                width: "0.5rem",
                                height: "0.5rem",
                                background: "#6366f1",
                                borderRadius: "50%",
                              }}
                            ></div>
                            <span>{getChainName(tx.chainId)}</span>
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.25rem 0.75rem",
                              background:
                                tx.type === TransactionType.BRIDGE_IN
                                  ? "rgba(34, 197, 94, 0.1)"
                                  : "rgba(59, 130, 246, 0.1)",
                              border:
                                tx.type === TransactionType.BRIDGE_IN
                                  ? "1px solid rgba(34, 197, 94, 0.2)"
                                  : "1px solid rgba(59, 130, 246, 0.2)",
                              borderRadius: "0.5rem",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              color:
                                tx.type === TransactionType.BRIDGE_IN
                                  ? "#22c55e"
                                  : "#3b82f6",
                            }}
                          >
                            <span>
                              {tx.type === TransactionType.BRIDGE_IN
                                ? "←"
                                : "→"}
                            </span>
                            <span>
                              {tx.type === TransactionType.BRIDGE_IN
                                ? "Bridge In"
                                : "Bridge Out"}
                            </span>
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
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
                              <span>
                                {tx.status === TransactionStatus.COMPLETED
                                  ? "Completed"
                                  : tx.status === TransactionStatus.FAILED
                                  ? "Failed"
                                  : tx.status === TransactionStatus.PENDING
                                  ? "Pending"
                                  : tx.status === TransactionStatus.PROCESSING
                                  ? "Processing"
                                  : "Unknown"}
                              </span>
                            </span>

                            {/* Add tooltip icon for failed transactions */}
                            {tx.status === TransactionStatus.FAILED && (
                              <div
                                style={{
                                  position: "relative",
                                  display: "inline-block",
                                }}
                                onMouseEnter={(e) =>
                                  handleTooltipShow(tx.txId, e)
                                }
                                onMouseLeave={handleTooltipHide}
                              >
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#ef4444",
                                    cursor: "help",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "1.5rem",
                                    height: "1.5rem",
                                    borderRadius: "50%",
                                    background: "rgba(239, 68, 68, 0.1)",
                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                    transition:
                                      "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    backdropFilter: "blur(10px)",
                                    boxShadow:
                                      "0 4px 12px rgba(239, 68, 68, 0.2)",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      "rgba(239, 68, 68, 0.2)";
                                    e.currentTarget.style.transform =
                                      "scale(1.1)";
                                    e.currentTarget.style.boxShadow =
                                      "0 6px 20px rgba(239, 68, 68, 0.3)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      "rgba(239, 68, 68, 0.1)";
                                    e.currentTarget.style.transform =
                                      "scale(1)";
                                    e.currentTarget.style.boxShadow =
                                      "0 4px 12px rgba(239, 68, 68, 0.2)";
                                  }}
                                >
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14,2 14,8 20,8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10,9 9,9 8,9"></polyline>
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            color: "#9ca3af",
                          }}
                        >
                          {formatDate(tx.txTimestamp)}
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
                          {tx.receipt == "" ? (
                            "-"
                          ) : (
                            <a
                              href={getExplorerUrl(tx.chainId, tx.receipt)}
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
                              <span>{formatAddress(tx.receipt)}</span>
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

        {tooltipVisible && (
          <div
            style={{
              position: "fixed",
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: tooltipPosition.showBelow
                ? "translateX(-50%) translateY(0%)"
                : "translateX(-50%) translateY(-100%)",
              background:
                "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.98))",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "0.75rem",
              padding: "1rem 1.25rem",
              fontSize: "0.875rem",
              color: "#ffffff",
              maxWidth: "420px",
              maxHeight: "300px",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              zIndex: 1000,
              boxShadow:
                "0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
              pointerEvents: "auto",
              opacity: tooltipReady ? 1 : 0,
              transition: "opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {/* Header with icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "1.25rem",
                  height: "1.25rem",
                  borderRadius: "0.25rem",
                  background: "rgba(239, 68, 68, 0.15)",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <span
                style={{
                  fontWeight: "600",
                  color: "#ef4444",
                  fontSize: "0.875rem",
                  background: "linear-gradient(to right, #ef4444, #dc2626)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Transaction Failed
              </span>
            </div>

            {/* Reason content with scrolling */}
            <div
              style={{
                color: "#e5e7eb",
                lineHeight: "1.5",
                fontSize: "0.8rem",
                maxHeight: "120px",
                overflowY: "auto",
                overflowX: "hidden",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                scrollbarWidth: "thin",
                scrollbarColor:
                  "rgba(239, 68, 68, 0.3) rgba(255, 255, 255, 0.1)",
              }}
              className="custom-scrollbar"
            >
              {(() => {
                const tx = transactions.find((t) => t.txId === tooltipVisible);
                const { reason, receipt } = tx;
                if (receipt) return "Check the receipt for failed reason.";
                return reason
                  .replace(/\\\"/g, '"') // Unescape quotes
                  .replace(/\\n/g, "\n") // Replace escaped newlines
                  .replace(/({|\[)/g, "$1\n  ") // Add newline + indent after { or [
                  .replace(/(}|])/g, "\n$1") // Add newline before } or ]
                  .replace(/,(?!\s*[\n}])/g, ",\n  "); // Add newline after commas (except before closing })
              })()}
            </div>

            {/* Enhanced tooltip arrow */}
            <div
              style={{
                position: "absolute",
                [tooltipPosition.showBelow ? "top" : "bottom"]: "-6px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "0",
                height: "0",
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                [tooltipPosition.showBelow ? "borderBottom" : "borderTop"]:
                  "6px solid rgba(17, 24, 39, 0.98)",
                filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))",
              }}
            ></div>

            {/* Subtle glow effect */}
            <div
              style={{
                position: "absolute",
                top: "-2px",
                left: "-2px",
                right: "-2px",
                bottom: "-2px",
                background:
                  "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))",
                borderRadius: "0.875rem",
                zIndex: -1,
                filter: "blur(8px)",
                opacity: 0.6,
              }}
            ></div>
          </div>
        )}

        {/* Decorative Elements */}
        <div
          style={{
            position: "absolute",
            top: "8.75rem",
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
            top: "8.75rem",
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
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(-100%) scale(1);
          }
        }
        .transaction-row:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(168, 85, 247, 0.3) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.5);
        }
      `}</style>
    </div>
  );
}

export { BridgeTransactions };
