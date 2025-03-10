import { NextResponse } from 'next/server';
import { createClient } from '@v1/supabase/server';

// Ensure this route is always handled at runtime
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(`${requestUrl.origin}/en/login?error=missing-code`);
    }
    
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/en/login?error=${encodeURIComponent(error.message)}`);
    }
    
    return NextResponse.redirect(`${requestUrl.origin}/en/events`);
  } catch (error) {
    console.error('Auth callback exception:', error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/en/login?error=unexpected`);
  }
}
