import jwt from 'jsonwebtoken'

const config = useRuntimeConfig()
const SECRET = process.env.JWT_SECRET || 'default-secret-change-me'

interface UserPayload {
  id: string
  email: string
  role: string
  name?: string
}

export const signUserToken = (user: UserPayload): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    SECRET,
    { expiresIn: '7d' }
  )
}

export const verifyUserToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, SECRET) as UserPayload
  } catch (error) {
    return null
  }
}

interface InvitePayload {
  email: string
  role: string
  name: string
  empresa_id: string
}

export const signInviteToken = (payload: InvitePayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' })
}

export const verifyInviteToken = (token: string): InvitePayload | null => {
  try {
    return jwt.verify(token, SECRET) as InvitePayload
  } catch (error) {
    return null
  }
}

