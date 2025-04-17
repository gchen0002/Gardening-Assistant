import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // Use createServerActionClient which directly accepts cookies()
    const supabase = createServerActionClient({ cookies })
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful exchange, redirect to origin + next path
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Log error if exchange failed
    console.error('Supabase code exchange error:', error.message);
  } else {
    // Log error if code is missing
    console.error('Callback Error: No code parameter received.');
  }

  // Redirect to an error page on any failure
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
} 