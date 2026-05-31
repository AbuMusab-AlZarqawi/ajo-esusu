"use client";

import { motion } from "framer-motion";
import { usePool, useNextRecipient, formatRitual, getFrequencyLabel, getStatusLabel, getNextCycleTime, shortenAddress } from "@/hooks/usePoolData";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AJO_ABI, CONTRACT_ADDRESS } from "@/lib/contract";
import { parseEther } from "viem";
import { useState } from "react";

interface PoolCardProps {
  poolId: number;
  userAddress?: string;
  onJoinSuccess?: () => void;
}

export default function PoolCard({ poolId, userAddress, onJoinSuccess }: PoolCardProps) {
  const { data: pool, isLoading } = usePool(poolId);
  const { data: nextRecipient } = useNextRecipient(poolId);
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const [joined, setJoined] = useState(false);

  if (isLoading || !pool) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-navy-700 rounded w-3/4 mb-3" />
        <div className="h-3 bg-navy-700 rounded w-1/2" />
      </div>
    );
  }

  const [id, name, creator, contributionAmount, collateralAmount, frequency, maxMembers, memberCount, currentRound, lastCycleTimestamp, status] = pool as unknown as any[];

  const isFull = Number(memberCount) >= Number(maxMembers);
  const isCompleted = Number(status) !== 0;
  const isCreator = userAddress?.toLowerCase() === creator?.toLowerCase();
  const nextCycle = getNextCycleTime(Number(lastCycleTimestamp), Number(frequency));

  const handleJoin = async () => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: AJO_ABI,
        functionName: "joinPool",
        args: [BigInt(poolId)],
        value: collateralAmount as bigint,
      });
      setJoined(true);
      onJoinSuccess?.();
    } catch (e) {
      console.error("Join failed:", e);
    }
  };

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
      console.error("Contribute failed:", e);
    }
  };

  const statusColors: Record<number, string> = {
    0: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    1: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    2: "text-red-400 bg-red-400/10 border-red-400/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-2xl p-6 gold-glow-hover cursor-default"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-xl font-bold text-white">{name as string}</h3>
          <p className="text-xs text-white/40 mt-1">
            by {shortenAddress(creator as string)}
            {isCreator && <span className="ml-2 text-gold-500">(you)</span>}
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${statusColors[Number(status)]}`}>
          {getStatusLabel(Number(status))}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-navy-900/60 rounded-xl p-3">
          <p className="text-white/40 text-xs mb-1">Contribution</p>
          <p className="text-gold-400 font-bold text-sm">{formatRitual(contributionAmount as bigint)}</p>
        </div>
        <div className="bg-navy-900/60 rounded-xl p-3">
          <p className="text-white/40 text-xs mb-1">Collateral</p>
          <p className="text-white font-bold text-sm">{formatRitual(collateralAmount as bigint)}</p>
        </div>
        <div className="bg-navy-900/60 rounded-xl p-3">
          <p className="text-white/40 text-xs mb-1">Members</p>
          <p className="text-white font-bold text-sm">
            {Number(memberCount)}/{Number(maxMembers)}
          </p>
        </div>
        <div className="bg-navy-900/60 rounded-xl p-3">
          <p className="text-white/40 text-xs mb-1">Frequency</p>
          <p className="text-white font-bold text-sm">{getFrequencyLabel(Number(frequency))}</p>
        </div>
      </div>

      {/* Progress bar for members */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>Capacity</span>
          <span>{Math.round((Number(memberCount) / Number(maxMembers)) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-navy-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all"
            style={{ width: `${(Number(memberCount) / Number(maxMembers)) * 100}%` }}
          />
        </div>
      </div>

      {/* Countdown */}
      <div className="flex items-center gap-2 mb-5 text-sm">
        <span className="text-white/40">Next cycle:</span>
        <span className="text-gold-400 font-mono font-bold">{nextCycle}</span>
        {nextRecipient && nextRecipient !== "0x0000000000000000000000000000000000000000" && (
          <>
            <span className="text-white/30">→</span>
            <span className="text-white/60 text-xs">{shortenAddress(nextRecipient as string)}</span>
          </>
        )}
      </div>

      {/* Actions */}
      {!isCompleted && !isFull && !isCreator && (
        <button
          onClick={handleJoin}
          disabled={isPending || isTxLoading || joined}
          className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 hover:from-gold-400 hover:to-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || isTxLoading
            ? "Joining..."
            : joined || isSuccess
            ? "✓ Joined"
            : `Join Pool · Lock ${formatRitual(collateralAmount as bigint)}`}
        </button>
      )}

      {isCreator && !isCompleted && (
        <button
          onClick={handleContribute}
          disabled={isPending || isTxLoading}
          className="w-full py-3 rounded-xl font-bold text-sm border border-gold-500/40 text-gold-400 hover:bg-gold-500/10 transition-all disabled:opacity-50"
        >
          {isPending || isTxLoading ? "Contributing..." : `Contribute ${formatRitual(contributionAmount as bigint)}`}
        </button>
      )}

      {(isFull || isCompleted) && (
        <div className="w-full py-3 text-center text-white/30 text-sm border border-white/10 rounded-xl">
          {isCompleted ? "Pool Completed" : "Pool Full"}
        </div>
      )}
    </motion.div>
  );
}
