"use client";

import { bridgeInUsername } from "@/app/wagmi";

function BridgeIn() {
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
                background: "linear-gradient(45deg, #3b82f6, #a855f7)",
                borderRadius: "1rem",
                marginBottom: "1rem",
                boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
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
              Bridge In
            </h1>
            <p
              style={{
                color: "#9ca3af",
                fontSize: "0.875rem",
              }}
            >
              Convert Liberdus coins to tokens
            </p>
          </div>

          {/* Instructions */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              marginTop: "2rem",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "0.75rem",
                padding: "1.5rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "white",
                  marginBottom: "1rem",
                }}
              >
                How to Bridge In
              </h3>
              <p
                style={{
                  color: "#d1d5db",
                  fontSize: "0.875rem",
                  lineHeight: "1.5",
                  marginBottom: "1rem",
                }}
              >
                To bridge your coins into Liberdus tokens, send a transfer from
                the Liberdus Web Client to the special bridge account.
              </p>

              <ol
                style={{
                  color: "#d1d5db",
                  fontSize: "0.875rem",
                  paddingLeft: "1.25rem",
                  margin: "0",
                }}
              >
                <li style={{ marginBottom: "0.75rem" }}>
                  <strong>Transfer Funds:</strong> Sign in your Liberdus account
                  to the Web Client and initiate a transfer.
                </li>
                <li style={{ marginBottom: "0.75rem" }}>
                  <strong>Target Bridge Account:</strong> Set the recipient to{" "}
                  <code
                    style={{
                      //   background:
                      //     "rgb(255, 255, 255)" /* Pure white background */,
                      padding: "0.1rem 0.5rem",
                      borderRadius: "0.275rem",
                      //   fontWeight: "bold",
                      fontStyle: "italic",
                      //   color: "rgb(30, 30, 30)" /* Very dark gray font color */,
                    }}
                  >
                    &quot;{bridgeInUsername}&quot;
                  </code>{" "}
                  and the desired amount.
                </li>
                <li>
                  <strong>Confirm & Receive:</strong> Confirm the transaction.
                  Liberdus tokens will reflect within minutes to the token
                  network address ( the same address associated with your
                  Liberdus account ).
                </li>
              </ol>

              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "0.75rem",
                  fontStyle: "italic",
                  marginTop: "1rem",
                }}
              >
                *Note: Token reflection time may vary due to network
                congestion.*
              </p>
            </div>
          </div>

          {/* Footer Info */}
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              For support, please contact the Liberdus team.
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
                onMouseEnter={(e) => (e.currentTarget.style.color = "#3b82f6")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                <span>Liberdus Website</span>
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
                onMouseEnter={(e) => (e.currentTarget.style.color = "#3b82f6")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                <span>Support Page</span>
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
            right: "-0.5rem",
            width: "1rem",
            height: "1rem",
            background: "rgba(59, 130, 246, 0.3)",
            borderRadius: "50%",
            animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            bottom: "-0.5rem",
            left: "-0.5rem",
            width: "1rem",
            height: "1rem",
            background: "rgba(168, 85, 247, 0.3)",
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

export { BridgeIn };
