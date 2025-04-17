import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'

// Create a Supabase client configured to work in a browser environment
export const createClient = () =>
  createPagesBrowserClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  }) 