import { Iblock } from './block'
import { Itransaction } from './transaction'
import { getSha256 } from './util'
const MAX_TXN_PER_BLOCK = process.env.MAX_TXN_PER_BLOCK ?? 2
const blockchain: Iblock[] = []
let block: Iblock = {
  transactions: [],
  prevHash: '0000000000000000000000000000000000000000000000000000000000000000'
}
let isFirstBlock = true
blockchain.push(block)
export async function doTransaction (debitAccount: string, creditAccount: string, amount: number): Promise<boolean> {
  const transaction: Itransaction = {
    debitAccount: getSha256(debitAccount),
    creditAccount: getSha256(creditAccount),
    amount,
    txnHash: getSha256(debitAccount + creditAccount + amount)
  }
  const accountBalance = findAccountBalance(blockchain, getSha256(debitAccount)) +
        findAccountBalance([block], getSha256(debitAccount))
  if (accountBalance < amount) {
    console.log('Invalid transaction, please try again')
    throw new Error('Invalid transaction')
  }
  block.transactions.push(transaction)

  if (block.transactions.length >= MAX_TXN_PER_BLOCK) {
    if (!isFirstBlock) {
      blockchain.push(block)
    }
    isFirstBlock = false
    let hash = ''
    block.transactions.forEach((transaction) => { hash += transaction.txnHash })
    block = {
      transactions: [],
      prevHash: hash
    }
  }
  return true
}

function findAllAccounts (blocks: Iblock[]): string[] {
  const accounts: any = {}
  for (const block of blocks) {
    for (const txn of block.transactions) {
      accounts[txn.debitAccount] = true
      accounts[txn.creditAccount] = true
    }
  }
  return Object.keys(accounts)
}

export function findAccountBalance (blocks: Iblock[], accountName: string): number {
  if (accountName === getSha256(process.env.ADMIN_PUBLIC_KEY || '')) { return 100000 }
  let accountBalance = 0
  for (const block of blocks) {
    for (const txn of block.transactions) {
      if (txn.debitAccount === accountName) {
        accountBalance -= txn.amount
      }
      if (txn.creditAccount === accountName) {
        accountBalance += txn.amount
      }
    }
  }
  return accountBalance
}
function findAccountBalanceForBlock (block: Iblock, accountName: string): number {
  if (accountName === process.env.ADMIN_PUBLIC_KEY) { return 100000 }
  let accountBalance = 0
  for (const txn of block.transactions) {
    if (txn.debitAccount === accountName) {
      accountBalance -= txn.amount
    }
    if (txn.creditAccount === accountName) {
      accountBalance += txn.amount
    }
  }

  return accountBalance
}
export function printBlockchain () {
  console.log(JSON.stringify(blockchain))
  console.log('============================')
}
