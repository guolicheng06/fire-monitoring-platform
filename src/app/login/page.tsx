'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import { Flame, Eye, EyeOff, LogIn, User, Lock, AlertCircle, Shield, Zap } from 'lucide-react';

// 演示账号快速登录按钮组件
function DemoAccountButton({
  username,
  password,
  label,
  color,
  onClick
}: {
  username: string;
  password: string;
  label: string;
  color: string;
  onClick: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleQuickLogin = async () => {
    onClick();
  };

  return (
    <button
      onClick={handleQuickLogin}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
        'hover:scale-[1.02] active:scale-[0.98]',
        'border-[#2D2D2D] hover:border-opacity-50'
      )}
      style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }}
      title={`用户名: ${username}`}
    >
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[#E5E5E5] text-xs font-medium">{label}</span>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  // 如果已登录，跳转首页
  useEffect(() => {
    if (!isLoading && user) {
      console.log('[登录页] 用户已登录，跳转首页', user.username);
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebugInfo('');

    console.log('[登录页] 开始登录:', { username, password: '***' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      console.log('[登录页] API 响应状态:', response.status);
      console.log('[登录页] Cookie 设置检查:', document.cookie);

      const result = await response.json();
      console.log('[登录页] API 响应数据:', result);

      if (result.success && result.user) {
        console.log('[登录页] 登录成功，准备跳转');
        // 直接调用 login 更新 context
        await login(username, password);
        // 跳转
        router.push('/');
      } else {
        console.log('[登录页] 登录失败:', result.message);
        setError(result.message || '登录失败，请检查用户名和密码');
        setDebugInfo(`状态码: ${response.status}\n响应: ${JSON.stringify(result)}`);
      }
    } catch (err) {
      console.error('[登录页] 请求异常:', err);
      setError('网络错误，请检查网络连接后重试');
      setDebugInfo(`错误: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* 顶部装饰 */}
      <div className="relative h-48 bg-gradient-to-br from-[#0078D4] via-[#0056B3] to-[#003366] overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 w-32 h-32 border border-white rounded-full" />
          <div className="absolute top-16 right-12 w-24 h-24 border border-white rounded-full" />
          <div className="absolute bottom-8 left-1/4 w-16 h-16 border border-white rounded-full" />
        </div>
        
        {/* Logo区域 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
            <Flame className="w-12 h-12 text-[#FF6B35]" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide">智慧消防监控</h1>
          <p className="text-white/70 text-sm mt-1">Smart Fire Monitoring Platform</p>
        </div>
      </div>

      {/* 登录表单区域 */}
      <div className="flex-1 px-6 py-8 -mt-6">
        <div className="bg-[#1A1A1A] rounded-t-3xl rounded-b-lg p-6 shadow-2xl border border-[#2D2D2D]">
          {/* 欢迎语 */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-[#E5E5E5]">欢迎回来</h2>
            <p className="text-[#6C6C6C] text-sm mt-1">请登录您的账号</p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-4 bg-[#D32F2F]/10 border border-[#D32F2F]/30 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-[#D32F2F] shrink-0" />
                <p className="text-[#D32F2F] text-sm">{error}</p>
              </div>
              {debugInfo && (
                <pre className="text-[#D32F2F]/70 text-xs mt-2 whitespace-pre-wrap bg-black/20 p-2 rounded">
                  {debugInfo}
                </pre>
              )}
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* 用户名输入 */}
            <div className="space-y-2">
              <label className="text-[#A0A0A0] text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                用户名
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className={cn(
                    'w-full bg-[#222222] border border-[#3A3A3A] rounded-xl px-4 py-3.5',
                    'text-[#E5E5E5] placeholder-[#6C6C6C]',
                    'focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]',
                    'transition-all duration-200'
                  )}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div className="space-y-2">
              <label className="text-[#A0A0A0] text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className={cn(
                    'w-full bg-[#222222] border border-[#3A3A3A] rounded-xl px-4 py-3.5 pr-12',
                    'text-[#E5E5E5] placeholder-[#6C6C6C]',
                    'focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]',
                    'transition-all duration-200'
                  )}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6C6C6C] hover:text-[#A0A0A0] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-4 rounded-xl font-semibold text-white',
                'bg-gradient-to-r from-[#0078D4] to-[#0056B3]',
                'hover:from-[#0066C4] hover:to-[#0046A3]',
                'active:scale-[0.98] transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2',
                'shadow-lg shadow-[#0078D4]/20'
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  登录
                </>
              )}
            </button>
          </form>

          {/* 演示账号快速登录 */}
          <div className="mt-6 p-4 bg-[#1A1A1A] rounded-xl border border-[#2D2D2D]">
            <p className="text-[#A0A0A0] text-xs mb-3 text-center">演示账号（点击直接登录）</p>
            <div className="grid grid-cols-3 gap-2">
              <DemoAccountButton username="admin" password="admin123" label="管理员" color="#D32F2F" onClick={() => { setUsername('admin'); setPassword('admin123'); }} />
              <DemoAccountButton username="property" password="property123" label="物业" color="#0078D4" onClick={() => { setUsername('property'); setPassword('property123'); }} />
              <DemoAccountButton username="tech1" password="tech123" label="施工员1" color="#FF9800" onClick={() => { setUsername('tech1'); setPassword('tech123'); }} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <DemoAccountButton username="tech2" password="tech123" label="施工员2" color="#FF9800" onClick={() => { setUsername('tech2'); setPassword('tech123'); }} />
              <DemoAccountButton username="tech3" password="tech123" label="施工员3" color="#FF9800" onClick={() => { setUsername('tech3'); setPassword('tech123'); }} />
              <DemoAccountButton username="owner1" password="owner123" label="业主(老街火锅)" color="#4CAF50" onClick={() => { setUsername('owner1'); setPassword('owner123'); }} />
              <DemoAccountButton username="owner2" password="owner123" label="业主(川味小馆)" color="#9C27B0" onClick={() => { setUsername('owner2'); setPassword('owner123'); }} />
            </div>
            <p className="text-[#6C6C6C] text-[10px] mt-3 text-center">
              账号: admin / admin123
            </p>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-6 text-center">
          <p className="text-[#6C6C6C] text-xs">
            登录即表示同意{' '}
            <button className="text-[#0078D4] hover:underline">用户协议</button>
            {' '}和{' '}
            <button className="text-[#0078D4] hover:underline">隐私政策</button>
          </p>
        </div>

        {/* 版本信息 */}
        <div className="mt-4 text-center">
          <p className="text-[#3A3A3A] text-xs">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
