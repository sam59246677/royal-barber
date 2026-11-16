
import { randomUUID } from 'node:crypto'
import pool from '../config/db.js'
import AppError from '../errors/AppError.js'

// Convert Persian and Arabic digits to English digits.
function normalizeDigits(value) {
    return value.replace(/[۰-۹٠-٩]/g, (digit) => {
        const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
        const arabicDigits = '٠١٢٣٤٥٦٧٨٩'

        if (persianDigits.includes(digit)) {
            return String(persianDigits.indexOf(digit))
        }

        return String(arabicDigits.indexOf(digit))
    })
}

// Get all barbers, including former barbers.
export async function getAllBarbers() {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                phone,
                active,
                left_at,
                created_at,
                updated_at
            FROM barbers
            ORDER BY
                active DESC,
                created_at DESC
        `)

        return result.rows
    } catch (error) {
        console.error('Failed to fetch barbers:', error.message)
        throw error
    }
}

// Create a new barber.
export async function createBarber({ name, phone }) {
    if (typeof name !== 'string' || !name.trim()) {
        throw new AppError('نام آرایشگر الزامی است!', 400)
    }

    const cleanName = name.trim()

    if (cleanName.length > 100) {
        throw new AppError(
            'نام آرایشگر نباید بیشتر از ۱۰۰ کاراکتر باشد!',
            400
        )
    }

    if (
        phone !== undefined &&
        phone !== null &&
        typeof phone !== 'string'
    ) {
        throw new AppError('شماره موبایل معتبر نیست!', 400)
    }

    let normalizedPhone = phone?.trim() || null

    if (normalizedPhone !== null) {
        normalizedPhone = normalizeDigits(normalizedPhone)

        if (!/^09\d{9}$/.test(normalizedPhone)) {
            throw new AppError(
                'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود!',
                400
            )
        }
    }

    const id = randomUUID()

    try {
        const result = await pool.query(
            `
                INSERT INTO barbers (
                    id,
                    name,
                    phone,
                    active,
                    left_at
                )
                VALUES ($1, $2, $3, TRUE, NULL)
                RETURNING *
            `,
            [id, cleanName, normalizedPhone]
        )

        return result.rows[0]
    } catch (error) {
        console.error('Failed to create barber:', error.message)
        throw error
    }
}

// Update barber information.
export async function updateBarber(id, { name, phone }) {
    let cleanName = null

    if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) {
            throw new AppError(
                'نام آرایشگر نمی‌تواند خالی باشد!',
                400
            )
        }

        cleanName = name.trim()

        if (cleanName.length > 100) {
            throw new AppError(
                'نام آرایشگر نباید بیشتر از ۱۰۰ کاراکتر باشد!',
                400
            )
        }
    }

    let normalizedPhone = null
    const shouldUpdatePhone = phone !== undefined

    if (shouldUpdatePhone && phone !== null) {
        if (typeof phone !== 'string') {
            throw new AppError('شماره موبایل معتبر نیست!', 400)
        }

        normalizedPhone = phone.trim()

        if (normalizedPhone) {
            normalizedPhone = normalizeDigits(normalizedPhone)

            if (!/^09\d{9}$/.test(normalizedPhone)) {
                throw new AppError(
                    'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود!',
                    400
                )
            }
        } else {
            normalizedPhone = null
        }
    }

    try {
        const result = await pool.query(
            `
                UPDATE barbers
                SET
                    name = COALESCE($1, name),
                    phone = CASE
                        WHEN $2 THEN $3
                        ELSE phone
                    END,
                    updated_at = NOW()
                WHERE id = $4
                RETURNING *
            `,
            [
                cleanName,
                shouldUpdatePhone,
                normalizedPhone,
                id
            ]
        )

        return result.rows[0] || null
    } catch (error) {
        console.error('Failed to update barber:', error.message)
        throw error
    }
}

// Update barber active status and linked account status.
export async function updateBarberStatus(id, active) {
    if (typeof active !== 'boolean') {
        throw new AppError('وضعیت آرایشگر نامعتبر است!', 400)
    }

    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const result = await client.query(
            `
                UPDATE barbers
                SET
                    active = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *
            `,
            [active, id]
        )

        const barber = result.rows[0]

        if (!barber) {
            throw new AppError('آرایشگر موردنظر پیدا نشد!', 404)
        }

        // Deactivate the linked account when the barber is deactivated.
        // Reactivating a barber does not automatically reactivate the account.
        if (!active) {
            await client.query(
                `
                    UPDATE staff_users
                    SET
                        active = FALSE,
                        updated_at = NOW()
                    WHERE barber_id = $1
                      AND role = 'barber'
                `,
                [id]
            )
        }

        await client.query('COMMIT')

        return barber
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Failed to update barber status:', error.message)
        throw error
    } finally {
        client.release()
    }
}

// Delete is disabled to preserve barber history.
export async function deleteBarber() {
    throw new AppError(
        'حذف آرایشگر مجاز نیست؛ برای خروج دائمی او را غیرفعال کنید.',
        409
    )
}

// Permanently mark a barber as a former employee.
export async function leaveBarber(id) {
    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const result = await client.query(
            `
                UPDATE barbers
                SET
                    active = FALSE,
                    left_at = COALESCE(left_at, NOW()),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
            `,
            [id]
        )

        const barber = result.rows[0]

        if (!barber) {
            throw new AppError('آرایشگر موردنظر پیدا نشد!', 404)
        }

        // Deactivate the linked account.
        await client.query(
            `
                UPDATE staff_users
                SET
                    active = FALSE,
                    updated_at = NOW()
                WHERE barber_id = $1
                  AND role = 'barber'
            `,
            [id]
        )

        await client.query('COMMIT')

        return barber
    } catch (error) {
        await client.query('ROLLBACK')
        console.error(
            'Failed to mark barber as former employee:',
            error.message
        )
        throw error
    } finally {
        client.release()
    }
}
