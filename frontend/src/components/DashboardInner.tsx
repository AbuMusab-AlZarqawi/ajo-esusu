"use client";

import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useReadContract } from "wagmi";
import { AJO_ABI, CONTRACT_ADDRESS } from "@/lib/contract";
import PoolCard from "./PoolCard";
import CreatePoolModal from "./CreatePoolModal";
import ActivityFeed from "./ActivityFeed";
import MyPools from "./MyPools";
import { shortenAddress } from "@/hooks/usePoolData";

function PoolGrid({ count, userAddress, onJoinSuccess }: { count: number; userAddress: string; onJoinSuccess: () => void }) {
  if (count === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <div className="text-5xl mb-4">🌍</div>
        <p className="text-white/50 text-lg font-display">No pools yet.</p>
        <p className="text-white/30 text-sm mt-2">Be the first to create a savings circle.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <PoolCard
          key={i}
          poolId={i}
          userAddress={userAddress}
          onJoinSuccess={onJoinSuccess}
        />
      ))}
    </div>
  );
}

export default function DashboardInner() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"browse" | "mine">("browse");

  const { data: poolCount, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AJO_ABI,
    functionName: "poolCount",
  });

  useEffect(() => {
    if (!isConnected) router.push("/");
  }, [isConnected, router]);

  const handleRefresh = () => {
    setRefreshTrigger((n) => n + 1);
    refetch();
  };

  const count = poolCount ? Number(poolCount) : 0;

  return (
    <div className="min-h-screen adire-bg">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-navy-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-8 h-8">
                  <polygon points="18,4 32,13 32,23 18,32 4,23 4,13" fill="none" stroke="#FFC107" strokeWidth="1.5"/>
                  <circle cx="18" cy="18" r="4" fill="#FFC107" opacity="0.8"/>
                  <line x1="18" y1="4" x2="18" y2="32" stroke="#FFC107" strokeWidth="0.5" opacity="0.3"/>
                  <line x1="4" y1="13" x2="32" y2="23" stroke="#FFC107" strokeWidth="0.5" opacity="0.3"/>
                  <line x1="4" y1="23" x2="32" y2="13" stroke="#FFC107" strokeWidth="0.5" opacity="0.3"/>
                </svg>
              </div>
            </div>
            <div className="leading-none">
              <span className="font-display text-lg font-bold gold-shimmer">Ajo / Esusu</span>
              <p className="text-white/30 text-xs">by Hemisphere</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreate(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500 text-navy-900 font-bold text-sm hover:bg-gold-400 transition-colors"
            >
              <span>+</span> Create Pool
            </button>
            <ConnectButton
              showBalance={false}
              chainStatus="none"
              accountStatus="avatar"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Hero stats bar ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 mb-8 flex flex-wrap gap-6 items-center justify-between"
        >
          <div>
            <p className="text-white/40 text-xs tracking-wider mb-1">CONNECTED AS</p>
            <p className="text-gold-400 font-mono text-sm font-bold">{address ? shortenAddress(address) : "—"}</p>
          </div>
          <div className="w-px h-8 bg-white/10 hidden sm:block" />
          <div>
            <p className="text-white/40 text-xs tracking-wider mb-1">TOTAL POOLS</p>
            <p className="text-white font-bold text-2xl font-display">{count}</p>
          </div>
          <div className="w-px h-8 bg-white/10 hidden sm:block" />
          <div>
            <p className="text-white/40 text-xs tracking-wider mb-1">NETWORK</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-white text-sm font-medium">Ritual Chain</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="ml-auto text-white/30 hover:text-gold-400 transition-colors text-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </motion.div>

        {/* ── Mobile create button ── */}
        <div className="sm:hidden mb-6">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 font-bold text-base"
          >
            + Create New Pool
          </button>
        </div>

        {/* ── Main layout ── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left — pools */}
          <div className="xl:col-span-3 space-y-8">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-navy-800/60 rounded-xl w-fit">
              {(["browse", "mine"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-gold-500 text-navy-900 font-bold"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {tab === "browse" ? "Browse Pools" : "My Pools"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "browse" ? (
                <motion.div
                  key="browse"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PoolGrid
                    count={count}
                    userAddress={address || ""}
                    onJoinSuccess={handleRefresh}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="mine"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {address && (
                    <MyPools
                      userAddress={address as `0x${string}`}
                      refreshTrigger={refreshTrigger}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — activity feed */}
          <div className="xl:col-span-1">
            <div className="sticky top-24">
              <ActivityFeed />

              {/* Info card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="glass-card rounded-2xl p-5 mt-5"
              >
                <h4 className="font-display font-bold text-white mb-3 text-sm">How It Works</h4>
                <ol className="space-y-2.5 text-xs text-white/50 leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-gold-500 font-bold flex-shrink-0">1.</span>
                    Create or join a pool by locking collateral
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold-500 font-bold flex-shrink-0">2.</span>
                    Everyone contributes each cycle (weekly or monthly)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold-500 font-bold flex-shrink-0">3.</span>
                    One member receives the full pot each round
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold-500 font-bold flex-shrink-0">4.</span>
                    Rotate until all members have received their payout
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold-500 font-bold flex-shrink-0">5.</span>
                    Collateral returned when pool completes ✓
                  </li>
                </ol>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Create Pool Modal ── */}
      <CreatePoolModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
