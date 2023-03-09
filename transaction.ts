export interface Itransaction {
  debitAccount: string
  creditAccount: string
  amount: number
  txnHash?: string
}
