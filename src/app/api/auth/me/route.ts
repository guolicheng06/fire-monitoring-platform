/**
 * 获取当前登录用户信息
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authOps, type UserWithRoles } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '未登录', user: null },
        { status: 401 }
      );
    }

    // 验证 token
    const decoded = authOps.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: '登录已过期', user: null },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await authOps.getUserById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在', user: null },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '获取成功',
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: '获取用户信息失败', user: null },
      { status: 500 }
    );
  }
}
