import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || error)}`, request.url)
    );
  }

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
        );
      }

      if (data.user) {
        console.log('User authenticated:', data.user.email);
        
        // Check if user needs onboarding
        const { data: userContext } = await supabase
          .from('user_context')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        // Redirect to onboarding if no context exists, otherwise to dashboard
        if (!userContext) {
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }
        
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('Unexpected error during auth callback:', error);
      return NextResponse.redirect(
        new URL('/login?error=Authentication failed', request.url)
      );
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}

