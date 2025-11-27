'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase, signOut } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-accent-beige">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Cosos"
                width={100}
                height={32}
                className="object-contain"
                priority
              />
            </Link>

            {user && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'border-action text-foreground'
                      : 'border-transparent text-foreground/60 hover:border-accent-beige hover:text-foreground'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/artifacts"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive('/artifacts')
                      ? 'border-action text-foreground'
                      : 'border-transparent text-foreground/60 hover:border-accent-beige hover:text-foreground'
                  }`}
                >
                  Artifacts
                </Link>
                <Link
                  href="/projects"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive('/projects')
                      ? 'border-action text-foreground'
                      : 'border-transparent text-foreground/60 hover:border-accent-beige hover:text-foreground'
                  }`}
                >
                  Projects
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-foreground/70">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/" className="btn-primary">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

