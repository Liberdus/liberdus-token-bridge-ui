"use client";

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount, useSwitchChain } from "wagmi";
import {
  wagmiConfig,
  isSupportedChain,
  networkConfig,
} from "@/app/wagmi";

// Resolve contract address by type from networkConfig, independent of connected chain
function resolveAddressByType(type: ContractType): string {
  const chains = networkConfig.supportedChains;
  const defaultCfg = chains[networkConfig.defaultChain.toString()];
  const secondaryCfg = chains[networkConfig.secondaryChain.toString()];
  if (type === "Primary") return defaultCfg?.contractAddress ?? "";
  if (type === "Secondary") return secondaryCfg?.contractAddress ?? "";
  // Vault lives on the default chain
  return defaultCfg?.vaultContractAddress ?? defaultCfg?.contractAddress ?? "";
}

// Resolve the target chain ID for a given contract type
function resolveChainByType(type: ContractType): number {
  if (type === "Secondary") return networkConfig.secondaryChain;
  return networkConfig.defaultChain; // Primary and Vault both live on the default chain
}
import { toast } from "react-toastify";
import { colors } from "@/theme/colors";
import { abi as liberdusAbi } from "../../utils/abis/Liberdus.json";
import { abi as liberdusSecondaryAbi } from "../../utils/abis/LiberdusSecondary.json";
import { abi as vaultAbi } from "../../utils/abis/Vault.json";

type ContractType = "Primary" | "Secondary" | "Vault";

const OP_TYPES: Record<ContractType, { value: number; name: string }[]> = {
  Primary: [
    { value: 0, name: "Mint" },
    { value: 1, name: "Burn" },
    { value: 2, name: "PostLaunch" },
    { value: 3, name: "Pause" },
    { value: 4, name: "Unpause" },
    { value: 5, name: "SetBridgeInCaller" },
    { value: 6, name: "SetBridgeInLimits" },
    { value: 7, name: "UpdateSigner" },
    { value: 8, name: "DistributeTokens" },
  ],
  Secondary: [
    { value: 0, name: "Pause" },
    { value: 1, name: "Unpause" },
    { value: 2, name: "SetBridgeInCaller" },
    { value: 3, name: "SetBridgeInLimits" },
    { value: 4, name: "UpdateSigner" },
    { value: 5, name: "SetBridgeInEnabled" },
    { value: 6, name: "SetBridgeOutEnabled" },
  ],
  Vault: [
    { value: 0, name: "Pause" },
    { value: 1, name: "Unpause" },
    { value: 2, name: "SetBridgeOutAmount" },
    { value: 3, name: "UpdateSigner" },
    { value: 4, name: "RelinquishTokens" },
    { value: 5, name: "SetBridgeOutEnabled" },
  ],
};

const getAbi = (type: ContractType) => {
  if (type === "Primary") return liberdusAbi;
  if (type === "Secondary") return liberdusSecondaryAbi;
  return vaultAbi;
};

interface OperationRecord {
  operationId: string;
  opType: number;
  opTypeName: string;
  target: string;
  value: bigint;
  data: string;
  numSignatures: number;
  executed: boolean;
  deadline: number;
  requester: string;
  timestamp: number;
  hasSigned: boolean;
  isExpired: boolean;
}

interface CreateFormData {
  opType: number;
  callerAddress: string;
  maxAmount: string;
  cooldown: string;
  oldSigner: string;
  newSigner: string;
  burnAmount: string;
  distributeRecipient: string;
  distributeAmount: string;
  bridgeEnabled: boolean;
}

const NO_FIELDS_OPS: Record<ContractType, string[]> = {
  Primary: ["Mint", "PostLaunch", "Pause", "Unpause"],
  Secondary: ["Pause", "Unpause"],
  Vault: ["Pause", "Unpause", "RelinquishTokens"],
};

const BOOL_OPS = ["SetBridgeInEnabled", "SetBridgeOutEnabled"];

function formatAddress(addr: string) {
  if (!addr || addr === ethers.ZeroAddress) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDeadline(ts: number) {
  const now = Math.floor(Date.now() / 1000);
  if (ts < now) return "Expired";
  const diff = ts - now;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m left`;
}

function Multisig() {
  const { isConnected } = useAccount({ config: wagmiConfig });
  const { switchChain } = useSwitchChain();
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [contractType, setContractType] = useState<ContractType>("Primary");
  const [contractAddress, setContractAddress] = useState("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isSigner, setIsSigner] = useState(false);
  const [operations, setOperations] = useState<OperationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateFormData>({
    opType: 0,
    callerAddress: "",
    maxAmount: "",
    cooldown: "",
    oldSigner: "",
    newSigner: "",
    burnAmount: "",
    distributeRecipient: "",
    distributeAmount: "",
    bridgeEnabled: true,
  });
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isChainSupported = chainId ? isSupportedChain(chainId) : false;
  const currentOpTypes = OP_TYPES[contractType];
  const selectedOpName =
    currentOpTypes.find((o) => o.value === formData.opType)?.name ?? "";

  // Initialize provider
  useEffect(() => {
    async function init() {
      if (!window.ethereum) return;
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      try {
        const net = await p.getNetwork();
        setChainId(Number(net.chainId));
      } catch {}
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          const s = await p.getSigner();
          setSigner(s);
        }
      } catch {}
    }
    init();
  }, []);

  // Listen for chain/account changes
  useEffect(() => {
    if (!window.ethereum) return;
    const onChainChanged = async (hex: string) => {
      const id = Number(hex);
      setChainId(id);
      setOperations([]);
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      if (isConnected) {
        try {
          const s = await p.getSigner();
          setSigner(s);
        } catch {}
      }
    };
    const onAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        setSigner(null);
      } else if (provider) {
        try {
          const s = await provider.getSigner();
          setSigner(s);
        } catch {}
      }
    };
    window.ethereum.on("chainChanged", onChainChanged);
    window.ethereum.on("accountsChanged", onAccountsChanged);
    return () => {
      window.ethereum.removeListener("chainChanged", onChainChanged);
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
    };
  }, [provider, isConnected]);

  // Sync signer when isConnected changes
  useEffect(() => {
    if (!isConnected) { setSigner(null); return; }
    if (provider) {
      provider.getSigner().then(setSigner).catch(() => {});
    }
  }, [isConnected, provider]);

  // Set default contract address from network config based on contract type
  useEffect(() => {
    setContractAddress(resolveAddressByType(contractType));
  }, [contractType]);

  // Build contract instance only when the wallet is on the correct chain for the selected contract type
  useEffect(() => {
    const expectedChain = resolveChainByType(contractType);
    if (
      !provider ||
      !contractAddress ||
      !ethers.isAddress(contractAddress) ||
      chainId !== expectedChain
    ) {
      setContract(null);
      setOperations([]);
      return;
    }
    const abi = getAbi(contractType);
    const c = new ethers.Contract(contractAddress, abi, provider);
    setContract(c);
  }, [provider, contractAddress, contractType, chainId]);

  // Check owner/signer status
  useEffect(() => {
    async function checkRole() {
      if (!contract || !signer?.address) {
        setIsOwner(false);
        setIsSigner(false);
        return;
      }
      try {
        const [ownerAddr, signerStatus] = await Promise.all([
          contract.owner(),
          contract.isSigner(signer.address),
        ]);
        setIsOwner(
          ownerAddr.toLowerCase() === signer.address.toLowerCase()
        );
        setIsSigner(signerStatus);
      } catch {
        setIsOwner(false);
        setIsSigner(false);
      }
    }
    checkRole();
  }, [contract, signer?.address]);

  // Fetch operations from events
  const fetchOperations = useCallback(async () => {
    if (!contract || !provider) return;
    setLoading(true);
    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 100000);

      const [requestedLogs, executedLogs, signedLogs] = await Promise.all([
        contract.queryFilter(
          contract.filters.OperationRequested(),
          fromBlock,
          "latest"
        ),
        contract.queryFilter(
          contract.filters.OperationExecuted(),
          fromBlock,
          "latest"
        ),
        signer?.address
          ? contract.queryFilter(
              contract.filters.SignatureSubmitted(
                null,
                signer.address
              ),
              fromBlock,
              "latest"
            )
          : Promise.resolve([]),
      ]);

      const executedIds = new Set(
        executedLogs.map((l) => {
          const parsed = contract.interface.parseLog({
            topics: l.topics as string[],
            data: l.data,
          });
          return parsed?.args[0] as string;
        })
      );

      const signedIds = new Set(
        signedLogs.map((l) => {
          const parsed = contract.interface.parseLog({
            topics: l.topics as string[],
            data: l.data,
          });
          return parsed?.args[0] as string;
        })
      );

      const now = Math.floor(Date.now() / 1000);
      const ops: OperationRecord[] = [];

      for (const log of requestedLogs) {
        const parsed = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (!parsed) continue;

        const operationId = parsed.args[0] as string;
        const opType = Number(parsed.args[1]);
        const requester = parsed.args[2] as string;
        const target = parsed.args[3] as string;
        const value = parsed.args[4] as bigint;
        const data = parsed.args[5] as string;
        const deadline = Number(parsed.args[6]);
        const timestamp = Number(parsed.args[7]);

        const executed = executedIds.has(operationId);
        // Get current sig count from contract
        let numSignatures = 0;
        try {
          const opData = await contract.operations(operationId);
          numSignatures = Number(opData.numSignatures ?? opData[4]);
        } catch {}

        const opTypeName =
          currentOpTypes.find((o) => o.value === opType)?.name ??
          `Op#${opType}`;

        ops.push({
          operationId,
          opType,
          opTypeName,
          target,
          value,
          data,
          numSignatures,
          executed,
          deadline,
          requester,
          timestamp,
          hasSigned: signedIds.has(operationId),
          isExpired: !executed && deadline < now,
        });
      }

      // Sort newest first
      ops.sort((a, b) => b.timestamp - a.timestamp);
      setOperations(ops);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "";
      // Suppress errors caused by chain switching mid-request
      if (!msg.includes("network changed")) {
        console.error("Error fetching operations:", err);
        toast.error("Failed to fetch operations");
      }
    } finally {
      setLoading(false);
    }
  }, [contract, provider, signer?.address, currentOpTypes]);

  useEffect(() => {
    if (contract && provider) {
      fetchOperations();
    }
  }, [contract, provider, fetchOperations]);

  // Reset form when contractType changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, opType: 0 }));
  }, [contractType]);

  // Pre-populate form fields with current on-chain values when operation type changes
  useEffect(() => {
    async function prefillCurrentValues() {
      if (!contract) return;
      try {
        switch (selectedOpName) {
          case "SetBridgeInCaller": {
            const current = await contract.bridgeInCaller();
            setFormData((prev) => ({ ...prev, callerAddress: current }));
            break;
          }
          case "SetBridgeInLimits": {
            const [maxAmt, cooldown] = await Promise.all([
              contract.maxBridgeInAmount(),
              contract.bridgeInCooldown(),
            ]);
            setFormData((prev) => ({
              ...prev,
              maxAmount: ethers.formatEther(maxAmt),
              cooldown: cooldown.toString(),
            }));
            break;
          }
          case "SetBridgeOutAmount": {
            const maxAmt = await contract.maxBridgeOutAmount();
            setFormData((prev) => ({
              ...prev,
              maxAmount: ethers.formatEther(maxAmt),
            }));
            break;
          }
          case "SetBridgeOutEnabled": {
            const enabled = await contract.bridgeOutEnabled();
            setFormData((prev) => ({ ...prev, bridgeEnabled: enabled }));
            break;
          }
          case "SetBridgeInEnabled": {
            const enabled = await contract.bridgeInEnabled();
            setFormData((prev) => ({ ...prev, bridgeEnabled: enabled }));
            break;
          }
        }
      } catch (err) {
        console.error("Failed to prefill current values:", err);
      }
    }
    prefillCurrentValues();
  }, [selectedOpName, contract]);

  // Build calldata for requestOperation
  function buildRequestArgs(
    opName: string
  ): [number, string, bigint, string] | null {
    const opType =
      currentOpTypes.find((o) => o.name === opName)?.value ?? 0;
    const zero = ethers.ZeroAddress;

    switch (opName) {
      case "Mint":
      case "PostLaunch":
      case "Pause":
      case "Unpause":
      case "RelinquishTokens":
        return [opType, zero, BigInt(0), "0x"];

      case "Burn": {
        if (!formData.burnAmount || parseFloat(formData.burnAmount) <= 0) {
          toast.error("Enter a valid burn amount");
          return null;
        }
        const amount = ethers.parseEther(formData.burnAmount);
        return [opType, zero, amount, "0x"];
      }

      case "SetBridgeInCaller": {
        if (!ethers.isAddress(formData.callerAddress)) {
          toast.error("Enter a valid caller address");
          return null;
        }
        return [opType, formData.callerAddress, BigInt(0), "0x"];
      }

      case "SetBridgeInLimits": {
        if (!formData.maxAmount || parseFloat(formData.maxAmount) <= 0) {
          toast.error("Enter a valid max amount");
          return null;
        }
        if (!formData.cooldown || parseInt(formData.cooldown) <= 0) {
          toast.error("Enter a valid cooldown in seconds");
          return null;
        }
        const maxAmt = ethers.parseEther(formData.maxAmount);
        const cooldown = BigInt(formData.cooldown);
        const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256"],
          [cooldown]
        );
        return [opType, zero, maxAmt, encoded];
      }

      case "UpdateSigner": {
        if (!ethers.isAddress(formData.oldSigner)) {
          toast.error("Enter a valid old signer address");
          return null;
        }
        if (!ethers.isAddress(formData.newSigner)) {
          toast.error("Enter a valid new signer address");
          return null;
        }
        const newSignerAsUint = BigInt(formData.newSigner);
        return [opType, formData.oldSigner, newSignerAsUint, "0x"];
      }

      case "SetBridgeOutAmount": {
        if (!formData.maxAmount || parseFloat(formData.maxAmount) <= 0) {
          toast.error("Enter a valid max amount");
          return null;
        }
        const maxAmt = ethers.parseEther(formData.maxAmount);
        return [opType, zero, maxAmt, "0x"];
      }

      case "SetBridgeInEnabled":
      case "SetBridgeOutEnabled": {
        const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
          ["bool"],
          [formData.bridgeEnabled]
        );
        return [opType, zero, BigInt(0), encoded];
      }

      case "DistributeTokens": {
        if (!ethers.isAddress(formData.distributeRecipient)) {
          toast.error("Enter a valid recipient address");
          return null;
        }
        if (
          !formData.distributeAmount ||
          parseFloat(formData.distributeAmount) <= 0
        ) {
          toast.error("Enter a valid distribute amount");
          return null;
        }
        const amount = ethers.parseEther(formData.distributeAmount);
        return [opType, formData.distributeRecipient, amount, "0x"];
      }

      default:
        return null;
    }
  }

  async function handleCreateOperation() {
    if (!contract || !signer) {
      toast.error("Connect wallet first");
      return;
    }
    const args = buildRequestArgs(selectedOpName);
    if (!args) return;

    setIsSubmitting(true);
    try {
      const contractWithSigner = contract.connect(signer) as ethers.Contract;
      const tx = await contractWithSigner.requestOperation(...args);
      toast.info("Transaction submitted, waiting for confirmation...");
      await tx.wait();
      toast.success("Operation created!");
      setShowCreateForm(false);
      await fetchOperations();
    } catch (err) {
      console.error(err);
      const e = err as { reason?: string; message?: string };
      toast.error(e?.reason ?? e?.message ?? "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSign(op: OperationRecord) {
    if (!contract || !signer) {
      toast.error("Connect wallet first");
      return;
    }
    setSigningId(op.operationId);
    try {
      const messageHash = await contract.getOperationHash(op.operationId);
      const signature = await signer.signMessage(
        ethers.getBytes(messageHash)
      );
      const contractWithSigner = contract.connect(signer) as ethers.Contract;
      const tx = await contractWithSigner.submitSignature(
        op.operationId,
        signature
      );
      toast.info("Signature submitted, waiting for confirmation...");
      await tx.wait();
      toast.success("Signature accepted!");
      await fetchOperations();
    } catch (err) {
      console.error(err);
      const e = err as { reason?: string; message?: string };
      toast.error(e?.reason ?? e?.message ?? "Signing failed");
    } finally {
      setSigningId(null);
    }
  }

  const displayedOps = showPendingOnly
    ? operations.filter((o) => !o.executed && !o.isExpired)
    : operations;

  const canActAsAdmin = isOwner || isSigner;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    background: colors.background.input,
    border: `1px solid ${colors.border.subtle}`,
    borderRadius: "0.5rem",
    color: colors.text.primary,
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.375rem",
    display: "block",
  };

  return (
    <div style={{ padding: "2rem 0rem", overflow: "auto" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "80rem",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: colors.background.card,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            boxShadow: colors.shadows.card,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  background: colors.gradients.primary,
                  borderRadius: "0.625rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.125rem",
                  boxShadow: colors.shadows.button,
                  flexShrink: 0,
                }}
              >
                🔐
              </div>
              <div>
                <h1
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "700",
                    background: colors.gradients.primary,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Multisig Operations
                </h1>
                <p
                  style={{
                    color: colors.text.muted,
                    fontSize: "0.8rem",
                    margin: "0.25rem 0 0",
                  }}
                >
                  Manage and sign multisig contract operations
                </p>
              </div>
            </div>

            {/* Role badge */}
            {signer && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {isOwner && (
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      background: colors.primary.bg,
                      border: `1px solid ${colors.primary.border}`,
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: colors.primary.main,
                    }}
                  >
                    Owner
                  </span>
                )}
                {isSigner && (
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      background: colors.status.successBg,
                      border: `1px solid ${colors.status.successBorder}`,
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: colors.status.success,
                    }}
                  >
                    Signer
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Contract Type Tabs */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "1.25rem",
              borderBottom: `1px solid ${colors.border.subtle}`,
              paddingBottom: "0",
            }}
          >
            {(["Primary", "Secondary", "Vault"] as ContractType[]).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => {
                    setContractType(type);
                    setOperations([]);
                    setShowCreateForm(false);
                    const targetChain = resolveChainByType(type);
                    if (isConnected && chainId !== targetChain) {
                      switchChain({ chainId: targetChain });
                    }
                  }}
                  style={{
                    padding: "0.5rem 1.25rem",
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      contractType === type
                        ? `2px solid ${colors.primary.main}`
                        : "2px solid transparent",
                    color:
                      contractType === type
                        ? colors.primary.main
                        : colors.text.muted,
                    fontSize: "0.875rem",
                    fontWeight: contractType === type ? "600" : "400",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    marginBottom: "-1px",
                  }}
                >
                  {type}
                </button>
              )
            )}
          </div>

          {/* Contract address + network row */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginTop: "1.25rem",
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1", minWidth: "260px" }}>
              <label style={labelStyle}>Contract Address</label>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder="0x..."
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={fetchOperations}
                disabled={loading || !contract}
                style={{
                  padding: "0.625rem 1.25rem",
                  background:
                    loading || !contract
                      ? colors.action.hover
                      : colors.status.successBg,
                  border: `1px solid ${
                    loading || !contract
                      ? colors.border.subtle
                      : colors.status.successBorder
                  }`,
                  borderRadius: "0.5rem",
                  color:
                    loading || !contract
                      ? colors.text.muted
                      : colors.status.success,
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: loading || !contract ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  whiteSpace: "nowrap",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    animation: loading ? "spin 1s linear infinite" : "none",
                  }}
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                {loading ? "Loading..." : "Refresh"}
              </button>

              {canActAsAdmin && (
                <button
                  onClick={() => setShowCreateForm((v) => !v)}
                  style={{
                    padding: "0.625rem 1.25rem",
                    background: showCreateForm
                      ? colors.action.hover
                      : colors.gradients.primary,
                    border: `1px solid ${
                      showCreateForm
                        ? colors.border.subtle
                        : "transparent"
                    }`,
                    borderRadius: "0.5rem",
                    color: showCreateForm
                      ? colors.text.secondary
                      : colors.text.inverse,
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {showCreateForm ? "✕ Cancel" : "+ Create Operation"}
                </button>
              )}
            </div>
          </div>

          {/* Connection warning */}
          {!isConnected && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                background: colors.status.warningBg,
                border: `1px solid ${colors.status.warningBorder}`,
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                color: colors.status.warning,
              }}
            >
              Connect your wallet to sign operations or create new ones.
            </div>
          )}
        </div>

        {/* Create Operation Form */}
        {showCreateForm && canActAsAdmin && (
          <div
            style={{
              background: colors.background.card,
              border: `1px solid ${colors.primary.border}`,
              borderRadius: "1rem",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              boxShadow: colors.shadows.card,
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: "700",
                color: colors.text.primary,
                margin: "0 0 1.25rem",
              }}
            >
              Create New Operation
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "1rem",
              }}
            >
              {/* Operation Type */}
              <div>
                <label style={labelStyle}>Operation Type</label>
                <select
                  value={formData.opType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      opType: Number(e.target.value),
                    }))
                  }
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  {currentOpTypes.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Fields */}
              {selectedOpName === "Burn" && (
                <div>
                  <label style={labelStyle}>Burn Amount (LIB)</label>
                  <input
                    type="text"
                    value={formData.burnAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        burnAmount: e.target.value,
                      }))
                    }
                    placeholder="e.g. 1000"
                    style={inputStyle}
                  />
                </div>
              )}

              {selectedOpName === "SetBridgeInCaller" && (
                <div>
                  <label style={labelStyle}>New Caller Address</label>
                  <input
                    type="text"
                    value={formData.callerAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        callerAddress: e.target.value,
                      }))
                    }
                    placeholder="0x..."
                    style={inputStyle}
                  />
                </div>
              )}

              {selectedOpName === "SetBridgeInLimits" && (
                <>
                  <div>
                    <label style={labelStyle}>Max Amount (LIB)</label>
                    <input
                      type="text"
                      value={formData.maxAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxAmount: e.target.value,
                        }))
                      }
                      placeholder="e.g. 10000"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Cooldown (seconds)</label>
                    <input
                      type="text"
                      value={formData.cooldown}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cooldown: e.target.value,
                        }))
                      }
                      placeholder="e.g. 60"
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              {selectedOpName === "SetBridgeOutAmount" && (
                <div>
                  <label style={labelStyle}>Max Bridge-Out Amount (LIB)</label>
                  <input
                    type="text"
                    value={formData.maxAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxAmount: e.target.value,
                      }))
                    }
                    placeholder="e.g. 10000"
                    style={inputStyle}
                  />
                </div>
              )}

              {BOOL_OPS.includes(selectedOpName) && (
                <div>
                  <label style={labelStyle}>Enable / Disable</label>
                  <select
                    value={formData.bridgeEnabled ? "true" : "false"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bridgeEnabled: e.target.value === "true",
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="true">Enable</option>
                    <option value="false">Disable</option>
                  </select>
                </div>
              )}

              {selectedOpName === "UpdateSigner" && (
                <>
                  <div>
                    <label style={labelStyle}>Old Signer Address</label>
                    <input
                      type="text"
                      value={formData.oldSigner}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          oldSigner: e.target.value,
                        }))
                      }
                      placeholder="0x..."
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>New Signer Address</label>
                    <input
                      type="text"
                      value={formData.newSigner}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          newSigner: e.target.value,
                        }))
                      }
                      placeholder="0x..."
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              {selectedOpName === "DistributeTokens" && (
                <>
                  <div>
                    <label style={labelStyle}>Recipient Address</label>
                    <input
                      type="text"
                      value={formData.distributeRecipient}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          distributeRecipient: e.target.value,
                        }))
                      }
                      placeholder="0x..."
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Amount (LIB)</label>
                    <input
                      type="text"
                      value={formData.distributeAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          distributeAmount: e.target.value,
                        }))
                      }
                      placeholder="e.g. 500"
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              {NO_FIELDS_OPS[contractType].includes(selectedOpName) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0.75rem",
                    background: colors.status.infoBg,
                    border: `1px solid ${colors.status.infoBorder}`,
                    borderRadius: "0.5rem",
                    fontSize: "0.8rem",
                    color: colors.status.infoText,
                    gap: "0.5rem",
                  }}
                >
                  <span>ℹ</span>
                  <span>
                    No additional parameters required for{" "}
                    <strong>{selectedOpName}</strong>.
                  </span>
                </div>
              )}
            </div>

            <div
              style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}
            >
              <button
                onClick={handleCreateOperation}
                disabled={isSubmitting}
                style={{
                  padding: "0.75rem 2rem",
                  background: isSubmitting
                    ? colors.action.hover
                    : colors.gradients.primary,
                  border: "none",
                  borderRadius: "0.5rem",
                  color: isSubmitting
                    ? colors.text.muted
                    : colors.text.inverse,
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {isSubmitting && (
                  <div
                    style={{
                      width: "0.875rem",
                      height: "0.875rem",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                )}
                {isSubmitting ? "Submitting..." : "Submit Operation"}
              </button>
            </div>
          </div>
        )}

        {/* Operations Table */}
        <div
          style={{
            background: colors.background.card,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: "1rem",
            boxShadow: colors.shadows.card,
            overflow: "hidden",
          }}
        >
          {/* Table header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem 1.5rem",
              borderBottom: `1px solid ${colors.border.subtle}`,
            }}
          >
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: colors.text.primary,
              }}
            >
              Operations
              {operations.length > 0 && (
                <span
                  style={{
                    marginLeft: "0.5rem",
                    padding: "0.125rem 0.5rem",
                    background: colors.primary.bg,
                    border: `1px solid ${colors.primary.border}`,
                    borderRadius: "9999px",
                    fontSize: "0.7rem",
                    color: colors.primary.main,
                    fontWeight: "600",
                  }}
                >
                  {displayedOps.length}
                </span>
              )}
            </span>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.8rem",
                color: colors.text.secondary,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={showPendingOnly}
                onChange={(e) => setShowPendingOnly(e.target.checked)}
                style={{ accentColor: colors.primary.main }}
              />
              Show pending only
            </label>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: colors.primary.main,
                  fontSize: "1rem",
                }}
              >
                <div
                  style={{
                    width: "1.25rem",
                    height: "1.25rem",
                    border: `2px solid ${colors.primary.bg}`,
                    borderTop: `2px solid ${colors.primary.main}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Loading operations...
              </div>
            </div>
          )}

          {!loading && !contract && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: colors.text.muted,
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.4 }}>
                🔗
              </div>
              <p style={{ margin: 0 }}>
                {!isConnected
                  ? "Connect wallet and select a network to view operations."
                  : !isChainSupported
                  ? "Switch to a supported network."
                  : "Enter a contract address to load operations."}
              </p>
            </div>
          )}

          {!loading && contract && displayedOps.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: colors.text.muted,
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.4 }}>
                📋
              </div>
              <p style={{ margin: 0 }}>
                {showPendingOnly
                  ? "No pending operations found."
                  : "No operations found for this contract."}
              </p>
            </div>
          )}

          {!loading && contract && displayedOps.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead>
                  <tr style={{ background: colors.background.input }}>
                    {[
                      "Op ID",
                      "Type",
                      "Params",
                      "Signatures",
                      "Status",
                      "Deadline",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "left",
                          fontSize: "0.7rem",
                          fontWeight: "600",
                          color: colors.text.muted,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: `2px solid ${colors.border.subtle}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedOps.map((op) => {
                    const isPending = !op.executed && !op.isExpired;
                    const canSign =
                      isSigner && isPending && !op.hasSigned;
                    const isSigning = signingId === op.operationId;

                    const statusColor = op.executed
                      ? colors.status.success
                      : op.isExpired
                      ? colors.status.error
                      : colors.status.warning;
                    const statusBg = op.executed
                      ? colors.status.successBg
                      : op.isExpired
                      ? colors.status.errorBg
                      : colors.status.warningBg;
                    const statusBorder = op.executed
                      ? colors.status.successBorder
                      : op.isExpired
                      ? colors.status.errorBorder
                      : colors.status.warningBorder;
                    const statusLabel = op.executed
                      ? "Executed"
                      : op.isExpired
                      ? "Expired"
                      : "Pending";

                    // Human-readable params based on operation type
                    const paramParts: string[] = [];
                    switch (op.opTypeName) {
                      case "SetBridgeInCaller":
                        if (op.target && op.target !== ethers.ZeroAddress)
                          paramParts.push(`caller: ${formatAddress(op.target)}`);
                        break;
                      case "SetBridgeInLimits":
                        if (op.value > BigInt(0)) {
                          try { paramParts.push(`maxAmount: ${ethers.formatEther(op.value)} LIB`); }
                          catch { paramParts.push(`maxAmount: ${op.value.toString()}`); }
                        }
                        if (op.data && op.data !== "0x") {
                          try {
                            const [cooldown] = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], op.data);
                            paramParts.push(`cooldown: ${cooldown.toString()}s`);
                          } catch { /* ignore decode errors */ }
                        }
                        break;
                      case "UpdateSigner":
                        if (op.target && op.target !== ethers.ZeroAddress)
                          paramParts.push(`old: ${formatAddress(op.target)}`);
                        if (op.value > BigInt(0)) {
                          try {
                            const newSigner = "0x" + op.value.toString(16).padStart(40, "0");
                            paramParts.push(`new: ${formatAddress(newSigner)}`);
                          } catch { paramParts.push(`new: ${op.value.toString()}`); }
                        }
                        break;
                      case "SetBridgeOutAmount":
                        if (op.value > BigInt(0)) {
                          try { paramParts.push(`maxAmount: ${ethers.formatEther(op.value)} LIB`); }
                          catch { paramParts.push(`maxAmount: ${op.value.toString()}`); }
                        }
                        break;
                      case "SetBridgeInEnabled":
                      case "SetBridgeOutEnabled":
                        if (op.data && op.data !== "0x") {
                          try {
                            const [enabled] = ethers.AbiCoder.defaultAbiCoder().decode(["bool"], op.data);
                            paramParts.push(`enabled: ${enabled ? "true" : "false"}`);
                          } catch { /* ignore decode errors */ }
                        }
                        break;
                      case "Burn":
                        if (op.value > BigInt(0)) {
                          try { paramParts.push(`amount: ${ethers.formatEther(op.value)} LIB`); }
                          catch { paramParts.push(`amount: ${op.value.toString()}`); }
                        }
                        break;
                      case "DistributeTokens":
                        if (op.target && op.target !== ethers.ZeroAddress)
                          paramParts.push(`to: ${formatAddress(op.target)}`);
                        if (op.value > BigInt(0)) {
                          try { paramParts.push(`amount: ${ethers.formatEther(op.value)} LIB`); }
                          catch { paramParts.push(`amount: ${op.value.toString()}`); }
                        }
                        break;
                      default:
                        // Mint, PostLaunch, Pause, Unpause, RelinquishTokens — no params
                        break;
                    }

                    return (
                      <tr
                        key={op.operationId}
                        className="op-row"
                        style={{ cursor: "default" }}
                      >
                        <td
                          style={{
                            padding: "0.875rem 1rem",
                            fontFamily: "monospace",
                            fontSize: "0.8rem",
                            color: colors.text.secondary,
                            borderBottom: `1px solid ${colors.border.subtle}`,
                          }}
                        >
                          {formatAddress(op.operationId)}
                        </td>
                        <td
                          style={{
                            padding: "0.875rem 1rem",
                            borderBottom: `1px solid ${colors.border.subtle}`,
                          }}
                        >
                          <span
                            style={{
                              padding: "0.2rem 0.6rem",
                              background: colors.primary.bg,
                              border: `1px solid ${colors.primary.border}`,
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              color: colors.primary.main,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {op.opTypeName}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "0.875rem 1rem",
                            fontSize: "0.8rem",
                            color: colors.text.secondary,
                            borderBottom: `1px solid ${colors.border.subtle}`,
                            maxWidth: "200px",
                          }}
                        >
                          {paramParts.length > 0
                            ? paramParts.map((p, i) => (
                                <div key={i}>{p}</div>
                              ))
                            : <span style={{ color: colors.text.muted }}>—</span>}
                        </td>
                        <td
                          style={{
                            padding: "0.875rem 1rem",
                            borderBottom: `1px solid ${colors.border.subtle}`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.375rem",
                            }}
                          >
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                style={{
                                  width: "0.75rem",
                                  height: "0.75rem",
                                  borderRadius: "50%",
                                  background:
                                    i < op.numSignatures
                                      ? colors.status.success
                                      : colors.border.default,
                                }}
                              />
                            ))}
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: colors.text.muted,
                                marginLeft: "0.25rem",
                              }}
                            >
                              {op.numSignatures}/3
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "0.875rem 1rem",
                            borderBottom: `1px solid ${colors.border.subtle}`,
                          }}
                        >
                          <span
                            style={{
                              padding: "0.2rem 0.6rem",
                              background: statusBg,
                              border: `1px solid ${statusBorder}`,
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              color: statusColor,
                              whiteSpace: "nowrap",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.375rem",
                              width: "fit-content",
                            }}
                          >
                            <div
                              style={{
                                width: "0.4rem",
                                height: "0.4rem",
                                background: statusColor,
                                borderRadius: "50%",
                                flexShrink: 0,
                              }}
                            />
                            {statusLabel}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "0.875rem 1rem",
                            fontSize: "0.8rem",
                            color: op.isExpired
                              ? colors.status.error
                              : colors.text.muted,
                            borderBottom: `1px solid ${colors.border.subtle}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDeadline(op.deadline)}
                        </td>
                        <td
                          style={{
                            padding: "0.875rem 1rem",
                            borderBottom: `1px solid ${colors.border.subtle}`,
                          }}
                        >
                          {canSign ? (
                            <button
                              onClick={() => handleSign(op)}
                              disabled={isSigning}
                              style={{
                                padding: "0.375rem 0.875rem",
                                background: isSigning
                                  ? colors.action.hover
                                  : colors.gradients.primary,
                                border: "none",
                                borderRadius: "0.375rem",
                                color: isSigning
                                  ? colors.text.muted
                                  : colors.text.inverse,
                                fontSize: "0.8rem",
                                fontWeight: "600",
                                cursor: isSigning
                                  ? "not-allowed"
                                  : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {isSigning && (
                                <div
                                  style={{
                                    width: "0.75rem",
                                    height: "0.75rem",
                                    border:
                                      "2px solid rgba(255,255,255,0.3)",
                                    borderTop: "2px solid white",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite",
                                  }}
                                />
                              )}
                              {isSigning ? "Signing..." : "Sign"}
                            </button>
                          ) : op.hasSigned && isPending ? (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: colors.status.success,
                                fontWeight: "500",
                              }}
                            >
                              ✓ Signed
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: colors.text.muted,
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Decorative dots */}
        <div
          style={{
            position: "absolute",
            top: "0rem",
            left: "0rem",
            width: "1rem",
            height: "1rem",
            background: colors.decorative.dotLeft,
            borderRadius: "50%",
            animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "0rem",
            right: "0rem",
            width: "1rem",
            height: "1rem",
            background: colors.decorative.dotRight,
            borderRadius: "50%",
            animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
            animationDelay: "1s",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .op-row:nth-child(even) td {
          background: ${colors.base.slate50};
        }
        .op-row:hover td {
          background: ${colors.base.slate100} !important;
        }
        .op-row td {
          transition: background 0.15s ease;
        }
      `}</style>
    </div>
  );
}

export { Multisig };
