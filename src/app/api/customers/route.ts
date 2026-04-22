import { NextResponse } from 'next/server';
import { customerOps } from '@/lib/db-operations';
import { getCurrentUserFromRequest, getUserCustomerIds } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // 获取当前用户
    const user = await getCurrentUserFromRequest(request);
    
    // 获取用户关联的商户ID
    const customerIds = getUserCustomerIds(user);
    
    // 如果用户没有任何关联商户且不是管理员，返回空列表
    if (customerIds !== null && customerIds.length === 0) {
      return NextResponse.json({ customers: [], total: 0, message: '无可访问的商户' });
    }

    // 获取商户列表（带商户过滤）
    let customers;
    if (customerIds === null) {
      // 管理员可以看到所有商户
      customers = await customerOps.getAll();
    } else {
      // 非管理员只能看到自己关联的商户
      const allCustomers = await customerOps.getAll();
      customers = allCustomers.filter(c => customerIds.includes(c.id));
    }
    
    return NextResponse.json({
      customers,
      total: customers.length,
    });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customer = await customerOps.create(body);
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Failed to create customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
