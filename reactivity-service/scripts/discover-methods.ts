import WebSocket from "ws";

const SOMNIA_WS_URL = "wss://dream-rpc.somnia.network/ws";

async function testMethod(method: string) {
    return new Promise((resolve) => {
        const ws = new WebSocket(SOMNIA_WS_URL);
        const timeout = setTimeout(() => {
            ws.terminate();
            resolve({ method, status: "timeout" });
        }, 5000);

        ws.on("open", () => {
            const msg = {
                jsonrpc: "2.0",
                id: Math.floor(Math.random() * 1000),
                method: method,
                params: ["RDS", {}]
            };
            ws.send(JSON.stringify(msg));
        });

        ws.on("message", (data) => {
            const res = JSON.parse(data.toString());
            clearTimeout(timeout);
            ws.terminate();
            if (res.error && res.error.code === -32601) {
                resolve({ method, status: "not_found" });
            } else {
                resolve({ method, status: "success", response: res });
            }
        });

        ws.on("error", (err) => {
            clearTimeout(timeout);
            resolve({ method, status: "error", error: err.message });
        });
    });
}

async function run() {
    const methods = [
        "somnia_subscribe",
        "somnia_subscribeRDS",
        "somnia_subscribe_rds",
        "somnia_rds_subscribe",
        "rds_subscribe",
        "reactivity_subscribe",
        "somnia_reactive_subscribe",
        "somnia_subscribe_native",
        "somnia_native_subscribe"
    ];

    console.log("🔍 Starting method discovery...");
    for (const m of methods) {
        process.stdout.write(`Testing ${m}... `);
        const result: any = await testMethod(m);
        console.log(result.status === "success" ? "✅ FOUND!" : "❌");
        if (result.status === "success") {
            console.log("Response:", JSON.stringify(result.response, null, 2));
        }
    }
}

run().catch(console.error);
