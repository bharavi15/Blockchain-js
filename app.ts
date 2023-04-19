import express from 'express'
import path from 'path'
import apis from './apis'
const app = express()

app.use(express.static(path.join(__dirname, 'public')))

app.use('/api', apis)
app.get('/', function (req, res) {
  res.send('Hello world')
})

app.use((req,res)=>{
  res.status(404).send({"error":"Not Found"})
})
export default app
