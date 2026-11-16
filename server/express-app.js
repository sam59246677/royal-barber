
import express from 'express'

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

// Parse JSON
app.use(express.json({ limit: '100kb' }))

// Session
app.use(sessionMiddleware)

// Authentication routes
app.use('/auth', authRoutes)

// Main route
app.get('/', (req, res) => {
    res.send('Welcome to Royal Barber!')
})

// Public API routes
app.use('/services', serviceRoutes)
app.use('/barbers', barberRoutes)
app.use('/appointments', appointmentRoutes)

// Barber protected routes
app.use(
    '/barber/appointments',
    requireRole('barber'),
    barberAppointmentRoutes
)

// Admin protected routes
app.use(
    '/admin/appointments',
    requireRole('admin'),
    adminAppointmentRoutes
)

app.use(
    '/admin/barbers',
    requireRole('admin'),
    adminBarberRoutes
)

app.use(
    '/admin/services',
    requireRole('admin'),
    adminServiceRoutes
)

app.use(
    '/admin/staff-users',
    requireRole('admin'),
    adminStaffUserRoutes
)

// 404 middleware
app.use((req, res, next) => {
    next(new AppError('مسیر موردنظر پیدا نشد!', 404))
})

// Central error handler
app.use((err, req, res, next) => {
    console.error(err)

    // Request body too large
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            message: 'حجم اطلاعات ارسالی بیش از حد مجاز است!'
        })
    }

    // Invalid JSON
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            message: 'ساختار JSON ارسالی نامعتبر است!'
        })
    }

    // Determine HTTP status code
    const statusCode =
        Number.isInteger(err.statusCode) &&
        err.statusCode >= 400 &&
        err.statusCode <= 599
            ? err.statusCode
            : 500

    // Hide internal server errors
    const message =
        statusCode === 500
            ? 'خطای داخلی سرور!'
            : err.message

    return res.status(statusCode).json({
        message
    })
})

// Start server
app.listen(3000, () => {
    console.log('Royal Barber API is running on port 3000')
})