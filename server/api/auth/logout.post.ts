export default defineEventHandler((event) => {
  deleteCookie(event, 'auth_token', { path: '/' }) // Forçar path '/' para garantir
  return { success: true }
})

