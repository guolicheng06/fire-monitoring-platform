import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 根据Excel数据导入商户
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 先删除所有现有商户
    await client.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Excel数据 - A区
    const zoneA = [
      { code: 'A01', name: '盐都干锅王', district: 'A区', use_type: '中餐馆', detector_count: 3, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'A02', name: '兰州拉面-新疆大盘鸡', district: 'A区', use_type: '中餐馆', detector_count: 3, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'A03', name: '手工水饺', district: 'A区', use_type: '超市', detector_count: 3, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '否', night_business: '是', flammable: '是' },
      { code: 'A04', name: '可可砂锅煨菜', district: 'A区', use_type: '中餐馆', detector_count: 2, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'A05', name: '川南味局盐帮菜', district: 'A区', use_type: '其他', detector_count: 0, ceiling_material: '', ceiling_type: '', open_flame: '', night_business: '', flammable: '' },
      { code: 'A06A', name: '金大川', district: 'A区', use_type: '', detector_count: 0, ceiling_material: '', ceiling_type: '', open_flame: '', night_business: '', flammable: '' },
      { code: 'A06B', name: '石锅拌饭鸡公煲', district: 'A区', use_type: '中餐馆', detector_count: 1, ceiling_material: '格栅金属板', ceiling_type: '大于70%', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'A07', name: '养生纸包鱼', district: 'A区', use_type: '中餐馆', detector_count: 3, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'A08', name: '蓉味麻辣香锅', district: 'A区', use_type: '中餐馆', detector_count: 3, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'A09', name: '中国移动', district: 'A区', use_type: '', detector_count: 0, ceiling_material: '', ceiling_type: '', open_flame: '', night_business: '', flammable: '' },
      { code: 'A10', name: '浅仓-旋风蛋包饭', district: 'A区', use_type: '中餐馆', detector_count: 0, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'A11', name: '真香土豆泥拌饭烧菜馆', district: 'A区', use_type: '中餐馆', detector_count: 3, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'A12', name: '食为天家常菜', district: 'A区', use_type: '中餐馆', detector_count: 1, ceiling_material: '无', ceiling_type: '无', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'A13', name: '恒升超市', district: 'A区', use_type: '超市', detector_count: 4, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '否', night_business: '是', flammable: '是' },
      { code: 'A14A', name: '合和轩鲜兔火锅', district: 'A区', use_type: '中餐馆', detector_count: 1, ceiling_material: '无', ceiling_type: '无', open_flame: '是', night_business: '', flammable: '是' },
      { code: 'A14B', name: '兴鑫美食', district: 'A区', use_type: '中餐馆', detector_count: 3, ceiling_material: '石膏板', ceiling_type: '15%到70%', open_flame: '是', night_business: '', flammable: '是' },
      { code: 'A15', name: '麦克士', district: 'A区', use_type: '中餐馆', detector_count: 3, ceiling_material: '塑扣板', ceiling_type: '大于70%', open_flame: '是', night_business: '', flammable: '是' },
      { code: 'A16A', name: '简单理发', district: 'A区', use_type: '', detector_count: 0, ceiling_material: '', ceiling_type: '', open_flame: '', night_business: '', flammable: '' },
      { code: 'A16B', name: '美味重庆鸡公煲', district: 'A区', use_type: '中餐馆', detector_count: 2, ceiling_material: '石膏板', ceiling_type: '', open_flame: '是', night_business: '', flammable: '是' },
      { code: 'A17', name: '明艳秀秀小吃', district: 'A区', use_type: '中餐馆', detector_count: 0, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '是', night_business: '', flammable: '是' },
      { code: 'A18', name: '味多多', district: 'A区', use_type: '中餐馆', detector_count: 3, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '是', night_business: '', flammable: '是' },
      { code: 'A19', name: '鲜辣鱼府府', district: 'A区', use_type: '中餐馆', detector_count: 2, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '是', night_business: '', flammable: '是' },
      { code: 'A20', name: '渔墨湾', district: 'A区', use_type: '中餐馆', detector_count: 2, ceiling_material: '铝扣板', ceiling_type: '大于70%', open_flame: '是', night_business: '', flammable: '是' },
      { code: 'A21', name: '唯姿美容美发', district: 'A区', use_type: '其他', detector_count: 2, ceiling_material: '', ceiling_type: '', open_flame: '', night_business: '', flammable: '' },
      { code: 'A22', name: '三顾冒菜', district: 'A区', use_type: '中餐馆', detector_count: 3, ceiling_material: '无', ceiling_type: '无', open_flame: '是', night_business: '是', flammable: '否' },
      { code: 'A23', name: '百汇鲜冒菜炸菜', district: 'A区', use_type: '中餐馆', detector_count: 3, ceiling_material: '无', ceiling_type: '无', open_flame: '是', night_business: '', flammable: '否' },
      { code: 'A24', name: '天猫小店', district: 'A区', use_type: '超市', detector_count: 1, ceiling_material: '无', ceiling_type: '无', open_flame: '否', night_business: '', flammable: '否' },
    ];

    // B区
    const zoneB = [
      { code: 'B01', name: '曹氏鸭脖', district: 'B区', use_type: '餐饮', detector_count: 6, ceiling_material: '塑料板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B02', name: '砂锅串串', district: 'B区', use_type: '餐饮', detector_count: 3, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是' },
      { code: 'B03', name: 'Tony会所', district: 'B区', use_type: 'TONY会所', detector_count: 4, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是' },
      { code: 'B04', name: '楚山牛炒饭铺', district: 'B区', use_type: '餐饮', detector_count: 6, ceiling_material: '石膏板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是' },
      { code: 'B05', name: '百味鲜面馆', district: 'B区', use_type: '餐饮', detector_count: 8, ceiling_material: '金属板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是' },
      { code: 'B06', name: '泡椒牛肉米线', district: 'B区', use_type: '餐饮', detector_count: 6, ceiling_material: '石膏板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B07', name: '正宗重庆鸡公煲', district: 'B区', use_type: '餐饮', detector_count: 13, ceiling_material: '铝板', ceiling_type: '局部镂空局部封闭', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B08', name: '鸿运鲜果园', district: 'B区', use_type: '餐饮', detector_count: 6, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B09', name: '鸿运饭店', district: 'B区', use_type: '餐饮', detector_count: 8, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B10', name: '富荣贵餐厅', district: 'B区', use_type: '餐饮', detector_count: 6, ceiling_material: '钢板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是' },
      { code: 'B11', name: '涵香菜饭店', district: 'B区', use_type: '餐饮', detector_count: 3, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B12', name: '富贵饭店', district: 'B区', use_type: '餐饮', detector_count: 5, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B13', name: '榜一美食', district: 'B区', use_type: '餐饮', detector_count: 2, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B14', name: '网红铁板烧', district: 'B区', use_type: '餐饮', detector_count: 0, ceiling_material: '', ceiling_type: '镂空形：镂空率11>70%', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B15', name: '财大爷私房面', district: 'B区', use_type: '餐饮', detector_count: 0, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B16', name: '川香面馆', district: 'B区', use_type: '数码', detector_count: 6, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是', remark: '吊顶修复', special_request: '检查水压' },
      { code: 'B17', name: '元星顺广告', district: 'B区', use_type: '餐饮', detector_count: 2, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B17-2', name: '塔斯特', district: 'B区', use_type: '餐饮', detector_count: 6, ceiling_material: '钢板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是' },
      { code: 'B18', name: '达州二马路特色酥肉砂锅米线', district: 'B区', use_type: '餐饮', detector_count: 8, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是', special_request: '两个系统未安装', remark: '两个烟感' },
      { code: 'B21', name: '牛将军牛肉拌饭', district: 'B区', use_type: '餐饮', detector_count: 5, ceiling_material: '金属板', ceiling_type: '局部镂空局部封闭', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B20', name: '豆豆油泼面', district: 'B区', use_type: '联通', detector_count: 0, ceiling_material: '不锈钢', ceiling_type: '镂空形：镂空率11>70%', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B19', name: '中国联通', district: 'B区', use_type: '餐饮', detector_count: 4, ceiling_material: '铝扣板', ceiling_type: '局部镂空局部封闭', open_flame: '否', night_business: '否', flammable: '是', remark: '感烟' },
      { code: 'B18B/A', name: '大成棋牌超市曹氏鸭脖', district: 'B区', use_type: '餐饮', detector_count: 6, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是' },
      { code: 'B17B', name: '小小火锅', district: 'B区', use_type: '餐饮', detector_count: 2, ceiling_material: '铝板', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是' },
      { code: 'B19B/A', name: '老成都冒烤鸭', district: 'B区', use_type: '餐饮', detector_count: 3, ceiling_material: '无', ceiling_type: '15%到70%', open_flame: '否', night_business: '否', flammable: '是', remark: '两个烟感' },
    ];

    // C区
    const zoneC = [
      { code: 'C1-1A', name: '8090汉堡店', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '否', night_business: '是', flammable: '是' },
      { code: 'C1-2', name: '零食多', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '否', night_business: '是', flammable: '是' },
      { code: 'C1-3', name: '0090汉堡店', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '否', night_business: '是', flammable: '是' },
      { code: 'C1-4', name: '首度理发店', district: 'C区', use_type: '理发店', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '否', night_business: '是', flammable: '否' },
      { code: 'C1-5', name: '嗦一锅-三鲜米线', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '格栅板', ceiling_type: '大于70%', open_flame: '是', night_business: '是', flammable: '否' },
      { code: 'C1-6', name: '川味汇中餐馆', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '否', night_business: '是', flammable: '否' },
      { code: 'C1-7', name: '麦克士', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'C1-8', name: '标榜国潮男发', district: 'C区', use_type: '理发店', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '否', night_business: '是', flammable: '否' },
      { code: 'C1-10', name: '砂锅豆汤饭', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'C1-11', name: '重庆小面', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '格栅板', ceiling_type: '100%满', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'C1-12', name: '瑞幸咖啡', district: 'C区', use_type: '奶茶', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '否', night_business: '是', flammable: '否' },
      { code: 'C1-13B', name: '兵力王', district: 'C区', use_type: '奶茶', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '否', night_business: '是', flammable: '否' },
      { code: 'C1-13C', name: '蜜雪冰城', district: 'C区', use_type: '奶茶', detector_count: 0, ceiling_material: '木材', ceiling_type: '大于70%', open_flame: '否', night_business: '是', flammable: '否' },
      { code: 'C1-14B', name: '嗦螺湾', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'C1-15A', name: '临榆炸鸡腿', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '格栅板', ceiling_type: '大于70%', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'C1-15B', name: '有点香美蛙鱼火锅', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'C1-16A', name: '本客批发部', district: 'C区', use_type: '超市', detector_count: 0, ceiling_material: '金属', ceiling_type: '100%满', open_flame: '否', night_business: '是', flammable: '否' },
      { code: 'C1-17A', name: '悦来香饭店', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'C1-17B', name: '39.9海吃火锅', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '金属', ceiling_type: '大于70%', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'C1-18A', name: '本草堂药房', district: 'C区', use_type: '药店', detector_count: 0, ceiling_material: '石膏板', ceiling_type: '100%满', open_flame: '否', night_business: '是', flammable: '否' },
      { code: 'C1-18B', name: '大成驾考', district: 'C区', use_type: '驾校', detector_count: 0, ceiling_material: '金属加木材', ceiling_type: '100%满', open_flame: '否', night_business: '否', flammable: '否' },
      { code: 'C1-19', name: '老邻居超市', district: 'C区', use_type: '超市', detector_count: 0, ceiling_material: '金属', ceiling_type: '大于70%', open_flame: '否', night_business: '是', flammable: '否' },
      { code: 'C1-20', name: '菜鸟驿站', district: 'C区', use_type: '快递站', detector_count: 0, ceiling_material: '', ceiling_type: '', open_flame: '否', night_business: '是', flammable: '是' },
      { code: 'C1-21', name: '牛肉米线', district: 'C区', use_type: '餐饮', detector_count: 0, ceiling_material: '金属', ceiling_type: '100%满', open_flame: '是', night_business: '是', flammable: '是' },
      { code: 'C1-22', name: '数码打印', district: 'C区', use_type: '打印', detector_count: 0, ceiling_material: '格栅板', ceiling_type: '大于70%', open_flame: '否', night_business: '是', flammable: '是' },
    ];

    const allStores = [...zoneA, ...zoneB, ...zoneC];

    // 清空现有商户（不使用delete，改用查询后逐条删除）
    const { data: existingCustomers } = await client.from('customers').select('id');
    if (existingCustomers && existingCustomers.length > 0) {
      for (const customer of existingCustomers) {
        await client.from('customers').delete().eq('id', customer.id);
      }
    }

    // 统计
    const stats = {
      total: allStores.length,
      created: 0,
      updated: 0,
      skipped: 0,
    };

    for (const store of allStores) {
      // 创建新商户，所有Excel数据存储在metadata中
      await client.from('customers').insert({
        name: store.name,  // 中文商户名称
        district: store.district,
        risk_level: store.detector_count >= 3 ? 'high' : (store.detector_count > 0 ? 'medium' : 'low'),
        metadata: {
          store_code: store.code,  // 商户编号
          use_type: store.use_type,
          ceiling_material: store.ceiling_material,
          ceiling_type: store.ceiling_type,
          open_flame: store.open_flame,
          night_business: store.night_business,
          flammable: store.flammable,
          detector_count: store.detector_count,
          special_request: ('special_request' in store && store.special_request) || '',
          remark: ('remark' in store && store.remark) || '',
          data_source: 'excel',
        }
      });
      stats.created++;
    }

    return NextResponse.json({
      success: true,
      message: '商户数据导入完成',
      ...stats,
    });

  } catch (error) {
    console.error('导入商户数据失败:', error);
    return NextResponse.json(
      { error: '导入商户数据失败', details: String(error) },
      { status: 500 }
    );
  }
}

// 获取导入状态
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { count } = await client.from('customers').select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      current_count: count || 0,
      excel_count: 77, // Excel中的商户总数
    });
  } catch (error) {
    return NextResponse.json({ error: '获取状态失败' }, { status: 500 });
  }
}
