import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Helper function to wait
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Deploy with retry logic
async function deployWithRetry<T>(
    name: string,
    deployFn: () => Promise<T>,
    maxRetries = 5
): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`   Attempt ${i + 1}/${maxRetries}...`);
            const result = await deployFn();
            return result;
        } catch (error: any) {
            if (error.message?.includes("mempool full") && i < maxRetries - 1) {
                const waitTime = (i + 1) * 15000; // 15s, 30s, 45s, 60s, 75s
                console.log(`   ⏳ Mempool full. Waiting ${waitTime / 1000}s before retry...`);
                await sleep(waitTime);
            } else {
                throw error;
            }
        }
    }
    throw new Error(`Failed to deploy ${name} after ${maxRetries} attempts`);
}

async function main() {
    console.log("🚀 Deploying SOMI Sentinel contracts to Somnia Testnet...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📍 Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "STT\n");

    if (balance === 0n) {
        throw new Error(
            "❌ Deployer has no STT balance! Get testnet tokens from the Somnia faucet at https://testnet.somnia.network/"
        );
    }

    // ── 1. Deploy MockToken ──
    console.log("1️⃣  Deploying MockToken...");
    const mockToken = await deployWithRetry("MockToken", async () => {
        const MockToken = await ethers.getContractFactory("MockToken");
        const contract = await MockToken.deploy();
        await contract.waitForDeployment();
        return contract;
    });
    const mockTokenAddress = await mockToken.getAddress();
    console.log("   ✅ MockToken deployed at:", mockTokenAddress);
    await sleep(3000); // Wait 3s between deployments

    // ── 2. Deploy LendingPool ──
    console.log("2️⃣  Deploying LendingPool...");
    const lendingPool = await deployWithRetry("LendingPool", async () => {
        const LendingPool = await ethers.getContractFactory("LendingPool");
        const contract = await LendingPool.deploy(mockTokenAddress);
        await contract.waitForDeployment();
        return contract;
    });
    const lendingPoolAddress = await lendingPool.getAddress();
    console.log("   ✅ LendingPool deployed at:", lendingPoolAddress);
    await sleep(3000);

    // ── 3. Deploy Guardian ──
    console.log("3️⃣  Deploying Guardian...");
    const guardian = await deployWithRetry("Guardian", async () => {
        const Guardian = await ethers.getContractFactory("Guardian");
        const contract = await Guardian.deploy(lendingPoolAddress, mockTokenAddress);
        await contract.waitForDeployment();
        return contract;
    });
    const guardianAddress = await guardian.getAddress();
    console.log("   ✅ Guardian deployed at:", guardianAddress);

    // ── 4. Configure Guardian authorization ──
    console.log("\n4️⃣  Configuring contract permissions...");
    console.log("   Setting Guardian address in LendingPool...");
    const setGuardianTx = await lendingPool.setGuardian(guardianAddress);
    await setGuardianTx.wait();
    console.log("   ✅ Guardian authorized to update collateral ratios");

    // ── 5. Save addresses to JSON ──
    const addresses = {
        network: "somnia-testnet",
        chainId: 50312,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            mockToken: mockTokenAddress,
            lendingPool: lendingPoolAddress,
            guardian: guardianAddress,
        },
    };

    const outputPath = path.join(__dirname, "../deployments.json");
    fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));

    // ── 6. Update .env files automatically ──
    console.log("\n6️⃣  Updating configuration files...");
    
    // Update reactivity-service/.env
    const reactivityEnvPath = path.join(__dirname, "../../reactivity-service/.env");
    const reactivityEnv = `# Somnia Testnet WebSocket (Somnia Reactivity endpoint)
SOMNIA_WS_URL=wss://dream-rpc.somnia.network/ws

# Deployed contract addresses
MOCK_TOKEN_ADDRESS=${mockTokenAddress}
LENDING_POOL_ADDRESS=${lendingPoolAddress}
GUARDIAN_ADDRESS=${guardianAddress}

# HTTP port for the reactivity service
PORT=3001
`;
    fs.writeFileSync(reactivityEnvPath, reactivityEnv);
    console.log("   ✅ Updated reactivity-service/.env");

    // Update frontend/.env.local
    const frontendEnvPath = path.join(__dirname, "../../frontend/.env.local");
    const frontendEnv = `# Deployed contract addresses on Somnia Testnet
NEXT_PUBLIC_MOCK_TOKEN=${mockTokenAddress}
NEXT_PUBLIC_LENDING_POOL=${lendingPoolAddress}
NEXT_PUBLIC_GUARDIAN=${guardianAddress}

# Reactivity service WebSocket
NEXT_PUBLIC_REACTIVITY_WS=ws://localhost:3001
`;
    fs.writeFileSync(frontendEnvPath, frontendEnv);
    console.log("   ✅ Updated frontend/.env.local");

    console.log("\n✨ All contracts deployed successfully!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Contract Addresses:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("MockToken:   ", mockTokenAddress);
    console.log("LendingPool: ", lendingPoolAddress);
    console.log("Guardian:    ", guardianAddress);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📄 Addresses saved to deployments.json");
    console.log(
        "\n🔗 Verify on explorer: https://shannon-explorer.somnia.network/address/" +
        guardianAddress
    );
    console.log(
        "\n⚡ Next: Update frontend/src/lib/contracts.ts with these addresses"
    );
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});
