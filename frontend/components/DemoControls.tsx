"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "@/lib/somnia";
import { GUARDIAN_ABI, MOCK_TOKEN_ABI, LENDING_POOL_ABI } from "@/lib/contracts";

interface DemoControlsProps {
    signer: ethers.Signer | null;
    isConnected: boolean;
}

type ActionKey = "mint" | "deposit" | "withdraw";

const WHALE_AMOUNT = ethers.parseEther("15000");
const DEPOSIT_AMOUNT = ethers.parseEther("1000");

export default function DemoControls({ signer, isConnected }: DemoControlsProps) {
    const [loading, setLoading] = useState<ActionKey | null>(null);
    const [txMsg, setTxMsg] = useState<string | null>(null);

    const contractsDeployed = CONTRACTS.guardian !== "0x0000000000000000000000000000000000000000";

    async function run(key: ActionKey, fn: () => Promise<void>) {
        if (!signer || loading) return;
        try {
            setLoading(key); setTxMsg(null);
            await fn();
            setTxMsg("✅ Manual trigger confirmed! Sentinel is processing...");
        } catch (e: unknown) {
            setTxMsg("❌ " + ((e as Error).message || "Transaction failed").slice(0, 120));
        } finally {
            setLoading(null);
            setTimeout(() => setTxMsg(null), 6000);
        }
    }

    const spinner = (
        <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
    );

    return (
        <div className="glass p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-white text-sm">Autonomous Sentinel</h2>
                    <p className="text-blue-400 text-[10px] uppercase font-bold tracking-tighter">Somnia Reactivity Pipeline</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 text-[10px] font-bold">AUTOMATED</span>
                </div>
            </div>

            <div className="bg-slate-900/40 p-3 rounded-lg border border-white/5">
                <p className="text-slate-400 text-[10px] leading-relaxed">
                    The <strong className="text-blue-300">Simulation Script</strong> is currently driving the market (0-250 range).
                    Somnia Reactivity is <span className="text-green-400">automatically</span> detecting risks and triggering Guardian actions.
                </p>
            </div>

            <div className="flex items-center gap-2 py-1">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-[9px] text-slate-600 font-bold uppercase">Manual Overrides</span>
                <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-2 opacity-80 hover:opacity-100 transition-opacity">
                {/* Mint tokens */}
                <button
                    className="btn btn-primary text-[10px] py-2 gap-1"
                    disabled={!isConnected || loading !== null || !contractsDeployed}
                    onClick={() => run("mint", async () => {
                        const addr = await signer!.getAddress();
                        const token = new ethers.Contract(CONTRACTS.mockToken, MOCK_TOKEN_ABI, signer!);
                        const tx = await token.mint(addr, ethers.parseEther("5000"));
                        await tx.wait();
                    })}
                >
                    {loading === "mint" ? spinner : "💎"} Mint 5K
                </button>

                {/* Deposit collateral */}
                <button
                    className="btn btn-primary text-[10px] py-2 gap-1"
                    disabled={!isConnected || loading !== null || !contractsDeployed}
                    onClick={() => run("deposit", async () => {
                        const token = new ethers.Contract(CONTRACTS.mockToken, MOCK_TOKEN_ABI, signer!);
                        const pool = new ethers.Contract(CONTRACTS.lendingPool, LENDING_POOL_ABI, signer!);
                        const approveTx = await token.approve(CONTRACTS.lendingPool, DEPOSIT_AMOUNT);
                        await approveTx.wait();
                        const depositTx = await pool.depositCollateral(DEPOSIT_AMOUNT);
                        await depositTx.wait();
                    })}
                >
                    {loading === "deposit" ? spinner : "📥"} Deposit
                </button>

                {/* Withdraw collateral */}
                <button
                    className="btn btn-primary text-[10px] py-2 gap-1 col-span-2"
                    disabled={!isConnected || loading !== null || !contractsDeployed}
                    onClick={() => run("withdraw", async () => {
                        const pool = new ethers.Contract(CONTRACTS.lendingPool, LENDING_POOL_ABI, signer!);
                        const addr = await signer!.getAddress();
                        const pos = await pool.getPosition(addr);
                        if (pos.collateralAmount < ethers.parseEther("500")) {
                            throw new Error("Insufficient collateral in pool (min 500)");
                        }
                        const tx = await pool.withdrawCollateral(ethers.parseEther("500"));
                        await tx.wait();
                    })}
                >
                    {loading === "withdraw" ? spinner : "💸"} Withdraw 500 STEST
                </button>
            </div>

            {txMsg && (
                <div className={`text-[10px] p-2 rounded-lg text-center ${txMsg.startsWith("✅") ? "bg-green-500/10 text-green-300 border border-green-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"}`}>
                    {txMsg}
                </div>
            )}
        </div>
    );
}
