import { ethers } from "ethers";

// Minimal ABIs — only functions used by the frontend
export const MOCK_TOKEN_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function mint(address to, uint256 amount)",
    "function decimals() view returns (uint8)",
    "event WhaleTransfer(address indexed from, address indexed to, uint256 amount)",
];

export const LENDING_POOL_ABI = [
    "function depositCollateral(uint256 amount)",
    "function withdrawCollateral(uint256 amount)",
    "function getPosition(address user) view returns (tuple(uint256 collateralAmount, uint256 collateralRatio, bool isActive))",
    "function guardian() view returns (address)",
    "event CollateralDeposited(address indexed user, uint256 amount)",
    "event CollateralRatioUpdated(address indexed user, uint256 ratio)",
];

export const GUARDIAN_ABI = [
    "function checkPosition(address user)",
    "function simulatePriceDrop(uint256 dropPercent)",
    "function triggerWhaleTransfer(uint256 amount)",
    "function triggerLiquidationRisk(address user)",
    "function restorePosition(address user)",
    "function getRiskLevel(address user) view returns (uint8)",
    "event PositionAtRisk(address indexed user)",
    "event GuardianAlert(address indexed user, string message, uint256 ratio)",
    "event PriceDropSimulated(uint256 dropPercent, uint256 timestamp)",
    "event LiquidationTriggered(address indexed user, uint256 ratio)",
];

export function getContracts(
    signer: ethers.Signer,
    addresses: { mockToken: string; lendingPool: string; guardian: string }
) {
    return {
        mockToken: new ethers.Contract(addresses.mockToken, MOCK_TOKEN_ABI, signer),
        lendingPool: new ethers.Contract(addresses.lendingPool, LENDING_POOL_ABI, signer),
        guardian: new ethers.Contract(addresses.guardian, GUARDIAN_ABI, signer),
    };
}
