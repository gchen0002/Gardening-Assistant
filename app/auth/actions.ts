'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function logout() {
  const supabase = createServerActionClient({ cookies })
  await supabase.auth.signOut()
  
  // Revalidate the root path to ensure header updates reflect logout
  revalidatePath('/') 
  
  redirect('/login') // Redirect to login page after logout
} 