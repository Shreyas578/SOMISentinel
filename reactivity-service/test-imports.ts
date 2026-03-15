import { createPublicClient, http, websocket, Address, Hex, defineChain } from "viem";
import { SDK as SomniaSDK } from "@somnia-chain/reactivity";
import { CONTRACT_ABIS, SentinelEvent } from "./src/events";

console.log("Imports successful!");
console.log("SomniaSDK:", SomniaSDK);
