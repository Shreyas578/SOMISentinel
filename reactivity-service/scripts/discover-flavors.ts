import WebSocket from "ws";

const SOMNIA_WS_URL = "wss://dream-rpc.somnia.network/ws";

async function testSubscribe(flavor: string) {
    return new Promise((resolve) => {
        const ws = new WebSocket(SOMNIA_WS_URL);
        const timeout = setTimeout(() => {
            ws.terminate();
            resolve({ flavor, status: "timeout" });
        }, 5000);

        ws.on("open", () => {
            const msg = {
                jsonrpc: "2.0",
                id: 1,
                method: "eth_subscribe",
                params: [flavor, {}]
            };
            ws.send(JSON.stringify(msg));
        });

        ws.on("message", (data) => {
            const res = JSON.parse(data.toString());
            clearTimeout(timeout);
            ws.terminate();
            if (res.error) {
                resolve({ flavor, status: "error", code: res.error.code, message: res.error.message });
            } else {
                resolve({ flavor, status: "success", result: res.result });
            }
        });

        ws.on("error", (err) => {
            clearTimeout(timeout);
            resolve({ flavor, status: "ws_error", error: err.message });
        });
    });
}

async function run() {
    const flavors = [
        "RDS",
        "somnia_rds",
        "native_rds",
        "reactive_logs",
        "somnia_logs",
        "rds_logs",
        "logs", // baseline
        "newHeads" // baseline
    ];

    console.log("🔍 Starting eth_subscribe flavor discovery...");
    for (const f of flavors) {
        process.stdout.write(`Testing flavor ${f}... `);
        const result: any = await testSubscribe(f);
        if (result.status === "success") {
            console.log(`✅ FOUND! Subscription ID: ${result.result}`);
        } else if (result.status === "error") {
            console.log(`❌ ERROR: ${result.message} (${result.code})`);
        } else {
            console.log(`❌ ${result.status}`);
        }
    }
}

run().catch(console.error);
