'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PixelPet from '@/components/PixelPet';
import LockScreen from '@/components/LockScreen';
import { useAuth } from '@/context/AuthContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push('/login');
    }
  }, [user, loading, isLoginPage, router]);

  if (isLoginPage) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  // If loading session, show an elegant splash
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">Loading Trading Journal...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 lg:pl-64 min-h-screen">
        {children}
      </div>
      <PixelPet />
      <LockScreen />
    </>
  );
}
