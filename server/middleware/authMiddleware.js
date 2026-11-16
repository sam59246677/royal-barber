
import pool from '../config/db.js'
import AppError from '../errors/AppError.js'

// Verify that the authenticated account and its barber profile are active.
async function verifyActiveAccount(req) {
    const user = req.session?.user

    if (!user) {
        throw new AppError(
            'برای دسترسی ابتدا وارد حساب کاربری شوید!',
            401
        )
    }

    const result = await pool.query(
        `
        SELECT
            staff_users.id,
            staff_users.role,
            staff_users.active,
            staff_users.barber_id,
            CASE
                WHEN staff_users.role = 'admin' THEN TRUE
                WHEN barbers.id IS NOT NULL
                    AND barbers.active = TRUE
                    AND barbers.left_at IS NULL
                THEN TRUE
                ELSE FALSE
            END AS barber_active
        FROM staff_users
        LEFT JOIN barbers
            ON barbers.id = staff_users.barber_id
        WHERE staff_users.id = $1
        `,
        [user.id]
    )

    const databaseUser = result.rows[0]

    const isInvalidAccount =
        !databaseUser ||
        !databaseUser.active ||
        databaseUser.role !== user.role ||
        (
            databaseUser.role === 'barber' &&
            !databaseUser.barber_active
        )

    if (isInvalidAccount) {
        await new Promise((resolve, reject) => {
            if (!req.session) return resolve()

            req.session.destroy(error => {
                if (error) reject(error)
                else resolve()
            })
        })

        throw new AppError(
            'حساب کاربری شما غیرفعال است یا اعتبار نشست پایان یافته است!',
            401
        )
    }

    return user
}

// Verify authentication.
export async function requireAuth(req, res, next) {
    try {
        await verifyActiveAccount(req)
        next()
    } catch (error) {
        next(error)
    }
}

// Verify authentication and allowed role.
export function requireRole(...allowedRoles) {
    return async (req, res, next) => {
        try {
            const user = await verifyActiveAccount(req)

            if (!allowedRoles.includes(user.role)) {
                throw new AppError(
                    'شما اجازه دسترسی به این بخش را ندارید!',
                    403
                )
            }

            next()
        } catch (error) {
            next(error)
        }
    }
}
