// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockToken
 * @dev ERC20 token used as collateral in SOMI Sentinel.
 *      Emits WhaleTransfer for large movements.
 */
contract MockToken is ERC20, Ownable {
    // Threshold for whale detection: 10,000 tokens
    uint256 public constant WHALE_THRESHOLD = 10_000 * 1e18;

    event WhaleTransfer(address indexed from, address indexed to, uint256 amount);

    constructor() ERC20("SOMI Test Token", "STEST") Ownable(msg.sender) {
        // Mint 1,000,000 tokens to deployer
        _mint(msg.sender, 1_000_000 * 1e18);
    }

    /**
     * @dev Anyone can mint tokens for testing purposes.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Override transfer to detect whale movements.
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        super._update(from, to, value);

        // Emit WhaleTransfer for large transfers (not during mint/burn)
        if (from != address(0) && to != address(0) && value >= WHALE_THRESHOLD) {
            emit WhaleTransfer(from, to, value);
        }
    }
}
