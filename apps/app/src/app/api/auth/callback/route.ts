import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@v1/supabase/server';

// Ensure this route is always handled at runtime, not during build
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
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  
  console.log('Auth callback received:');
  console.log('- Code present:', !!code);
  console.log('- State present:', !!state);
  
  // Log all cookies for debugging
  const cookieList = cookies().getAll();
  const cookieNames = cookieList.map(cookie => cookie.name);
  console.log('Available cookies:', cookieNames);
  
  try {
    if (!code) {
      return NextResponse.redirect(`${requestUrl.origin}/en/login?error=missing-code`);
    }

    // Create Supabase client (will handle cookies automatically)
    const supabase = createClient();
    
    // Use direct exchangeCodeForSession approach to handle the callback
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth error:', error);
      
      if (error.code === 'flow_state_not_found') {
        console.log('Flow state not found. This typically happens when using a code twice or when the state is expired.');
        // Clear the existing cookies to provide a clean slate for the next attempt
        for (const cookie of cookieList) {
          cookies().delete(cookie.name);
        }
        return NextResponse.redirect(`${requestUrl.origin}/en/login?error=expired-session&message=${encodeURIComponent('Your authentication session expired. Please try again.')}`);
      }
      
      return NextResponse.redirect(`${requestUrl.origin}/en/login?error=auth-error&message=${encodeURIComponent(error.message)}`);
    }
    
    console.log('Authentication successful:', !!data?.user);
    
    // Redirect to the home page after successful authentication
    return NextResponse.redirect(`${requestUrl.origin}/en`);
  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect(`${requestUrl.origin}/en/login?error=unexpected-error&message=${encodeURIComponent('An unexpected error occurred during login')}`);
  }
}
