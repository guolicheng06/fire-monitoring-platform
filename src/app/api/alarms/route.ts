import { NextResponse } from 'next/server';
import { alarmOps } from '@/lib/db-operations';
import { getCurrentUserFromRequest, getUserCustomerIds } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // 获取当前用户
    const user = await getCurrentUserFromRequest(request);
    
    // 获取用户关联的商户ID
    const customerIds = getUserCustomerIds(user);
    
    // 如果用户没有任何关联商户且不是管理员，返回空列表
    if (customerIds !== null && customerIds.length === 0) {
      return NextResponse.json({ alarms: [], total: 0, message: '无可访问的报警记录' });
    }

    // 获取报警列表（带商户过滤）
    const alarms = await alarmOps.getAll(100, customerIds || undefined);
    
    return NextResponse.json({
      alarms,
      total: alarms.length,
    });
  } catch (error) {
    console.error('Failed to fetch alarms:', error);
    return NextResponse.json({ error: 'Failed to fetch alarms' }, { status: 500 });
  }
}
