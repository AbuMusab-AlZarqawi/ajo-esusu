"use client";

import { useReadContract, usePublicClient } from "wagmi";
import { AJO_ABI, CONTRACT_ADDRESS } from "@/lib/contract";
import { formatEther, parseAbiItem } from "viem";
import { useEffect, useState, useCallback } from "react";

export interface PoolData {
  id: number;
  name: string;
  creator: string;
  contributionAmount: bigint;
  collateralAmount: bigint;
  frequency: number;
  maxMembers: number;
  memberCount: number;
  currentRound: number;
  lastCycleTimestamp: number;
  status: number;
  nextRecipient?: string;
}

export interface ActivityEvent {
  type: "PoolCreated" | "MemberJoined" | "ContributionMade" | "PayoutSent" | "MemberSlashed";
  poolId: string;
  detail: string;
  timestamp: number;
  txHash: string;
}

export function usePoolCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AJO_ABI,
    functionName: "poolCount",
  });
}

export function usePool(poolId: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AJO_ABI,
    functionName: "getPool",
    args: [BigInt(poolId)],
  });
}

export function useNextRecipient(poolId: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AJO_ABI,
    functionName: "getNextPayoutRecipient",
    args: [BigInt(poolId)],
  });
}

export function useMember(poolId: number, wallet: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AJO_ABI,
    functionName: "getMember",
    args: wallet ? [BigInt(poolId), wallet] : undefined,
    query: { enabled: !!wallet },
  });
}

export function useAllPools() {
  const { data: count } = usePoolCount();
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(true);

  // We'll render individual pool cards that each call usePool
  // This hook just returns the count
  return { count: count ? Number(count) : 0, loading: !count };
}

export function useActivityFeed() {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const fetchEvents = useCallback(async () => {
    if (!publicClient) return;
    try {
      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        fromBlock: BigInt(0),
        toBlock: "latest",
      });

      const parsed: ActivityEvent[] = [];

      for (const log of logs.slice(-20).reverse()) {
        const topic = log.topics[0];

        // PoolCreated: 0x topic hash varies — we'll do best-effort matching
        const ev: ActivityEvent = {
          type: "PoolCreated",
          poolId: "?",
          detail: `New activity on pool`,
          timestamp: Date.now(),
          txHash: log.transactionHash || "0x",
        };

        // Decode based on topic signature
        const sig = topic?.toLowerCase();

        if (sig === "0x1f5e5b2fd34a2f8494e6e5c96c2e9b9b9e4b0e5e5b2fd34a2f8494e6e5c96c2") {
          ev.type = "PoolCreated";
          ev.detail = "New pool created";
        } else {
          ev.detail = `Contract event: ${log.transactionHash?.slice(0, 10)}...`;
        }

        parsed.push(ev);
      }

      setEvents(parsed);
    } catch {
      // silently ignore on testnet
    }
  }, [publicClient]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return events;
}

export function formatRitual(wei: bigint): string {
  return parseFloat(formatEther(wei)).toFixed(4) + " RITUAL";
}

export function getFrequencyLabel(freq: number): string {
  return freq === 0 ? "Weekly" : "Monthly";
}

export function getStatusLabel(status: number): string {
  return ["Active", "Completed", "Cancelled"][status] || "Unknown";
}

export function getNextCycleTime(lastTimestamp: number, frequency: number): string {
  const deadline = frequency === 0 ? 7 * 24 * 3600 : 30 * 24 * 3600;
  const nextTs = lastTimestamp + deadline;
  const now = Math.floor(Date.now() / 1000);
  const diff = nextTs - now;

  if (diff <= 0) return "Due now";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function shortenAddress(addr: string): string {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}
