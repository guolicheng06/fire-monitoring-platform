'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Loader2, ShieldOff, Home, LogIn } from 'lucide-react';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  redirectToLogin?: boolean;
  children: React.ReactNode;
}

export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  redirectToLogin = true,
  children,
}: PermissionGuardProps) {
  const router = useRouter();
  const { user, isLoading, hasPermission, hasAnyPermission } = useAuth();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setHasChecked(false);
      return;
    }

    if (!user) {
      if (redirectToLogin) {
        router.push('/login');
      }
      setHasChecked(true);
      return;
    }

    if (permission && !hasPermission(permission)) {
      router.push('/');
      setHasChecked(true);
      return;
    }

    if (permissions && permissions.length > 0) {
      const hasAccess = requireAll
        ? permissions.every(p => hasPermission(p))
        : hasAnyPermission(permissions);
      
      if (!hasAccess) {
        router.push('/');
      }
    }
    setHasChecked(true);
  }, [isLoading, user, permission, permissions, requireAll, hasPermission, hasAnyPermission, redirectToLogin, router]);

  // 加载中状态
  if (isLoading || !hasChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#0078D4] animate-spin" />
          <p className="text-[#6C6C6C] text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录状态
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0A0A0A] p-6">
        <div className="bg-[#1E1E1E] rounded-2xl p-8 max-w-sm w-full text-center border border-[#2D2D2D]">
          <div className="w-16 h-16 rounded-full bg-[#D32F2F]/10 flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-8 h-8 text-[#D32F2F]" />
          </div>
          <h2 className="text-xl font-bold text-[#E5E5E5] mb-2">请先登录</h2>
          <p className="text-[#6C6C6C] mb-6">您需要登录后才能访问此页面</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-[#0078D4] text-white rounded-xl font-medium hover:bg-[#0056B3] transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            前往登录
          </button>
        </div>
      </div>
    );
  }

  // 无权限状态（短暂显示，最终会跳转到首页）
  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0A0A0A] p-6">
        <div className="bg-[#1E1E1E] rounded-2xl p-8 max-w-sm w-full text-center border border-[#2D2D2D]">
          <div className="w-16 h-16 rounded-full bg-[#FF9800]/10 flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-8 h-8 text-[#FF9800]" />
          </div>
          <h2 className="text-xl font-bold text-[#E5E5E5] mb-2">权限不足</h2>
          <p className="text-[#6C6C6C] mb-6">您没有访问此页面的权限</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-[#0078D4] text-white rounded-xl font-medium hover:bg-[#0056B3] transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
