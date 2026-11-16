# Royal Barber 💈

A full-stack barber shop management and appointment booking application built with **React, TypeScript, Node.js, Express, and PostgreSQL**.

Royal Barber provides customers with an online appointment booking experience and offers separate management dashboards for administrators and barbers.

## Features

### Customer
- Browse available barber services and prices
- View available barbers
- Book appointments without creating an account
- Select appointment dates and time slots
- Submit booking details with form validation

### Admin
- Secure authentication and role-based access control
- Create, update, and manage barber services
- Manage barbers and their active status
- View and manage all appointments
- Manage staff accounts

### Barber
- Secure barber authentication
- View personal appointments only
- Manage eligible appointments
- Update appointment statuses

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
   git clone https://github.com/sam59246677/royal-barber.git
   cd royal-barber
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file using `.env.example` as a reference.

4. Configure your PostgreSQL database and create the required tables.

5. Start the backend server:

   ```bash
   node server/express-app.js
   ```

6. Open another terminal and start the frontend:

   ```bash
   npm run dev
   ```

## Environment Variables

Configure the required environment variables in your local `.env` file.

Refer to `.env.example` for the variable names and configuration format.

Never commit your `.env` file or expose real credentials.

## Production Build

To create a production build of the frontend:

```bash
npm run build
```

## Project Notes

- Customers can book appointments without creating an account.
- Administrators have access to all appointments and management features.
- Barbers can access only their own appointments.
- PostgreSQL is used for persistent data storage.
- Database configuration and deployment are required before production use.

## License

This project is intended for portfolio and educational purposes.
