// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase'
  ],
  supabase: {
    url: process.env.SUPABASE_URL || 'https://gphjqwibtdkqxtuwtncz.supabase.co',
    key: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwaGpxd2lidGRrcXh0dXd0bmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDU2OTEsImV4cCI6MjA3NjEyMTY5MX0.grLnZKGw8z0ohJ0MIc4xBQRclmajQAposgHKCpuyZ8U',
    redirectOptions: {
      login: '/',
      callback: '/atendimentos',
      exclude: ['/']
    },
    clientOptions: {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    },
    cookieOptions: {
      maxAge: 60 * 60 * 8, // 8 horas
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  },
  runtimeConfig: {
    // Private keys (only available on server-side)
    evolutionApiUrl: process.env.EVOLUTION_API_URL,
    evolutionApiKey: process.env.EVOLUTION_API_KEY,

    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://gphjqwibtdkqxtuwtncz.supabase.co',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwaGpxd2lidGRrcXh0dXd0bmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDU2OTEsImV4cCI6MjA3NjEyMTY5MX0.grLnZKGw8z0ohJ0MIc4xBQRclmajQAposgHKCpuyZ8U',
      siteUrl: process.env.SITE_URL || 'http://localhost:3000'
    }
  }
})
