import * as dotenv from 'dotenv'
dotenv.config()
import app from './app'
import http from 'http'

const sv = new http.Server(app)
const port = process.env.PORT ?? 3000

sv.listen(port, function () {
  console.log(`listening on http://localhost:${port}`)
})
