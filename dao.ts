import { createClient } from 'redis'
const LOG_PREFIX_FILE = 'dao | '

const client = createClient()
export async function getDbValue (key: string) {
  const LOG_PREFIX_FN = LOG_PREFIX_FILE + 'getDbValue' + ' | '
  if (!client.isReady) {
    await getRedisClient()
  }
  const value = await client.get(key)
  console.log(`${LOG_PREFIX_FN}key = ${key} has value = ${value}`)
  return value ?? '{}'
}

export async function setDbValue (key: string, value: string) {
  const LOG_PREFIX_FN = LOG_PREFIX_FILE + 'setDbValue' + ' | '

  if (!client.isReady) {
    await getRedisClient()
  }
  console.log(`${LOG_PREFIX_FN}Setting key = ${key} and value = ${value}`)

  return await client.set(key, value)
}
export async function delDbValue (key: string | null | undefined) {
  if (key == null) { return }
  if (!client.isReady) {
    await getRedisClient()
  }
  return await client.del(key)
}
export async function flushDb () {
  if (!client.isReady) {
    await getRedisClient()
  }
  return await client.flushDb()
}
export async function getRedisClient () {
  if (client.isReady) {
    return client
  }
  await client.connect()
  return client
}
