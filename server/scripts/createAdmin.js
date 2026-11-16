
import bcrypt from 'bcrypt'
import { createInterface } from 'node:readline/promises'
import pool from '../config/db.js'


function askHidden(question) {
    return new Promise((resolve, reject) => {
        if (!process.stdin.isTTY || !process.stdin.setRawMode) {
            reject(new Error('ترمینال تعاملی پشتیبانی نمی‌شود.'))
            return
        }

        let value = ''

        process.stdout.write(question)

        const onData = (chunk) => {
            for (const char of chunk.toString()) {
                if (char === '\u0003') {
                    process.stdin.setRawMode(false)
                    process.stdin.pause()
                    reject(new Error('عملیات لغو شد.'))
                    return
                }

                if (char === '\r' || char === '\n') {
                    process.stdin.setRawMode(false)
                    process.stdin.pause()
                    process.stdin.removeListener('data', onData)
                    process.stdout.write('\n')
                    resolve(value)
                    return
                }

                if (char === '\u007f' || char === '\b') {
                    value = value.slice(0, -1)
                } else {
                    value += char
                }
            }
        }

        process.stdin.setRawMode(true)
        process.stdin.resume()
        process.stdin.on('data', onData)
    })
}


async function createAdmin() {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    })

    let username

    try {
        username = (await rl.question('Admin username: ')).trim()
    } finally {
        rl.close()
    }

    if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(username)) {
        throw new Error('نام کاربری باید ۳ تا ۵۰ کاراکتر انگلیسی باشد.')
    }

    const password = await askHidden('Admin password: ')

    if (password.length < 12) {
        throw new Error('رمز عبور باید حداقل ۱۲ کاراکتر باشد.')
    }

    const confirmPassword = await askHidden('Confirm password: ')

    if (password !== confirmPassword) {
        throw new Error('رمزهای عبور یکسان نیستند.')
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await pool.query(
        `INSERT INTO staff_users (username, password_hash, role)
         VALUES ($1, $2, 'admin')
         RETURNING id, username, role, active`,
        [username, passwordHash]
    )

    console.log('\nمدیر با موفقیت ساخته شد:')
    console.log(result.rows[0])
}

try {
    await createAdmin()
} catch (error) {
    if (error.code === '23505') {
        console.error('این نام کاربری قبلاً ثبت شده است.')
    } else {
        console.error('خطا:', error.message)
    }
} finally {
    await pool.end()
}
