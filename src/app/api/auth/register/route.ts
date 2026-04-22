/**
 * 用户注册 API
 */

import { NextResponse } from 'next/server';
import { authOps, roleOps } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, realName, phone, roleCode } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: '用户名、邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: '密码长度至少6位' },
        { status: 400 }
      );
    }

    // 注册用户
    const result = await authOps.register(username, email, password, realName, phone);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // 如果指定了角色，分配角色
    if (result.user && roleCode) {
      try {
        await roleOps.assignRole(result.user.id, roleCode);
      } catch (roleError) {
        console.error('分配角色失败:', roleError);
      }
    }

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: result.user,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
