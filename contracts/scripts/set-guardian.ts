import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🔧 Setting Guardian authorization in LendingPool...\n");

    const deploymentsPath = path.join(__dirname, "../deployments.json");
    if (!fs.existsSync(deploymentsPath)) {
        throw new Error("❌ deployments.json not found.");
    }

    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
    const { lendingPool: lendingPoolAddress, guardian: guardianAddress } = deployments.contracts;

    const [signer] = await ethers.getSigners();
    console.log("📍 Signer: ", signer.address);
    console.log("📍 Balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "STT");

    const lendingPool = await ethers.getContractAt("LendingPool", lendingPoolAddress, signer);

    const owner = await lendingPool.owner();
    console.log("📍 Owner:  ", owner);

    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.error("❌ Signer is NOT the owner of LendingPool!");
    }

    console.log("📍 Guardian:", guardianAddress);

    try {
        console.log("\n📝 Sending transaction to set Guardian...");
        const tx = await lendingPool.setGuardian(guardianAddress);
        console.log("✅ Transaction hash:", tx.hash);

        console.log("⏳ Waiting for confirmation...");
        await tx.wait();
        console.log("✨ Guardian authorized successfully!");
    } catch (e: any) {
        console.error("❌ Transaction failed!");
        console.error(e);
    }
}

main().catch(console.error);
