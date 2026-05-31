"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AJO_ABI, CONTRACT_ADDRESS } from "@/lib/contract";
import { parseEther } from "viem";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePoolModal({ open, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [contribution, setContribution] = useState("0.001");
  const [collateral, setCollateral] = useState("0.002");
  const [frequency, setFrequency] = useState<0 | 1>(0);
  const [maxMembers, setMaxMembers] = useState("5");
  const [error, setError] = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleCreate = async () => {
    setError("");
    if (!name.trim()) return setError("Pool name is required");
    if (isNaN(Number(contribution)) || Number(contribution) <= 0) return setError("Invalid contribution amount");
    if (isNaN(Number(maxMembers)) || Number(maxMembers) < 2) return setError("Min 2 members");

    try {
      const collateralWei = parseEther(collateral || "0");
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: AJO_ABI,
        functionName: "createPool",
        args: [
          name.trim(),
          parseEther(contribution),
          collateralWei,
          frequency,
          BigInt(maxMembers),
        ],
        value: collateralWei, // creator locks collateral on creation
      });
    } catch (e: any) {
      setError(e?.shortMessage || "Transaction failed");
    }
  };

  if (isSuccess) {
    setTimeout(() => { onSuccess(); onClose(); }, 1500);
  }

  const inputCls = "w-full bg-navy-900/80 border border-white/10 focus:border-gold-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors placeholder-white/25";
  const labelCls = "block text-xs text-white/50 mb-1.5 tracking-wide";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="glass-card rounded-3xl p-8 w-full max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Create Pool</h2>
                <p className="text-white/40 text-sm mt-1">Start a rotating savings circle</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-colors"
              >
                ✕
              </button>
            </div>

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="text-5xl mb-4">🎉</div>
                <p className="text-gold-400 font-bold text-lg font-display">Pool Created!</p>
                <p className="text-white/50 text-sm mt-2">Your savings circle is live</p>
              </motion.div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Pool Name</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Lagos Family Circle"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Contribution (RITUAL)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      className={inputCls}
                      value={contribution}
                      onChange={(e) => setContribution(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Collateral (RITUAL)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      className={inputCls}
                      value={collateral}
                      onChange={(e) => setCollateral(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Contribution Frequency</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: "Weekly", val: 0 }, { label: "Monthly", val: 1 }].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setFrequency(opt.val as 0 | 1)}
                        className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                          frequency === opt.val
                            ? "border-gold-500 bg-gold-500/10 text-gold-400"
                            : "border-white/10 text-white/40 hover:border-white/30"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Max Members (2–50)</label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    className={inputCls}
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
                    {error}
                  </p>
                )}

                <div className="bg-navy-900/60 rounded-xl p-4 text-xs text-white/40 leading-relaxed">
                  <span className="text-gold-500">Note:</span> You'll lock the collateral amount when creating the pool. All members rotate receiving the full pot. Defaulters are slashed.
                </div>

                <button
                  onClick={handleCreate}
                  disabled={isPending || isTxLoading}
                  className="w-full py-4 rounded-xl font-bold text-base bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 hover:from-gold-400 hover:to-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isPending || isTxLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                      Creating Pool...
                    </span>
                  ) : (
                    "Create Pool"
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
