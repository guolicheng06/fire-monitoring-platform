import { NextResponse } from 'next/server';
import { customerOps, deviceOps } from '@/lib/db-operations';

// 初始化示例数据
export async function POST() {
  try {
    // 检查是否已有数据
    const existingCustomers = await customerOps.getAll();
    if (existingCustomers.length > 0) {
      return NextResponse.json({ message: 'Data already exists', count: existingCustomers.length });
    }

    // 创建示例商户
    const customers = [
      {
        name: '老街火锅店',
        address: 'XX区XX路123号',
        contact_person: '张老板',
        contact_phone: '13800138001',
        district: '一区',
        risk_level: 'high' as const,
      },
      {
        name: '川味小馆',
        address: 'XX区XX路456号',
        contact_person: '李经理',
        contact_phone: '13800138002',
        district: '二区',
        risk_level: 'medium' as const,
      },
      {
        name: '麻辣香锅',
        address: 'XX区XX路789号',
        contact_person: '王老板',
        contact_phone: '13800138003',
        district: '三区',
        risk_level: 'high' as const,
      },
      {
        name: '重庆火锅',
        address: 'XX区XX路321号',
        contact_person: '赵经理',
        contact_phone: '13800138004',
        district: '一区',
        risk_level: 'high' as const,
      },
      {
        name: '串串香火锅',
        address: 'XX区XX路654号',
        contact_person: '刘老板',
        contact_phone: '13800138005',
        district: '二区',
        risk_level: 'medium' as const,
      },
    ];

    const createdCustomers = [];
    for (const customer of customers) {
      const created = await customerOps.create(customer);
      createdCustomers.push(created);
    }

    // 创建示例设备
    const devices = [
      // 老街火锅店设备
      { device_code: 'GAS-001', device_type: 'gas_detector' as const, device_name: '后厨可燃气体探测器', customer_id: createdCustomers[0].id, location: '后厨' },
      { device_code: 'GAS-002', device_type: 'gas_detector' as const, device_name: '前厅可燃气体探测器', customer_id: createdCustomers[0].id, location: '前厅' },
      { device_code: 'TEMP-001', device_type: 'temperature_detector' as const, device_name: '后厨温度探测器', customer_id: createdCustomers[0].id, location: '后厨' },
      { device_code: 'SMOKE-001', device_type: 'smoke_detector' as const, device_name: '后厨烟雾探测器', customer_id: createdCustomers[0].id, location: '后厨' },
      { device_code: 'FIRE-001', device_type: 'fire_alarm' as const, device_name: '火灾报警主机', customer_id: createdCustomers[0].id, location: '消控室' },
      
      // 川味小馆设备
      { device_code: 'GAS-003', device_type: 'gas_detector' as const, device_name: '厨房可燃气体探测器', customer_id: createdCustomers[1].id, location: '厨房' },
      { device_code: 'TEMP-002', device_type: 'temperature_detector' as const, device_name: '厨房温度探测器', customer_id: createdCustomers[1].id, location: '厨房' },
      { device_code: 'SMOKE-002', device_type: 'smoke_detector' as const, device_name: '餐厅烟雾探测器', customer_id: createdCustomers[1].id, location: '餐厅' },
      
      // 麻辣香锅设备
      { device_code: 'GAS-004', device_type: 'gas_detector' as const, device_name: '主厨房气体探测器', customer_id: createdCustomers[2].id, location: '主厨房' },
      { device_code: 'GAS-005', device_type: 'gas_detector' as const, device_name: '副厨房气体探测器', customer_id: createdCustomers[2].id, location: '副厨房' },
      { device_code: 'TEMP-003', device_type: 'temperature_detector' as const, device_name: '主厨房温度探测器', customer_id: createdCustomers[2].id, location: '主厨房' },
      { device_code: 'SMOKE-003', device_type: 'smoke_detector' as const, device_name: '主厨房烟雾探测器', customer_id: createdCustomers[2].id, location: '主厨房' },
      { device_code: 'FIRE-002', device_type: 'fire_alarm' as const, device_name: '火灾报警控制箱', customer_id: createdCustomers[2].id, location: '门口' },
      
      // 重庆火锅设备
      { device_code: 'GAS-006', device_type: 'gas_detector' as const, device_name: '底料区气体探测器', customer_id: createdCustomers[3].id, location: '底料区' },
      { device_code: 'TEMP-004', device_type: 'temperature_detector' as const, device_name: '大厅温度探测器', customer_id: createdCustomers[3].id, location: '大厅' },
      { device_code: 'SMOKE-004', device_type: 'smoke_detector' as const, device_name: '大厅烟雾探测器', customer_id: createdCustomers[3].id, location: '大厅' },
      
      // 串串香火锅设备
      { device_code: 'GAS-007', device_type: 'gas_detector' as const, device_name: '后厨气体探测器', customer_id: createdCustomers[4].id, location: '后厨' },
      { device_code: 'TEMP-005', device_type: 'temperature_detector' as const, device_name: '后厨温度探测器', customer_id: createdCustomers[4].id, location: '后厨' },
    ];

    for (const device of devices) {
      await deviceOps.create(device);
    }

    return NextResponse.json({
      message: 'Data seeded successfully',
      customers: createdCustomers.length,
      devices: devices.length,
    });
  } catch (error) {
    console.error('Failed to seed data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
