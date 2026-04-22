'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// 用户角色信息
export interface UserRole {
  roleId: string;
  roleCode: string;
  roleName: string;
  permissions: string[];
  customerId: string | null;
}

// 用户信息
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  realName: string | null;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: UserRole[];
}

// 权限检查类型
type Permission = string;

// 权限上下文
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (roleCode: string) => boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 权限配置
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'dashboard:view',
    'devices:view', 'devices:add', 'devices:edit', 'devices:delete',
    'alarms:view', 'alarms:acknowledge', 'alarms:resolve',
    'merchants:view', 'merchants:add', 'merchants:edit', 'merchants:delete',
    'tasks:view', 'tasks:add', 'tasks:edit', 'tasks:assign',
    'users:view', 'users:add', 'users:edit', 'users:delete',
    'settings:view', 'settings:edit',
    'reports:view', 'reports:export',
    'ai:use', 'ai:risk',
  ],
  property_manager: [
    'dashboard:view',
    'devices:view', 'devices:add', 'devices:edit',
    'alarms:view', 'alarms:acknowledge', 'alarms:resolve',
    'merchants:view', 'merchants:edit',
    'tasks:view', 'tasks:add', 'tasks:edit',
    'reports:view', 'reports:export',
    'ai:use',
  ],
  technician: [
    'dashboard:view',
    'devices:view', 'devices:edit',
    'alarms:view', 'alarms:acknowledge',
    'merchants:view',
    'tasks:view', 'tasks:edit',
    'ai:use',
  ],
  owner: [
    'dashboard:view',
    'devices:view',
    'alarms:view',
    'merchants:view',
    'tasks:view',
    'ai:use',
  ],
  viewer: [
    'dashboard:view',
    'devices:view',
    'alarms:view',
    'merchants:view',
  ],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 获取当前用户信息
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // 确保请求带上 Cookie
      });
      const result = await response.json();
      
      if (result.success && result.user) {
        setUser(result.user as AuthUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化时获取用户信息
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 登录
  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 确保请求带上 Cookie
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success && result.user) {
        setUser(result.user as AuthUser);
        return { success: true };
      }

      return { success: false, message: result.message || '登录失败' };
    } catch {
      return { success: false, message: '网络错误' };
    }
  };

  // 登出
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include', // 确保请求带上 Cookie
      });
    } finally {
      setUser(null);
      router.push('/login');
      router.refresh();
    }
  };

  // 检查是否有指定权限
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    
    // 管理员拥有所有权限
    if (user.roles.some(r => r.roleCode === 'admin')) return true;
    
    // 检查用户角色权限
    for (const role of user.roles) {
      const rolePerms = ROLE_PERMISSIONS[role.roleCode] || [];
      if (rolePerms.includes(permission)) return true;
    }
    
    return false;
  }, [user]);

  // 检查是否有任一权限
  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);

  // 检查是否有指定角色
  const hasRole = useCallback((roleCode: string): boolean => {
    if (!user) return false;
    return user.roles.some(r => r.roleCode === roleCode);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        hasPermission,
        hasAnyPermission,
        hasRole,
        login,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 权限检查组件
interface RequirePermissionProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({ permission, children, fallback = null }: RequirePermissionProps) {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// 角色检查组件
interface RequireRoleProps {
  roleCode: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ roleCode, children, fallback = null }: RequireRoleProps) {
  const { hasRole } = useAuth();
  
  if (!hasRole(roleCode)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
