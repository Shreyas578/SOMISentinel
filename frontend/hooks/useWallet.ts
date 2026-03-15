"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { SOMNIA_CHAIN } from "@/lib/somnia";

export interface WalletState {
    address: string | null;
    signer: ethers.Signer | null;
    chainId: number | null;
    isConnected: boolean;
    isCorrectNetwork: boolean;
    isConnecting: boolean;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    switchNetwork: () => Promise<void>;
}

export function useWallet(): WalletState {
    const [address, setAddress] = useState<string | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isConnected = !!address;
    const isCorrectNetwork = chainId === SOMNIA_CHAIN.chainId;

    const switchNetwork = useCallback(async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: SOMNIA_CHAIN.chainIdHex }],
            });
        } catch (e: unknown) {
            // Chain not added yet — add it
            if ((e as { code?: number }).code === 4902) {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: SOMNIA_CHAIN.chainIdHex,
                        chainName: SOMNIA_CHAIN.name,
                        rpcUrls: [SOMNIA_CHAIN.rpcUrl],
                        nativeCurrency: SOMNIA_CHAIN.currency,
                        blockExplorerUrls: [SOMNIA_CHAIN.blockExplorer],
                    }],
                });
            }
        }
    }, []);

    const connect = useCallback(async () => {
        if (!window.ethereum) {
            setError("MetaMask not found. Please install it from metamask.io");
            return;
        }
        try {
            setIsConnecting(true);
            setError(null);
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const s = await provider.getSigner();
            const addr = await s.getAddress();
            const net = await provider.getNetwork();
            setSigner(s);
            setAddress(addr);
            setChainId(Number(net.chainId));
            // Auto-switch to Somnia if on wrong network
            if (Number(net.chainId) !== SOMNIA_CHAIN.chainId) {
                await switchNetwork();
            }
        } catch (e: unknown) {
            setError((e as Error).message || "Failed to connect");
        } finally {
            setIsConnecting(false);
        }
    }, [switchNetwork]);

    const disconnect = useCallback(() => {
        setAddress(null); setSigner(null); setChainId(null); setError(null);
    }, []);

    // Listen for account / chain changes
    useEffect(() => {
        if (!window.ethereum) return;
        const onAccounts = (accounts: string[]) => {
            if (accounts.length === 0) disconnect();
            else setAddress(accounts[0]);
        };
        const onChain = (id: string) => setChainId(parseInt(id, 16));
        window.ethereum.on("accountsChanged", onAccounts);
        window.ethereum.on("chainChanged", onChain);
        return () => {
            window.ethereum?.removeListener("accountsChanged", onAccounts);
            window.ethereum?.removeListener("chainChanged", onChain);
        };
    }, [disconnect]);

    return { address, signer, chainId, isConnected, isCorrectNetwork, isConnecting, error, connect, disconnect, switchNetwork };
}
