
import bcrypt from 'bcrypt'
import pool from '../config/db.js'
import AppError from '../errors/AppError.js'

export async function authenticateStaff(username, password) {
    // اعتبارسنجی ورودی‌ها
    if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        !username.trim() ||
        !password
    ) {
        throw new AppError('نام کاربری و رمز عبور الزامی هستند!', 400)
    }

    const normalizedUsername = username.trim()

    // پیدا کردن حساب کاربری
    const result = await pool.query(
        `
        SELECT
            id,
            username,
            password_hash,
            role,
            barber_id,
            active
        FROM staff_users
        WHERE username = $1
        `,
        [normalizedUsername]
    )

    const staff = result.rows[0]

    // حساب ناموجود یا غیرفعال
    if (!staff || !staff.active) {
        throw new AppError('نام کاربری یا رمز عبور اشتباه است!', 401)
    }

    // مقایسه رمز واردشده با هش ذخیره‌شده
    const isPasswordValid = await bcrypt.compare(
        password,
        staff.password_hash
    )

    if (!isPasswordValid) {
        throw new AppError('نام کاربری یا رمز عبور اشتباه است!', 401)
    }

    // فقط اطلاعات غیرحساس را برمی‌گردانیم
    return {
        id: staff.id,
        username: staff.username,
        role: staff.role,
        barberId: staff.barber_id
    }
}