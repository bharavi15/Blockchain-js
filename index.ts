import * as dotenv from 'dotenv'
dotenv.config()
import app from './app'
import http from 'http'
import { getRedisClient, getDbValue, setDbValue, flushDb } from './dao'
import { Iblock } from './block'

const sv = new http.Server(app)
const port = process.env.PORT ?? 3000

initialize().then(() => {
  sv.listen(port, function () {
    console.log(`listening on http://localhost:${port}`)
  })
}).catch((err) => {
  console.log('failed to start server')
  console.log(err)
})
async function initialize () {
  await getRedisClient()
  console.log(await setDbValue('asd', 'asfdgadsf'))
  console.log(await getDbValue('asd'))
  await flushDb()
  const GENESIS_BLOCK_HASH = process.env.GENESIS_BLOCK_HASH ?? '0000000000000000000000000000000000000000000000000000000000000000'
  const CURRENT_BLOCK_HASH_CACHE_KEY = process.env.CURRENT_BLOCK_HASH_CACHE_KEY ?? 'block_current_hash'
  const BLOCK_HASH_CACHE_PREFIX = process.env.BLOCK_HASH_CACHE_PREFIX ?? 'block:currentHash:'

  const genesisBlock: Iblock = {
    transactions: [],
    prevHash: GENESIS_BLOCK_HASH,
    currHash: GENESIS_BLOCK_HASH,
    merkleRootHash: GENESIS_BLOCK_HASH
  }

  await setDbValue(BLOCK_HASH_CACHE_PREFIX + GENESIS_BLOCK_HASH, JSON.stringify(genesisBlock))
  await setDbValue(CURRENT_BLOCK_HASH_CACHE_KEY, BLOCK_HASH_CACHE_PREFIX + GENESIS_BLOCK_HASH)
}
