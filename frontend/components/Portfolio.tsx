"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "@/lib/somnia";
import { MOCK_TOKEN_ABI, LENDING_POOL_ABI } from "@/lib/contracts";

interface PortfolioProps {
    signer: ethers.Signer | null;
    currentRatio: number;
    events: any[];
}

export default function Portfolio({ signer, currentRatio, events }: PortfolioProps) {
    const [stats, setStats] = useState({
        wallet: "0.00",
        deposited: "0.00",
        withdrawn: "0.00",
        pnl: "0.00"
    });

    useEffect(() => {
        if (events.length > 0) {
            console.log(`💼 Portfolio: Received ${events.length} events`);
        }
        if (!signer) return;

        const loadStats = async () => {
            const addr = await signer.getAddress();
            const token = new ethers.Contract(CONTRACTS.mockToken, MOCK_TOKEN_ABI, signer);
            const pool = new ethers.Contract(CONTRACTS.lendingPool, LENDING_POOL_ABI, signer);

            const [bal, pos] = await Promise.all([
                token.balanceOf(addr),
                pool.getPosition(addr)
            ]);

            // Calculate historical withdrawn from events
            const withdrawEvents = events.filter(e => e.type === "CollateralWithdrawn" && e.user?.toLowerCase() === addr.toLowerCase());
            const totalWithdrawn = withdrawEvents.reduce((acc, e) => acc + parseFloat(e.amount || "0"), 0);

            // PnL calculation: simple simulation relative to 200% baseline
            // If ratio > 200, we are "in profit" relative to base health
            const depositedVal = parseFloat(ethers.formatEther(pos.collateralAmount));
            const pnlPercent = (currentRatio - 200) / 200;
            const pnlAmount = depositedVal * pnlPercent;

            setStats({
                wallet: parseFloat(ethers.formatEther(bal)).toFixed(2),
                deposited: depositedVal.toFixed(2),
                withdrawn: totalWithdrawn.toFixed(2),
                pnl: pnlAmount.toFixed(2)
            });
        };

        loadStats();
        const interval = setInterval(loadStats, 5000);
        return () => clearInterval(interval);
    }, [signer, currentRatio, events]);

    const isProfit = parseFloat(stats.pnl) >= 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass p-4 border-l-4 border-blue-500">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Wallet Balance</p>
                <h4 className="text-white text-lg font-mono font-bold">{stats.wallet} <span className="text-[10px] text-slate-500">STEST</span></h4>
            </div>

            <div className="glass p-4 border-l-4 border-purple-500">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Deposited</p>
                <h4 className="text-white text-lg font-mono font-bold">{stats.deposited} <span className="text-[10px] text-slate-500">STEST</span></h4>
            </div>

            <div className="glass p-4 border-l-4 border-indigo-500">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Withdrawn</p>
                <h4 className="text-white text-lg font-mono font-bold">{stats.withdrawn} <span className="text-[10px] text-slate-500">STEST</span></h4>
            </div>

            <div className={`glass p-4 border-l-4 ${isProfit ? "border-green-500" : "border-red-500"}`}>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Net PnL (Estimated)</p>
                <h4 className={`text-lg font-mono font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
                    {isProfit ? "+" : ""}{stats.pnl} <span className="text-[10px] opacity-70">STEST</span>
                </h4>
            </div>
        </div>
    );
}
