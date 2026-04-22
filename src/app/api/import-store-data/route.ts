import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Excel数据导入API
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // Excel数据
    const storeData = [
      { code: 'A01', useType: '中餐馆', detectorCount: 3, nightOpen: '是', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '高密级' },
      { code: 'A02', useType: '中餐馆', detectorCount: 3, nightOpen: '是', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '高密级' },
      { code: 'A03', useType: '超市', detectorCount: 3, nightOpen: '是', openFire: '否', district: 'A区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'A04', useType: '中餐馆', detectorCount: 2, nightOpen: '是', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '高密级' },
      { code: 'A05', useType: '其他', detectorCount: 1, nightOpen: '', openFire: '', district: 'A区', hasDetector: 0, densityLevel: '低密级' },
      { code: 'A06B', useType: '中餐馆', detectorCount: 1, nightOpen: '是', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '高密级' },
      { code: 'A07', useType: '中餐馆', detectorCount: 3, nightOpen: '是', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '高密级' },
      { code: 'A08', useType: '中餐馆', detectorCount: 3, nightOpen: '是', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '高密级' },
      { code: 'A10', useType: '中餐馆', detectorCount: 1, nightOpen: '是', openFire: '是', district: 'A区', hasDetector: 0, densityLevel: '高密级' },
      { code: 'A11', useType: '中餐馆', detectorCount: 3, nightOpen: '是', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '高密级' },
      { code: 'A12', useType: '中餐馆', detectorCount: 1, nightOpen: '是', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '高密级' },
      { code: 'A13', useType: '超市', detectorCount: 4, nightOpen: '是', openFire: '否', district: 'A区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'A14A', useType: '中餐馆', detectorCount: 1, nightOpen: '', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'A14B', useType: '中餐馆', detectorCount: 3, nightOpen: '', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'A15', useType: '中餐馆', detectorCount: 3, nightOpen: '', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'A16B', useType: '中餐馆', detectorCount: 2, nightOpen: '', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'A17', useType: '中餐馆', detectorCount: 1, nightOpen: '', openFire: '是', district: 'A区', hasDetector: 0, densityLevel: '中密级' },
      { code: 'A18', useType: '中餐馆', detectorCount: 3, nightOpen: '', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'A19', useType: '中餐馆', detectorCount: 2, nightOpen: '', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'A20', useType: '中餐馆', detectorCount: 2, nightOpen: '', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'A21', useType: '其他', detectorCount: 2, nightOpen: '', openFire: '', district: 'A区', hasDetector: 1, densityLevel: '低密级' },
      { code: 'A22', useType: '中餐馆', detectorCount: 3, nightOpen: '是', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '高密级' },
      { code: 'A23', useType: '中餐馆', detectorCount: 3, nightOpen: '', openFire: '是', district: 'A区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'A24', useType: '超市', detectorCount: 1, nightOpen: '', openFire: '否', district: 'A区', hasDetector: 1, densityLevel: '低密级' },
      { code: 'B01', useType: '餐饮', detectorCount: 6, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B02', useType: '餐饮', detectorCount: 3, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B03', useType: '会所', detectorCount: 4, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B04', useType: '餐饮', detectorCount: 6, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B05', useType: '餐饮', detectorCount: 8, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B06', useType: '餐饮', detectorCount: 6, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B07', useType: '餐饮', detectorCount: 3, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B08', useType: '餐饮', detectorCount: 6, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B09', useType: '餐饮', detectorCount: 8, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B10', useType: '餐饮', detectorCount: 6, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B11', useType: '餐饮', detectorCount: 3, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B12', useType: '餐饮', detectorCount: 5, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B13', useType: '餐饮', detectorCount: 2, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B14', useType: '餐饮', detectorCount: 1, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 0, densityLevel: '中密级' },
      { code: 'B15', useType: '餐饮', detectorCount: 1, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 0, densityLevel: '中密级' },
      { code: 'B16', useType: '数码', detectorCount: 6, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '低密级' },
      { code: 'B17-1', useType: '餐饮', detectorCount: 2, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B17-2', useType: '餐饮', detectorCount: 2, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B18', useType: '餐饮', detectorCount: 6, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B19', useType: '餐饮', detectorCount: 4, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'B20', useType: '联通', detectorCount: 1, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 0, densityLevel: '低密级' },
      { code: 'B21', useType: '餐饮', detectorCount: 5, nightOpen: '否', openFire: '否', district: 'B区', hasDetector: 1, densityLevel: '中密级' },
      { code: 'C1-1', useType: '餐饮', detectorCount: 1, nightOpen: '是', openFire: '是', district: 'C区', hasDetector: 0, densityLevel: '高密级' },
      { code: 'C1-2', useType: '未装修', detectorCount: 1, nightOpen: '', openFire: '', district: 'C区', hasDetector: 0, densityLevel: '未评级' },
      { code: 'C1-3', useType: '奶茶', detectorCount: 1, nightOpen: '是', openFire: '否', district: 'C区', hasDetector: 0, densityLevel: '中密级' },
      { code: 'C1-4', useType: '餐饮', detectorCount: 1, nightOpen: '是', openFire: '否', district: 'C区', hasDetector: 0, densityLevel: '高密级' },
      { code: 'C1-5', useType: '理发店', detectorCount: 1, nightOpen: '是', openFire: '是', district: 'C区', hasDetector: 0, densityLevel: '高密级' },
      { code: 'C1-6', useType: '餐饮', detectorCount: 1, nightOpen: '是', openFire: '是', district: 'C区', hasDetector: 0, densityLevel: '高密级' },
      { code: 'C1-7', useType: '餐饮', detectorCount: 1, nightOpen: '是', openFire: '是', district: 'C区', hasDetector: 0, densityLevel: '高密级' },
      { code: 'C1-8', useType: '理发店', detectorCount: 1, nightOpen: '是', openFire: '否', district: 'C区', hasDetector: 0, densityLevel: '高密级' },
      { code: 'C1-9', useType: '未装修', detectorCount: 1, nightOpen: '', openFire: '', district: 'C区', hasDetector: 0, densityLevel: '未评级' },
      { code: 'C1-10', useType: '餐饮', detectorCount: 2, nightOpen: '是', openFire: '是', district: 'C区', hasDetector: 0, densityLevel: '高密级' },
      { code: 'C1-11', useType: '餐饮', detectorCount: 1, nightOpen: '是', openFire: '是', district: 'C区', hasDetector: 0, densityLevel: '高密级' },
      { code: 'C1-12', useType: '奶茶', detectorCount: 1, nightOpen: '是', openFire: '否', district: 'C区', hasDetector: 0, densityLevel: '中密级' },
      { code: 'C1-13', useType: '奶茶', detectorCount: 1, nightOpen: '是', openFire: '否', district: 'C区', hasDetector: 0, densityLevel: '中密级' },
      { code: 'C1-14', useType: '奶茶', detectorCount: 1, nightOpen: '是', openFire: '否', district: 'C区', hasDetector: 0, densityLevel: '中密级' },
      { code: 'C1-15', useType: '未装修', detectorCount: 1, nightOpen: '', openFire: '', district: 'C区', hasDetector: 0, densityLevel: '未评级' },
      { code: 'C1-16', useType: '餐饮', detectorCount: 1, nightOpen: '是', openFire: '是', district: 'C区', hasDetector: 0, densityLevel: '高密级' },
      { code: 'C1-17', useType: '餐饮', detectorCount: 1, nightOpen: '是', openFire: '是', district: 'C区', hasDetector: 0, densityLevel: '高密级' },
      { code: 'C1-18', useType: '餐饮', detectorCount: 1, nightOpen: '是', openFire: '是', district: 'C区', hasDetector: 0, densityLevel: '高密级' },
      { code: 'C1-19', useType: '药店', detectorCount: 1, nightOpen: '是', openFire: '否', district: 'C区', hasDetector: 0, densityLevel: '中密级' },
      { code: 'C1-20', useType: '驾校', detectorCount: 1, nightOpen: '否', openFire: '否', district: 'C区', hasDetector: 0, densityLevel: '低密级' },
      { code: 'C1-21', useType: '超市', detectorCount: 1, nightOpen: '是', openFire: '否', district: 'C区', hasDetector: 0, densityLevel: '中密级' },
      { code: 'C1-22', useType: '打印', detectorCount: 1, nightOpen: '是', openFire: '否', district: 'C区', hasDetector: 0, densityLevel: '中密级' },
    ];

    // 风险等级映射
    const riskLevelMap: Record<string, string> = {
      '高密级': 'high',
      '中密级': 'medium',
      '低密级': 'low',
      '未评级': 'unrated',
    };

    // 设备类型映射（根据用途选择探测器类型）
    const getDeviceType = (useType: string): string => {
      if (useType.includes('餐') || useType.includes('火锅') || useType.includes('烧烤')) {
        return 'smoke'; // 餐饮用烟感
      }
      if (useType.includes('超市') || useType.includes('奶茶') || useType.includes('药店')) {
        return 'smoke';
      }
      return 'smoke'; // 默认烟感
    };

    // 导入统计
    const stats = {
      totalStores: storeData.length,
      customersImported: 0,
      customersSkipped: 0,
      devicesCreated: 0,
      errors: [] as string[],
    };

    // 导入商户数据
    for (const store of storeData) {
      try {
        // 检查是否已存在该商户
        const { data: existing } = await client
          .from('customers')
          .select('id')
          .eq('name', store.code)
          .maybeSingle();

        if (existing) {
          stats.customersSkipped++;
          continue;
        }

        // 插入商户
        const { error: customerError } = await client
          .from('customers')
          .insert({
            name: store.code,
            district: store.district,
            risk_level: riskLevelMap[store.densityLevel] || 'medium',
            is_active: true,
            metadata: {
              store_code: store.code,
              use_type: store.useType,
              detector_count: store.detectorCount,
              night_open: store.nightOpen === '是',
              open_fire: store.openFire === '是',
              has_detector: store.hasDetector === 1,
              density_level: store.densityLevel,
              data_source: '三区数据.xlsx',
            },
          })
          .select('id');

        if (customerError) {
          stats.errors.push(`商户 ${store.code}: ${customerError.message}`);
          continue;
        }

        stats.customersImported++;

        // 如果有探测器数量，为该商户创建设备
        if (store.hasDetector === 1 && store.detectorCount > 0) {
          const devices = [];
          for (let i = 1; i <= store.detectorCount; i++) {
            devices.push({
              device_code: `${store.code}-D${String(i).padStart(2, '0')}`,
              device_type: getDeviceType(store.useType),
              device_name: `${store.useType}探测器${i}号`,
              customer_id: (await client.from('customers').select('id').eq('name', store.code).single()).data?.id,
              location: `${store.code}${store.district}`,
              status: 'online',
              is_active: true,
              metadata: {
                zone: store.district,
                detector_index: i,
              },
            });
          }

          if (devices.length > 0) {
            const { error: deviceError } = await client.from('devices').insert(devices);
            if (deviceError) {
              stats.errors.push(`设备 ${store.code}: ${deviceError.message}`);
            } else {
              stats.devicesCreated += devices.length;
            }
          }
        }
      } catch (err) {
        stats.errors.push(`商户 ${store.code}: ${err}`);
      }
    }

    // 返回导入结果
    return NextResponse.json({
      success: true,
      message: '三区数据导入完成',
      stats: {
        totalStores: stats.totalStores,
        customersImported: stats.customersImported,
        customersSkipped: stats.customersSkipped,
        devicesCreated: stats.devicesCreated,
        errors: stats.errors.length > 0 ? stats.errors : null,
      },
    });
  } catch (error) {
    console.error('数据导入失败:', error);
    return NextResponse.json(
      { success: false, message: '数据导入失败', error: String(error) },
      { status: 500 }
    );
  }
}

// 获取导入统计
export async function GET() {
  try {
    const client = getSupabaseClient();

    // 统计商户
    const { count: customerCount, error: customerError } = await client
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (customerError) throw customerError;

    // 统计设备
    const { count: deviceCount, error: deviceError } = await client
      .from('devices')
      .select('*', { count: 'exact', head: true });

    if (deviceError) throw deviceError;

    // 按区域统计
    const { data: districtStats } = await client
      .from('customers')
      .select('district, risk_level');

    const districtSummary: Record<string, { total: number; high: number; medium: number; low: number; unrated: number }> = {};
    districtStats?.forEach(c => {
      const district = c.district || '未知';
      if (!districtSummary[district]) {
        districtSummary[district] = { total: 0, high: 0, medium: 0, low: 0, unrated: 0 };
      }
      districtSummary[district].total++;
      const risk = c.risk_level as string || 'unrated';
      if (risk in districtSummary[district]) {
        (districtSummary[district] as any)[risk]++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCustomers: customerCount || 0,
        totalDevices: deviceCount || 0,
        districtSummary,
      },
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    return NextResponse.json(
      { success: false, message: '获取统计失败', error: String(error) },
      { status: 500 }
    );
  }
}
