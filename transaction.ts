export interface Itransaction {
  timestamp: number
  debitAccount: string
  creditAccount: string
  amount: number
  txnHash?: string
}
