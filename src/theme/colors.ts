export const colors = {
  // Base/primitive colors
  base: {
    white: "#ffffff",
    black: "#000000",
    transparent: "transparent",
    slate50: "#f8fafc",
    slate100: "#f1f5f9",
    slate200: "#e2e8f0",
    slate300: "#cbd5e1",
    slate400: "#94a3b8",
    slate500: "#64748b",
    slate600: "#475569",
    slate700: "#334155",
    slate800: "#1e293b",
    slate900: "#0f172a",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#fb923c",
    info: "#6366f1",
  },

  // Background colors
  background: {
    main: "#f8fafc",
    card: "#ffffff",
    input: "#f8fafc",
    hover: "#f1f5f9",
  },

  // Text colors
  text: {
    primary: "#1e293b",
    secondary: "#64748b",
    muted: "#94a3b8",
    inverse: "#ffffff",
    link: "#818cf8",
    linkHover: "#6366f1",
  },

  // Border colors
  border: {
    subtle: "#e2e8f0",
    default: "#cbd5e1",
    focus: "rgba(99, 102, 241, 0.5)",
    focusRing: "rgba(99, 102, 241, 0.15)",
  },

  // Primary (indigo) accent
  primary: {
    main: "#6366f1",
    light: "#818cf8",
    dark: "#4f46e5",
    ring: "rgba(99, 102, 241, 0.25)",
    bg: "rgba(99, 102, 241, 0.08)",
    bgHover: "rgba(99, 102, 241, 0.15)",
    border: "rgba(99, 102, 241, 0.2)",
  },

  // Action states
  action: {
    hover: "#f1f5f9",
    selected: "rgba(99, 102, 241, 0.08)",
    disabled: "#94a3b8",
  },

  // Gradients
  gradients: {
    primary: "linear-gradient(to right, #6366f1, #8b5cf6)",
    primaryHover: "linear-gradient(to right, #4f46e5, #7c3aed)",
    error: "linear-gradient(to right, #dc2626, #b91c1c)",
    errorHover: "linear-gradient(to right, #b91c1c, #991b1b)",
    // Original purple for BridgeOut/BridgeIn
    purple: "linear-gradient(45deg, #a855f7, #3b82f6)",
    purpleReverse: "linear-gradient(45deg, #3b82f6, #a855f7)",
    purpleHover: "linear-gradient(to right, #9333ea, #2563eb)",
  },

  // Shadows (light theme)
  shadows: {
    sm: "0 1px 3px rgba(0, 0, 0, 0.08)",
    md: "0 4px 12px rgba(0, 0, 0, 0.08)",
    lg: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
    xl: "0 20px 40px -5px rgba(0, 0, 0, 0.1)",
    card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
    cardHover: "0 10px 25px rgba(0, 0, 0, 0.08)",
    button: "0 4px 12px rgba(99, 102, 241, 0.25)",
    buttonPurple: "0 10px 25px rgba(168, 85, 247, 0.2)",
  },

  // Status colors
  status: {
    success: "#22c55e",
    successBg: "rgba(34, 197, 94, 0.1)",
    successBorder: "rgba(34, 197, 94, 0.2)",
    error: "#ef4444",
    errorBg: "rgba(239, 68, 68, 0.1)",
    errorBorder: "rgba(239, 68, 68, 0.2)",
    warning: "#fb923c",
    warningBg: "rgba(251, 146, 60, 0.1)",
    warningBorder: "rgba(251, 146, 60, 0.2)",
    infoBg: "rgba(59, 130, 246, 0.1)",
    infoBorder: "rgba(59, 130, 246, 0.2)",
    infoText: "#3b82f6",
  },

  // Chain-specific colors
  chain: {
    liberdus: "#f59e0b",
    polygon: "#818cf8",
    ethereum: "#818cf8",
    bsc: "#facc15",
    default: "#94a3b8",
  },

  // Decorative
  decorative: {
    dotLeft: "rgba(99, 102, 241, 0.2)",
    dotRight: "rgba(139, 92, 246, 0.2)",
  },
} as const;
