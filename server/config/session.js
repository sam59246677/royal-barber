
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import pool from './db.js'

// بررسی وجود کلید محرمانه
if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is missing from environment variables!')
}

// ساخت PostgreSQL session store
const PostgreSQLStore = connectPgSimple(session)

const sessionStore = new PostgreSQLStore({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
})

// تنظیمات Session
const sessionMiddleware = session({
    store: sessionStore,

    secret: process.env.SESSION_SECRET,

    name: 'royal_barber.sid',

    resave: false,

    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8
    }
})
export default sessionMiddleware