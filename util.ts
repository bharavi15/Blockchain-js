import crypto from 'crypto'
export function getSha256 (key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}
export function getSha256Buffer (key: string): Buffer {
  return crypto.createHash('sha256').update(key).digest()
}
