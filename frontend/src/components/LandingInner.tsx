"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingInner() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (isConnected && !redirected.current) {
      redirected.current = true;
      setTimeout(() => router.push("/dashboard"), 600);
    }
  }, [isConnected, router]);

  return (
    <div className="relative min-h-screen adire-bg overflow-hidden flex flex-col items-center justify-center">
      {/* ── Animated background orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="float-slow absolute w-96 h-96 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #FFC107, transparent 70%)",
            top: "-10%",
            left: "-5%",
          }}
        />
        <div
          className="float-medium absolute w-80 h-80 rounded-full opacity-8"
          style={{
            background: "radial-gradient(circle, #FF6B35, transparent 70%)",
            bottom: "-5%",
            right: "-5%",
          }}
        />
        <div
          className="float-fast absolute w-64 h-64 rounded-full opacity-6"
          style={{
            background: "radial-gradient(circle, #FFC107, transparent 70%)",
            top: "30%",
            right: "15%",
          }}
        />

        {/* ── Adire diamond grid overlay ── */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diamonds" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#FFC107" strokeWidth="0.8"/>
              <circle cx="20" cy="20" r="2" fill="#FFC107" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diamonds)"/>
        </svg>

        {/* Horizontal gold line decorations */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-30" />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">

        {/* Top tag */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mb-8"
        >
          <span className="text-xs tracking-[0.35em] text-gold-500 uppercase font-body border border-gold-500/30 px-4 py-1.5 rounded-full">
            Ritual Chain Testnet
          </span>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          className="font-display text-7xl md:text-9xl font-bold leading-none mb-2"
        >
          <span className="gold-shimmer">Ajo</span>
          <span className="text-white/20 mx-3 text-5xl md:text-7xl">/</span>
          <span className="gold-shimmer">Esusu</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="font-body text-xl md:text-2xl text-white/60 tracking-wide mt-6 mb-2"
        >
          A Decentralized Rotating Savings
        </motion.p>

        {/* By Hemisphere */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="font-display text-sm md:text-base italic text-gold-400/70 tracking-widest mb-14"
        >
          by Hemisphere
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="w-32 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mb-14"
        />

        {/* Connect button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6, duration: 0.6, type: "spring" }}
          className="relative"
        >
          {/* Pulse rings behind button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="pulse-ring w-48 h-16 rounded-full border border-gold-500/40"
              style={{ animationDelay: "0s" }}
            />
            <div
              className="pulse-ring w-48 h-16 rounded-full border border-gold-500/20 absolute"
              style={{ animationDelay: "0.7s" }}
            />
          </div>

          <div className="relative z-10 [&_button]:!bg-gradient-to-r [&_button]:!from-gold-500 [&_button]:!to-gold-600 [&_button]:!text-navy-900 [&_button]:!font-bold [&_button]:!text-base [&_button]:!px-10 [&_button]:!py-4 [&_button]:!rounded-xl [&_button]:!shadow-lg [&_button]:!shadow-gold-500/25 [&_button]:!tracking-wide">
            <ConnectButton label="Connect Wallet to Begin" />
          </div>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="mt-12 flex items-center gap-6 text-white/30 text-xs tracking-wider"
        >
          <span>Trustless</span>
          <span className="w-1 h-1 rounded-full bg-gold-500/40" />
          <span>Non-custodial</span>
          <span className="w-1 h-1 rounded-full bg-gold-500/40" />
          <span>On-chain</span>
        </motion.div>
      </div>

      {/* ── Bottom decorative bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-1 ankara-stripe" />
    </div>
  );
}
