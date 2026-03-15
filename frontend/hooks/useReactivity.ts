"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { REACTIVITY_SERVICE_WS } from "@/lib/somnia";

export type EventSeverity = "info" | "safe" | "warn" | "danger";

export interface SentinelEvent {
    id: string;
    type: string;
    timestamp: number;
    severity: EventSeverity;
    title: string;
    description: string;
    user?: string;
    amount?: string;
    ratio?: number;
    txHash?: string;
    blockNumber?: number;
    raw?: unknown;
}

function classifyEvent(raw: Record<string, unknown>): SentinelEvent {
    const base = {
        id: `${raw.type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: (raw.timestamp as number) || Date.now(),
        txHash: raw.txHash as string | undefined,
        blockNumber: raw.blockNumber as number | undefined,
        user: raw.user as string | undefined,
        amount: raw.amount as string | undefined,
        ratio: raw.ratio as number | undefined,
        raw,
    };

    switch (raw.type) {
        case "CollateralDeposited":
            return {
                ...base, type: "CollateralDeposited", severity: "safe",
                title: "Collateral Deposited",
                description: `${parseFloat(raw.amount as string || "0").toFixed(2)} STEST deposited`
            };
        case "CollateralRatioUpdated":
            const r = raw.ratio as number;
            return {
                ...base, type: "CollateralRatioUpdated",
                severity: r < 130 ? "danger" : r < 150 ? "warn" : "safe",
                title: "Collateral Ratio Updated",
                description: `Ratio updated to ${r}%`
            };
        case "PositionAtRisk":
            return {
                ...base, type: "PositionAtRisk", severity: "danger",
                title: "⚠️ Position At Risk!",
                description: "Position is approaching liquidation threshold"
            };
        case "WhaleTransfer":
            return {
                ...base, type: "WhaleTransfer", severity: "warn",
                title: "🐋 Whale Transfer Detected",
                description: `${parseFloat(raw.amount as string || "0").toFixed(0)} STEST moved`
            };
        case "GuardianAlert":
            const msg = raw.message as string;
            const isC = msg.includes("CRITICAL") || msg.includes("LIQUIDATION");
            return {
                ...base, type: "GuardianAlert",
                severity: isC ? "danger" : "warn",
                title: "🛡️ Guardian Alert",
                description: msg
            };
        case "PriceDropSimulated":
            return {
                ...base, type: "PriceDropSimulated", severity: "warn",
                title: "📉 Price Drop Simulated",
                description: `${raw.dropPercent}% price drop triggered`
            };
        case "LiquidationTriggered":
            return {
                ...base, type: "LiquidationTriggered", severity: "danger",
                title: "🔥 Liquidation Risk!",
                description: `Ratio at ${raw.ratio}% — Critical!`
            };
        case "Connected":
            return {
                ...base, type: "Connected", severity: "info",
                title: "⚡ Reactivity Connected",
                description: "Somnia Reactivity WebSocket active — no polling"
            };
        default:
            return {
                ...base, type: raw.type as string, severity: "info",
                title: raw.type as string,
                description: "Blockchain event received"
            };
    }
}

export function useReactivity() {
    const [events, setEvents] = useState<SentinelEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [latestRatio, setLatestRatio] = useState<number>(200);
    const [hasWhaleAlert, setHasWhaleAlert] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const addEvent = useCallback((raw: Record<string, unknown>) => {
        const ev = classifyEvent(raw);
        setEvents(prev => [ev, ...prev].slice(0, 100));
        if (ev.type === "CollateralRatioUpdated" && ev.ratio !== undefined) setLatestRatio(ev.ratio);
        if (ev.type === "WhaleTransfer") { setHasWhaleAlert(true); setTimeout(() => setHasWhaleAlert(false), 10000); }
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        try {
            const ws = new WebSocket(REACTIVITY_SERVICE_WS);
            wsRef.current = ws;
            ws.onopen = () => {
                console.log("⚡ Reactivity Connected: WebSocket OPEN");
                setIsConnected(true);
            };
            ws.onclose = () => {
                console.log("🔌 Reactivity Disconnected: WebSocket CLOSED");
                setIsConnected(false);
                reconnTimer.current = setTimeout(connect, 3000);
            };
            ws.onerror = (e) => {
                console.error("❌ Reactivity Error:", e);
                ws.close();
            };
            ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    console.log("📥 Reactivity Event Received:", data);
                    addEvent(data);
                } catch (err) {
                    console.error("❌ Failed to parse reactivity message:", err);
                }
            };
        } catch { }
    }, [addEvent]);

    useEffect(() => {
        connect();
        return () => {
            if (reconnTimer.current) clearTimeout(reconnTimer.current);
            wsRef.current?.close();
        };
    }, [connect]);

    const clearEvents = useCallback(() => setEvents([]), []);

    return { events, isConnected, latestRatio, hasWhaleAlert, clearEvents };
}
