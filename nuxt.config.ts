// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase'
  ],
  supabase: {
    url: process.env.SUPABASE_URL || 'https://xklnwohwmirfcfzhzong.supabase.co',
    key: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbG53b2h3bWlyZmNmemh6b25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzExNTIsImV4cCI6MjA3NDc0NzE1Mn0._EU8__293KLsWfRppzNDbqd1ygrDIfrhyLxv3Q-Q2Jk',
    redirectOptions: {
      login: '/',
      callback: '/atendimentos',
      exclude: ['/']
    }
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://xklnwohwmirfcfzhzong.supabase.co',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbG53b2h3bWlyZmNmemh6b25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzExNTIsImV4cCI6MjA3NDc0NzE1Mn0._EU8__293KLsWfRppzNDbqd1ygrDIfrhyLxv3Q-Q2Jk'
    }
  }
})
