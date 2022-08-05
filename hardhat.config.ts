import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "hardhat-deploy"
import "dotenv/config"

const GANACHE_ACCOUNTS = [
    process.env.GANACHE_PK0 || "<GANACHE PRIVATE KEY 0>",
    process.env.GANACHE_PK1 || "<GANACHE PRIVATE KEY 1>",
    process.env.GANACHE_PK2 || "<GANACHE PRIVATE KEY 2>",
    process.env.GANACHE_PK3 || "<GANACHE PRIVATE KEY 3>",
]

const RINKEBY_RPC_URL =
    process.env.RINKEBY_RPC_URL ||
    "https://eth-rinkeby.alchemyapi.io/v2/<API KEY>"

const RINKEBY_API_KEY =
    process.env.RINKEBY_API_KEY || "<API KEY>"

const RINKEBY_ACCOUNTS = [
    process.env.RINKEBY_PK0 || "<RINKEBY PRIVATE KEY 0>",
    process.env.RINKEBY_PK1 || "<RINKEBY PRIVATE KEY 1>",
    // process.env.RINKEBY_PK2 || "<RINKEBY PRIVATE KEY 2>",
    // process.env.RINKEBY_PK3 || "<RINKEBY PRIVATE KEY 3>",
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
        rinkeby: {
            url: RINKEBY_RPC_URL,
            chainId: 4,
            accounts: RINKEBY_ACCOUNTS,
        },
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
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
    },
    etherscan: {
        apiKey: {
            rinkeby: "vwqC-3v_RZAtCxEVK2FCwSpki-orGnxg",
        },
    },
}

export default config
