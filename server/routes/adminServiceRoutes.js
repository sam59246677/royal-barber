
import express from 'express'
import AppError from '../errors/AppError.js'

import {
    getAllServices,
    createService,
    updateService,
    updateServiceStatus,
    deleteService
} from '../services/adminServiceService.js'

const router = express.Router()

// Get all services.
router.get('/', async (req, res) => {
    const services = await getAllServices()

    return res.status(200).json({
        count: services.length,
        services
    })
})

// Create a new service.
router.post('/', async (req, res) => {

    if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw new AppError('بدنه درخواست باید یک شیء جیسون باشد!', 400)
    }

    const allowedFields = ['name', 'price', 'duration']

    const hasInvalidField = Object.keys(req.body).some(
        field => !allowedFields.includes(field)
    )

    if (hasInvalidField) {
        throw new AppError('درخواست شامل فیلدهای غیرمجاز است!',400)
    }

    const newService = await createService({
        name: req.body.name,
        price: req.body.price,
        duration: req.body.duration
    })

    return res.status(201).json({
        message: 'خدمت با موفقیت ثبت شد.',
        service: newService
    })
})

// Update service information.
router.patch('/:id', async (req, res) => {

    const { id } = req.params

    if ( req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw new AppError('بدنه درخواست باید یک شیء جیسون باشد!', 400)
    }

    const allowedFields = ['name', 'price', 'duration']

    const hasInvalidField = Object.keys(req.body).some(
        field => !allowedFields.includes(field)
    )

    if (hasInvalidField) {
        throw new AppError( 'درخواست شامل فیلدهای غیرمجاز است!', 400 )
    }

    if (Object.keys(req.body).length === 0) {
        throw new AppError('حداقل یک فیلد برای ویرایش ارسال کنید!', 400 )
    }

    const updatedService = await updateService(id, {
        name: req.body.name,
        price: req.body.price,
        duration: req.body.duration
    })

    if (!updatedService) {
        throw new AppError('خدمت موردنظر پیدا نشد!', 404)
    }

    return res.status(200).json({
        message: 'اطلاعات خدمت با موفقیت ویرایش شد.',
        service: updatedService
    })
})

// Update service active status.
router.patch('/:id/active', async (req, res) => {

    const { id } = req.params

    if (
        req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw new AppError('بدنه درخواست باید یک شیء جیسون باشد!', 400 )
    }

    const allowedFields = ['active']

    const hasInvalidField = Object.keys(req.body).some(
        field => !allowedFields.includes(field)
    )

    if (hasInvalidField) {
        throw new AppError('درخواست شامل فیلدهای غیرمجاز است!',400)
    }

    if (typeof req.body.active !== 'boolean') {
        throw new AppError('فیلد active باید true یا false باشد!',400)
    }

    const updatedService = await updateServiceStatus(
        id,
        req.body.active
    )

    if (!updatedService) {
        throw new AppError('خدمت موردنظر پیدا نشد!', 404)
    }

    return res.status(200).json({
        message: 'وضعیت خدمت با موفقیت تغییر کرد.',
        service: updatedService
    })
})

// Delete service.
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const deletedService = await deleteService(id)
    if (!deletedService) {
        throw new AppError('خدمت موردنظر پیدا نشد!', 404)
    }

    return res.status(200).json({
        message: 'خدمت با موفقیت حذف شد.',
        service: deletedService
    })
})
export default router