
import bcrypt from 'bcrypt'
import pool from '../config/db.js'
import AppError from '../errors/AppError.js'

// Create a barber account.
export async function createBarberAccount({
    barberId,
    username,
    password
}) {
    if (
        typeof barberId !== 'string' ||
        !barberId.trim() ||
        typeof username !== 'string' ||
        !/^[a-zA-Z0-9_.-]{3,50}$/.test(username) ||
        typeof password !== 'string' ||
        password.length < 12 ||
        password.length > 200
    ) {
        throw new AppError('اطلاعات حساب کاربری نامعتبر است!', 400)
    }

    const normalizedBarberId = barberId.trim()

    // Check that the barber exists, is active, and has not left.
    const barberResult = await pool.query(
        `
        SELECT id
        FROM barbers
        WHERE id = $1
          AND active = TRUE
          AND left_at IS NULL
        `,
        [normalizedBarberId]
    )

    if (barberResult.rows.length === 0) {
        throw new AppError(
            'آرایشگر موردنظر وجود ندارد، غیرفعال است یا از مجموعه خارج شده است!',
            404
        )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    try {
        const result = await pool.query(
            `
            INSERT INTO staff_users (
                username,
                password_hash,
                role,
                barber_id
            )
            VALUES ($1, $2, 'barber', $3)
            RETURNING id, username, role, barber_id, active
            `,
            [username, passwordHash, normalizedBarberId]
        )

        return result.rows[0]

    } catch (error) {
        if (error.code === '23505') {
            throw new AppError(
                'این نام کاربری یا برای این آرایشگر قبلاً حساب ساخته شده است!',
                409
            )
        }

        throw error
    }
}

// Get all barber accounts.
export async function getAllBarberAccounts() {
    const result = await pool.query(`
        SELECT
            staff_users.id,
            staff_users.username,
            staff_users.role,
            staff_users.barber_id,
            barbers.name AS barber_name,
            staff_users.active,
            staff_users.created_at
        FROM staff_users
        INNER JOIN barbers
            ON staff_users.barber_id = barbers.id
        WHERE staff_users.role = 'barber'
        ORDER BY staff_users.created_at DESC
    `)

    return result.rows
}

// Update a barber account's active status.
export async function updateBarberAccountStatus(id, active) {
    if (
        typeof id !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
        typeof active !== 'boolean'
    ) {
        throw new AppError('اطلاعات وضعیت حساب نامعتبر است!', 400)
    }

    const result = await pool.query(
        `
        UPDATE staff_users AS staff
        SET
            active = $1,
            updated_at = NOW()
        FROM barbers
        WHERE staff.id = $2
          AND staff.role = 'barber'
          AND staff.barber_id = barbers.id
          AND (
              $1 = FALSE
              OR (
                  barbers.active = TRUE
                  AND barbers.left_at IS NULL
              )
          )
        RETURNING
            staff.id,
            staff.username,
            staff.role,
            staff.barber_id,
            staff.active
        `,
        [active, id]
    )

    if (result.rows.length === 0) {
        throw new AppError(
            'حساب آرایشگر پیدا نشد یا آرایشگر غیرفعال است و امکان فعال‌سازی حساب وجود ندارد!',
            404
        )
    }

    return result.rows[0]
}
