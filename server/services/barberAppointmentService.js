
import pool from '../config/db.js'

export async function getBarberAppointments(barberId) {
    const result = await pool.query(
        `
        SELECT
            id,
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
            created_at
        FROM appointments
        WHERE barber_id = $1
        ORDER BY appointment_start DESC
        `,
        [barberId]
    )

    return result.rows
}

export async function updateBarberAppointmentStatus(
    appointmentId,
    barberId,
    status
) {
    const result = await pool.query(
        `
        UPDATE appointments
        SET status = $1
        WHERE id = $2
          AND barber_id = $3
          AND status = 'confirmed'
        RETURNING *
        `,
        [status, appointmentId, barberId]
    )

    return result.rows[0] || null
}
