import { Iblock } from './block'
import { delDbValue, getDbValue, setDbValue } from './dao'
import { Itransaction } from './transaction'
import { getSha256 } from './util'
const MAX_TXN_PER_BLOCK = process.env.MAX_TXN_PER_BLOCK ?? 2
const ADMIN_PUBLIC_KEY = process.env.ADMIN_PUBLIC_KEY ?? ''
const BLOCK_HASH_CACHE_PREFIX = process.env.BLOCK_HASH_CACHE_PREFIX ?? 'block:hash:'
const GENESIS_BLOCK_HASH = process.env.GENESIS_BLOCK_HASH ?? '0000000000000000000000000000000000000000000000000000000000000000'
const CURRENT_BLOCK_HASH_CACHE_KEY = process.env.CURRENT_BLOCK_HASH_CACHE_KEY ?? 'block_current_hash'
const genesisBlock: Iblock = {
  transactions: [],
  prevHash: GENESIS_BLOCK_HASH
}

export async function doTransaction(debitAccount: string, creditAccount: string, amount: number): Promise<boolean> {
  const timestamp = new Date().getTime()

  const accountBalance = await findAccountBalance(getSha256(debitAccount))
  if (accountBalance < amount) {
    console.log('Invalid transaction, please try again')
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
  console.log('currentBlock', currentBlock)
  if (currentBlock.transactions.length >= MAX_TXN_PER_BLOCK) {
    const hash = findBlockHash(currentBlock)
    console.log('hash', hash)
    currentBlock.currentHash = hash
    await setDbValue(BLOCK_HASH_CACHE_PREFIX+hash,JSON.stringify(currentBlock))
    currentBlock = {
      transactions: [],
      prevHash: hash
    }
  }
  currentBlock.transactions.push(transaction)
  await delDbValue(BLOCK_HASH_CACHE_PREFIX+currentBlock.currHash)
  currentBlock.currHash = findBlockHash(currentBlock)
  await setDbValue(BLOCK_HASH_CACHE_PREFIX+currentBlock.currHash,JSON.stringify(currentBlock))
  await setDbValue(CURRENT_BLOCK_HASH_CACHE_KEY,BLOCK_HASH_CACHE_PREFIX+currentBlock.currHash)
  return true
}

export async function findAllAccounts(): Promise<string[]> {
  const accounts: any = {}
  let currentBlock = JSON.parse(await getDbValue(await getDbValue(CURRENT_BLOCK_HASH_CACHE_KEY)))
  console.log(currentBlock)
  while (currentBlock.prevHash && currentBlock.prevHash != GENESIS_BLOCK_HASH) {
    for (const txn of currentBlock.transactions) {
      accounts[txn.debitAccount] = true
      accounts[txn.creditAccount] = true
    }
    currentBlock = JSON.parse(BLOCK_HASH_CACHE_PREFIX+await getDbValue(currentBlock.prevHash))
  }
  for (const txn of currentBlock.transactions) {
    accounts[txn.debitAccount] = true
    accounts[txn.creditAccount] = true
  }
  delete accounts[getSha256(ADMIN_PUBLIC_KEY)]
  console.log('accounts:',accounts)
  return Object.keys(accounts)
}

export async function findAllAccountBalance(): Promise<any> {
  const balances: { [key: string]: number} = {}
  const accounts = await findAllAccounts()
  for (const account of accounts) {
    balances[account] = await findAccountBalance(account)
  }
  return balances
}

export async function findAccountBalance(accountName: string): Promise<number> {
  if (accountName === getSha256(ADMIN_PUBLIC_KEY)) { return Number.MAX_VALUE }
  let accountBalance = 0
  let currentBlock = JSON.parse(await getDbValue(await getDbValue(CURRENT_BLOCK_HASH_CACHE_KEY)))
  
  while (currentBlock.prevHash && currentBlock.prevHash != GENESIS_BLOCK_HASH) {
    for (const txn of currentBlock.transactions) {
      if (txn.debitAccount === accountName) {
        accountBalance -= txn.amount
      }
      if (txn.creditAccount === accountName) {
        accountBalance += txn.amount
      }
    }
    currentBlock = JSON.parse(BLOCK_HASH_CACHE_PREFIX+await getDbValue(currentBlock.prevHash))
  }
  for (const txn of currentBlock.transactions) {
    if (txn.debitAccount === accountName) {
      accountBalance -= txn.amount
    }
    if (txn.creditAccount === accountName) {
      accountBalance += txn.amount
    }
  }
  return accountBalance
}


function findBlockHash(block: Iblock): string {
  let hash = '';
  block.transactions.forEach((transaction) => { hash = `${hash}${transaction.txnHash}` })
  return getSha256(hash+block.prevHash);
}