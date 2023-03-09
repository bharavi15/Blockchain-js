import crypto from 'crypto'
export function getSha256 (key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}
