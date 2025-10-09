import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Get authenticated Supabase client for server-side operations
 */
export const useSupabaseServer = async (event: H3Event) => {
  return await serverSupabaseClient(event)
}

/**
 * Get authenticated user from Supabase session
 */
export const getServerUser = async (event: H3Event) => {
  return await serverSupabaseUser(event)
}
