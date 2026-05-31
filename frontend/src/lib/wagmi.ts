import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const ritualChain = defineChain({
  id: 1979,
  name: "Ritual Chain",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.ritualfoundation.org"] },
    public: { http: ["https://rpc.ritualfoundation.org"] },
  },
  blockExplorers: {
    default: { name: "Ritual Explorer", url: "https://explorer.ritualfoundation.org" },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: "Ajo / Esusu",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [ritualChain],
  ssr: true,
});
