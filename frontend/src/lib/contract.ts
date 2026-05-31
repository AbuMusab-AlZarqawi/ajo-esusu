export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const AJO_ABI = [
  // ── Write ───────────────────────────────────────────────────────────────────
  {
    name: "createPool",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "name", type: "string" },
      { name: "contributionAmount", type: "uint256" },
      { name: "collateralAmount", type: "uint256" },
      { name: "frequency", type: "uint8" },
      { name: "maxMembers", type: "uint256" },
    ],
    outputs: [{ name: "poolId", type: "uint256" }],
  },
  {
    name: "joinPool",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "poolId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "contribute",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "poolId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "slashMember",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "poolId", type: "uint256" },
      { name: "memberAddr", type: "address" },
    ],
    outputs: [],
  },
  // ── Read ────────────────────────────────────────────────────────────────────
  {
    name: "getPool",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "poolId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "creator", type: "address" },
      { name: "contributionAmount", type: "uint256" },
      { name: "collateralAmount", type: "uint256" },
      { name: "frequency", type: "uint8" },
      { name: "maxMembers", type: "uint256" },
      { name: "memberCount", type: "uint256" },
      { name: "currentRound", type: "uint256" },
      { name: "lastCycleTimestamp", type: "uint256" },
      { name: "status", type: "uint8" },
    ],
  },
  {
    name: "getMembers",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "poolId", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "getMember",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "poolId", type: "uint256" },
      { name: "wallet", type: "address" },
    ],
    outputs: [
      { name: "addr", type: "address" },
      { name: "joinedAt", type: "uint256" },
      { name: "collateralLocked", type: "uint256" },
      { name: "hasReceivedPayout", type: "bool" },
      { name: "isActive", type: "bool" },
      { name: "missedContributions", type: "uint256" },
    ],
  },
  {
    name: "getNextPayoutRecipient",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "poolId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "getAllPools",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "poolCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getActiveCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "poolId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  // ── Events ──────────────────────────────────────────────────────────────────
  {
    name: "PoolCreated",
    type: "event",
    inputs: [
      { name: "poolId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "contributionAmount", type: "uint256", indexed: false },
      { name: "collateralAmount", type: "uint256", indexed: false },
      { name: "maxMembers", type: "uint256", indexed: false },
      { name: "frequency", type: "uint8", indexed: false },
    ],
  },
  {
    name: "MemberJoined",
    type: "event",
    inputs: [
      { name: "poolId", type: "uint256", indexed: true },
      { name: "member", type: "address", indexed: true },
      { name: "collateralLocked", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ContributionMade",
    type: "event",
    inputs: [
      { name: "poolId", type: "uint256", indexed: true },
      { name: "member", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "round", type: "uint256", indexed: false },
    ],
  },
  {
    name: "PayoutSent",
    type: "event",
    inputs: [
      { name: "poolId", type: "uint256", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "round", type: "uint256", indexed: false },
    ],
  },
  {
    name: "MemberSlashed",
    type: "event",
    inputs: [
      { name: "poolId", type: "uint256", indexed: true },
      { name: "member", type: "address", indexed: true },
      { name: "collateralSlashed", type: "uint256", indexed: false },
      { name: "round", type: "uint256", indexed: false },
    ],
  },
] as const;
