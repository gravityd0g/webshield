import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../db.js'

const BCRYPT_COST = 12

function jwtSecret() {
  const s = process.env.JWT_SECRET
  if (!s || s === 'change_me_in_production_use_openssl_rand') {
    throw new Error('JWT_SECRET no configurado o usando default inseguro')
  }
  return s
}

function jwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN ?? '7d'
}

function sanitizeUser(row) {
  return {
    id: row.user_id,
    email: row.email,
    name: row.display_name,
  }
}

export async function findUserByEmail(email) {
  const rows = await query(
    'SELECT user_id, email, password_hash, display_name FROM users WHERE email = ? LIMIT 1',
    [email.toLowerCase().trim()],
  )
  return rows[0] ?? null
}

export async function findUserById(userId) {
  const rows = await query(
    'SELECT user_id, email, display_name FROM users WHERE user_id = ? LIMIT 1',
    [userId],
  )
  return rows[0] ? sanitizeUser(rows[0]) : null
}

export async function registerUser({ email, password, displayName }) {
  const normalized = email.toLowerCase().trim()
  const existing = await findUserByEmail(normalized)
  if (existing) {
    const err = new Error('Email already registered')
    err.status = 409
    throw err
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST)
  await query(
    'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
    [normalized, passwordHash, displayName],
  )
  const user = await findUserByEmail(normalized)
  return sanitizeUser(user)
}

export async function verifyPassword({ email, password }) {
  const user = await findUserByEmail(email)
  if (!user) return null
  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) return null
  return sanitizeUser(user)
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    jwtSecret(),
    { expiresIn: jwtExpiresIn() },
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret())
  } catch {
    return null
  }
}
