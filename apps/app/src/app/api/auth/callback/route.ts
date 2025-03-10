import { NextResponse } from 'next/server';
import { createClient } from '@v1/supabase/server';

// Ensure this route is always handled at runtime
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get and log the full URL for debugging
    const fullUrl = request.url;
    console.log(`Auth callback URL: ${fullUrl}`);
    
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    // Handle missing code
    if (!code) {
      console.log('Auth callback: Missing code parameter');
      return NextResponse.redirect(`${requestUrl.origin}/en/login?error=missing-code`);
    }
    
    console.log('Auth callback: Creating Supabase client');
    const supabase = createClient();
    
    // Basic session exchange with minimal error handling
    try {
      console.log('Auth callback: Exchanging code for session');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback: Exchange error', error);
        return NextResponse.redirect(`${requestUrl.origin}/en/login?error=${error.message}`);
      }
      
      console.log('Auth callback: Exchange successful');
      // Simple redirect to root on success
      return NextResponse.redirect(`${requestUrl.origin}/en`);
    } catch (exchangeError) {
      console.error('Auth callback: Exception during exchange', exchangeError);
      return NextResponse.redirect(`${requestUrl.origin}/en/login?error=exchange-exception`);
    }
  } catch (globalError) {
    // Global error handler
    console.error('Auth callback: Global exception', globalError);
    return new Response('Error during authentication', { status: 500 });
  }
}
