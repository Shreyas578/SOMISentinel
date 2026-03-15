"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { useReactivity } from "@/hooks/useReactivity";
import { CONTRACTS, SOMNIA_CHAIN } from "@/lib/somnia";
import { LENDING_POOL_ABI } from "@/lib/contracts";
import WalletConnect from "@/components/WalletConnect";
import RiskMeter from "@/components/RiskMeter";
import EventLog from "@/components/EventLog";
import WhaleAlert from "@/components/WhaleAlert";
import DemoControls from "@/components/DemoControls";
import RatioChart from "@/components/RatioChart";
import Portfolio from "@/components/Portfolio";
import Image from "next/image";

function shortAddr(a: string) { return a.slice(0, 6) + "..." + a.slice(-4); }

export default function Home() {
  const wallet = useWallet();
  const { events, isConnected: reactivityConnected, latestRatio, hasWhaleAlert, clearEvents } = useReactivity();

  const [collateral, setCollateral] = useState<string>("0");
  const [riskLevel, setRiskLevel] = useState<number>(0);

  // Fetch on-chain position when wallet connected
  useEffect(() => {
    if (!wallet.signer || !wallet.isCorrectNetwork) return;
    const contractsDeployed = CONTRACTS.lendingPool !== "0x0000000000000000000000000000000000000000";
    if (!contractsDeployed) return;

    async function fetchPosition() {
      try {
        const pool = new ethers.Contract(CONTRACTS.lendingPool, LENDING_POOL_ABI, wallet.signer!);
        const addr = await wallet.signer!.getAddress();
        const pos = await pool.getPosition(addr);
        setCollateral(ethers.formatEther(pos.collateralAmount));
      } catch { }
    }
    fetchPosition();
  }, [wallet.signer, wallet.isCorrectNetwork, events.length]);

  // Derive risk level from ratio
  useEffect(() => {
    if (latestRatio < 130) setRiskLevel(2);
    else if (latestRatio < 150) setRiskLevel(1);
    else setRiskLevel(0);
  }, [latestRatio]);

  const latestWhaleEvent = events.find(e => e.type === "WhaleTransfer");

  const riskBadge =
    riskLevel === 2 ? <span className="badge badge-danger animate-pulse_fast">🔥 CRITICAL</span> :
      riskLevel === 1 ? <span className="badge badge-warn">⚠️ WARNING</span> :
        <span className="badge badge-safe">✅ SAFE</span>;

  return (
    <div className="min-h-screen bg-grid">
      {/* Whale Alert toast */}
      <WhaleAlert
        active={hasWhaleAlert}
        amount={latestWhaleEvent?.amount}
        from={latestWhaleEvent?.user}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-sentinel-border bg-sentinel-bg/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo + name */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex-shrink-0">
              <Image src="/logo.png" alt="SOMI Sentinel" fill className="object-contain" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">SOMI Sentinel</p>
              <p className="text-blue-400/70 text-xs">Reactive DeFi Guardian</p>
            </div>
          </div>

          {/* Center: Reactivity status */}
          <div className="hidden sm:flex items-center gap-2 glass px-3 py-1.5 text-xs">
            <div className={`pulse-dot ${reactivityConnected ? "" : "danger"}`} />
            <span className={reactivityConnected ? "text-green-400" : "text-red-400"}>
              Somnia Reactivity {reactivityConnected ? "LIVE" : "OFFLINE"}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">No polling · WebSocket</span>
          </div>

          {/* Right: Wallet */}
          <WalletConnect wallet={wallet} />
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      {!wallet.isConnected && (
        <section className="max-w-7xl mx-auto px-4 pt-20 pb-12 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <Image src="/logo.png" alt="SOMI Sentinel" fill className="object-contain" style={{ filter: "drop-shadow(0 0 20px #00aaff88)" }} />
          </div>
          <h1 className="text-5xl font-bold glow-text mb-4">
            SOMI <span className="text-blue-400">Sentinel</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-2">
            Real-time DeFi risk monitoring powered by{" "}
            <span className="text-blue-400 font-semibold">Somnia Reactivity</span>
          </p>
          <p className="text-slate-600 text-sm mb-10">
            Events are pushed from the blockchain · Zero polling · Instant alerts
          </p>
          <WalletConnect wallet={wallet} />

          {/* Features grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {[
              { icon: "⚡", title: "Zero Polling", desc: "WebSocket subscriptions push events instantly" },
              { icon: "🛡️", title: "Risk Guardian", desc: "Monitors collateral ratios in real time" },
              { icon: "🐋", title: "Whale Alerts", desc: "Detects large on-chain movements" },
              { icon: "🔥", title: "Liquidation Guard", desc: "Triggers alerts before positions go critical" },
            ].map(f => (
              <div key={f.title} className="glass p-4 text-center">
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="text-white text-xs font-semibold mb-1">{f.title}</p>
                <p className="text-slate-500 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Dashboard (after connect) ─────────────────────────────────── */}
      {wallet.isConnected && (
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Wrong network banner */}
          {!wallet.isCorrectNetwork && (
            <div className="glass glow-border-warn p-4 mb-6 flex items-center justify-between gap-4">
              <p className="text-yellow-300 text-sm">⚠️ Connected to wrong network. Please switch to <strong>Somnia Testnet</strong>.</p>
              <button className="btn btn-warn text-xs" onClick={wallet.switchNetwork}>Switch Network</button>
            </div>
          )}

          {/* Stats row replaced by Portfolio */}
          <Portfolio signer={wallet.signer} currentRatio={latestRatio} events={events} />

          {/* Risk warning banner */}
          {riskLevel === 2 && (
            <div className="glass glow-border-danger p-4 mb-6 flex items-center gap-4 animate-pulse_fast">
              <span className="text-3xl">🔥</span>
              <div>
                <p className="text-red-400 font-bold">LIQUIDATION RISK DETECTED</p>
                <p className="text-slate-400 text-sm">
                  Collateral ratio at <strong className="text-red-300">{latestRatio}%</strong> — below the 130% liquidation threshold.
                  Guardian alert triggered via Somnia Reactivity.
                </p>
              </div>
            </div>
          )}

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <RiskMeter ratio={latestRatio} />
              <RatioChart currentRatio={latestRatio} events={events} />
              <EventLog events={events} isConnected={reactivityConnected} onClear={clearEvents} />
            </div>
            {/* Right column */}
            <div className="flex flex-col gap-4">
              <DemoControls signer={wallet.signer} isConnected={wallet.isConnected} />

              {/* Network info */}
              <div className="glass p-4">
                <p className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wider">Network</p>
                <div className="flex flex-col gap-2 text-xs">
                  {[
                    ["Chain", SOMNIA_CHAIN.name],
                    ["Chain ID", String(SOMNIA_CHAIN.chainId)],
                    ["RPC", SOMNIA_CHAIN.rpcUrl.replace("https://", "")],
                    ["Currency", SOMNIA_CHAIN.currency.symbol],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-blue-300 font-mono truncate">{v}</span>
                    </div>
                  ))}
                  <a href={SOMNIA_CHAIN.faucet} target="_blank" rel="noopener noreferrer"
                    className="mt-2 text-center text-blue-500 hover:text-blue-400 transition-colors">
                    🚰 Get Testnet STT →
                  </a>
                </div>
              </div>

              {/* Reactivity info */}
              <div className="glass p-4">
                <p className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wider">Somnia Reactivity</p>
                <div className="flex flex-col gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2"><div className={`pulse-dot w-2 h-2 ${reactivityConnected ? "" : "danger"}`} /><span className={reactivityConnected ? "text-green-400" : "text-red-400"}>{reactivityConnected ? "WebSocket LIVE" : "Offline"}</span></div>
                  <p>✅ No RPC polling</p>
                  <p>✅ Event + state in same block</p>
                  <p>✅ Sub-second latency</p>
                  <p>✅ Cross-environment (on/off-chain)</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-sentinel-border mt-12 py-6 text-center">
        <p className="text-slate-600 text-xs">
          SOMI Sentinel · Built for the <span className="text-blue-500">Somnia Reactivity Mini Hackathon</span> · Somnia Testnet
        </p>
      </footer>
    </div>
  );
}
