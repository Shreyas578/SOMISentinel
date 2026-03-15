/**
 * Somnia Testnet configuration and contract addresses.
 * Update CONTRACTS after running: cd contracts && npm run deploy
 */

export const SOMNIA_CHAIN = {
    chainId: 50312,
    chainIdHex: "0xC488",
    name: "Somnia Testnet",
    rpcUrl: "https://dream-rpc.somnia.network/",
    wsUrl: "wss://dream-rpc.somnia.network/ws",
    currency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
    blockExplorer: "https://shannon-explorer.somnia.network",
    faucet: "https://testnet.somnia.network/",
};

// ⬇️ Update these after running the deploy script
export const CONTRACTS = {
    mockToken: process.env.NEXT_PUBLIC_MOCK_TOKEN || "0x0000000000000000000000000000000000000000",
    lendingPool: process.env.NEXT_PUBLIC_LENDING_POOL || "0x0000000000000000000000000000000000000000",
    guardian: process.env.NEXT_PUBLIC_GUARDIAN || "0x0000000000000000000000000000000000000000",
};

export const REACTIVITY_SERVICE_WS = process.env.NEXT_PUBLIC_REACTIVITY_WS || "ws://localhost:3001";
