import { HardhatRuntimeEnvironment } from "hardhat/types"

module.exports = async ({
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("Deploying ABC Token")

    await deploy("ABCToken", {
        from: deployer,
        log: true,
        waitConfirmations: 1,
    })
}

module.exports.tags = ["all", "abc"]
