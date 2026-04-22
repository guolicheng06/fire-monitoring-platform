/**
 * 单个用户管理 API
 */

import { NextResponse } from 'next/server';
import { userManagementOps, roleOps } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取单个用户
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const users = await userManagementOps.getAllUsers();
    const user = users.find(u => u.id === id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: '获取用户失败' },
      { status: 500 }
    );
  }
}

// 更新用户
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { realName, phone, isActive, roleCode, customerId, newPassword } = body;

    // 更新基本信息
    if (realName !== undefined || phone !== undefined || isActive !== undefined) {
      const updated = await userManagementOps.updateUser(id, { realName, phone, isActive });
      if (!updated) {
        return NextResponse.json(
          { success: false, message: '更新用户失败' },
          { status: 400 }
        );
      }
    }

    // 重置密码
    if (newPassword) {
      const passwordReset = await userManagementOps.resetPassword(id, newPassword);
      if (!passwordReset) {
        return NextResponse.json(
          { success: false, message: '重置密码失败' },
          { status: 400 }
        );
      }
    }

    // 更新角色
    if (roleCode !== undefined) {
      // 先获取用户当前角色
      const users = await userManagementOps.getAllUsers();
      const user = users.find(u => u.id === id);
      
      if (user) {
        // 移除旧角色
        for (const role of user.roles) {
          await roleOps.removeRole(id, role.roleId);
        }
        // 添加新角色
        if (roleCode) {
          await roleOps.assignRole(id, roleCode, customerId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '更新用户成功',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, message: '更新用户失败' },
      { status: 500 }
    );
  }
}

// 删除用户
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = await userManagementOps.deleteUser(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: '删除用户失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除用户成功',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, message: '删除用户失败' },
      { status: 500 }
    );
  }
}
