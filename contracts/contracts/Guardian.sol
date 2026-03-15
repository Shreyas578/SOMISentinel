// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./LendingPool.sol";
import "./MockToken.sol";

/**
 * @title Guardian
 * @dev Monitors collateral ratios from LendingPool and emits risk alerts.
 *      Demo functions simulate price drops and whale transfers for the hackathon.
 *
 *      Somnia Reactivity subscribes to all events emitted by this contract
 *      and pushes them instantly to the frontend — no polling required.
 */
contract Guardian {
    LendingPool public immutable lendingPool;
    MockToken public immutable token;

    // Risk thresholds
    uint256 public constant DANGER_RATIO = 130;   // Below this = PositionAtRisk
    uint256 public constant WARNING_RATIO = 150;  // Below this = warning zone

    // ── Events (Somnia Reactivity subscribes to these) ──
    event PositionAtRisk(address indexed user);
    event WhaleTransfer(address indexed from, address indexed to, uint256 amount);
    event GuardianAlert(address indexed user, string message, uint256 ratio);
    event PriceDropSimulated(uint256 dropPercent, uint256 timestamp);
    event LiquidationTriggered(address indexed user, uint256 ratio);

    constructor(address _lendingPool, address _token) {
        lendingPool = LendingPool(_lendingPool);
        token = MockToken(_token);
    }

    /**
     * @dev Check if a user's position is at risk.
     *      Called externally or by automation.
     */
    function checkPosition(address user) external {
        LendingPool.Position memory pos = lendingPool.getPosition(user);
        require(pos.isActive, "No active position");

        if (pos.collateralRatio < DANGER_RATIO) {
            emit PositionAtRisk(user);
            emit GuardianAlert(
                user,
                "CRITICAL: Position below liquidation threshold",
                pos.collateralRatio
            );
        } else if (pos.collateralRatio < WARNING_RATIO) {
            emit GuardianAlert(
                user,
                "WARNING: Position approaching liquidation",
                pos.collateralRatio
            );
        }
    }

    /**
     * @dev DEMO: Simulate a price drop event.
     *      Drops the caller's collateral ratio and emits risk events.
     *      This is the core demo function for the hackathon.
     */
    function simulatePriceDrop(uint256 dropPercent) external {
        require(dropPercent > 0 && dropPercent <= 90, "Invalid drop percent");

        LendingPool.Position memory pos = lendingPool.getPosition(msg.sender);
        require(pos.isActive, "No active position to drop");

        // Calculate new ratio after price drop
        uint256 currentRatio = pos.collateralRatio;
        uint256 newRatio = currentRatio - (currentRatio * dropPercent / 100);

        // Update ratio in LendingPool (this emits CollateralRatioUpdated)
        lendingPool.updateCollateralRatio(msg.sender, newRatio);

        // Emit price drop event
        emit PriceDropSimulated(dropPercent, block.timestamp);

        // Check if position is now at risk
        if (newRatio < DANGER_RATIO) {
            emit PositionAtRisk(msg.sender);
            emit GuardianAlert(
                msg.sender,
                "CRITICAL: Liquidation risk after price drop",
                newRatio
            );
        } else if (newRatio < WARNING_RATIO) {
            emit GuardianAlert(
                msg.sender,
                "WARNING: Price drop moved position to warning zone",
                newRatio
            );
        }
    }

    /**
     * @dev DEMO: Trigger a whale transfer simulation.
     *      Transfers a whale-sized amount of tokens from caller to this contract.
     *      The MockToken contract will emit WhaleTransfer automatically.
     */
    function triggerWhaleTransfer(uint256 amount) external {
        require(amount >= 10_000 * 1e18, "Must be whale-sized (>= 10,000 tokens)");
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        // Also emit from Guardian for Somnia Reactivity subscription
        emit WhaleTransfer(msg.sender, address(this), amount);
    }

    /**
     * @dev DEMO: Trigger liquidation risk scenario for a user.
     *      Sets ratio to critically low level.
     */
    function triggerLiquidationRisk(address user) external {
        LendingPool.Position memory pos = lendingPool.getPosition(user);
        require(pos.isActive, "No active position");

        uint256 criticalRatio = 110; // Well below liquidation threshold
        lendingPool.updateCollateralRatio(user, criticalRatio);

        emit LiquidationTriggered(user, criticalRatio);
        emit PositionAtRisk(user);
        emit GuardianAlert(user, "LIQUIDATION RISK: Immediate action required", criticalRatio);
    }

    /**
     * @dev DEMO: Restore position to healthy state (for repeated demos).
     */
    function restorePosition(address user) external {
        lendingPool.updateCollateralRatio(user, 200);
        emit GuardianAlert(user, "Position restored to healthy state", 200);
    }

    /**
     * @dev Get current risk level for a user.
     *      Returns: 0 = Safe, 1 = Warning, 2 = Critical
     */
    function getRiskLevel(address user) external view returns (uint8) {
        LendingPool.Position memory pos = lendingPool.getPosition(user);
        if (!pos.isActive) return 0;
        if (pos.collateralRatio < DANGER_RATIO) return 2;
        if (pos.collateralRatio < WARNING_RATIO) return 1;
        return 0;
    }
}
