export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  return {
    // Database
    DATABASE_URL: process.env.DATABASE_URL ? 'Configured' : 'Missing',

    // Evolution API
    EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || process.env.NUXT_EVOLUTION_API_URL ? 'Configured' : 'Missing',
    EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || process.env.NUXT_EVOLUTION_API_KEY ? 'Configured' : 'Missing',

    // RuntimeConfig (valores injetados pelo Nuxt)
    runtimeConfig: {
      evolutionApiUrl: config.evolutionApiUrl ? 'Configured' : 'Missing',
      evolutionApiKey: config.evolutionApiKey ? 'Configured' : 'Missing',
      publicSiteUrl: config.public.siteUrl ? 'Configured' : 'Missing'
    }
  }
})
