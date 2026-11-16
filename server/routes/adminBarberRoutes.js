import express from 'express'
import AppError from '../errors/AppError.js'

import {
    getAllBarbers,
    createBarber,
    updateBarber,
    updateBarberStatus,
    leaveBarber
} from '../services/adminBarberService.js'

const router = express.Router()

// Get all barbers.
router.get('/', async (req, res) => {
    const barbers = await getAllBarbers()
    return res.status(200).json({
        count: barbers.length,
        barbers
    })
})

// Create a new barber.
router.post('/', async (req, res) => {

    // Validate request body.
    if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw new AppError('بدنه درخواست باید یک شیء جیسون باشد!', 400)
    }

    // Allow only name and phone fields.
    const allowedFields = ['name', 'phone']

    const hasInvalidField = Object.keys(req.body).some(
        field => !allowedFields.includes(field)
    )

    if (hasInvalidField) {
        throw new AppError('درخواست شامل فیلدهای غیرمجاز است!', 400)
    }

    // Create barber.
    const newBarber = await createBarber({
        name: req.body.name,
        phone: req.body.phone
    })

    return res.status(201).json({
        message: 'آرایشگر با موفقیت ثبت شد.',
        barber: newBarber
    })
})

// Update barber information.
router.patch('/:id', async (req, res) => {

    const { id } = req.params

    // Validate request body.
    if (
        req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw new AppError('بدنه درخواست باید یک شیء جیسون باشد!', 400)
    }

    // Allow only name and phone fields.
    const allowedFields = ['name', 'phone']

    const hasInvalidField = Object.keys(req.body).some(
        field => !allowedFields.includes(field)
    )

    if (hasInvalidField) {
        throw new AppError('درخواست شامل فیلدهای غیرمجاز است!', 400)
    }

    // At least one field must be provided.
    if (Object.keys(req.body).length === 0) {
        throw new AppError('حداقل یک فیلد برای ویرایش ارسال کنید!', 400)
    }

    // Update barber.
    const updatedBarber = await updateBarber(id, {
        name: req.body.name,
        phone: req.body.phone
    })

    if (!updatedBarber) {
        throw new AppError('آرایشگر موردنظر پیدا نشد!', 404)
    }

    return res.status(200).json({
        message: 'اطلاعات آرایشگر با موفقیت ویرایش شد.',
        barber: updatedBarber
    })
})

// Update barber active status.
router.patch('/:id/active', async (req, res) => {

    const { id } = req.params

    // Validate request body.
    if (
        req.body === null ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
    ) {
        throw new AppError('بدنه درخواست باید یک شیء جیسون باشد!', 400)
    }

    // Allow only active field.
    const allowedFields = ['active']

    const hasInvalidField = Object.keys(req.body).some(
        field => !allowedFields.includes(field)
    )

    if (hasInvalidField) {
        throw new AppError('درخواست شامل فیلدهای غیرمجاز است!', 400)
    }

    if (typeof req.body.active !== 'boolean') {
        throw new AppError('فیلد active باید true یا false باشد!', 400)
    }

    // Update barber status.
    const updatedBarber = await updateBarberStatus(
        id,
        req.body.active
    )

    if (!updatedBarber) {
        throw new AppError('آرایشگر موردنظر پیدا نشد!', 404)
    }

    return res.status(200).json({
        message: 'وضعیت آرایشگر با موفقیت تغییر کرد.',
        barber: updatedBarber
    })
})
// Permanently mark a barber as a former employee.
router.patch('/:id/leave', async (req, res) => {
    const barber = await leaveBarber(req.params.id)

    if (!barber) {
        throw new AppError('آرایشگر موردنظر پیدا نشد!', 404)
    }

    return res.status(200).json({
        message: 'خروج دائمی آرایشگر با موفقیت ثبت شد.',
        barber
    })
})



export default router