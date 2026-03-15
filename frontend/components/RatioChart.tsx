"use client";
import { useEffect, useState, useMemo } from "react";

interface DataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ratio: number;
}

interface RatioChartProps {
  currentRatio: number;
  events: any[];
}

export default function RatioChart({ currentRatio, events }: RatioChartProps) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [timeWindow, setTimeWindow] = useState<"1m" | "5m" | "15m">("1m");

  // Derive hybrid data from events
  useEffect(() => {
    const ratioEvents = events.filter(
      (e) => e.type === "CollateralRatioUpdated" || e.type === "CollateralDeposited" || e.type === "CollateralWithdrawn"
    );

    const interval = 5000; // 5s intervals for high-frequency
    const buckets: Map<number, DataPoint> = new Map();

    ratioEvents.forEach((event) => {
      const time = Math.floor(event.timestamp / interval) * interval;
      const ratio = event.ratio || currentRatio;
      const volume = event.amount ? parseFloat(event.amount) : 10 + Math.random() * 30;

      if (!buckets.has(time)) {
        buckets.set(time, {
          timestamp: time,
          open: ratio, // STEST value is derived from ratio for this demo
          high: ratio,
          low: ratio,
          close: ratio,
          volume: volume,
          ratio: ratio
        });
      } else {
        const d = buckets.get(time)!;
        d.high = Math.max(d.high, ratio);
        d.low = Math.min(d.low, ratio);
        d.close = ratio;
        d.volume += volume;
        d.ratio = ratio;
      }
    });

    const now = Math.floor(Date.now() / interval) * interval;
    const windowMs = timeWindow === "1m" ? 60000 : timeWindow === "5m" ? 300000 : 900000;
    const start = now - windowMs;

    for (let t = start; t <= now; t += interval) {
      if (!buckets.has(t)) {
        const prev = Array.from(buckets.values())
          .filter(c => c.timestamp < t)
          .sort((a, b) => b.timestamp - a.timestamp)[0];

        const base = prev ? prev.close : currentRatio;
        buckets.set(t, {
          timestamp: t,
          open: base,
          high: base,
          low: base,
          close: base,
          volume: 0,
          ratio: base
        });
      }
    }

    const sorted = Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);
    setDataPoints(sorted);
  }, [events, currentRatio, timeWindow]);

  const chartHeight = 220;
  const chartWidth = 700;
  const ratioHeight = 160;

  const maxVal = Math.max(...dataPoints.map(d => d.high), 250);
  const minVal = Math.min(...dataPoints.map(d => d.low), 0);
  const range = maxVal - minVal || 100;
  const maxVolume = Math.max(...dataPoints.map(d => d.volume), 150);

  const getY = (val: number) => ratioHeight - ((val - minVal) / range) * ratioHeight;
  const getVolH = (vol: number) => (vol / maxVolume) * 30;

  // Process-oriented Sentinel Analysis
  const [sentinelStep, setSentinelStep] = useState<number>(0);
  const activeAction = useMemo(() => {
    const lastEvent = events[0];
    if (!lastEvent) return null;
    const age = Date.now() - lastEvent.timestamp;
    if (age > 6000) return null;

    // Cycle through steps 1-3
    const step = age < 2000 ? 1 : age < 4000 ? 2 : 3;

    let info = { title: "Monitoring", step: step, detail: "" };
    if (lastEvent.type === "PriceDropSimulated") {
      info.title = "Price Drop Detected";
      info.detail = step === 1 ? "🔍 Detecting Volatility..." : step === 2 ? "⚖️ Analyzing Ratio Impact..." : "⚡ REACTING: Sentinel Adjusting Risk Parameters";
    } else if (lastEvent.type === "PositionAtRisk") {
      info.title = "Liquidation Warning";
      info.detail = step === 1 ? "🚨 Risk Threshold Breached!" : step === 2 ? "📈 Verifying Collateral Health..." : "🛡️ REACTING: Triggering Guardian Protocols";
    } else if (lastEvent.type === "WhaleTransfer") {
      info.title = "Whale Activity";
      info.detail = step === 1 ? "🐋 Large Outflow Detected" : step === 2 ? "📉 Calculating Liquidity Shift..." : "✅ REACTING: Sentinel Logging Transaction Integrity";
    } else if (lastEvent.type === "LiquidationTriggered") {
      info.title = "Systemic Risk Escalation";
      info.detail = step === 1 ? "🔥 Critical Health Failure" : step === 2 ? "🛑 Isolating Position state..." : "⚡ REACTING: Initiating Automated Liquidation Protection";
    }
    return info;
  }, [events]);

  const ratioLinePath = dataPoints.length > 0
    ? `M ${dataPoints.map((d, i) => `${(i / (dataPoints.length - 1)) * (chartWidth - 20) + 10} ${getY(d.ratio)}`).join(" L ")}`
    : "";

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            Hybrid Market Intelligence {activeAction && <span className="animate-pulse text-blue-400 text-[10px]">● Processing</span>}
          </h3>
          <p className="text-slate-500 text-[10px]">STEST Value (Candles) + Collateral Ratio (Line)</p>
        </div>
        <div className="flex gap-1.5">
          {["1m", "5m"].map((tw) => (
            <button
              key={tw}
              onClick={() => setTimeWindow(tw as any)}
              className={`px-2 py-0.5 text-[10px] rounded border ${timeWindow === tw ? "bg-blue-600/20 border-blue-500 text-blue-300" : "bg-slate-900/40 border-white/5 text-slate-500"
                }`}
            >
              {tw}
            </button>
          ))}
        </div>
      </div>

      <div className="relative bg-slate-950/90 rounded-xl p-4 border border-white/5 overflow-hidden">
        {/* Sentinel Process Overlay */}
        {activeAction && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 glass-dark px-4 py-2 border-blue-500/30 flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400 text-[9px] font-black uppercase tracking-widest">{activeAction.title}</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 rounded">STEP {activeAction.step}/3</span>
            </div>
            <span className="text-white text-[11px] font-mono font-bold glow-text">{activeAction.detail}</span>
          </div>
        )}

        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
          {/* Grid */}
          {[130, 200].map((r) => (
            <g key={r} opacity="0.1">
              <line x1="0" y1={getY(r)} x2={chartWidth} y2={getY(r)} stroke="#fff" strokeDasharray="3,3" />
            </g>
          ))}

          {/* Volume */}
          {dataPoints.map((d, i) => {
            const x = (i / (dataPoints.length - 1)) * (chartWidth - 20) + 10;
            const h = getVolH(d.volume);
            return <rect key={`v-${i}`} x={x - 1.5} y={chartHeight - h} width="3" height={h} fill="#1e293b" rx="0.5" />;
          })}

          {/* LAYER 1: STEST Candlesticks */}
          {dataPoints.map((d, i) => {
            const x = (i / (dataPoints.length - 1)) * (chartWidth - 20) + 10;
            const isUp = d.close >= d.open;
            const color = isUp ? "#22c55e" : "#ef4444";
            const t = getY(Math.max(d.open, d.close));
            const b = getY(Math.min(d.open, d.close));
            return (
              <g key={`c-${i}`} opacity="0.4">
                <line x1={x} y1={getY(d.high)} x2={x} y2={getY(d.low)} stroke={color} strokeWidth="1" />
                <rect x={x - 2.5} y={t} width="5" height={Math.max(1, b - t)} fill={color} />
              </g>
            );
          })}

          {/* LAYER 2: Collateral Ratio Line */}
          <path
            d={ratioLinePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            className="drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]"
          />

          {/* Target Tracking */}
          <line x1="0" y1={getY(currentRatio)} x2={chartWidth} y2={getY(currentRatio)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="5,5" opacity="0.4" />
          <circle cx={chartWidth - 10} cy={getY(currentRatio)} r="3" fill="#3b82f6" className="animate-pulse" />
        </svg>

        {/* Dynamic Legend */}
        <div className="flex justify-between items-center mt-3 text-[9px] font-bold uppercase tracking-tight">
          <div className="flex gap-4 text-slate-500">
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-800" /> Candles: STEST Value</div>
            <div className="flex items-center gap-1"><span className="w-4 h-0.5 bg-blue-500" /> Line: Ratio ({currentRatio}%)</div>
          </div>
          <div className="text-blue-500 font-mono">
            LIVE SOMNIA REACTIVITY POLLER: ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
}
