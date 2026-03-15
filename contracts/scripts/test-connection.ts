import { ethers } from "hardhat";

async function main() {
    console.log("Testing connection...");
    try {
        const [signer] = await ethers.getSigners();
        console.log("Signer address:", signer.address);
        const balance = await ethers.provider.getBalance(signer.address);
        console.log("Balance:", ethers.formatEther(balance), "STT");

        const network = await ethers.provider.getNetwork();
        console.log("Network:", network.name, "ChainId:", network.chainId.toString());
    } catch (error: any) {
        console.error("Test failed!");
        console.error(error);
    }
}

main().catch(console.error);
