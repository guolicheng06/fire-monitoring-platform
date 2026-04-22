/**
 * 燃气设备历史数据 API
 * 返回设备的历史浓度数据点
 */

import { NextResponse } from 'next/server';

// 内存存储历史数据（生产环境应使用数据库）
const historyDataStore: Map<string, Array<{
  time: string;
  timestamp: number;
  concentration: number;
  alarmStatus: string;
}>> = new Map();

// 最大存储数据点数量
const MAX_DATA_POINTS = 60;

// 获取设备历史数据
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');
  const limit = parseInt(searchParams.get('limit') || '60');
  
  try {
    // 如果指定了设备ID，返回该设备的历史数据
    if (deviceId) {
      const history = historyDataStore.get(deviceId) || [];
      return NextResponse.json({
        deviceId,
        data: history.slice(-limit),
        count: history.length,
      });
    }
    
    // 返回所有设备的历史数据摘要
    const summary: Array<{
      deviceId: string;
      dataCount: number;
      latestConcentration: number | null;
      latestAlarmStatus: string;
    }> = [];
    
    historyDataStore.forEach((history, id) => {
      summary.push({
        deviceId: id,
        dataCount: history.length,
        latestConcentration: history.length > 0 ? history[history.length - 1].concentration : null,
        latestAlarmStatus: history.length > 0 ? history[history.length - 1].alarmStatus : 'normal',
      });
    });
    
    return NextResponse.json({
      devices: summary,
      totalDevices: summary.length,
      maxDataPoints: MAX_DATA_POINTS,
    });
  } catch (error) {
    console.error('Failed to get gas history data:', error);
    return NextResponse.json({
      error: 'Failed to get history data'
    }, { status: 500 });
  }
}
