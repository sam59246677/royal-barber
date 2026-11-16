import AppError from '../errors/AppError.js'

export async function getOrCreateCustomer(client, { name, phone }) {
    const insertResult = await client.query(
        `
            INSERT INTO customers (name, phone)
            VALUES ($1, $2)
            ON CONFLICT (phone) DO NOTHING
            RETURNING id, name, phone
        `,
        [name, phone]
    )

    if (insertResult.rows.length > 0) {
        return insertResult.rows[0]
    }

    const selectResult = await client.query(
        `
            SELECT id, name, phone
            FROM customers
            WHERE phone = $1
        `,
        [phone]
    )

    const existingCustomer = selectResult.rows[0]

    if (!existingCustomer) {
        throw new AppError('بازیابی اطلاعات مشتری با مشکل مواجه شد!', 500)
    }

    if (existingCustomer.name !== name) {
        throw new AppError(
            'این شماره موبایل قبلاً با نام دیگری ثبت شده است!',
            409
        )
    }

    return existingCustomer
}