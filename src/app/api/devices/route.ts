import { NextResponse } from 'next/server';
import { deviceOps } from '@/lib/db-operations';
import { getCurrentUserFromRequest, getUserCustomerIds, isAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // 获取当前用户
    const user = await getCurrentUserFromRequest(request);
    
    // 获取用户关联的商户ID
    const customerIds = getUserCustomerIds(user);
    
    // 如果用户没有任何关联商户且不是管理员，返回空列表
    if (customerIds !== null && customerIds.length === 0) {
      return NextResponse.json({ devices: [], total: 0, message: '无可访问的设备' });
    }

    // 获取设备列表（带商户过滤）
    const devices = await deviceOps.getAll(customerIds || undefined);
    
    return NextResponse.json({
      devices,
      total: devices.length,
      isAdmin: isAdmin(user),
    });
  } catch (error) {
    console.error('Failed to fetch devices:', error);
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await getCurrentUserFromRequest(request);
    const customerIds = getUserCustomerIds(user);
    
    // 获取用户的商户ID
    let customerId = body.customer_id;
    
    // 如果没有传入 customer_id，尝试从用户关联的商户中获取
    if (!customerId) {
      if (customerIds && customerIds.length > 0) {
        customerId = customerIds[0];
      } else if (customerIds === null) {
        // 管理员没有限制，但如果没有传入 customer_id，需要返回错误
        return NextResponse.json({ error: '创建设备需要指定商户ID' }, { status: 400 });
      }
    }
    
    // 如果仍然没有 customer_id，返回错误
    if (!customerId) {
      return NextResponse.json({ error: '无法确定设备所属商户' }, { status: 400 });
    }
    
    const deviceData = {
      ...body,
      customer_id: customerId,
    };
    
    const device = await deviceOps.create(deviceData);
    return NextResponse.json(device);
  } catch (error) {
    console.error('Failed to create device:', error);
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 });
  }
}
