"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePublicClient } from "wagmi";
import { CONTRACT_ADDRESS, AJO_ABI } from "@/lib/contract";
import { decodeEventLog, formatEther } from "viem";

interface FeedItem {
  id: string;
  icon: string;
  message: string;
  time: string;
  color: string;
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const EVENT_COLORS: Record<string, string> = {
  PoolCreated: "text-gold-400",
  MemberJoined: "text-blue-400",
  ContributionMade: "text-emerald-400",
  PayoutSent: "text-purple-400",
  MemberSlashed: "text-red-400",
};

const EVENT_ICONS: Record<string, string> = {
  PoolCreated: "🏛️",
  MemberJoined: "🤝",
  ContributionMade: "💰",
  PayoutSent: "🎉",
  MemberSlashed: "⚔️",
};

export default function ActivityFeed() {
  const publicClient = usePublicClient();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicClient) return;

    const fetchLogs = async () => {
      try {
        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          fromBlock: BigInt(0),
          toBlock: "latest",
        });

        const parsed: FeedItem[] = [];

        for (const log of logs.slice(-15).reverse()) {
          try {
            for (const eventDef of AJO_ABI.filter((x) => x.type === "event")) {
              try {
                const decoded = decodeEventLog({
                  abi: AJO_ABI,
                  data: log.data,
                  topics: log.topics,
                  eventName: (eventDef as any).name,
                });

                const evName = decoded.eventName as string;
                const args = decoded.args as any;
                let message = "";

                switch (evName) {
                  case "PoolCreated":
                    message = `Pool "${args.name}" created — ${formatEther(args.contributionAmount)} RITUAL/cycle`;
                    break;
                  case "MemberJoined":
                    message = `Member joined pool #${args.poolId}`;
                    break;
                  case "ContributionMade":
                    message = `${formatEther(args.amount)} RITUAL contributed to pool #${args.poolId}`;
                    break;
                  case "PayoutSent":
                    message = `${formatEther(args.amount)} RITUAL paid out from pool #${args.poolId}`;
                    break;
                  case "MemberSlashed":
                    message = `Member slashed in pool #${args.poolId}`;
                    break;
                }

                if (message) {
                  parsed.push({
                    id: `${log.transactionHash}-${evName}`,
                    icon: EVENT_ICONS[evName] || "📋",
                    message,
                    time: "recent",
                    color: EVENT_COLORS[evName] || "text-white/60",
                  });
                }
                break;
              } catch {
                continue;
              }
            }
          } catch {
            continue;
          }
        }

        setItems(parsed.slice(0, 10));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 20000);
    return () => clearInterval(interval);
  }, [publicClient]);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <h3 className="font-display text-lg font-bold text-white">Live Activity</h3>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-navy-700 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-navy-700 rounded w-4/5" />
                <div className="h-2.5 bg-navy-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-8 text-white/30">
          <div className="text-3xl mb-3">🌱</div>
          <p className="text-sm">No activity yet — create the first pool!</p>
        </div>
      )}

      <AnimatePresence>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0"
          >
            <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${item.color} leading-snug`}>{item.message}</p>
              <p className="text-white/25 text-xs mt-0.5">{item.time}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
