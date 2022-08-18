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
