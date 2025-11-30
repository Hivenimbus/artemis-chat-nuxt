import jwt from 'jsonwebtoken'

const config = useRuntimeConfig()
const SECRET = process.env.JWT_SECRET || 'default-secret-change-me'

interface UserPayload {
  id: string
  email: string
  role: string
}

export const signUserToken = (user: UserPayload): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
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

