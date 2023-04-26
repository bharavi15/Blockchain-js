import { Router, json } from 'express'
import { doTransaction, findAllAccountBalance } from './blockchain'
const router = Router()
router.use(json())
router.post('/transaction', async (req, res) => {
  try {
   const transactionDetails = await doTransaction(req.body.debitAccount, req.body.creditAccount, req.body.amount)
    res.send(transactionDetails)
  } catch (error: any) {
    console.log(error)
    res.status(400).send({ error: error.message })
  }
})

router.get('/balance', async (req, res) => {
  res.send(await findAllAccountBalance())
})

router.use((err: any, req: any, res: any, next: any) => {
  res.status(500).send({ error: err })
})
export default router
