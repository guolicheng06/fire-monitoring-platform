/**
 * 用户登录 API
 */

import { NextResponse } from 'next/server';
import { authOps, roleOps } from '@/lib/auth';

// 初始化默认角色
async function ensureDefaultRoles() {
  try {
    await roleOps.initDefaultRoles();
  } catch (error) {
    console.error('初始化默认角色失败:', error);
  }
}

// 确保默认角色存在
ensureDefaultRoles();

// 本地调试模式：如果数据库未配置，使用模拟登录
const MOCK_USERS = [
  { id: 'mock-1', username: 'admin', password: 'admin123', role: 'admin', name: '管理员' },
  { id: 'mock-2', username: 'operator', password: 'operator123', role: 'operator', name: '操作员' },
  { id: 'mock-3', username: 'user', password: 'user123', role: 'user', name: '普通用户' },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 检查是否使用模拟登录（当数据库连接失败时）
    let result;
    try {
      result = await authOps.login(username, password);
    } catch (dbError) {
      // 数据库连接失败时使用模拟登录
      console.warn('数据库连接失败，使用模拟登录:', dbError);
      const mockUser = MOCK_USERS.find(u => u.username === username && u.password === password);
      if (mockUser) {
        result = {
          success: true,
          message: '模拟登录成功',
          user: {
            id: mockUser.id,
            username: mockUser.username,
            name: mockUser.name,
            role: mockUser.role,
          },
          token: 'mock-token-' + Date.now(),
        };
      } else {
        result = { success: false, message: '用户名或密码错误' };
      }
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    // 返回用户信息和token
    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    });

    // 设置 HTTP-only Cookie
    // 注意：dev.coze.site 使用 HTTPS，所以需要 secure: true
    // sameSite: 'lax' 在大多数情况下可正常工作
    response.cookies.set('auth_token', result.token || '', {
      httpOnly: true,
      secure: true, // dev.coze.site 使用 HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24小时
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
