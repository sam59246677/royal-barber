# Royal Barber 💈

A full-stack barber shop management and appointment booking application built with React, TypeScript, Node.js, Express, and PostgreSQL.

Royal Barber provides an online appointment booking experience for customers and separate management dashboards for administrators and barbers.

## Features

### Customer
- Browse barber services and prices
- View available barbers
- Book appointments without creating an account
- Select appointment date and time
- Submit booking information with form validation

### Admin
- Secure authentication and role-based access control
- Manage services, prices, durations, and availability
- Manage barbers and their active status
- View and manage all appointments
- Manage staff accounts

### Barber
- Secure barber login
- View only their own appointments
- Complete or cancel eligible appointments
- Update appointment status

### Security
- Password hashing with bcrypt
- PostgreSQL-backed session storage
- HTTP-only session cookies
- Role-based authorization
- Server-side input validation
- Parameterized SQL queries

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React

**Backend**
- Node.js
- Express
- PostgreSQL
- express-session
- connect-pg-simple
- bcrypt

## Getting Started

### Prerequisites
- Node.js
- npm
- PostgreSQL

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/royal-barber.git
   cd royal-barber
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root based on the environment variables required by the application.

4. Configure your PostgreSQL database and create the required tables.

5. Start the backend server:

   ```bash
   node server/express-app.js
   ```

6. Start the frontend development server in another terminal:

   ```bash
   npm run dev
   ```

## Environment Variables

Configure the following variables in your local `.env` file:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `SESSION_SECRET`
- `NODE_ENV`

Never commit your `.env` file or expose real credentials.

## Build

```bash
npm run build
```

## Notes

- Customer booking does not require an account.
- Admin and barber dashboards require authentication.
- The backend uses PostgreSQL for persistent data storage.
- This repository contains the application source code; database setup and deployment configuration are required before production use.

## License

This project is available for portfolio and educational purposes.
