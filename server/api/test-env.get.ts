export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  return {
    // Supabase
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Missing',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Missing',
    
    // Evolution API
    EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || process.env.NUXT_EVOLUTION_API_URL ? 'Configured' : 'Missing',
    EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || process.env.NUXT_EVOLUTION_API_KEY ? 'Configured' : 'Missing',
    
    // RuntimeConfig (valores injetados pelo Nuxt)
    runtimeConfig: {
      evolutionApiUrl: config.evolutionApiUrl ? 'Configured' : 'Missing',
      evolutionApiKey: config.evolutionApiKey ? 'Configured' : 'Missing',
      publicSupabaseUrl: config.public.supabaseUrl ? 'Configured' : 'Missing',
      publicSiteUrl: config.public.siteUrl ? 'Configured' : 'Missing'
    }
  }
})