"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePublicClient } from "wagmi";
import { CONTRACT_ADDRESS, AJO_ABI } from "@/lib/contract";
import { decodeEventLog, formatEther } from "viem";
import { usePool, useMember, formatRitual, getStatusLabel, getFrequencyLabel, getNextCycleTime } from "@/hooks/usePoolData";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

function MyPoolItem({ poolId, userAddress }: { poolId: number; userAddress: `0x${string}` }) {
  const { data: pool } = usePool(poolId);
  const { data: member } = useMember(poolId, userAddress);
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isTxLoading } = useWaitForTransactionReceipt({ hash: txHash });

  if (!pool || !member) return null;

  const [id, name, creator, contributionAmount, collateralAmount, frequency, maxMembers, memberCount, currentRound, lastCycleTimestamp, status] = pool as unknown as any[];
  const [addr, joinedAt, collateralLocked, hasReceivedPayout, isActive] = member as unknown as any[];

  if (!isActive) return null;

  const nextCycle = getNextCycleTime(Number(lastCycleTimestamp), Number(frequency));

  const handleContribute = async () => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: AJO_ABI,
        functionName: "contribute",
        args: [BigInt(poolId)],
        value: contributionAmount as bigint,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-display font-bold text-white">{name as string}</h4>
          <p className="text-xs text-white/40 mt-0.5">Pool #{poolId} · Round {Number(currentRound) + 1}</p>
        </div>
        <div className="text-right">
          {hasReceivedPayout ? (
            <span className="text-xs text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full border border-purple-400/20">
              ✓ Paid Out
            </span>
          ) : (
            <span className="text-xs text-gold-400 bg-gold-400/10 px-3 py-1 rounded-full border border-gold-400/20">
              Awaiting Payout
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-white/40 text-xs">Contribution</p>
          <p className="text-gold-400 font-bold text-sm">{formatRitual(contributionAmount as bigint)}</p>
        </div>
        <div className="text-center">
          <p className="text-white/40 text-xs">My Collateral</p>
          <p className="text-white text-sm">{formatRitual(collateralLocked as bigint)}</p>
        </div>
        <div className="text-center">
          <p className="text-white/40 text-xs">Next Cycle</p>
          <p className="text-emerald-400 font-mono font-bold text-sm">{nextCycle}</p>
        </div>
      </div>

      {Number(status) === 0 && (
        <button
          onClick={handleContribute}
          disabled={isPending || isTxLoading}
          className="w-full py-2.5 rounded-lg text-sm font-bold border border-gold-500/40 text-gold-400 hover:bg-gold-500/10 transition-all disabled:opacity-50"
        >
          {isPending || isTxLoading ? "Contributing..." : `Contribute ${formatRitual(contributionAmount as bigint)}`}
        </button>
      )}
    </motion.div>
  );
}

interface Props {
  userAddress: `0x${string}`;
  refreshTrigger: number;
}

export default function MyPools({ userAddress, refreshTrigger }: Props) {
  const publicClient = usePublicClient();
  const [myPoolIds, setMyPoolIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicClient || !userAddress) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          fromBlock: BigInt(0),
          toBlock: "latest",
        });

        const ids = new Set<number>();

        for (const log of logs) {
          try {
            const decoded = decodeEventLog({
              abi: AJO_ABI,
              data: log.data,
              topics: log.topics,
              eventName: "MemberJoined",
            });
            const args = decoded.args as any;
            if (args.member?.toLowerCase() === userAddress.toLowerCase()) {
              ids.add(Number(args.poolId));
            }
          } catch {}

          try {
            const decoded = decodeEventLog({
              abi: AJO_ABI,
              data: log.data,
              topics: log.topics,
              eventName: "PoolCreated",
            });
            const args = decoded.args as any;
            if (args.creator?.toLowerCase() === userAddress.toLowerCase()) {
              ids.add(Number(args.poolId));
            }
          } catch {}
        }

        setMyPoolIds(Array.from(ids));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [publicClient, userAddress, refreshTrigger]);

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-white mb-5">My Pools</h2>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-navy-700 rounded w-2/3 mb-3" />
              <div className="h-3 bg-navy-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {!loading && myPoolIds.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center text-white/30">
          <div className="text-4xl mb-3">🫙</div>
          <p>You haven't joined any pools yet.</p>
          <p className="text-sm mt-1">Browse pools below or create your own.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {myPoolIds.map((id) => (
          <MyPoolItem key={id} poolId={id} userAddress={userAddress} />
        ))}
      </div>
    </div>
  );
}
