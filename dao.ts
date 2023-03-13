import { createClient } from 'redis'
const client = createClient()
export async function getDbValue (key: string) {
  if(!client.isReady){
    await getRedisClient()
  }
  const value = await client.get(key)
  console.log('key',key,'has value', value)
  return value
}

export async function setDbValue (key: string, value: string) {
  if(!client.isReady){
    await getRedisClient()
  }

  return await client.set(key, value)
}
export async function getRedisClient(){
  if(client.isReady){
    return client;
  }
  await client.connect()
  return client
}