// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  devServer: {
    port: 3000
  },
  nitro: {
    externals: {
      inline: []
    }
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo.png' }
      ]
    }
  },
  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-emoji-picker',
    '@vueuse/nuxt'
  ],
  runtimeConfig: {
    // Private keys (only available on server-side)
    databaseUrl: process.env.DATABASE_URL,
    evolutionApiUrl: process.env.NUXT_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL,
    evolutionApiKey: process.env.NUXT_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY,
    openrouterApiKey: process.env.OPENROUTER_APIKEY,
    jwtSecret: process.env.JWT_SECRET,
    smtpHost: process.env.NUXT_SMTP_HOST || process.env.SMTP_HOST,
    smtpPort: process.env.NUXT_SMTP_PORT || process.env.SMTP_PORT,
    smtpUser: process.env.NUXT_SMTP_USER || process.env.SMTP_USER,
    smtpPass: process.env.NUXT_SMTP_PASS || process.env.SMTP_PASS,
    smtpFrom: process.env.NUXT_SMTP_FROM || process.env.SMTP_FROM,
    minioEndpoint: process.env.MINIO_ENDPOINT,
    minioAccessKey: process.env.MINIO_ACCESS_KEY,
    minioSecretKey: process.env.MINIO_SECRET_KEY,
    minioBucket: process.env.MINIO_BUCKET_NAME,
    minioRegion: process.env.MINIO_REGION,

    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000'
    }
  }
})
