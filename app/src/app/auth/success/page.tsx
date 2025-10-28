'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to dashboard after 2 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card max-w-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Successfully Connected!</h1>
        <p className="text-gray-600 mb-4">
          Your Gmail and Calendar have been connected.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to dashboard...
        </p>
      </div>
    </div>
  );
}

