import { verifyUserToken } from '~/server/utils/jwt'

export default defineEventHandler((event) => {
  const token = getCookie(event, 'auth_token')

  if (token) {
    const user = verifyUserToken(token)
    if (user) {
      event.context.user = user
    }
  }
})

