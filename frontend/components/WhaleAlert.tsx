"use client";
import { useEffect, useState } from "react";

export default function WhaleAlert({ amount, from, to, active }: {
    amount?: string;
    from?: string;
    to?: string;
    active: boolean;
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (active) {
            setVisible(true);
            const t = setTimeout(() => setVisible(false), 10000);
            return () => clearTimeout(t);
        }
    }, [active]);

    if (!visible) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade_in">
            <div
                className="glass px-6 py-4 flex items-center gap-4 glow-border-warn"
                style={{ minWidth: 360, maxWidth: 560 }}
            >
                <span className="text-4xl animate-bounce">🐋</span>
                <div className="flex-1">
                    <p className="text-yellow-300 font-bold text-base">Whale Transfer Detected!</p>
                    {amount && (
                        <p className="text-slate-300 text-sm mt-1">
                            <span className="text-yellow-400 font-mono font-bold">{parseFloat(amount).toLocaleString()} STEST</span> moved on-chain
                        </p>
                    )}
                    {from && to && (
                        <p className="text-slate-500 text-xs font-mono mt-1">
                            {from.slice(0, 6)}...{from.slice(-4)} → {to.slice(0, 6)}...{to.slice(-4)}
                        </p>
                    )}
                    <p className="text-slate-600 text-xs mt-1">Pushed instantly via Somnia Reactivity ⚡</p>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    className="text-slate-500 hover:text-white transition-colors text-lg cursor-pointer"
                >✕</button>
            </div>
        </div>
    );
}
