import "mocha"
import { expect, assert } from "chai"
import {
    deployments,
    ethers,
    getNamedAccounts,
} from "hardhat"
import {
    parseEther,
    formatEther,
    formatBytes32String,
    formatUnits,
} from "ethers/lib/utils"
import { it } from "mocha"
import { ABCToken } from "../../typechain-types"

const ADDRESS_ZERO: string = ethers.constants.AddressZero

describe("ABCToken unit test", async () => {
    let abcToken: ABCToken
    let abcToken2: ABCToken
    let deployer: string
    let operator: string
    let recipient: string

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        operator = (await getNamedAccounts()).operator
        recipient = (await getNamedAccounts()).recipient

        await deployments.fixture(["all"])

        abcToken = await ethers.getContract(
            "ABCToken",
            deployer
        )
        abcToken2 = await ethers.getContract(
            "ABCToken",
            operator
        )
    })

    describe("constructor", async () => {
        it("Initialize the deployer with quite a token and a correct total supply", async () => {
            const balanceOf = formatEther(
                await abcToken.balanceOf(deployer)
            )
            const balanceOf2 = formatEther(
                await abcToken.balanceOf(operator)
            )
            const totalSupply = formatEther(
                await abcToken.totalSupply()
            )
            assert.equal(balanceOf, "101.0")
            assert.equal(balanceOf2, "0.0")
            assert.equal(totalSupply, "101.0")
        })
    })

    describe("name, symbol, granularity, defaultOperator", async () => {
        it("Return the correct name and symbol", async () => {
            assert.equal(await abcToken.name(), "Alphabet")
            assert.equal(await abcToken.symbol(), "ABC")
            assert.equal(
                formatUnits(
                    await abcToken.granularity(),
                    "wei"
                ),
                "1"
            )
            assert.equal(
                formatUnits(
                    await abcToken.decimals(),
                    "wei"
                ),
                "18"
            )
            assert.equal(
                (await abcToken.defaultOperators()).length,
                0
            )
        })
    })

    describe("authorizeOperator", async () => {
        it("Revert when you try to authorize yourself", async () => {
            await expect(
                abcToken.authorizeOperator(deployer)
            ).to.be.revertedWithCustomError(
                abcToken,
                "ABCToken__SameHolderAndOperator"
            )
        })

        it("Emit signal when authorize operator", async () => {
            await expect(
                abcToken.authorizeOperator(operator)
            )
                .to.emit(abcToken, "AuthorizedOperator")
                .withArgs(operator, deployer)
        })
    })

    describe("revokeOperator", () => {
        it("Revert when you try to revoke yourself", async () => {
            await expect(
                abcToken.revokeOperator(deployer)
            ).to.be.revertedWithCustomError(
                abcToken,
                "ABCToken__SameHolderAndOperator"
            )
        })

        it("Emit signal when authorize operator", async () => {
            await expect(
                abcToken.authorizeOperator(operator)
            )
                .to.emit(abcToken, "AuthorizedOperator")
                .withArgs(operator, deployer)
        })
    })

    describe("isOperatorFor", () => {
        it("Return correctly when call it yourself", async () => {
            assert(
                await abcToken.isOperatorFor(
                    deployer,
                    deployer
                ),
                "true"
            )
        })
        it("Return correctly when hasnt authorize", async () => {
            assert(
                abcToken.isOperatorFor(operator, deployer),
                "false"
            )
        })

        it("Return correctly when has authorize", async () => {
            await abcToken.authorizeOperator(operator)
            assert(
                abcToken.isOperatorFor(operator, deployer),
                "true"
            )
        })

        it("Return correctly when authorization has been revoked", async () => {
            await abcToken.authorizeOperator(operator)
            await abcToken.revokeOperator(operator)
            assert(
                abcToken.isOperatorFor(operator, deployer),
                "false"
            )
        })
    })

    describe("send", () => {
        it("Revert when you send tokens to no one", async () => {
            await expect(
                abcToken.send(
                    ADDRESS_ZERO,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    )
                )
            ).to.be.revertedWithCustomError(
                abcToken,
                "ABCToken__SendTokenToNoOne"
            )
        })

        it("Revert when you dont have enough tokens", async () => {
            await expect(
                abcToken.send(
                    recipient,
                    parseEther("137"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    )
                )
            ).to.be.revertedWithCustomError(
                abcToken,
                "ABCToken__NotEnoughBalance"
            )
        })

        /// TODO: test ABCToken__ERC777InterfaceNotImplementeda error
        /// TODO: test ABCToken__RecipientRevert error

        it("Should emit sent signal", async () => {
            await expect(
                abcToken.send(
                    recipient,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    )
                )
            )
                .to.emit(abcToken, "Sent")
                .withArgs(
                    deployer,
                    deployer,
                    recipient,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    ),
                    "0x"
                )
        })

        it("Balance after Send function call should be correct", async () => {
            const holderBalanceBefore =
                await abcToken.balanceOf(deployer)
            const recipientBalanceBefore =
                await abcToken.balanceOf(recipient)

            await abcToken.send(
                recipient,
                parseEther("59"),
                formatBytes32String(
                    "Hello! I am Barry B. Benson!"
                )
            )
            const holderBalanceAfter =
                await abcToken.balanceOf(deployer)

            const recipientBalanceAfter =
                await abcToken.balanceOf(recipient)

            assert.equal(
                formatEther(
                    holderBalanceBefore.add(
                        recipientBalanceBefore
                    )
                ),
                formatEther(
                    holderBalanceAfter.add(
                        recipientBalanceAfter
                    )
                )
            )
        })
    })

    describe("operatorSend when you are authorized", async () => {
        beforeEach(async () => {
            await abcToken.authorizeOperator(operator)
        })

        it("Revert when holder send tokens to no one", async () => {
            await expect(
                abcToken2.operatorSend(
                    deployer,
                    ADDRESS_ZERO,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    ),
                    formatBytes32String(
                        "I am from the Bee Movie!"
                    )
                )
            ).to.be.revertedWithCustomError(
                abcToken2,
                "ABCToken__SendTokenToNoOne"
            )
        })

        it("Revert when your authorization got revoked", async () => {
            await abcToken.revokeOperator(operator)
            await expect(
                abcToken2.operatorSend(
                    deployer,
                    recipient,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    ),
                    formatBytes32String(
                        "I am from the Bee Movie!"
                    )
                )
            ).to.be.revertedWithCustomError(
                abcToken2,
                "ABCToken__NotAuthorized"
            )
        })

        it("Revert when holder dont have enough tokens", async () => {
            await expect(
                abcToken2.operatorSend(
                    deployer,
                    recipient,
                    parseEther("137"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    ),
                    formatBytes32String(
                        "I am from the Bee Movie!"
                    )
                )
            ).to.be.revertedWithCustomError(
                abcToken2,
                "ABCToken__NotEnoughBalance"
            )
        })

        /// TODO: test ABCToken__ERC777InterfaceNotImplementeda error
        /// TODO: test ABCToken__RecipientRevert error

        it("Should emit sent signal", async () => {
            await expect(
                abcToken2.operatorSend(
                    deployer,
                    recipient,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    ),
                    formatBytes32String(
                        "I am from the Bee Movie!"
                    )
                )
            )
                .to.emit(abcToken2, "Sent")
                .withArgs(
                    operator,
                    deployer,
                    recipient,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    ),
                    formatBytes32String(
                        "I am from the Bee Movie!"
                    )
                )
        })

        it("Balance after sendOperator call should be correct", async () => {
            const holderBalanceBefore =
                await abcToken2.balanceOf(deployer)
            const recipientBalanceBefore =
                await abcToken2.balanceOf(recipient)
            const operatorBalanceBefore =
                await abcToken2.balanceOf(operator)
            await abcToken2.operatorSend(
                deployer,
                recipient,
                parseEther("59"),
                formatBytes32String(
                    "Hello! I am Barry B. Benson!"
                ),
                formatBytes32String(
                    "I am from the Bee Movie!"
                )
            )
            const holderBalanceAfter =
                await abcToken2.balanceOf(deployer)
            const recipientBalanceAfter =
                await abcToken2.balanceOf(recipient)
            const operatorBalanceAfter =
                await abcToken2.balanceOf(operator)

            assert.equal(
                formatEther(
                    holderBalanceBefore.add(
                        recipientBalanceBefore.add(
                            operatorBalanceBefore
                        )
                    )
                ),
                formatEther(
                    holderBalanceAfter.add(
                        recipientBalanceAfter.add(
                            operatorBalanceAfter
                        )
                    )
                )
            )
        })
    })

    describe("burn", async () => {
        it("Revert when you dont have enough tokens", async () => {
            await expect(
                abcToken.burn(
                    parseEther("137"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    )
                )
            ).to.be.revertedWithCustomError(
                abcToken2,
                "ABCToken__NotEnoughBalance"
            )
        })

        it("Your balance and total balance is drop", async () => {
            const holderBalanceBefore =
                await abcToken.balanceOf(deployer)
            const totalBalanceBefore =
                await abcToken.totalSupply()

            await abcToken.burn(
                parseEther("59"),
                formatBytes32String(
                    "Hello! I am Barry B. Benson!"
                )
            )

            const holderBalanceAfter =
                await abcToken.balanceOf(deployer)
            const totalBalanceAfter =
                await abcToken.totalSupply()
            assert.equal(
                formatEther(
                    holderBalanceAfter.add(parseEther("59"))
                ),
                formatEther(holderBalanceBefore)
            )
            assert.equal(
                formatEther(
                    totalBalanceAfter.add(parseEther("59"))
                ),
                formatEther(totalBalanceBefore)
            )
        })

        it("Emit a Burned signal", async () => {
            await expect(
                abcToken.burn(
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    )
                )
            )
                .to.emit(abcToken, "Burned")
                .withArgs(
                    deployer,
                    deployer,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    ),
                    "0x"
                )
        })
    })

    describe("operatorBurn when you are authorized", async () => {
        beforeEach(async () => {
            await abcToken.authorizeOperator(operator)
        })

        it("Revert when holder revoke your authorization", async () => {
            await abcToken.revokeOperator(operator)
            await expect(
                abcToken2.operatorBurn(
                    deployer,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    ),
                    formatBytes32String(
                        "I am from the Bee Movie!"
                    )
                )
            ).to.be.revertedWithCustomError(
                abcToken2,
                "ABCToken__NotAuthorized"
            )
        })

        it("Revert when holder dont have enough tokens", async () => {
            await expect(
                abcToken2.operatorBurn(
                    deployer,
                    parseEther("137"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    ),
                    formatBytes32String(
                        "I am from the Bee Movie!"
                    )
                )
            ).to.be.revertedWithCustomError(
                abcToken2,
                "ABCToken__NotEnoughBalance"
            )
        })

        it("Holder balance and total balance is drop", async () => {
            const holderBalanceBefore =
                await abcToken.balanceOf(deployer)
            const totalBalanceBefore =
                await abcToken.totalSupply()

            await abcToken2.operatorBurn(
                deployer,
                parseEther("59"),
                formatBytes32String(
                    "Hello! I am Barry B. Benson!"
                ),
                formatBytes32String(
                    "I am from the Bee Movie!"
                )
            )

            const holderBalanceAfter =
                await abcToken.balanceOf(deployer)
            const totalBalanceAfter =
                await abcToken.totalSupply()
            assert.equal(
                formatEther(
                    holderBalanceAfter.add(parseEther("59"))
                ),
                formatEther(holderBalanceBefore)
            )
            assert.equal(
                formatEther(
                    totalBalanceAfter.add(parseEther("59"))
                ),
                formatEther(totalBalanceBefore)
            )
        })

        it("Emit a Burned signal", async () => {
            await expect(
                abcToken2.operatorBurn(
                    deployer,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    ),
                    formatBytes32String(
                        "I am from the Bee Movie!"
                    )
                )
            )
                .to.emit(abcToken, "Burned")
                .withArgs(
                    operator,
                    deployer,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    ),
                    formatBytes32String(
                        "I am from the Bee Movie!"
                    )
                )
        })
    })

    describe("send", () => {
        it("Revert when you send tokens to no one", async () => {
            await expect(
                abcToken.send(
                    ADDRESS_ZERO,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    )
                )
            ).to.be.revertedWithCustomError(
                abcToken,
                "ABCToken__SendTokenToNoOne"
            )
        })

        it("Revert when you dont have enough tokens", async () => {
            await expect(
                abcToken.send(
                    recipient,
                    parseEther("137"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    )
                )
            ).to.be.revertedWithCustomError(
                abcToken,
                "ABCToken__NotEnoughBalance"
            )
        })

        /// TODO: test ABCToken__ERC777InterfaceNotImplementeda error
        /// TODO: test ABCToken__RecipientRevert error

        it("Should emit sent signal", async () => {
            await expect(
                abcToken.send(
                    recipient,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    )
                )
            )
                .to.emit(abcToken, "Sent")
                .withArgs(
                    deployer,
                    deployer,
                    recipient,
                    parseEther("59"),
                    formatBytes32String(
                        "Hello! I am Barry B. Benson!"
                    ),
                    "0x"
                )
        })

        it("Balance after Send function call should be correct", async () => {
            const holderBalanceBefore =
                await abcToken.balanceOf(deployer)
            const recipientBalanceBefore =
                await abcToken.balanceOf(recipient)

            await abcToken.send(
                recipient,
                parseEther("59"),
                formatBytes32String(
                    "Hello! I am Barry B. Benson!"
                )
            )
            const holderBalanceAfter =
                await abcToken.balanceOf(deployer)

            const recipientBalanceAfter =
                await abcToken.balanceOf(recipient)

            assert.equal(
                formatEther(
                    holderBalanceBefore.add(
                        recipientBalanceBefore
                    )
                ),
                formatEther(
                    holderBalanceAfter.add(
                        recipientBalanceAfter
                    )
                )
            )
        })
    })
})
