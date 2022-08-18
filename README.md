# Introduction

This project is for learning `ERC20` and `The Graph`. I'm using `The Graph` for querying `ABC ERC20 Token` balances of users.
The contract is written with `hardhat` framework.

# Showcase

![The Graph Showcase 1](https://github.com/NHTuanDat/hardhat-erc20-graph/blob/master/Screenshot%202022-08-18%20103602.png)

![The Graph Showcase 2](https://github.com/NHTuanDat/hardhat-erc20-graph/blob/master/Screenshot%202022-08-18%20103647.png)

# The Graph content

```graphql
# schema.graphql

type Wallet @entity {
    id: Bytes!
    balance: BigInt!
    outgoingTransactions: [Transaction!]! @derivedFrom(field: "from")
    incomingTransactions: [Transaction!]! @derivedFrom(field: "to")
}

type Transaction @entity(immutable: true) {
    id: Bytes!
    from: Wallet!
    to: Wallet!
    amount: BigInt!
    timestamp: BigInt!
}
```

```ts
// mapping.ts

import { Address, BigInt, ByteArray } from "@graphprotocol/graph-ts"
import { Burned, Minted, Sent } from "../generated/ABCToken/ABCToken"
import { Wallet, Transaction } from "../generated/schema"

export function handleMinted(event: Minted): void {
    let transaction = new Transaction(event.transaction.hash)
    transaction.timestamp = event.block.timestamp
    let from = Address.zero()
    let to = event.params.to
    let amount = event.params.amount
    handleTransaction(from, to, amount, transaction)
}

export function handleSent(event: Sent): void {
    let transaction = new Transaction(event.transaction.hash)
    transaction.timestamp = event.block.timestamp
    let from = event.params.from
    let to = event.params.to
    let amount = event.params.amount
    handleTransaction(from, to, amount, transaction)
}

export function handleBurned(event: Burned): void {
    let transaction = new Transaction(event.transaction.hash)
    transaction.timestamp = event.block.timestamp
    let from = event.params.from
    let to = Address.zero()
    let amount = event.params.amount
    handleTransaction(from, to, amount, transaction)
}

function handleTransaction(from: Address, to: Address, amount: BigInt, transaction: Transaction): void {
    transaction.from = from
    transaction.to = to
    transaction.amount = amount
    transaction.save()

    applyChange(from, amount, false)
    applyChange(to, amount, true)
}

function applyChange(holderAddress: Address, amount: BigInt, positive: boolean): void {
    let holder = Wallet.load(holderAddress)
    if (!holder) {
        holder = new Wallet(holderAddress)
        holder.balance = holderAddress != Address.zero() ? BigInt.zero() : BigInt.fromI32(-1)
    }
    if (holderAddress != Address.zero()) {
        if (positive) holder.balance = holder.balance.plus(amount)
        else holder.balance = holder.balance.minus(amount)
    }
    holder.save()
}
```

```yaml
# subgraph.yaml

specVersion: 0.0.4
description: ABC Token querry
# repository: https://github.com/graphprotocol/example-subgraph
schema:
    file: ./schema.graphql
dataSources:
    - kind: ethereum/contract
      name: ABCToken
      network: hardhat
      source:
          address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
          abi: ABCToken
      mapping:
          kind: ethereum/events
          apiVersion: 0.0.6
          language: wasm/assemblyscript
          entities:
              - Wallet
              - Transaction
          abis:
              - name: ABCToken
                file: ./artifacts/contracts/ABCToken.sol/ABCToken.json
          eventHandlers:
              - event: Minted(indexed address,indexed address,uint256,bytes,bytes)
                handler: handleMinted
              - event: Sent(indexed address,indexed address,indexed address,uint256,bytes,bytes)
                handler: handleSent
              - event: Burned(indexed address,indexed address,uint256,bytes,bytes)
                handler: handleBurned
          file: ./src/mapping.ts
```

# Installation

0. Install app packages

```shell
yarn
```

1. Run the hardhat node first, it will automatically deploy the contract

```shell
yarn hardhat node
```

2. Copy the contract address then modify the address in `subgraph.yaml` file.

3. Remember to run the graph node docker connected to hardhat net first. Then deploy the subgraph

```shell
yarn codegen
yarn create-local
yarn deploy-local
```

# What I Learned

-   A Raw signed transaction could just be sent by the JsonRPC provider. It still needs funds, you can't know where it from though? Even after decoded it. But it is exact every time
-   How to deploy ERC1820 Registry using Nick's method and maybe in the future deploying my own contract this way?
-   Creating a simple ERC777 / ERC20 compatible token.
-   Run the graph node using docker
-   Create a subgraph for ERC20 token.
