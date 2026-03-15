import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    somnia: {
      url: "https://dream-rpc.somnia.network/",
      chainId: 50312,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      timeout: 120000,      // 120 second timeout
    },
    somniaAlt: {
      url: "https://dream-rpc.somnia.network/",
      chainId: 50312,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      timeout: 120000,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
