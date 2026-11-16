
import pool from '../config/db.js'

// Get active barbers who have not permanently left.
export async function getBarbers() {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                phone,
                active
            FROM barbers
            WHERE active = TRUE
              AND left_at IS NULL
            ORDER BY name
        `)

        return result.rows
    } catch (error) {
        console.error('Failed to fetch barbers:', error.message)
        throw error
    }
}
