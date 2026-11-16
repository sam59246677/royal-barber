
import { randomUUID } from 'node:crypto'
import pool from '../config/db.js'
import AppError from '../errors/AppError.js'

// Get all services, including inactive services.
export async function getAllServices() {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                price,
                duration,
                active,
                created_at,
                updated_at
            FROM services
            ORDER BY created_at DESC
        `)

        return result.rows

    } catch (error) {
        console.error('Failed to fetch services:', error.message)
        throw error
    }
}

// Create a new service.
export async function createService({ name, price, duration }) {

    // Validate service name.
    if (typeof name !== 'string' || !name.trim()) {
        throw new AppError('نام خدمت الزامی است!', 400)
    }

    const cleanName = name.trim()

    if (cleanName.length > 150) {
        throw new AppError('نام خدمت نباید بیشتر از ۱۵۰ کاراکتر باشد!',400)
    }

    // Validate price.
    if (!Number.isSafeInteger(price) || price < 0) {
        throw new AppError('قیمت باید یک عدد صحیح و غیرمنفی باشد!',400)
    }

    // Validate duration.
    if (!Number.isSafeInteger(duration) || duration <= 0) {
        throw new AppError('مدت خدمت باید یک عدد صحیح و بزرگ‌تر از صفر باشد!',400)
    }

    const id = randomUUID()

    try {
        const result = await pool.query(
            `
                INSERT INTO services (
                    id,
                    name,
                    price,
                    duration,
                    active
                )
                VALUES ($1, $2, $3, $4, TRUE)
                RETURNING *
            `,
            [id, cleanName, price, duration]
        )

        return result.rows[0]

    } catch (error) {
        console.error('Failed to create service:', error.message)
        throw error
    }
}

// Update service information.
export async function updateService(id, { name, price, duration }) {

    const updates = {}
    const hasName = name !== undefined
    const hasPrice = price !== undefined
    const hasDuration = duration !== undefined

    if (!hasName && !hasPrice && !hasDuration) {
        throw new AppError('حداقل یک فیلد برای ویرایش ارسال کنید!',400)
    }

    if (hasName) {
        if (typeof name !== 'string' || !name.trim()) {
            throw new AppError('نام خدمت نمی‌تواند خالی باشد!', 400)
        }

        updates.name = name.trim()

        if (updates.name.length > 150) {
            throw new AppError('نام خدمت نباید بیشتر از ۱۵۰ کاراکتر باشد!', 400)
        }
    }

    if (hasPrice) {
        if (!Number.isSafeInteger(price) || price < 0) {
            throw new AppError('قیمت باید یک عدد صحیح و غیرمنفی باشد!',400)
        }

        updates.price = price
    }

    if (hasDuration) {
        if (!Number.isSafeInteger(duration) || duration <= 0) {
            throw new AppError('مدت خدمت باید یک عدد صحیح و بزرگ‌تر از صفر باشد!',400)
        }

        updates.duration = duration
    }

    try {
        const result = await pool.query(
            `
                UPDATE services
                SET
                    name = COALESCE($1, name),
                    price = COALESCE($2, price),
                    duration = COALESCE($3, duration),
                    updated_at = NOW()
                WHERE id = $4
                RETURNING *
            `,
            [
                updates.name ?? null,
                updates.price ?? null,
                updates.duration ?? null,
                id
            ]
        )

        return result.rows[0] || null

    } catch (error) {
        console.error('Failed to update service:', error.message)
        throw error
    }
}

// Update service active status.
export async function updateServiceStatus(id, active) {

    if (typeof active !== 'boolean') {
        throw new AppError('وضعیت فعال بودن باید true یا false باشد!', 400)
    }

    try {
        const result = await pool.query(
            `
                UPDATE services
                SET
                    active = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *
            `,
            [active, id]
        )

        return result.rows[0] || null

    } catch (error) {
        console.error('Failed to update service status:', error.message)
        throw error
    }
}

// Delete a service only if it has no appointment history.
export async function deleteService(id) {
    try {
        const result = await pool.query(
            `
                DELETE FROM services
                WHERE id = $1
                RETURNING *
            `,
            [id]
        )

        return result.rows[0] || null

    } catch (error) {

        // Prevent deleting services with appointment history.
        if (error.code === '23503') {
            throw new AppError('این خدمت سابقه نوبت دارد؛ فقط می‌توانید آن را غیرفعال کنید!', 409)
        }

        console.error('Failed to delete service:', error.message)
        throw error
    }
}