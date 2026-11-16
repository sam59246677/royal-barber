
import AppError from '../errors/AppError.js'
import pool from '../config/db.js'
import { getOrCreateCustomer } from './customerService.js'
import { DateTime } from 'luxon'

// Convert Persian and Arabic digits to English digits.
function normalizeDigits(value) {
    return value.replace(/[۰-۹٠-٩]/g, digit => {
        const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
        const arabicDigits = '٠١٢٣٤٥٦٧٨٩'

        if (persianDigits.includes(digit)) {
            return String(persianDigits.indexOf(digit))
        }

        return String(arabicDigits.indexOf(digit))
    })
}

// Validate appointment date and time.
function validateAppointmentDateTime(value) {
    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)

    if (!hasTimezone) {
        throw new AppError(
            'تاریخ و ساعت باید دارای منطقه زمانی معتبر باشد!',
            400
        )
    }

    const appointmentStart = DateTime
        .fromISO(value, { setZone: true })
        .setZone('Asia/Tehran')

    if (!appointmentStart.isValid) {
        throw new AppError(
            'تاریخ و ساعت رزرو معتبر نیست!',
            400
        )
    }

    if (
        appointmentStart.minute % 15 !== 0 ||
        appointmentStart.second !== 0 ||
        appointmentStart.millisecond !== 0
    ) {
        throw new AppError(
            'ساعت شروع نوبت باید روی فاصله‌های ۱۵ دقیقه‌ای باشد!',
            400
        )
    }

    if (
        appointmentStart.toMillis() <=
        DateTime.now().setZone('Asia/Tehran').toMillis()
    ) {
        throw new AppError(
            'امکان رزرو در زمان گذشته وجود ندارد!',
            400
        )
    }

    return appointmentStart
}

export async function createAppointment({
    customerName,
    customerPhone,
    serviceId,
    barberId,
    appointmentDateTime
}) {
    // Validate input types.
    if (
        typeof customerName !== 'string' ||
        typeof customerPhone !== 'string' ||
        typeof serviceId !== 'string' ||
        typeof barberId !== 'string' ||
        typeof appointmentDateTime !== 'string'
    ) {
        throw new AppError(
            'اطلاعات رزرو معتبر نیست!',
            400
        )
    }

    // Clean input values.
    const cleanCustomerName = customerName.trim()
    const cleanCustomerPhone = customerPhone.trim()
    const cleanServiceId = serviceId.trim()
    const cleanBarberId = barberId.trim()
    const cleanAppointmentDateTime = appointmentDateTime.trim()

    // Check required fields.
    if (
        !cleanCustomerName ||
        !cleanCustomerPhone ||
        !cleanServiceId ||
        !cleanBarberId ||
        !cleanAppointmentDateTime
    ) {
        throw new AppError(
            'تکمیل تمام اطلاعات رزرو الزامی است!',
            400
        )
    }

    // Normalize mobile number.
    const normalizedPhone = normalizeDigits(cleanCustomerPhone)

    // Validate Iranian mobile number.
    if (!/^09\d{9}$/.test(normalizedPhone)) {
        throw new AppError(
            'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود!',
            400
        )
    }

    // Validate customer name length.
    if (cleanCustomerName.length > 100) {
        throw new AppError(
            'نام مشتری نباید بیشتر از ۱۰۰ کاراکتر باشد!',
            400
        )
    }

    // Validate customer name characters.
    const namePattern = /^[\u0600-\u06FFa-zA-Z\s\u200c'-]+$/

    if (!namePattern.test(cleanCustomerName)) {
        throw new AppError(
            'نام مشتری فقط می‌تواند شامل حروف، فاصله، خط تیره و آپاستروف باشد!',
            400
        )
    }

    // Validate appointment date and time.
    const appointmentStart = validateAppointmentDateTime(
        cleanAppointmentDateTime
    )

    // Get a database connection.
    const client = await pool.connect()

    try {
        // Start transaction.
        await client.query('BEGIN')

        // Find the selected active service.
        const serviceResult = await client.query(
            `
                SELECT id, name, price, duration
                FROM services
                WHERE id = $1
                AND active = TRUE
            `,
            [cleanServiceId]
        )

        const matchedService = serviceResult.rows[0]

        if (!matchedService) {
            throw new AppError(
                'خدمت موردنظر معتبر یا فعال نیست!',
                400
            )
        }

        // Calculate appointment end time.
        const appointmentEnd = appointmentStart.plus({
            minutes: matchedService.duration
        })

        // Define salon working hours.
        const openingTime = appointmentStart
            .startOf('day')
            .set({ hour: 9, minute: 0 })

        const closingTime = appointmentStart
            .startOf('day')
            .set({ hour: 21, minute: 0 })

        // Check appointment start time.
        if (
            appointmentStart.toMillis() < openingTime.toMillis() ||
            appointmentStart.toMillis() >= closingTime.toMillis()
        ) {
            throw new AppError(
                'ساعت شروع نوبت باید بین ۹ صبح تا ۲۱ باشد!',
                400
            )
        }

        // Check appointment end time.
        if (appointmentEnd.toMillis() > closingTime.toMillis()) {
            throw new AppError(
                'مدت خدمت از ساعات کاری آرایشگاه بیشتر است!',
                400
            )
        }

        // Find the selected active barber.
        const barberResult = await client.query(
            `
                SELECT id, name
                FROM barbers
                WHERE id = $1
                AND active = TRUE
            `,
            [cleanBarberId]
        )

        const matchedBarber = barberResult.rows[0]

        if (!matchedBarber) {
            throw new AppError(
                'آرایشگر موردنظر معتبر یا فعال نیست!',
                400
            )
        }

        // Find an existing customer or create a new one.
        const customer = await getOrCreateCustomer(client, {
            name: cleanCustomerName,
            phone: normalizedPhone
        })

        // Convert appointment times to JavaScript Date objects.
        const startDate = appointmentStart.toUTC().toJSDate()
        const endDate = appointmentEnd.toUTC().toJSDate()

        // Check overlapping appointments for the barber.
        const barberConflict = await client.query(
            `
                SELECT id
                FROM appointments
                WHERE barber_id = $1
                AND status <> 'cancelled'
                AND appointment_start < $2
                AND appointment_end > $3
                LIMIT 1
            `,
            [
                matchedBarber.id,
                endDate,
                startDate
            ]
        )

        if (barberConflict.rows.length > 0) {
            throw new AppError(
                'این آرایشگر در ساعت انتخاب‌شده نوبت دیگری دارد!',
                409
            )
        }

        // Check overlapping appointments for the customer.
        const customerConflict = await client.query(
            `
                SELECT id
                FROM appointments
                WHERE customer_id = $1
                AND status <> 'cancelled'
                AND appointment_start < $2
                AND appointment_end > $3
                LIMIT 1
            `,
            [
                customer.id,
                endDate,
                startDate
            ]
        )

        if (customerConflict.rows.length > 0) {
            throw new AppError(
                'شما در این بازه زمانی نوبت دیگری دارید!',
                409
            )
        }

        // Insert the appointment into the database.
        const appointmentResult = await client.query(
            `
                INSERT INTO appointments (
                    customer_id,
                    customer_name,
                    customer_phone,
                    service_id,
                    service_name,
                    price,
                    duration,
                    barber_id,
                    barber_name,
                    appointment_start,
                    appointment_end,
                    status
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10, $11, 'confirmed'
                )
                RETURNING *
            `,
            [
                customer.id,
                customer.name,
                customer.phone,
                matchedService.id,
                matchedService.name,
                matchedService.price,
                matchedService.duration,
                matchedBarber.id,
                matchedBarber.name,
                startDate,
                endDate
            ]
        )

        // Get the created appointment.
        const appointment = appointmentResult.rows[0]

        // Confirm the transaction.
        await client.query('COMMIT')

        return appointment

    } catch (error) {
        // Roll back transaction if anything fails.
        try {
            await client.query('ROLLBACK')
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError)
        }

        // Handle PostgreSQL exclusion constraint violations.
        if (error.code === '23P01') {
            throw new AppError(
                'این زمان قبلاً برای مشتری یا آرایشگر دیگری رزرو شده است!',
                409
            )
        }

        throw error

    } finally {
        // Release database connection.
        client.release()
    }
}