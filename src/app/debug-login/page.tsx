'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';

export default function DebugLoginPage() {
  const router = useRouter();
  const { user, login, isLoading } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [debug, setDebug] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string>('');

  const addDebug = (msg: string) => {
    setDebug(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleTest = async () => {
    addDebug('开始测试...');
    setTestResult('');

    // 1. 测试直接 API 调用
    addDebug(`1. 测试 API: ${window.location.origin}/api/auth/login`);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      
      addDebug(`   响应状态: ${response.status}`);
      
      const setCookieHeader = response.headers.get('set-cookie');
      addDebug(`   Set-Cookie 头: ${setCookieHeader ? '有' : '无'}`);
      
      const data = await response.json();
      addDebug(`   响应数据: success=${data.success}, message=${data.message}`);
      
      if (data.success) {
        addDebug('   ✓ 登录成功！');
        setTestResult('success');
        
        // 2. 检查 Cookie 是否被设置
        addDebug('2. 检查 Cookie:');
        const cookies = document.cookie;
        addDebug(`   document.cookie: "${cookies}"`);
        if (cookies.includes('auth_token')) {
          addDebug('   ✓ auth_token 存在');
        } else {
          addDebug('   ✗ auth_token 不存在 - 这是问题所在！');
        }

        // 3. 测试获取用户信息
        addDebug('3. 测试 /api/auth/me:');
        try {
          const meResponse = await fetch('/api/auth/me', {
            credentials: 'include',
          });
          addDebug(`   响应状态: ${meResponse.status}`);
          const meData = await meResponse.json();
          if (meData.success) {
            addDebug(`   ✓ 获取用户成功: ${meData.user.username}`);
          } else {
            addDebug(`   ✗ 获取用户失败: ${meData.message}`);
          }
        } catch (err) {
          addDebug(`   ✗ 请求失败: ${err}`);
        }
      } else {
        addDebug(`   ✗ 登录失败: ${data.message}`);
        setTestResult('error');
      }
    } catch (err) {
      addDebug(`   ✗ 请求失败: ${err}`);
      setTestResult('error');
    }
  };

  // 跳转到首页测试
  const handleJumpToHome = () => {
    addDebug('准备跳转到首页...');
    router.push('/');
  };

  // 手动刷新页面测试
  const handleRefresh = () => {
    addDebug('刷新页面...');
    window.location.reload();
  };

  useEffect(() => {
    addDebug(`页面加载，当前用户: ${user?.username || '(未登录)'}`);
    addDebug(`Cookie: ${document.cookie}`);
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">登录调试页面</h1>
        
        <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">登录测试</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[#A0A0A0] text-sm mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#222222] border border-[#3A3A3A] rounded px-3 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-[#A0A0A0] text-sm mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#222222] border border-[#3A3A3A] rounded px-3 py-2 text-white"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleTest}
                className="px-4 py-2 bg-[#0078D4] text-white rounded hover:bg-[#0066C4] transition-colors"
              >
                执行测试
              </button>
              <button
                onClick={handleJumpToHome}
                className="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#388E3C] transition-colors"
              >
                跳转首页
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-[#FF9800] text-white rounded hover:bg-[#F57C00] transition-colors"
              >
                刷新页面
              </button>
            </div>
          </div>
          
          {testResult && (
            <div className={cn(
              'mt-4 p-3 rounded-lg',
              testResult === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            )}>
              {testResult === 'success' ? '✓ 登录测试成功' : '✗ 登录测试失败'}
            </div>
          )}
        </div>
        
        <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">调试日志</h2>
          <div className="bg-black rounded p-4 font-mono text-sm space-y-1 max-h-96 overflow-auto">
            {debug.map((msg, i) => (
              <div key={i} className={cn(
                msg.includes('✓') ? 'text-green-400' : 
                msg.includes('✗') ? 'text-red-400' : 'text-gray-300'
              )}>
                {msg}
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-[#1A1A1A] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">排查说明</h2>
          <div className="text-[#A0A0A0] text-sm space-y-2">
            <p>1. 点击"执行测试"后，查看 Cookie 是否被设置</p>
            <p>2. 如果 Cookie 存在但显示"获取用户失败"，说明 Cookie 没有被正确发送</p>
            <p>3. 点击"跳转首页"测试登录后能否正常跳转</p>
            <p>4. 点击"刷新页面"测试刷新后是否保持登录状态</p>
            <p className="text-yellow-400 mt-4">请把这些测试结果发给我，帮助诊断问题</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <a href="/login" className="text-[#0078D4] hover:underline">
            返回正常登录页面
          </a>
        </div>
      </div>
    </div>
  );
}
