import { Iblock } from './block'
import { delDbValue, getDbValue, setDbValue } from './dao'
import { Itransaction } from './transaction'
import { getSha256, getSha256Buffer } from './util'
import {MerkleTree}  from 'merkletreejs'
const MAX_TXN_PER_BLOCK = process.env.MAX_TXN_PER_BLOCK ?? 2
const ADMIN_PUBLIC_KEY = process.env.ADMIN_PUBLIC_KEY ?? ''
const BLOCK_HASH_CACHE_PREFIX = process.env.BLOCK_HASH_CACHE_PREFIX ?? 'block:hash:'
const GENESIS_BLOCK_HASH = process.env.GENESIS_BLOCK_HASH ?? '0000000000000000000000000000000000000000000000000000000000000000'
const CURRENT_BLOCK_HASH_CACHE_KEY = process.env.CURRENT_BLOCK_HASH_CACHE_KEY ?? 'block_current_hash'
const LOG_PREFIX_FILE = 'blockchain | '
const FN_START = 'START'
const FN_END = 'END'
export async function doTransaction (debitAccount: string, creditAccount: string, amount: number): Promise<Itransaction> {
  const LOG_PREFIX_FN = LOG_PREFIX_FILE + 'doTransaction' + ' | '
  console.log(`${LOG_PREFIX_FN}${FN_START}`)
  const timestamp = new Date().getTime()

  const accountBalance = await findAccountBalance(getSha256(debitAccount))
  if (accountBalance < amount) {
    console.log(`${LOG_PREFIX_FN} Invalid transaction, please try again`)
    console.log(`${LOG_PREFIX_FN}${FN_END}`)
    throw new Error('Invalid transaction')
  }

  const transaction: Itransaction = {
    timestamp,
    debitAccount: getSha256(debitAccount),
    creditAccount: getSha256(creditAccount),
    amount,
    txnHash: getSha256(`${timestamp}${debitAccount}${creditAccount}${amount}`)
  }

  let currentBlock = JSON.parse(await getDbValue(await getDbValue(CURRENT_BLOCK_HASH_CACHE_KEY)))
  console.log(`${LOG_PREFIX_FN}currentBlock = ${JSON.stringify(currentBlock)}`)
  if (currentBlock.transactions.length >= MAX_TXN_PER_BLOCK) {
    const hash = findBlockHash(currentBlock)
    console.log(`${LOG_PREFIX_FN} hash =  ${hash}`)
    currentBlock.currHash = hash
    await setDbValue(BLOCK_HASH_CACHE_PREFIX + hash, JSON.stringify(currentBlock))
    currentBlock = {
      transactions: [],
      prevHash: hash
    }
  }
  currentBlock.transactions.push(transaction)
  await delDbValue(BLOCK_HASH_CACHE_PREFIX + currentBlock.currHash)
  currentBlock.currHash = findBlockHash(currentBlock)
  await setDbValue(BLOCK_HASH_CACHE_PREFIX + currentBlock.currHash, JSON.stringify(currentBlock))
  await setDbValue(CURRENT_BLOCK_HASH_CACHE_KEY, BLOCK_HASH_CACHE_PREFIX + currentBlock.currHash)
  console.log(`${LOG_PREFIX_FN}${FN_END}`)
  return transaction
}

export async function findAllAccounts (): Promise<string[]> {
  const LOG_PREFIX_FN = LOG_PREFIX_FILE + 'findAllAccounts' + ' | '
  console.log(`${LOG_PREFIX_FN}${FN_START}`)
  const accounts: any = {}
  let currentBlock = JSON.parse(await getDbValue(await getDbValue(CURRENT_BLOCK_HASH_CACHE_KEY)))
  console.log(`${LOG_PREFIX_FN}currentBlock = ${currentBlock}`)
  while (currentBlock.prevHash && currentBlock.prevHash !== GENESIS_BLOCK_HASH) {
    for (const txn of currentBlock.transactions) {
      accounts[txn.debitAccount] = true
      accounts[txn.creditAccount] = true
    }
    currentBlock = JSON.parse(await getDbValue(BLOCK_HASH_CACHE_PREFIX + currentBlock.prevHash))
  }
  for (const txn of currentBlock.transactions|| []) {
    accounts[txn.debitAccount] = true
    accounts[txn.creditAccount] = true
  }
  delete accounts[getSha256(ADMIN_PUBLIC_KEY)]
  console.log(`${LOG_PREFIX_FN}accounts = ${accounts}`)
  console.log(`${LOG_PREFIX_FN}${FN_END}`)

  return Object.keys(accounts)
}

export async function findAllAccountBalance (): Promise<any> {
  const LOG_PREFIX_FN = LOG_PREFIX_FILE + 'findAllAccountBalance' + ' | '
  console.log(`${LOG_PREFIX_FN}${FN_START}`)
  const balances: { [key: string]: number } = {}
  const accounts = await findAllAccounts()
  for (const account of accounts) {
    balances[account] = await findAccountBalance(account)
  }
  console.log(`${LOG_PREFIX_FN}${FN_END}`)
  return balances
}

export async function findAccountBalance (accountName: string): Promise<number> {
  const LOG_PREFIX_FN = LOG_PREFIX_FILE + 'findAccountBalance' + ' | '
  console.log(`${LOG_PREFIX_FN}${FN_START}`)
  if (accountName === getSha256(ADMIN_PUBLIC_KEY)) { return Number.MAX_VALUE }
  let accountBalance = 0
  let currentBlock = JSON.parse(await getDbValue(await getDbValue(CURRENT_BLOCK_HASH_CACHE_KEY)))

  while (currentBlock.prevHash && currentBlock.prevHash !== GENESIS_BLOCK_HASH) {
    for (const txn of currentBlock.transactions) {
      if (txn.debitAccount === accountName) {
        accountBalance -= txn.amount
      }
      if (txn.creditAccount === accountName) {
        accountBalance += txn.amount
      }
    }
    currentBlock = JSON.parse(await getDbValue(BLOCK_HASH_CACHE_PREFIX + currentBlock.prevHash))
  }
  for (const txn of currentBlock.transactions|| []) { 
    if (txn.debitAccount === accountName) {
      accountBalance -= txn.amount
    }
    if (txn.creditAccount === accountName) {
      accountBalance += txn.amount
    }
  }
  console.log(`${LOG_PREFIX_FN}${FN_END}`)
  return accountBalance
}

function findBlockHash (block: Iblock): string {
  const LOG_PREFIX_FN = LOG_PREFIX_FILE + 'findBlockHash' + ' | '
  console.log(`${LOG_PREFIX_FN}${FN_START}`)
  let hash = ''
  block.transactions.forEach((transaction) => { hash = `${hash}${transaction.txnHash}` })
  console.log(`${LOG_PREFIX_FN}${FN_END}`)
  return getSha256(hash + block.prevHash)
}

function findBlockHashWithMerkle (block: Iblock): string {
  let txnHashes = block.transactions.map((transaction) => transaction.txnHash).map((hash) =>getSha256Buffer(hash))
  const tree = new MerkleTree(txnHashes, getSha256Buffer)
  const root = tree.getRoot().toString('hex')
  return root
}