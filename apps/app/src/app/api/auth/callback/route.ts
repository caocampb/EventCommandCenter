import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@v1/supabase/server';

// Ensure this route is always handled at runtime
export const dynamic = 'force-dynamic';

// Known cookie names used by Supabase - these are the ones seen in the actual logs
const POSSIBLE_PKCE_COOKIE_NAMES = [
  'sb-auth-token-code-verifier',
  'sb-auth-code-verifier',
  'sb-127-auth-token-code-verifier',
  'sb-token-code-verifier',
  'sb-pkce-verifier'
];

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    // Required parameter validation
    if (!code) {
      return NextResponse.redirect(`${requestUrl.origin}/en/login?error=missing-code`);
    }

    // Create Supabase client
    const supabase = createClient();
    
    // Handle the auth callback
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth error:', error);
        return NextResponse.redirect(`${requestUrl.origin}/en/login?error=auth-error&message=${encodeURIComponent(error.message)}`);
      }
      
      // On successful authentication, redirect to the events page
      return NextResponse.redirect(`${requestUrl.origin}/en/events`);
    } catch (authError) {
      console.error('Auth exchange error:', authError);
      return NextResponse.redirect(`${requestUrl.origin}/en/login?error=exchange-error`);
    }
  } catch (error) {
    console.error('Callback error:', error);
    // Ensure we always return a response even in case of errors
    return NextResponse.redirect(`/en/login?error=callback-error`);
  }
}
