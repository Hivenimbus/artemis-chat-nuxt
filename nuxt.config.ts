// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  devServer: {
    port: 3000
  },
  // Configuração do Nitro para incluir módulos no bundle (necessário para Docker)
  nitro: {
    externals: {
      inline: ['@supabase/supabase-js', '@supabase/node-fetch']
    }
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    'nuxt-emoji-picker',
    '@vueuse/nuxt'
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
    // Aceita tanto NUXT_* (padrão Nuxt) quanto sem prefixo (compatibilidade)
    evolutionApiUrl: process.env.NUXT_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL,
    evolutionApiKey: process.env.NUXT_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY,

    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://gphjqwibtdkqxtuwtncz.supabase.co',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwaGpxd2lidGRrcXh0dXd0bmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDU2OTEsImV4cCI6MjA3NjEyMTY5MX0.grLnZKGw8z0ohJ0MIc4xBQRclmajQAposgHKCpuyZ8U',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000'
    }
  }
})
