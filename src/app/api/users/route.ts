/**
 * 用户管理 API
 */

import { NextResponse } from 'next/server';
import { userManagementOps, roleOps, type UserWithRoles } from '@/lib/auth';

// 获取所有用户
export async function GET() {
  try {
    const users = await userManagementOps.getAllUsers();
    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, message: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

// 创建用户
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, realName, phone, roleCode, customerId } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: '用户名、邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    // 创建用户
    const result = await userManagementOps.createUser(username, email, password, realName, phone);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // 如果指定了角色，分配角色
    if (result.user && roleCode) {
      try {
        await roleOps.assignRole(result.user.id, roleCode, customerId);
      } catch (roleError) {
        console.error('分配角色失败:', roleError);
      }
    }

    return NextResponse.json({
      success: true,
      message: '创建用户成功',
      user: result.user,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, message: '创建用户失败' },
      { status: 500 }
    );
  }
}
