import { randomBytes } from 'crypto'

export function newId(): string {
  return Date.now().toString(36) + randomBytes(5).toString('hex')
}
