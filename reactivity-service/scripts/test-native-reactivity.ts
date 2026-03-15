import WebSocket from "ws";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from the parent directory
dotenv.config({ path: path.join(__dirname, "../.env") });

const SOMNIA_WS_URL = process.env.SOMNIA_WS_URL || "wss://dream-rpc.somnia.network/ws";

console.log(`Connecting to ${SOMNIA_WS_URL}...`);

const ws = new WebSocket(SOMNIA_WS_URL);

ws.on("open", () => {
    console.log("✅ WebSocket opened");

    const subscribeMessage = {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_subscribe",
        params: [
            "RDS",
            {
                eventFilter: {
                    address: undefined, // Listen to all for testing
                },
            },
        ],
    };

    console.log("Sending somnia_subscribe message...");
    ws.send(JSON.stringify(subscribeMessage));
});

ws.on("message", (data) => {
    const message = JSON.parse(data.toString());
    console.log("Received message:", JSON.stringify(message, null, 2));

    if (message.id === 1 && message.result) {
        console.log(`✅ Subscription successful! ID: ${message.result}`);
        console.log("Waiting 5 seconds for events, then closing...");
        setTimeout(() => {
            console.log("Closing connection.");
            ws.close();
            process.exit(0);
        }, 5000);
    }

    if (message.method === "somnia_subscription") {
        console.log("🔥 RECEIVED NATIVE RDS EVENT!");
    }
});

ws.on("error", (err) => {
    console.error("❌ WebSocket error:", err.message);
    process.exit(1);
});

ws.on("close", () => {
    console.log("🔌 Connection closed");
});

// Timeout after 15 seconds if nothing happens
setTimeout(() => {
    console.error("❌ Test timed out.");
    process.exit(1);
}, 15000);
