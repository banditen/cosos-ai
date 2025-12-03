'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash (implicit flow)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          router.push(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        if (session?.user) {
          console.log('User authenticated:', session.user.email);

          // Check if user needs setup
          const { data: userContext } = await supabase
            .from('user_context')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

          if (!userContext) {
            router.push('/setup');
          } else {
            router.push('/home');
          }
        } else {
          // No session, redirect to login
          router.push('/login');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        router.push('/login?error=Authentication failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

