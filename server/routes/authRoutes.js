
import express from 'express'
import AppError from '../errors/AppError.js'
import { authenticateStaff } from '../services/authService.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// تبدیل callback به Promise
function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => {
            if (error) {
                reject(error)
            } else {
                resolve()
            }
        })
    })
}

function saveSession(req) {
    return new Promise((resolve, reject) => {
        req.session.save((error) => {
            if (error) {
                reject(error)
            } else {
                resolve()
            }
        })
    })
}

// ورود مدیر یا آرایشگر
router.post('/login', async (req, res) => {
    if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
    ) {
        throw new AppError('ساختار اطلاعات ارسالی نامعتبر است!', 400)
    }

    const allowedFields = ['username', 'password']

    if (Object.keys(req.body).some(
        (key) => !allowedFields.includes(key)
    )) {
        throw new AppError('فیلد غیرمجاز در اطلاعات ارسالی وجود دارد!', 400)
    }

    const { username, password } = req.body

    if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        username.length > 50 ||
        password.length > 200
    ) {
        throw new AppError('نام کاربری یا رمز عبور نامعتبر است!', 400)
    }

    // بررسی نام کاربری و رمز عبور
    const user = await authenticateStaff(username, password)

    // ساخت شناسه نشست جدید برای جلوگیری از Session Fixation
    await regenerateSession(req)

    // ذخیره اطلاعات کاربر در Session
    req.session.user = user

    // اطمینان از ذخیره Session در PostgreSQL
    await saveSession(req)

    res.status(200).json({
        message: 'ورود موفقیت‌آمیز بود.',
        user
    })
})


// بررسی وضعیت ورود کاربر
// بررسی وضعیت ورود و فعال بودن حساب کاربر
router.get('/me', requireAuth, (req, res) => {
    return res.status(200).json({
        user: req.session.user
    })
})

// خروج از حساب کاربری
router.post('/logout', async (req, res) => {
    if (!req.session) {
        return res.status(200).json({
            message: 'از حساب کاربری خارج شدید.'
        })
    }

    await new Promise((resolve, reject) => {
        req.session.destroy((error) => {
            if (error) {
                reject(error)
            } else {
                resolve()
            }
        })
    })

    res.clearCookie('royal_barber.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    })

    res.status(200).json({
        message: 'با موفقیت از حساب کاربری خارج شدید.'
    })
})

export default router