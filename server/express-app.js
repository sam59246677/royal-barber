
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import serviceRoutes from './routes/serviceRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import barberRoutes from './routes/barberRoutes.js'

import adminAppointmentRoutes from './routes/adminAppointmentRoutes.js'
import adminBarberRoutes from './routes/adminBarberRoutes.js'
import adminServiceRoutes from './routes/adminServiceRoutes.js'
import adminStaffUserRoutes from './routes/adminStaffUserRoutes.js'

import barberAppointmentRoutes from './routes/barberAppointmentRoutes.js'

import AppError from './errors/AppError.js'
import sessionMiddleware from './config/session.js'
import authRoutes from './routes/authRoutes.js'
import { requireRole } from './middleware/authMiddleware.js'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isProduction = process.env.NODE_ENV === 'production'

// Trust Render's reverse proxy in production
if (isProduction) {
    app.set('trust proxy', 1)
}

// Parse JSON
app.use(express.json({ limit: '100kb' }))

// Session
app.use(sessionMiddleware)

// Authentication routes
app.use('/api/auth', authRoutes)

// Public API routes
app.use('/api/services', serviceRoutes)
app.use('/api/barbers', barberRoutes)
app.use('/api/appointments', appointmentRoutes)

// Barber protected routes
app.use(
    '/api/barber/appointments',
    requireRole('barber'),
    barberAppointmentRoutes
)

// Admin protected routes
app.use(
    '/api/admin/appointments',
    requireRole('admin'),
    adminAppointmentRoutes
)

app.use(
    '/api/admin/barbers',
    requireRole('admin'),
    adminBarberRoutes
)

app.use(
    '/api/admin/services',
    requireRole('admin'),
    adminServiceRoutes
)

app.use(
    '/api/admin/staff-users',
    requireRole('admin'),
    adminStaffUserRoutes
)

// Serve React build in production
if (isProduction) {
    const distPath = path.resolve(__dirname, '../dist')

    app.use(express.static(distPath))

    app.get('/{*path}', (req, res, next) => {
        res.sendFile(path.join(distPath, 'index.html'), (error) => {
            if (error) next(error)
        })
    })
} else {
    app.get('/', (req, res) => {
        res.send('Welcome to Royal Barber API!')
    })
}

// 404 middleware
app.use((req, res, next) => {
    next(new AppError('مسیر موردنظر پیدا نشد!', 404))
})

// Central error handler
app.use((err, req, res, next) => {
    console.error(err)

    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            message: 'حجم اطلاعات ارسالی بیش از حد مجاز است!'
        })
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            message: 'ساختار JSON ارسالی نامعتبر است!'
        })
    }

    const statusCode =
        Number.isInteger(err.statusCode) &&
        err.statusCode >= 400 &&
        err.statusCode <= 599
            ? err.statusCode
            : 500

    const message =
        statusCode === 500
            ? 'خطای داخلی سرور!'
            : err.message

    return res.status(statusCode).json({ message })
})

// Start server
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Royal Barber API is running on port ${PORT}`)
})
