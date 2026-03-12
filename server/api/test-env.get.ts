export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  return {
    // Database
    DATABASE_URL: process.env.DATABASE_URL ? 'Configured' : 'Missing',

    // API-MEOW
    MEOW_API_URL: process.env.MEOW_API_URL || process.env.NUXT_MEOW_API_URL ? 'Configured' : 'Missing',
    MEOW_API_KEY: process.env.MEOW_API_KEY || process.env.NUXT_MEOW_API_KEY ? 'Configured' : 'Missing',

    // RuntimeConfig (valores injetados pelo Nuxt)
    runtimeConfig: {
      meowApiUrl: config.meowApiUrl ? 'Configured' : 'Missing',
      meowApiKey: config.meowApiKey ? 'Configured' : 'Missing',
      publicSiteUrl: config.public.siteUrl ? 'Configured' : 'Missing'
    }
  }
})
