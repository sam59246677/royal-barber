
import express from 'express'
import AppError from '../errors/AppError.js'
import { getAllAppointments, updateAppointmentStatus } from '../services/adminAppointmentService.js'

const router = express.Router()

// Get all appointments.
router.get('/', async (req, res) => {
    const appointments = await getAllAppointments()
    return res.status(200).json({
        count: appointments.length,
        appointments
    })
})

// Update appointment status.
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params

    // Validate appointment ID.
    const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidPattern.test(id)) {
        throw new AppError('شناسه نوبت معتبر نیست!',400)
    }

    // Validate request body.
    if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw new AppError( 'بدنه درخواست باید یک شیء جیسون باشد!', 400 )
    }

    // Allow only the status field.
    const allowedFields = ['status']

    const hasInvalidField = Object.keys(req.body).some(
        field => !allowedFields.includes(field)
    )

    if (hasInvalidField) {
        throw new AppError('درخواست شامل فیلدهای غیرمجاز است!', 400 )
    }

    const { status } = req.body

    // Validate status.
    const allowedStatuses = ['completed', 'cancelled']

    if (!allowedStatuses.includes(status)) {
        throw new AppError('وضعیت انتخاب‌شده معتبر نیست!',400)
    }

    // Update appointment.
    const appointment = await updateAppointmentStatus(id, status)
    if (!appointment) {
        throw new AppError('نوبت پیدا نشد یا قبلاً وضعیت آن نهایی شده است!',404)
    }

    return res.status(200).json({
        message: 'وضعیت نوبت با موفقیت تغییر کرد.',
        appointment
    })
})
export default router