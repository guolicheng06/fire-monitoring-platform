/**
 * 角色管理 API
 */

import { NextResponse } from 'next/server';
import { roleOps } from '@/lib/auth';

// 获取所有角色
export async function GET() {
  try {
    const roles = await roleOps.getAllRoles();
    return NextResponse.json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json(
      { success: false, message: '获取角色列表失败' },
      { status: 500 }
    );
  }
}

// 初始化默认角色
export async function POST() {
  try {
    await roleOps.initDefaultRoles();
    const roles = await roleOps.getAllRoles();
    return NextResponse.json({
      success: true,
      message: '初始化角色成功',
      roles,
    });
  } catch (error) {
    console.error('Init roles error:', error);
    return NextResponse.json(
      { success: false, message: '初始化角色失败' },
      { status: 500 }
    );
  }
}
