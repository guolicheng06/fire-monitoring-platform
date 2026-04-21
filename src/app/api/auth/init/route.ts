/**
 * 初始化认证数据
 * 创建默认角色和测试用户，并关联到商户
 */

import { NextResponse } from 'next/server';
import { roleOps, authOps } from '@/lib/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { customerOps } from '@/lib/db-operations';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const client = getSupabaseClient();

    // 1. 初始化默认角色
    await roleOps.initDefaultRoles();
    const roles = await roleOps.getAllRoles();

    // 2. 如果强制刷新，先删除旧用户
    if (force) {
      // 获取所有测试用户
      const testUsernames = ['admin', 'property', 'tech1', 'tech2', 'tech3', 'owner1'];
      for (const username of testUsernames) {
        // 查找用户
        const { data: user } = await client
          .from('users')
          .select('id')
          .eq('username', username)
          .maybeSingle();
        
        if (user) {
          // 删除用户角色关联
          await client.from('user_roles').delete().eq('user_id', user.id);
          // 删除用户
          await client.from('users').delete().eq('id', user.id);
        }
      }
    }

    // 3. 获取商户列表用于关联
    const customers = await customerOps.getAll();
    const customerMap = new Map(customers.map(c => [c.name, c.id]));

    // 4. 创建测试用户并关联到商户
    const testUsers = [
      { username: 'admin', email: 'admin@example.com', password: 'admin123', realName: '系统管理员', roleCode: 'admin', customerName: null },
      { username: 'property', email: 'property@example.com', password: 'property123', realName: '物业管理员', roleCode: 'property_manager', customerName: null },
      { username: 'tech1', email: 'tech1@example.com', password: 'tech123', realName: '张明', roleCode: 'technician', customerName: null },
      { username: 'tech2', email: 'tech2@example.com', password: 'tech123', realName: '李华', roleCode: 'technician', customerName: null },
      { username: 'tech3', email: 'tech3@example.com', password: 'tech123', realName: '王强', roleCode: 'technician', customerName: null },
      { username: 'owner1', email: 'owner1@example.com', password: 'owner123', realName: '王老板', roleCode: 'owner', customerName: '老街火锅店' },
      { username: 'owner2', email: 'owner2@example.com', password: 'owner123', realName: '李老板', roleCode: 'owner', customerName: '川味小馆' },
    ];

    const createdUsers = [];
    for (const user of testUsers) {
      const result = await authOps.register(user.username, user.email, user.password, user.realName);
      if (result.success && result.user) {
        // 如果指定了商户，关联到该商户
        const customerId = user.customerName ? customerMap.get(user.customerName) : undefined;
        await roleOps.assignRole(result.user.id, user.roleCode, customerId);
        createdUsers.push({ 
          username: user.username, 
          roleCode: user.roleCode,
          customerId: customerId || null,
          customerName: user.customerName || null
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: '初始化完成',
      roles: roles.length,
      users: createdUsers,
    });
  } catch (error) {
    console.error('Init auth data error:', error);
    return NextResponse.json(
      { success: false, message: '初始化失败' },
      { status: 500 }
    );
  }
}
