# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
GAS_REPORT=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
npx hardhat deploy
```

# What I Have Learned

-   A Raw signed transaction could just be send by the JsonRPC provider. It still need funds, you can't know where it from though? even after decoded it. But it is exact everytime
-   How to deploy ERC1820 Registry using Nick's method and maybe in the future deploying my own contract this way?
-   Creating a simple ERC777 / ERC20 compatible token.
