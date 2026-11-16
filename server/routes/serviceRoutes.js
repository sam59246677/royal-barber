import express from 'express'
import { getServices } from '../services/serviceService.js'

const router = express.Router()

router.get('/', async (req, res) => {
    const services = await getServices()

    return res.status(200).json(services)
})

export default router