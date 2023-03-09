import { Iblock } from './block'
import { Itransaction } from './transaction'
import { getSha256 } from './util'
const MAX_TXN_PER_BLOCK = process.env.MAX_TXN_PER_BLOCK ?? 2
const blockchain: Iblock[] = []
let genesisBlock: Iblock = {
    transactions: [],
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000'
}
let isFirstBlock = true
blockchain.push(genesisBlock)

export async function doTransaction(debitAccount: string, creditAccount: string, amount: number): Promise<boolean> {
    const timestamp = new Date().getTime()

    const accountBalance = findAccountBalance(blockchain, getSha256(debitAccount)) 
    if (accountBalance < amount) {
        console.log('Invalid transaction, please try again')
        throw new Error('Invalid transaction')
    }

    const transaction: Itransaction = {
        timestamp,
        debitAccount: getSha256(debitAccount),
        creditAccount: getSha256(creditAccount),
        amount,
        txnHash: getSha256(timestamp + debitAccount + creditAccount + amount)
    }

    let currentBlock = blockchain[blockchain.length - 1]
    console.log('currentBlock',currentBlock)
    if (currentBlock.transactions.length >= MAX_TXN_PER_BLOCK) {
        isFirstBlock = false
        let hash = ''
        currentBlock.transactions.forEach((transaction) => { hash += transaction.txnHash })
        console.log('hash',hash)
        currentBlock = {
            transactions: [],
            prevHash: getSha256(hash)
        }
        if (!isFirstBlock) {
            blockchain.push({...currentBlock})
        }
    }
   
    currentBlock.transactions.push(transaction)
    return true
}

export function findAllAccounts(): string[] {
    const accounts: any = {}
    for (const block of blockchain) {
        for (const txn of block.transactions) {
            accounts[txn.debitAccount] = true
            accounts[txn.creditAccount] = true
        }
    }
    delete accounts[getSha256(process.env.ADMIN_PUBLIC_KEY || '')]
    return Object.keys(accounts)
}

export function findAllAccountBalance():any{
    const balances:any = {}
    const accounts = findAllAccounts()
    for(let account of accounts){
       balances[account] =  findAccountBalance(blockchain, account)
    }
    return balances
}

export function findAccountBalance(blocks: Iblock[], accountName: string): number {
    if (accountName === getSha256(process.env.ADMIN_PUBLIC_KEY || '')) { return Number.MAX_VALUE }
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
function findAccountBalanceForBlock(block: Iblock, accountName: string): number {
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
export function printBlockchain() {
    console.log('++++++++++++++++++++++++++++')
    console.log(JSON.stringify(blockchain))
    console.log('============================')
}
