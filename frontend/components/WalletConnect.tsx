"use client";
import { WalletState } from "@/hooks/useWallet";
import { SOMNIA_CHAIN } from "@/lib/somnia";

function shortAddr(addr: string) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function WalletConnect({ wallet }: { wallet: WalletState }) {
    const { address, isConnected, isCorrectNetwork, isConnecting, error, connect, disconnect, switchNetwork } = wallet;

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center gap-4">
                <button className="btn btn-primary text-base px-8 py-3" onClick={connect} disabled={isConnecting}>
                    {isConnecting ? (
                        <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Connecting...</>
                    ) : (
                        <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M22 10H2" /></svg> Connect MetaMask</>
                    )}
                </button>
                {error && <p className="text-red-400 text-sm text-center max-w-sm">{error}</p>}
                <p className="text-slate-500 text-xs">Requires MetaMask + Somnia Testnet (Chain ID: {SOMNIA_CHAIN.chainId})</p>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            {!isCorrectNetwork ? (
                <button className="btn btn-warn text-sm" onClick={switchNetwork}>⚠️ Switch to Somnia</button>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="pulse-dot" />
                    <span className="text-green-400 text-xs font-mono">Somnia Testnet</span>
                </div>
            )}
            <div className="glass px-4 py-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs">
                    {address?.slice(2, 4).toUpperCase()}
                </div>
                <span className="font-mono text-sm text-blue-300">{shortAddr(address!)}</span>
            </div>
            <button onClick={disconnect} className="text-slate-500 hover:text-red-400 text-xs transition-colors cursor-pointer">✕</button>
        </div>
    );
}
