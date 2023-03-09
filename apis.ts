import { Router, json } from 'express'
// import { doTransaction, findAllAccountBalance, printBlockchain } from './blockchain'
import { doTransaction, printBlockchain } from './blockchain'
const router = Router()
router.use(json())
router.post('/transaction', async (req, res) => {
  try {
    await doTransaction(req.body.debitAccount, req.body.creditAccount, req.body.amount)
    printBlockchain()
    res.send(req.body)
  } catch (error: any) {
    res.status(400).send({ error: error.message })
  }
})

router.use((err: any, req: any, res: any, next: any) => {
  res.status(500).send({ error: err })
})
export default router
