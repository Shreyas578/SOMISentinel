"use client";
import { useState, useEffect } from "react";
import { SentinelEvent } from "@/hooks/useReactivity";

const EVENT_ICONS: Record<string, string> = {
    CollateralDeposited: "💎",
    CollateralRatioUpdated: "📊",
    PositionAtRisk: "⚠️",
    WhaleTransfer: "🐋",
    GuardianAlert: "🛡️",
    PriceDropSimulated: "📉",
    LiquidationTriggered: "🔥",
    CollateralWithdrawn: "💸",
    Connected: "⚡",
};

const SEVERITY_STYLES: Record<string, string> = {
    safe: "border-l-green-500  bg-green-500/5",
    warn: "border-l-yellow-500 bg-yellow-500/5",
    danger: "border-l-red-500    bg-red-500/5",
    info: "border-l-blue-500   bg-blue-500/5",
};

function timeAgo(ts: number) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
}

export default function EventLog({ events, isConnected, onClear }: {
    events: SentinelEvent[];
    isConnected: boolean;
    onClear: () => void;
}) {
    const [, forceRender] = useState(0);
    // Re-render every 5s for "time ago" updates
    useEffect(() => {
        const t = setInterval(() => forceRender(n => n + 1), 5000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="glass flex flex-col h-full min-h-[420px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-sentinel-border">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Live Event Feed</span>
                    <div className={`pulse-dot ${isConnected ? "" : "danger"}`} />
                    <span className={`text-xs ${isConnected ? "text-green-400" : "text-red-400"}`}>
                        {isConnected ? "REACTIVITY LIVE" : "DISCONNECTED"}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="badge badge-blue">{events.length} events</span>
                    {events.length > 0 && (
                        <button onClick={onClear} className="text-slate-500 hover:text-slate-300 text-xs transition-colors cursor-pointer">
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Events */}
            <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1">
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                        <div className="text-4xl opacity-30">📡</div>
                        <p className="text-slate-500 text-sm">Waiting for blockchain events...</p>
                        <p className="text-slate-600 text-xs">Events will appear here in real-time via Somnia Reactivity</p>
                    </div>
                ) : (
                    events.map((ev) => (
                        <div
                            key={ev.id}
                            className={`event-entry flex gap-3 p-3 rounded-lg border-l-2 ${SEVERITY_STYLES[ev.severity]}`}
                        >
                            <span className="text-xl flex-shrink-0 mt-0.5">{EVENT_ICONS[ev.type] || "📣"}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-white truncate">{ev.title}</span>
                                    <span className="text-xs text-slate-500 flex-shrink-0">{timeAgo(ev.timestamp)}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">{ev.description}</p>
                                {ev.user && (
                                    <p className="text-xs text-blue-400/70 font-mono mt-0.5 truncate">
                                        {ev.user.slice(0, 6)}...{ev.user.slice(-4)}
                                    </p>
                                )}
                                {ev.txHash && (
                                    <a
                                        href={`https://shannon-explorer.somnia.network/tx/${ev.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-500/60 hover:text-blue-400 font-mono transition-colors"
                                    >
                                        {ev.txHash.slice(0, 10)}...↗
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
