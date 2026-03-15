import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🔍 Checking Guardian authorization status...\n");

    const deploymentsPath = path.join(__dirname, "../deployments.json");
    if (!fs.existsSync(deploymentsPath)) {
        throw new Error("❌ deployments.json not found.");
    }

    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
    const { lendingPool: lendingPoolAddress, guardian: guardianAddress } = deployments.contracts;

    console.log("LendingPool Address:", lendingPoolAddress);
    console.log("Expected Guardian:  ", guardianAddress);

    const lendingPool = await ethers.getContractAt("LendingPool", lendingPoolAddress);
    const actualGuardian = await lendingPool.guardian();

    console.log("Actual Guardian:    ", actualGuardian);

    if (actualGuardian.toLowerCase() === guardianAddress.toLowerCase()) {
        console.log("\n✅ Guardian is CORRECTLY authorized!");
    } else if (actualGuardian === "0x0000000000000000000000000000000000000000") {
        console.log("\n❌ Guardian is NOT set (0x0).");
    } else {
        console.log("\n❌ Guardian is set to a DIFFERENT address.");
    }

    const owner = await lendingPool.owner();
    console.log("LendingPool Owner: ", owner);
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exitCode = 1;
});
