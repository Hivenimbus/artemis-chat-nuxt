export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  return {
    // Database
    DATABASE_URL: process.env.DATABASE_URL ? 'Configured' : 'Missing',

    // Hive API
    HIVE_API_URL: process.env.HIVE_API_URL || process.env.NUXT_HIVE_API_URL ? 'Configured' : 'Missing',
    HIVE_API_KEY: process.env.HIVE_API_KEY || process.env.NUXT_HIVE_API_KEY ? 'Configured' : 'Missing',

    // RuntimeConfig (valores injetados pelo Nuxt)
    runtimeConfig: {
      hiveApiUrl: config.hiveApiUrl ? 'Configured' : 'Missing',
      hiveApiKey: config.hiveApiKey ? 'Configured' : 'Missing',
      publicSiteUrl: config.public.siteUrl ? 'Configured' : 'Missing'
    }
  }
})
