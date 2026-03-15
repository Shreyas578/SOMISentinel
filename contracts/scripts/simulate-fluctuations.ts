import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log("📈 Starting SOMI Sentinel Realistic Market Simulation...");
    console.log("   Simulating STEST volume, collateral deposits, and ratio fluctuations.\n");

    const deploymentsPath = path.join(__dirname, "../deployments.json");
    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
    const { lendingPool: lendingPoolAddress, guardian: guardianAddress, mockToken: tokenAddress } = deployments.contracts;

    const [signer] = await ethers.getSigners();
    console.log("📍 Signer:", signer.address);

    const token = await ethers.getContractAt("MockToken", tokenAddress, signer);
    const pool = await ethers.getContractAt("LendingPool", lendingPoolAddress, signer);
    const guardian = await ethers.getContractAt("Guardian", guardianAddress, signer);

    // Initial setup: ensure signer has STEST, allowance, and has deposited
    console.log("🛡️ Preparing simulation account (Massive Allowance + Balance)...");
    await (await token.mint(signer.address, ethers.parseEther("100000"))).wait();
    await (await token.approve(lendingPoolAddress, ethers.MaxUint256)).wait();
    await (await token.approve(guardianAddress, ethers.MaxUint256)).wait();

    let pos = await pool.getPosition(signer.address);
    if (!pos.isActive) {
        console.log("📦 Initializing position for simulation...");
        await (await pool.depositCollateral(ethers.parseEther("2000"))).wait();
        console.log("✅ Position initialized with 2000 STEST.");
    }

    let currentRatio = 200;
    console.log("🚀 Simulation LIVE. FULL RANGE (0-250) + AUTOMATED SCENARIOS. Press Ctrl+C to stop.\n");

    let counter = 0;

    while (true) {
        counter++;
        const rand = Math.random();

        try {
            // Every 8 iterations (~30-40s), trigger a high-impact automated scenario
            if (counter % 8 === 0) {
                const scenario = Math.floor(Math.random() * 4);
                console.log("\n🎬 AUTOMATED SCENARIO TRIGGERED:");

                if (scenario === 0) {
                    console.log("📉 Scenario: FLASH CRASH (Price Drop)...");
                    await (await guardian.simulatePriceDrop(40)).wait();
                    currentRatio = Math.floor(currentRatio * 0.6);
                } else if (scenario === 1) {
                    console.log("🐋 Scenario: WHALE EXIT (15K STEST)...");
                    const whaleAmount = ethers.parseEther("15000");
                    await (await token.mint(signer.address, whaleAmount)).wait();
                    await (await token.approve(guardianAddress, whaleAmount)).wait();
                    await (await guardian.triggerWhaleTransfer(whaleAmount)).wait();
                } else if (scenario === 2) {
                    console.log("🔥 Scenario: SYSTEMIC RISK (Liquidation Level)...");
                    await (await guardian.triggerLiquidationRisk(signer.address)).wait();
                    currentRatio = 110;
                } else {
                    console.log("✅ Scenario: RECOVERY (Restoring Health)...");
                    await (await guardian.restorePosition(signer.address)).wait();
                    currentRatio = 200;
                }
            } else {
                // Normal fluctuations (0-250 range)
                if (rand < 0.75) {
                    const change = Math.floor(Math.random() * 15) - 7; // -7 to +7 (Larger shifts)
                    let nextRatio = currentRatio + change;
                    nextRatio = Math.max(10, Math.min(250, nextRatio));

                    if (nextRatio !== currentRatio) {
                        console.log(`⚖️ Market Flux: ${currentRatio}% -> ${nextRatio}%`);
                        await (await pool.updateCollateralRatio(signer.address, nextRatio)).wait();
                        currentRatio = nextRatio;
                    }
                } else if (rand < 0.90) {
                    const amount = ethers.parseEther((100 + Math.random() * 400).toFixed(2));
                    const balance = await token.balanceOf(signer.address);
                    if (balance < amount) {
                        console.log("💎 Refilling STEST for simulation...");
                        await (await token.mint(signer.address, ethers.parseEther("100000"))).wait();
                    }
                    console.log(`📥 Market Buy: ${ethers.formatEther(amount)} STEST`);
                    await (await pool.depositCollateral(amount)).wait();
                } else {
                    const amount = ethers.parseEther((50 + Math.random() * 200).toFixed(2));
                    console.log(`💸 Market Sell: ${ethers.formatEther(amount)} STEST`);
                    await (await pool.withdrawCollateral(amount)).wait();
                }
            }
        } catch (e: any) {
            console.error("❌ Action failed:", e.message);
            if (e.message.includes("Not authorized")) {
                console.log("💡 Fix: npx hardhat run scripts/set-guardian.ts --network somnia");
                return;
            }
        }

        const wait = 3000 + Math.random() * 2000; // 3-5s updates
        console.log(`   ⏳ Rapid Syncing in ${Math.round(wait / 1000)}s...\n`);
        await sleep(wait);
    }
}

main().catch(console.error);
