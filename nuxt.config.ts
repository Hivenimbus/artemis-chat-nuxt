// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  devServer: {
    port: parseInt(process.env.PORT || '3000')
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
    meowApiUrl: process.env.NUXT_MEOW_API_URL || process.env.MEOW_API_URL,
    meowApiKey: process.env.NUXT_MEOW_API_KEY || process.env.MEOW_API_KEY,
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
