import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "hardhat-deploy"
import "dotenv/config"

const GANACHE_ACCOUNTS = [
    process.env.GANACHE_PK0 || "",
    process.env.GANACHE_PK1 || "",
    process.env.GANACHE_PK2 || "",
    process.env.GANACHE_PK3 || "",
]

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
        ganache: {
            url: "http://127.0.0.1:7546",
            chainId: 1337,
            accounts: GANACHE_ACCOUNTS,
        },
        // rinkeby: {},
    },
    solidity: {
        compilers: [
            {
                version: "0.8.9",
            },
            {
                version: "0.7.6",
            },
        ],
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        holder: {
            default: 1,
        },
        recipient: {
            default: 2,
        },
        operator: {
            default: 3,
        },
    },
    gasReporter: {
        enabled: false,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
    },
}

export default config
