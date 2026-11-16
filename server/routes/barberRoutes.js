import express from 'express'
import { getBarbers } from '../services/barberService.js'

const router = express.Router()

router.get('/', async (req, res) => {
    const barbers = await getBarbers()

    return res.status(200).json(barbers)
})

export default router