'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Loading from '@/components/Loading';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        const code = searchParams.get('code');
        
        if (code) {
          // Exchange code for session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code:', error);
            router.push('/?error=auth_failed');
            return;
          }
        }

        // Check if user has completed onboarding
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if user context exists
          const { data: context } = await supabase
            .from('user_context')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (!context) {
            // Redirect to onboarding
            router.push('/onboarding');
          } else {
            // Redirect to dashboard
            router.push('/dashboard');
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/?error=unknown');
      }
    };

    handleCallback();
  }, [router]);

  return <Loading />;
}

