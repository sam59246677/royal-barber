
import pool from '../config/db.js'

// Get all appointments.
export async function getAllAppointments() {
    try {
        const result = await pool.query(`
            SELECT
                id,
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
                status,
                created_at,
                updated_at
            FROM appointments
            ORDER BY appointment_start DESC
        `)

        return result.rows

    } catch (error) {
        console.error('Failed to fetch appointments:', error.message)
        throw error
    }
}

// Update appointment status.
export async function updateAppointmentStatus(id, status) {
    try {
        const result = await pool.query(
            `
                UPDATE appointments
                SET
                    status = $1,
                    updated_at = NOW()
                WHERE id = $2
                AND status = 'confirmed'
                RETURNING *
            `,
            [status, id]
        )

        return result.rows[0] || null

    } catch (error) {
        console.error('Failed to update appointment status:', error.message)
        throw error
    }
}
