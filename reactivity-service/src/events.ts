/**
 * SOMI Sentinel — Event Type Definitions
 * These mirror the Solidity events in Guardian.sol, LendingPool.sol, and MockToken.sol
 * Used by the Somnia Reactivity WebSocket listener.
 */

export type EventType =
    | "CollateralDeposited"
    | "CollateralRatioUpdated"
    | "PositionAtRisk"
    | "WhaleTransfer"
    | "GuardianAlert"
    | "PriceDropSimulated"
    | "LiquidationTriggered"
    | "CollateralWithdrawn"
    | "Connected"
    | "Error";

export interface BaseEvent {
    type: EventType;
    timestamp: number;
    txHash?: string;
    blockNumber?: number;
    contractAddress?: string;
}

export interface CollateralDepositedEvent extends BaseEvent {
    type: "CollateralDeposited";
    user: string;
    amount: string; // formatted ETH string
    amountRaw: string; // raw BigInt as string
}

export interface CollateralRatioUpdatedEvent extends BaseEvent {
    type: "CollateralRatioUpdated";
    user: string;
    ratio: number; // e.g. 200 = 200%
}

export interface PositionAtRiskEvent extends BaseEvent {
    type: "PositionAtRisk";
    user: string;
}

export interface WhaleTransferEvent extends BaseEvent {
    type: "WhaleTransfer";
    from: string;
    to: string;
    amount: string; // formatted
    amountRaw: string;
}

export interface GuardianAlertEvent extends BaseEvent {
    type: "GuardianAlert";
    user: string;
    message: string;
    ratio: number;
}

export interface PriceDropSimulatedEvent extends BaseEvent {
    type: "PriceDropSimulated";
    dropPercent: number;
    timestamp: number;
}

export interface LiquidationTriggeredEvent extends BaseEvent {
    type: "LiquidationTriggered";
    user: string;
    ratio: number;
}

export interface CollateralWithdrawnEvent extends BaseEvent {
    type: "CollateralWithdrawn";
    user: string;
    amount: string;
}

export interface ConnectedEvent extends BaseEvent {
    type: "Connected";
    message: string;
    chainId: number;
}

export type SentinelEvent =
    | CollateralDepositedEvent
    | CollateralRatioUpdatedEvent
    | PositionAtRiskEvent
    | WhaleTransferEvent
    | GuardianAlertEvent
    | PriceDropSimulatedEvent
    | LiquidationTriggeredEvent
    | CollateralWithdrawnEvent
    | ConnectedEvent;

// Contract ABIs — only the event fragments needed for log decoding
export const CONTRACT_ABIS = {
    MockToken: [
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event WhaleTransfer(address indexed from, address indexed to, uint256 amount)",
    ],
    LendingPool: [
        "event CollateralDeposited(address indexed user, uint256 amount)",
        "event CollateralRatioUpdated(address indexed user, uint256 ratio)",
        "event CollateralWithdrawn(address indexed user, uint256 amount)",
    ],
    Guardian: [
        "event PositionAtRisk(address indexed user)",
        "event WhaleTransfer(address indexed from, address indexed to, uint256 amount)",
        "event GuardianAlert(address indexed user, string message, uint256 ratio)",
        "event PriceDropSimulated(uint256 dropPercent, uint256 timestamp)",
        "event LiquidationTriggered(address indexed user, uint256 ratio)",
    ],
};
