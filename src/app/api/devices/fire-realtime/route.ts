/**
 * 火灾报警设备实时数据 API
 * 从数据库获取火灾报警系统设备数据
 */

import { NextResponse } from 'next/server';
import { deviceOps } from '@/lib/db-operations';

// 生成模拟火灾报警设备数据
function generateMockFireAlarmData(deviceCode: string, deviceType: string): { 
  status: string; 
  temperature?: number; 
  smokeLevel?: number;
  lastTest?: string;
} {
  // 火灾报警设备默认返回正常状态
  return {
    status: 'normal',
    temperature: 20 + Math.random() * 10, // 20-30℃
    smokeLevel: Math.random() * 10, // 0-10 正常范围
    lastTest: new Date().toISOString().split('T')[0],
  };
}

export async function GET() {
  try {
    // 获取所有设备
    const devices = await deviceOps.getAll();
    
    // 过滤火灾报警系统相关设备
    const fireDevices = devices.filter(d => {
      return d.device_type === 'fire_alarm' || 
             d.device_type === 'smoke_detector' || 
             d.device_type === 'temperature_detector';
    });
    
    // 如果没有火灾设备，返回空数据
    if (fireDevices.length === 0) {
      return NextResponse.json({
        detectors: [],
        summary: { total: 0, controller: 0, smoke: 0, temperature: 0, fault: 0 }
      });
    }
    
    const detectors: Array<{
      id: string;
      deviceCode: string;
      name: string;
      location: string;
      deviceType: string;
      typeName: string;
      status: string;
      temperature?: number;
      smokeLevel?: number;
      lastTest?: string;
      isReal: boolean;
    }> = [];
    
    let controllerCount = 0;
    let smokeCount = 0;
    let temperatureCount = 0;
    let faultCount = 0;
    
    for (const device of fireDevices) {
      const deviceType = device.device_type;
      const location = (device as { location?: string }).location || '';
      
      // 根据设备类型设置类型名称
      let typeName = '';
      switch (deviceType) {
        case 'fire_alarm':
          typeName = '火灾报警控制器';
          controllerCount++;
          break;
        case 'smoke_detector':
          typeName = '烟感探测器';
          smokeCount++;
          break;
        case 'temperature_detector':
          typeName = '温感探测器';
          temperatureCount++;
          break;
        default:
          typeName = '未知设备';
      }
      
      // 生成数据（目前使用模拟数据，后续可扩展真实设备连接）
      const mockData = generateMockFireAlarmData(device.device_code, deviceType);
      
      // 判断状态
      let status = 'online';
      if (device.status === 'offline') {
        status = 'offline';
        faultCount++;
      } else if (device.status === 'fault') {
        status = 'fault';
        faultCount++;
      }
      
      detectors.push({
        id: device.id,
        deviceCode: device.device_code,
        name: device.device_name,
        location,
        deviceType,
        typeName,
        status,
        temperature: mockData.temperature,
        smokeLevel: mockData.smokeLevel,
        lastTest: mockData.lastTest,
        isReal: device.is_active && device.status !== 'offline',
      });
    }
    
    return NextResponse.json({
      detectors,
      summary: {
        total: detectors.length,
        controller: controllerCount,
        smoke: smokeCount,
        temperature: temperatureCount,
        fault: faultCount
      }
    });
  } catch (error) {
    console.error('Failed to get fire alarm device data:', error);
    return NextResponse.json({
      detectors: [],
      summary: { total: 0, controller: 0, smoke: 0, temperature: 0, fault: 0 },
      error: 'Failed to get fire alarm device data'
    }, { status: 500 });
  }
}
