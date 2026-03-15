/**
 * SOMI Sentinel — Reactivity Service
 * ====================================
 * This service implements Somnia Reactivity:
 * - Connects to the Somnia node via native WebSocket (wss://)
 * - Subscribes to smart contract event logs using Somnia Native Reactivity (somnia_subscribe)
 * - NO RPC POLLING, NO eth_subscribe LEGACY OVERHEAD
 * - Decodes ABI-encoded events using ethers.js
 * - Broadcasts decoded events to the frontend via a local WebSocket server
 *
 * This is the core of Somnia Reactivity: events are pushed directly
 * from the blockchain via Reactive Data Streams (RDS) in the same
 * atomic notification, including both the event and the state.
 */

import * as dotenv from "dotenv";
dotenv.config();

import WebSocket from "ws";
import * as http from "http";
import express from "express";
import cors from "cors";
import { ethers } from "ethers";
import { createPublicClient, http as viemHttp, webSocket as viemWs, Address, Hex } from "viem";
import { defineChain } from "viem/utils";
import { SDK as SomniaSDK } from "@somnia-chain/reactivity";
import { CONTRACT_ABIS, SentinelEvent } from "./events";

// ── Configuration ────────────────────────────────────────────────────────────

const SOMNIA_WS_URL =
    process.env.SOMNIA_WS_URL || "wss://dream-rpc.somnia.network/ws";
const SOMNIA_RPC_URL = 
    process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network/";
const SERVICE_PORT = parseInt(process.env.PORT || "3001");

// Contract addresses — updated after deployment
const CONTRACT_ADDRESSES = {
    mockToken: process.env.MOCK_TOKEN_ADDRESS || "",
    lendingPool: process.env.LENDING_POOL_ADDRESS || "",
    guardian: process.env.GUARDIAN_ADDRESS || "",
};

// ── ABI Interfaces for decoding ──────────────────────────────────────────────

const interfaces: Record<string, ethers.Interface> = {
    mockToken: new ethers.Interface(CONTRACT_ABIS.MockToken),
    lendingPool: new ethers.Interface(CONTRACT_ABIS.LendingPool),
    guardian: new ethers.Interface(CONTRACT_ABIS.Guardian),
};

// Build a map from contract address → interface name for fast lookup
const addressToInterface: Record<string, [ethers.Interface, string]> = {};

function buildAddressMap() {
    console.log("\n🛠️  BUILDING ADDRESS MAP");
    const found = {
        mockToken: !!CONTRACT_ADDRESSES.mockToken,
        lendingPool: !!CONTRACT_ADDRESSES.lendingPool,
        guardian: !!CONTRACT_ADDRESSES.guardian,
    };
    
    console.log("   ↳ Environment variables found:", found);

    if (CONTRACT_ADDRESSES.mockToken) {
        console.log(`   ↳ Mapping MockToken: ${CONTRACT_ADDRESSES.mockToken}`);
        addressToInterface[CONTRACT_ADDRESSES.mockToken.toLowerCase()] = [
            interfaces.mockToken,
            "mockToken",
        ];
    }
    if (CONTRACT_ADDRESSES.lendingPool) {
        console.log(`   ↳ Mapping LendingPool: ${CONTRACT_ADDRESSES.lendingPool}`);
        addressToInterface[CONTRACT_ADDRESSES.lendingPool.toLowerCase()] = [
            interfaces.lendingPool,
            "lendingPool",
        ];
    }
    if (CONTRACT_ADDRESSES.guardian) {
        console.log(`   ↳ Mapping Guardian: ${CONTRACT_ADDRESSES.guardian}`);
        addressToInterface[CONTRACT_ADDRESSES.guardian.toLowerCase()] = [
            interfaces.guardian,
            "guardian",
        ];
    }
    
    if (!found.mockToken && !found.lendingPool && !found.guardian) {
        console.error("❌ CRITICAL: No contract addresses found! Check reactivity-service/.env");
    }
}

// ── Frontend WebSocket Server ─────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const frontendWss = new WebSocket.Server({ server });

const frontendClients = new Set<WebSocket>();

frontendWss.on("connection", (ws) => {
    console.log("🖥️  Frontend client connected");
    frontendClients.add(ws);

    // Send welcome event
    const welcome: SentinelEvent = {
        type: "Connected",
        timestamp: Date.now(),
        message: "Connected to SOMI Sentinel Reactivity Service",
        chainId: 50312,
    };
    ws.send(JSON.stringify(welcome));

    ws.on("close", () => {
        console.log("🖥️  Frontend client disconnected");
        frontendClients.delete(ws);
    });
});

function broadcastToFrontend(event: SentinelEvent) {
    const message = JSON.stringify(event);
    frontendClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// HTTP health check endpoint
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "SOMI Sentinel Reactivity Service",
        connectedClients: frontendClients.size,
        contracts: CONTRACT_ADDRESSES,
        somniaWs: SOMNIA_WS_URL,
    });
});

app.get("/contracts", (_req, res) => {
    res.json(CONTRACT_ADDRESSES);
});

// ── Event Decoding ───────────────────────────────────────────────────────────

function decodeLog(log: {
    address: string;
    topics: string[];
    data: string;
    transactionHash?: string;
    blockNumber?: string;
}): SentinelEvent | null {
    const contractAddress = log.address.toLowerCase();
    const entry = addressToInterface[contractAddress];
    if (!entry) {
        console.warn(`⚠️  No interface found for address: ${contractAddress}`);
        return null;
    }

    const [iface] = entry;
    try {
        const description = iface.parseLog({
            topics: log.topics,
            data: log.data,
        });

        if (!description) return null;

        const txHash = log.transactionHash;
        const blockNumber = log.blockNumber
            ? parseInt(log.blockNumber, 16)
            : undefined;
        const timestamp = Date.now();
        const contractAddr = log.address;

        switch (description.name) {
            case "CollateralDeposited":
                return {
                    type: "CollateralDeposited",
                    timestamp,
                    txHash,
                    blockNumber,
                    contractAddress: contractAddr,
                    user: description.args[0] as string,
                    amount: ethers.formatEther(description.args[1] as bigint),
                    amountRaw: (description.args[1] as bigint).toString(),
                };

            case "CollateralRatioUpdated":
                return {
                    type: "CollateralRatioUpdated",
                    timestamp,
                    txHash,
                    blockNumber,
                    contractAddress: contractAddr,
                    user: description.args[0] as string,
                    ratio: Number(description.args[1] as bigint),
                };

            case "CollateralWithdrawn":
                return {
                    type: "CollateralWithdrawn",
                    timestamp,
                    txHash,
                    blockNumber,
                    contractAddress: contractAddr,
                    user: description.args[0] as string,
                    amount: ethers.formatEther(description.args[1] as bigint),
                };

            case "PositionAtRisk":
                return {
                    type: "PositionAtRisk",
                    timestamp,
                    txHash,
                    blockNumber,
                    contractAddress: contractAddr,
                    user: description.args[0] as string,
                };

            case "WhaleTransfer":
                return {
                    type: "WhaleTransfer",
                    timestamp,
                    txHash,
                    blockNumber,
                    contractAddress: contractAddr,
                    from: description.args[0] as string,
                    to: description.args[1] as string,
                    amount: ethers.formatEther(description.args[2] as bigint),
                    amountRaw: (description.args[2] as bigint).toString(),
                };

            case "GuardianAlert":
                return {
                    type: "GuardianAlert",
                    timestamp,
                    txHash,
                    blockNumber,
                    contractAddress: contractAddr,
                    user: description.args[0] as string,
                    message: description.args[1] as string,
                    ratio: Number(description.args[2] as bigint),
                };

            case "PriceDropSimulated":
                return {
                    type: "PriceDropSimulated",
                    timestamp,
                    txHash,
                    blockNumber,
                    contractAddress: contractAddr,
                    dropPercent: Number(description.args[0] as bigint),
                };

            case "LiquidationTriggered":
                return {
                    type: "LiquidationTriggered",
                    timestamp,
                    txHash,
                    blockNumber,
                    contractAddress: contractAddr,
                    user: description.args[0] as string,
                    ratio: Number(description.args[1] as bigint),
                };

            default:
                return null;
        }
    } catch (err) {
        console.error(`❌ Decoding error for ${contractAddress}:`, err);
        return null;
    }
}

// ── Somnia Reactivity — SDK Integration ──────────────────────────────────────

let somniaSdk: SomniaSDK | null = null;

const somniaChain = defineChain({
    id: 50312,
    name: "Somnia Testnet",
    nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
    rpcUrls: {
        default: {
            http: [SOMNIA_RPC_URL],
            webSocket: [SOMNIA_WS_URL],
        },
        public: {
            http: [SOMNIA_RPC_URL],
            webSocket: [SOMNIA_WS_URL],
        },
    },
});

function connectToSomnia() {
    console.log(`\n⚡ SOMNIA REACTIVITY: Initializing SDK with ${SOMNIA_WS_URL}...`);
    
    try {
        const viemClient = createPublicClient({
            chain: somniaChain,
            transport: viemWs(SOMNIA_WS_URL),
        });

        somniaSdk = new SomniaSDK({ public: viemClient as any });

        const addresses = Object.values(CONTRACT_ADDRESSES)
            .filter(Boolean) as Address[];

        console.log("📡 Subscribing to events for addresses:", addresses);

        somniaSdk.subscribe({
            ethCalls: [], // We don't need additional state for now
            eventContractSources: addresses,
            onData: (data: any) => {
                // The SDK returns raw data in the data field
                // Based on types, it might be { result: { topics, data, address? } }
                // or similar. We log it first to be sure, but attempt decoding.
                
                // console.log("📥 SDK Event Received:", JSON.stringify(data, null, 2));

                const log = data.result || data;
                
                // Ensure we have address, topics, and data for decodeLog
                if (log.topics && log.data) {
                    const blockNum = log.blockNumber ? (typeof log.blockNumber === 'string' ? parseInt(log.blockNumber, 16) : Number(log.blockNumber)) : "unknown";
                    
                    // If SDK doesn't provide address in the result, we might need it for decoding lookup
                    // However, usually it's in the log result.
                    const address = log.address || log.emitter; // emitter is sometimes used in SDK types

                    if (!address && addresses.length === 1) {
                        // Fallback if only one address is watched
                        log.address = addresses[0];
                    } else if (!address) {
                        // console.warn("⚠️ Event received without address, skip decoding");
                        return;
                    } else {
                        log.address = address;
                    }

                    const decoded = decodeLog(log);
                    if (decoded) {
                        console.log(`📥 SDK Event: ${decoded.type} from ${log.address} (block ${blockNum})`);
                        broadcastToFrontend(decoded);
                    }
                }
            },
            onError: (err: Error) => {
                console.error("❌ Somnia SDK Error:", err.message);
                console.log("   Attempting to reconnect in 5 seconds...");
                setTimeout(() => connectToSomnia(), 5000);
            }
        }).then(res => {
            if (res instanceof Error) {
                console.error("❌ SDK Subscription failed:", res.message);
                setTimeout(() => connectToSomnia(), 5000);
            } else {
                console.log(`✅ SDK Subscription Active. ID: ${res.subscriptionId}`);
                console.log("🔴 LIVE: listening for real-time blockchain events via SDK...\n");
            }
        }).catch(err => {
            console.error("❌ SDK Fatal Error:", err);
            setTimeout(() => connectToSomnia(), 5000);
        });

    } catch (err) {
        console.error("❌ SDK Initialization Error:", err);
        setTimeout(() => connectToSomnia(), 5000);
    }
}

// ── HTTP Test Endpoint (for demo without deployed contracts) ──────────────────

app.post("/simulate", (req, res) => {
    const { type, data } = req.body as { type: string; data: Record<string, unknown> };

    const syntheticEvent: SentinelEvent = {
        type: type as SentinelEvent["type"],
        timestamp: Date.now(),
        ...data,
    } as SentinelEvent;

    broadcastToFrontend(syntheticEvent);
    console.log(`🧪 Simulated event: ${type}`);
    res.json({ success: true, event: syntheticEvent });
});

// ── Start Services ────────────────────────────────────────────────────────────

async function main() {
    buildAddressMap();

    server.listen(SERVICE_PORT, () => {
        console.log("\n╔══════════════════════════════════════════════════╗");
        console.log("║     SOMI Sentinel — Reactivity Service v1.0     ║");
        console.log("╠══════════════════════════════════════════════════╣");
        console.log(`║  HTTP/WS Server: http://localhost:${SERVICE_PORT}          ║`);
        console.log(`║  Health check:   http://localhost:${SERVICE_PORT}/health   ║`);
        console.log("╠══════════════════════════════════════════════════╣");
        console.log("║  Contract Addresses:                             ║");
        console.log(`║  MockToken:   ${(CONTRACT_ADDRESSES.mockToken || "not set").substring(0, 20)}...    ║`);
        console.log(`║  LendingPool: ${(CONTRACT_ADDRESSES.lendingPool || "not set").substring(0, 20)}...    ║`);
        console.log(`║  Guardian:    ${(CONTRACT_ADDRESSES.guardian || "not set").substring(0, 20)}...    ║`);
        console.log("╚══════════════════════════════════════════════════╝\n");
    });

    // Connect to Somnia via WebSocket (Somnia Reactivity)
    connectToSomnia();
}

main().catch(console.error);

// Cleanup on exit
process.on("SIGTERM", () => {
    // If we had a reconnect timer or SDK instance, clean them up here.
    // somniaSdk.unsubscribe() is not available on the SDK instance directly, 
    // but the resulting object from subscribe() has it.
    // For now, terminate is enough.
    server.close();
    process.exit(0);
});
