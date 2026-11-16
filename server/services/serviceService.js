import pool from '../config/db.js'

// Get active services for public booking.
export async function getServices() {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                price,
                duration,
                active
            FROM services
            WHERE active = TRUE
            ORDER BY name
        `)

        return result.rows

    } catch (error) {
        console.error('Failed to fetch services:', error.message)
        throw error
    }
}