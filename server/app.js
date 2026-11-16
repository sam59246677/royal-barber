import http from 'node:http'

const services = [
    'Haircut',
    'Beard Trim',
    'Hair Coloring'
]


const MAX_BODY_SIZE = 100 * 1024

const server = http.createServer((req, res) => {

    if (req.url === '/appointments' && req.method === 'POST') {

        const contentType = req.headers['content-type']

        if (!contentType || !contentType.includes('application/json')) {
            res.statusCode = 415
            res.end('Content-Type must be application/json!')
            return
        }

        let body = ''
        let bodySize = 0
        let isTooLarge = false

        req.on('data', (chunk) => {
            bodySize += chunk.length

            if (bodySize > MAX_BODY_SIZE) {
                if (!isTooLarge) {
                    isTooLarge = true
                    res.statusCode = 413
                    res.end('Request body is too large!')
                }
                return
            }

            if (!isTooLarge) {
                body += chunk
            }
        })

        req.on('end', () => {

            if (isTooLarge) {
                return
            }

            let appointment

            try {
                appointment = JSON.parse(body)

                if (
                    appointment === null ||
                    typeof appointment !== 'object' ||
                    Array.isArray(appointment)
                ) {
                    res.statusCode = 400
                    res.end('Request body must be a JSON object!')
                    return
                }

            } catch (error) {
                res.statusCode = 400
                res.end('Invalid JSON!')
                return
            }

            if (
                typeof appointment.customerName !== 'string' ||
                appointment.customerName.trim() === ''
            ) {
                res.statusCode = 400
                res.end('Valid customer name is required!')
                return
            }

            if (
                typeof appointment.service !== 'string' ||
                appointment.service.trim() === ''
            ) {
                res.statusCode = 400
                res.end('Valid service is required!')
                return
            }

            appointment.customerName = appointment.customerName.trim()
            appointment.service = appointment.service.trim()

            if (!services.includes(appointment.service)) {
                res.statusCode = 400
                res.end('Invalid service!')
                return
            }

            const newAppointment = {
                customerName: appointment.customerName,
                service: appointment.service
            }

            console.log(newAppointment)

            res.end('Appointment received!')
        })

    } else {
        res.statusCode = 404
        res.end('Route Not Found!')
    }

})


server.listen(3000, () => {
    console.log('Server is running on port 3000')
})