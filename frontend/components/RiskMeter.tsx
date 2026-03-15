"use client";

interface RiskMeterProps {
    ratio: number;
}

export default function RiskMeter({ ratio }: RiskMeterProps) {
    // Clamp 0–250
    const clamped = Math.min(Math.max(ratio, 0), 250);
    const pct = (clamped / 250) * 100;

    const color =
        clamped < 130 ? "#ff1744" :
            clamped < 150 ? "#ffab40" : "#00e676";

    const label =
        clamped < 130 ? "CRITICAL" :
            clamped < 150 ? "WARNING" : "SAFE";

    const labelClass =
        clamped < 130 ? "badge badge-danger" :
            clamped < 150 ? "badge badge-warn" : "badge badge-safe";

    return (
        <div className="stat-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-medium">Collateral Ratio</span>
                <span className={labelClass}>{label}</span>
            </div>
            <div className="flex items-end gap-3">
                <span
                    className="text-4xl font-bold font-mono transition-all duration-700"
                    style={{ color }}
                >
                    {clamped}%
                </span>
                <span className="text-slate-500 text-sm pb-1">/ 250%</span>
            </div>
            {/* Bar */}
            <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}88` }}
                />
                {/* Thresholds markers */}
                <div className="absolute top-0 h-full w-px bg-yellow-500/60" style={{ left: `${(150 / 250) * 100}%` }} />
                <div className="absolute top-0 h-full w-px bg-red-500/60" style={{ left: `${(130 / 250) * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-600">
                <span>0%</span>
                <span className="text-red-500/70">130% Liquidation</span>
                <span className="text-yellow-500/70">150% Warning</span>
                <span>250%</span>
            </div>
        </div>
    );
}
