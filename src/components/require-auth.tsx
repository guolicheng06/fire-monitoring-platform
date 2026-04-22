'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Loader2, ShieldOff, LogIn } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // 跳过登录页的验证
    if (pathname === '/login') return;
    
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, pathname, router]);

  // 登录页不需要验证
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        {/* 顶部装饰 */}
        <div className="h-48 bg-gradient-to-br from-[#0078D4] via-[#0056B3] to-[#003366] flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#6C6C6C]">正在验证身份...</p>
        </div>
      </div>
    );
  }

  // 未登录状态
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        {/* 顶部装饰 */}
        <div className="relative h-48 bg-gradient-to-br from-[#0078D4] via-[#0056B3] to-[#003366] overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-8 left-8 w-32 h-32 border border-white rounded-full" />
            <div className="absolute top-16 right-12 w-24 h-24 border border-white rounded-full" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ShieldOff className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 -mt-16">
          <div className="bg-[#1A1A1A] rounded-t-3xl rounded-b-lg p-6 max-w-sm w-full shadow-2xl border border-[#2D2D2D] text-center">
            <h2 className="text-xl font-semibold text-[#E5E5E5] mb-2">请先登录</h2>
            <p className="text-[#6C6C6C] mb-6">您需要登录后才能访问此平台</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-gradient-to-r from-[#0078D4] to-[#0056B3] text-white rounded-xl font-medium hover:from-[#0066C4] hover:to-[#0046A3] transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              前往登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
