/**
 * 设备连接测试 API
 * 用于测试 Modbus TCP 设备、瑶安 YA-K300-S 设备（TCP/RS485/4G/HTTP）和海湾 GST 火灾报警设备连接
 */

import { NextResponse } from 'next/server';
import { ModbusTCPDevice, type DeviceConnectionConfig } from '@/lib/modbus-tcp';
import { YAK300Device, type YAK300ConnectionConfig } from '@/lib/yak300';
import { YAK300RTUDevice, type YAK300RTUConnectionConfig } from '@/lib/yak300-rtu';
import { YAK3004GDevice, YAK300CloudDevice, type YAK3004GConfig } from '@/lib/yak300-4g';
import { YAK300HTTPDevice, type YAK300HTTPConfig } from '@/lib/yak300-http';
import { GSTFireAlarmDevice, type GSTConnectionConfig, type GSTDeviceModel } from '@/lib/gst-fire-alarm';

// 测试连接
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { host, port, unitId, timeout, deviceType, model, path, baudRate, dataBits, stopBits, parity, guid, apiUrl, apiKey, pollInterval, deviceSubType, username, password, userId } = body as {
      // TCP配置
      host?: string;
      port?: number;
      unitId?: number;
      timeout?: number;
      deviceType?: 'modbus_tcp' | 'yak300' | 'yak300_rtu' | 'yak300_4g' | 'yak300_cloud' | 'yak300_http485' | 'gst_fire';
      model?: string;
      // RTU配置
      path?: string;
      baudRate?: number;
      dataBits?: number;
      stopBits?: number;
      parity?: 'none' | 'even' | 'odd';
      // 4G模块配置
      guid?: string;
      apiUrl?: string;
      apiKey?: string;
      pollInterval?: number;
      deviceSubType?: 'gas' | 'temperature' | 'smoke' | 'multi';
      // 瑶安云平台配置
      username?: string;
      password?: string;
      userId?: string;
    };
    
    // HTTP 轮询 RS485 设备测试
    if (deviceType === 'yak300_http485') {
      if (!apiUrl) {
        return NextResponse.json({ success: false, message: '请输入 HTTP API 地址' }, { status: 400 });
      }
      
      const config: YAK300HTTPConfig = {
        apiUrl: apiUrl,
        pollInterval: pollInterval || 30000,
        timeout: timeout || 10000,
        unitId: unitId || 1,
      };
      
      const result = await YAK300HTTPDevice.testConnection(config);
      return NextResponse.json(result);
    }
    
    // 瑶安4G模块测试
    if (deviceType === 'yak300_4g' || deviceSubType) {
      // 如果GUID为空，使用默认GUID用于模拟测试
      const effectiveGuid = guid || 'D2D19D04AF5E433E9C4BFCC4';
      
      const config: YAK3004GConfig = {
        guid: effectiveGuid,
        apiUrl: apiUrl || undefined,
        apiKey: apiKey || undefined,
        pollInterval: pollInterval || 30000,
        timeout: timeout || 10000,
        deviceType: deviceSubType || 'gas',
      };
      
      const result = await YAK3004GDevice.testConnection(config);
      return NextResponse.json(result);
    }
    
    // 瑶安云平台测试
    if (deviceType === 'yak300_cloud') {
      if (!username || !password || !userId) {
        return NextResponse.json({ success: false, message: '请填写完整的瑶安云平台信息（用户名、密码、用户ID）' }, { status: 400 });
      }
      
      // 瑶安云平台配置
      const config = {
        apiUrl: apiUrl || 'https://api.yaoan-cloud.com/yaoanweb',
        username,
        password,
        userId,
        pollInterval: pollInterval || 30000,
        timeout: timeout || 10000,
      };
      
      const result = await YAK300CloudDevice.testConnection(config);
      return NextResponse.json(result);
    }
    
    // RTU设备测试
    if (deviceType === 'yak300_rtu') {
      // 如果串口路径为空，使用'MOCK'触发模拟测试
      const effectivePath = path || 'MOCK';
      
      const config: YAK300RTUConnectionConfig = {
        path: effectivePath,
        baudRate: baudRate || 9600,
        dataBits: dataBits || 8,
        stopBits: stopBits || 1,
        parity: parity || 'none',
        unitId: unitId || 1,
        timeout: timeout || 5000,
      };
      
      const result = await YAK300RTUDevice.testConnection(config);
      return NextResponse.json(result);
    }
    
    // TCP设备测试
    if (!host) {
      return NextResponse.json({ success: false, message: '请输入设备IP地址' }, { status: 400 });
    }

    // 根据设备类型选择测试方法
    if (deviceType === 'yak300') {
      const config: YAK300ConnectionConfig = {
        host,
        port: port || 502,
        unitId: unitId || 1,
        timeout: timeout || 5000,
      };
      
      const result = await YAK300Device.testConnection(config);
      return NextResponse.json(result);
    } else if (deviceType === 'gst_fire') {
      // 海湾 GST 火灾报警控制器
      const config: GSTConnectionConfig = {
        host,
        port: port || 502,
        unitId: unitId || 1,
        timeout: timeout || 5000,
        model: (model as GSTDeviceModel) || 'generic',
      };
      
      const result = await GSTFireAlarmDevice.testConnection(config);
      return NextResponse.json(result);
    } else {
      // 默认使用通用 Modbus TCP
      const config: DeviceConnectionConfig = {
        host,
        port: port || 502,
        unitId: unitId || 1,
        timeout: timeout || 5000,
      };
      
      const result = await ModbusTCPDevice.testConnection(config);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json({
      success: false,
      message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
    }, { status: 500 });
  }
}
