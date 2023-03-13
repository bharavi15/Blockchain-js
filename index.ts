import * as dotenv from 'dotenv'
dotenv.config()
import app from './app'
import http from 'http'
import { getRedisClient, getDbValue, setDbValue } from './dao'

const sv = new http.Server(app)
const port = process.env.PORT ?? 3000

initialize().then(()=>{
  sv.listen(port, function () {
    console.log(`listening on http://localhost:${port}`)
  })
})
async function initialize() {
  await getRedisClient()
  console.log(await setDbValue('asd','asfdgadsf'))
  console.log(await getDbValue('asd'))
}
