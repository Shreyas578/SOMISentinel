// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LendingPool
 * @dev Tracks user collateral deposits and ratios.
 *      Emits reactive events consumed by SOMI Sentinel guardian.
 */
contract LendingPool is Ownable, ReentrancyGuard {
    IERC20 public immutable collateralToken;
    address public guardian; // Guardian contract address

    // Baseline collateral ratio (200 = 200%, healthy)
    uint256 public constant HEALTHY_RATIO = 200;
    // Liquidation threshold (120 = 120%)
    uint256 public constant LIQUIDATION_RATIO = 120;

    struct Position {
        uint256 collateralAmount;
        uint256 collateralRatio; // expressed as percentage (e.g. 200 = 200%)
        bool isActive;
    }

    mapping(address => Position) public positions;
    address[] public depositors;

    // ── Events (Somnia Reactivity subscribes to these) ──
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralRatioUpdated(address indexed user, uint256 ratio);
    event CollateralWithdrawn(address indexed user, uint256 amount);

    constructor(address _collateralToken) Ownable(msg.sender) {
        collateralToken = IERC20(_collateralToken);
    }

    /**
     * @dev Deposit collateral tokens into the pool.
     */
    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(
            collateralToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        Position storage pos = positions[msg.sender];

        if (!pos.isActive) {
            depositors.push(msg.sender);
            pos.isActive = true;
        }

        pos.collateralAmount += amount;
        pos.collateralRatio = HEALTHY_RATIO; // Start healthy

        emit CollateralDeposited(msg.sender, amount);
        emit CollateralRatioUpdated(msg.sender, pos.collateralRatio);
    }

    /**
     * @dev Update collateral ratio for a user (called by Guardian or owner).
     */
    function updateCollateralRatio(address user, uint256 newRatio) external {
        require(
            msg.sender == owner() || msg.sender == user || msg.sender == guardian,
            "Not authorized"
        );
        positions[user].collateralRatio = newRatio;
        emit CollateralRatioUpdated(user, newRatio);
    }

    /**
     * @dev Set the Guardian contract address (only owner).
     */
    function setGuardian(address _guardian) external onlyOwner {
        guardian = _guardian;
    }

    /**
     * @dev Withdraw collateral.
     */
    function withdrawCollateral(uint256 amount) external nonReentrant {
        Position storage pos = positions[msg.sender];
        require(pos.collateralAmount >= amount, "Insufficient collateral");

        pos.collateralAmount -= amount;
        if (pos.collateralAmount == 0) {
            pos.isActive = false;
        }

        require(
            collateralToken.transfer(msg.sender, amount),
            "Transfer failed"
        );

        emit CollateralWithdrawn(msg.sender, amount);
    }

    /**
     * @dev View position of a user.
     */
    function getPosition(address user) external view returns (Position memory) {
        return positions[user];
    }

    /**
     * @dev Get number of active depositors.
     */
    function getDepositorCount() external view returns (uint256) {
        return depositors.length;
    }
}
