import { NextResponse } from 'next/server';
import { customerOps, deviceOps, alarmOps } from '@/lib/db-operations';
import { getCurrentUserFromRequest, getUserCustomerIds, isAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';
    const deviceId = searchParams.get('device_id');
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 获取当前用户
    const user = await getCurrentUserFromRequest(request);
    
    // 获取用户关联的商户ID
    const customerIds = getUserCustomerIds(user);
    
    // 如果用户没有任何关联商户且不是管理员，返回受限数据
    let allowedCustomerIds: string[] | undefined = undefined;
    if (customerIds !== null && customerIds.length === 0) {
      // 用户没有关联任何商户，返回空数据
      return NextResponse.json({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          customers: [],
          devices: [],
          alarms: [],
          stats: {
            devices: { total: 0, online: 0, offline: 0, fault: 0, byType: {} },
            alarms: { total: 0, pending: 0, todayCount: 0, byLevel: {}, byType: {} },
            customers: { total: 0, byDistrict: {}, byRiskLevel: {} },
          },
          message: '无可访问的数据',
        },
      });
    } else if (customerIds !== null) {
      allowedCustomerIds = customerIds;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (type) {
      case 'dashboard': {
        // 返回监控大屏所需的全部数据
        const [dashCustomers, dashDevices, dashAlarms] = await Promise.all([
          customerOps.getAll(),
          deviceOps.getAll(allowedCustomerIds),
          alarmOps.getAll(limit, allowedCustomerIds),
        ]);

        // 管理员可以看到所有商户，非管理员只能看到关联的商户
        const visibleCustomers = allowedCustomerIds 
          ? dashCustomers.filter(c => allowedCustomerIds!.includes(c.id))
          : dashCustomers;

        // 计算统计数据
        const deviceStats = {
          total: dashDevices.length,
          online: dashDevices.filter(d => d.status === 'online').length,
          offline: dashDevices.filter(d => d.status === 'offline').length,
          fault: dashDevices.filter(d => d.status === 'fault').length,
          byType: {} as Record<string, number>,
        };
        dashDevices.forEach(d => {
          deviceStats.byType[d.device_type] = (deviceStats.byType[d.device_type] || 0) + 1;
        });

        const alarmStats = {
          total: dashAlarms.length,
          pending: dashAlarms.filter(a => a.status === 'pending' || a.status === 'acknowledged').length,
          todayCount: dashAlarms.filter(a => new Date(a.created_at) >= today).length,
          byLevel: {} as Record<string, number>,
          byType: {} as Record<string, number>,
        };
        dashAlarms.forEach(a => {
          alarmStats.byLevel[a.alarm_level] = (alarmStats.byLevel[a.alarm_level] || 0) + 1;
          alarmStats.byType[a.alarm_type] = (alarmStats.byType[a.alarm_type] || 0) + 1;
        });

        const customerStats = {
          total: visibleCustomers.length,
          byDistrict: {} as Record<string, number>,
          byRiskLevel: {} as Record<string, number>,
        };
        visibleCustomers.forEach(c => {
          customerStats.byDistrict[c.district || '未知'] = (customerStats.byDistrict[c.district || '未知'] || 0) + 1;
          customerStats.byRiskLevel[c.risk_level] = (customerStats.byRiskLevel[c.risk_level] || 0) + 1;
        });

        return NextResponse.json({
          success: true,
          data: {
            timestamp: new Date().toISOString(),
            customers: visibleCustomers,
            devices: dashDevices,
            alarms: dashAlarms.slice(0, 20),
            stats: {
              devices: deviceStats,
              alarms: alarmStats,
              customers: customerStats,
            },
            isOwnerView: !isAdmin(user),
          },
        });
      }

      case 'devices': {
        // 设备列表
        let devicesList = await deviceOps.getAll(allowedCustomerIds);
        if (customerId && allowedCustomerIds?.includes(customerId)) {
          devicesList = devicesList.filter(d => d.customer_id === customerId);
        }
        if (status) {
          devicesList = devicesList.filter(d => d.status === status);
        }
        return NextResponse.json({
          success: true,
          count: devicesList.length,
          data: devicesList.slice(0, limit),
        });
      }

      case 'alarms': {
        // 报警记录
        let alarmsList = await alarmOps.getAll(limit, allowedCustomerIds);
        if (deviceId) {
          alarmsList = alarmsList.filter(a => a.device_id === deviceId);
        }
        if (customerId && allowedCustomerIds?.includes(customerId)) {
          alarmsList = alarmsList.filter(a => a.customer_id === customerId);
        }
        if (status) {
          alarmsList = alarmsList.filter(a => a.status === status);
        }
        return NextResponse.json({
          success: true,
          count: alarmsList.length,
          data: alarmsList,
        });
      }

      case 'customers': {
        // 商户列表
        const allCustomers = await customerOps.getAll();
        const customersList = allowedCustomerIds 
          ? allCustomers.filter(c => allowedCustomerIds!.includes(c.id))
          : allCustomers;
        return NextResponse.json({
          success: true,
          count: customersList.length,
          data: customersList,
        });
      }

      case 'full':
      default: {
        // 完整数据（供AI深度分析）
        const [fullCustomers, fullDevices, fullAlarms] = await Promise.all([
          customerOps.getAll(),
          deviceOps.getAll(allowedCustomerIds),
          alarmOps.getAll(100, allowedCustomerIds),
        ]);

        const visibleFullCustomers = allowedCustomerIds 
          ? fullCustomers.filter(c => allowedCustomerIds!.includes(c.id))
          : fullCustomers;

        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          summary: {
            总商户数: visibleFullCustomers.length,
            总设备数: fullDevices.length,
            在线设备: fullDevices.filter(d => d.status === 'online').length,
            故障设备: fullDevices.filter(d => d.status === 'fault').length,
            总报警数: fullAlarms.length,
            待处理报警: fullAlarms.filter(a => a.status === 'pending').length,
            今日报警: fullAlarms.filter(a => new Date(a.created_at) >= today).length,
          },
          customers: visibleFullCustomers,
          devices: fullDevices,
          alarms: fullAlarms,
          isOwnerView: !isAdmin(user),
        });
      }
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
