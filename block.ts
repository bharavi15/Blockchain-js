import { Itransaction } from './transaction'
export interface Iblock {
  transactions: Itransaction[]
  currHash?: string
  prevHash?: string
}
