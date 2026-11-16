import express from 'express'
import AppError from '../errors/AppError.js'
import {
    createBarberAccount,
    getAllBarberAccounts,
    updateBarberAccountStatus
} from '../services/staffUserService.js'

const router = express.Router()

// دریافت فهرست حساب‌های آرایشگران
router.get('/barber-accounts', async (req, res) => {
    const accounts = await getAllBarberAccounts()

    res.status(200).json({
        count: accounts.length,
        accounts
    })
})

// ساخت حساب کاربری آرایشگر
router.post('/barber-accounts', async (req, res) => {
    if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
    ) {
        throw new AppError('ساختار اطلاعات ارسالی نامعتبر است!', 400)
    }

    const allowedFields = ['barberId', 'username', 'password']

    if (Object.keys(req.body).some(key => !allowedFields.includes(key))) {
        throw new AppError('فیلد غیرمجاز در اطلاعات ارسالی وجود دارد!', 400)
    }

    const { barberId, username, password } = req.body

    if (
        typeof barberId !== 'string' ||
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        barberId.length > 100 ||
        username.length > 50 ||
        password.length > 200
    ) {
        throw new AppError('اطلاعات حساب کاربری نامعتبر است!', 400)
    }

    const account = await createBarberAccount({
        barberId,
        username,
        password
    })

    res.status(201).json({
        message: 'حساب کاربری آرایشگر با موفقیت ساخته شد.',
        account
    })
})

// فعال یا غیرفعال کردن حساب آرایشگر
router.patch('/barber-accounts/:id/active', async (req, res) => {
    if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
    ) {
        throw new AppError('ساختار اطلاعات ارسالی نامعتبر است!', 400)
    }

    const allowedFields = ['active']

    if (Object.keys(req.body).some(key => !allowedFields.includes(key))) {
        throw new AppError('فیلد غیرمجاز در اطلاعات ارسالی وجود دارد!', 400)
    }

    const account = await updateBarberAccountStatus(
        req.params.id,
        req.body.active
    )

    res.status(200).json({
        message: 'وضعیت حساب آرایشگر با موفقیت تغییر کرد.',
        account
    })
})

export default router