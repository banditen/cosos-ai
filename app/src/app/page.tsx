'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Loading from '@/components/Loading';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // User is logged in, redirect to home
        router.push('/home');
      } else {
        // User is not logged in, redirect to login page
        router.push('/login');
      }
    });
  }, [router]);

  return <Loading />;
}

