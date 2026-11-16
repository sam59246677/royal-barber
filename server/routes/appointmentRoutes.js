
import express from 'express'
import AppError from '../errors/AppError.js'
import { createAppointment } from '../services/appointmentService.js'

const router = express.Router()

router.post('/', async (req, res) => {
    // Validate request body.
    if (req.body === null ||typeof req.body !== 'object' ||Array.isArray(req.body)) {
        throw new AppError('بدنه درخواست باید یک شیء جیسون باشد!', 400)
    }

    // Define allowed request fields.
    const allowedFields = [
        'customerName',
        'customerPhone',
        'serviceId',
        'barberId',
        'appointmentDateTime'
    ]

    // Reject unexpected fields.
    const hasInvalidField = Object.keys(req.body).some(
        field => !allowedFields.includes(field)
    )

    if (hasInvalidField) {
        throw new AppError('درخواست شامل فیلدهای غیرمجاز است!',400)
    }

    // Create appointment.
    const newAppointment = await createAppointment({
        customerName: req.body.customerName,
        customerPhone: req.body.customerPhone,
        serviceId: req.body.serviceId,
        barberId: req.body.barberId,
        appointmentDateTime: req.body.appointmentDateTime
    })

    return res.status(201).json({
        message: 'نوبت با موفقیت ثبت شد.',
        appointment: newAppointment
    })
})
export default router