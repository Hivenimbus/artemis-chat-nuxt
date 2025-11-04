export default defineEventHandler(async (event) => {
  return {
    SUPABASE_URL: process.env.SUPABASE_URL ? 'Configured' : 'Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Missing',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Configured' : 'Missing'
  }
})