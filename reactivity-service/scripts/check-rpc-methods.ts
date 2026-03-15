async function checkMethods() {
    const response = await fetch("https://dream-rpc.somnia.network/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "rpc_modules",
            params: [],
            id: 1
        })
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

checkMethods();
