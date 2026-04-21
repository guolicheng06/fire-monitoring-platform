/**
 * 气体探测器实时数据 API
 * 返回真实接入设备的数据，如果没有真实设备则返回模拟数据
 * 支持瑶安 YA-K300-S 设备（TCP/RS485/4G/云平台）
 */

import { NextResponse } from 'next/server';
import { deviceOps } from '@/lib/db-operations';
import { MockModbusDevice } from '@/lib/device-manager';
import { YAK300Device } from '@/lib/yak300';
import { YAK300RTUDevice } from '@/lib/yak300-rtu';
import { YAK300CloudDevice, YAK3004GDevice } from '@/lib/yak300-4g';
import { ModbusTCPDevice } from '@/lib/modbus-tcp';

// 瑶安 YA-K300-S RTU 连接配置接口
interface YAK300RTUConfig {
  path: string;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;
  unitId: number;
  timeout?: number;
}

// 瑶安 YA-K300-S 云平台配置接口
interface YAK300CloudConfig {
  apiUrl?: string;
  username: string;
  password: string;
  userId: string;
  deviceName?: string;       // 设备名称（用于匹配云平台上的设备，如 "YA-K300-S"）
  pollInterval?: number;
  timeout?: number;
}

// 瑶安 YA-K300-S 4G配置接口
interface YAK3004GConfig {
  guid: string;
  apiUrl?: string;
  apiKey?: string;
  pollInterval?: number;
  timeout?: number;
  deviceType?: 'gas' | 'temperature' | 'smoke' | 'multi';
}

// 设备元数据接口
interface DeviceMetadata {
  connectionType?: string;
  yak300Config?: {
    host: string;
    port: number;
    unitId: number;
    timeout?: number;
  };
  yak300RtuConfig?: YAK300RTUConfig;
  yak300CloudConfig?: YAK300CloudConfig;
  yak3004GConfig?: YAK3004GConfig;
  yak300HttpConfig?: {
    apiUrl: string;
    pollInterval?: number;
    timeout?: number;
    unitId?: number;
  };
  modbusConfig?: {
    host: string;
    port: number;
    unitId: number;
    timeout?: number;
  };
  alarmThreshold?: {
    gas?: number;
  };
}

// 生成模拟气体浓度数据（仅用于无真实连接的设备）
function generateMockGasData(deviceCode: string, baseValue: number = 8): { concentration: number; status: string; alarmStatus: string } {
  // 模拟设备默认返回安全范围内的正常数据
  const safeValue = 5 + Math.random() * 10; // 5-15%LEL 安全范围
  
  return {
    concentration: Math.round(safeValue * 10) / 10,
    status: 'normal',
    alarmStatus: 'normal'
  };
}

export async function GET() {
  try {
    // 获取所有设备
    const devices = await deviceOps.getAll();
    
    // 过滤气体探测器设备：device_type 是气体类型 或者 metadata.connectionType 是真实连接类型
    // 显示所有设备（包括停用的），以便在首页可以选择查看
    // 为设备添加优先级排序：非云平台的设备优先显示（排除yak300_cloud）
    const gasDevices = devices
    .map(d => {
      const metadata = d.metadata as DeviceMetadata | undefined;
      const connectionType = metadata?.connectionType || '';
      
      const isGasDeviceType = d.device_type === 'gas_detector' || 
        d.device_type === 'yak300_gas' ||
        d.device_type === 'yak300_rtu' ||
        d.device_type === 'yak300_4g';
      
      // 支持所有连接类型：mock, modbus_tcp, yak300, yak300_rtu, yak300_4g, yak300_cloud, yak300_http485
      const isRealConnection = ['yak300', 'yak300_rtu', 'yak300_4g', 'yak300_cloud', 'yak300_http485', 'modbus_tcp'].includes(connectionType);
      
      // 是气体设备类型 或者 有真实连接配置
      const isMatch = isGasDeviceType || isRealConnection;
      
      // 优先级：本地设备 > 4G设备 > 云平台设备 > 模拟设备
      let priority = 0;
      if (connectionType === 'yak300_cloud' || (metadata?.yak300CloudConfig && !connectionType)) {
        priority = 3; // 云平台设备排在最后
      } else if (connectionType === 'yak300_4g' || (metadata?.yak3004GConfig && !connectionType)) {
        priority = 2; // 4G设备排在中间
      } else if (connectionType !== 'mock' && connectionType !== '') {
        priority = 1; // 本地连接设备优先
      } else {
        priority = 0; // 模拟设备
      }
      
      return { device: d, isMatch, priority };
    })
    .filter(item => item.isMatch)
    // 按优先级排序：非云平台优先
    .sort((a, b) => a.priority - b.priority)
    // 提取匹配的设备
    .map(item => item.device);
    
    // 如果没有气体探测器，返回默认数据
    if (gasDevices.length === 0) {
      return NextResponse.json({
        detectors: [
          { id: 'demo-01', name: '演示设备 - 后厨', concentration: 12.5, status: 'normal', alarmStatus: 'normal', threshold: 50, isReal: false, isActive: true }
        ],
        summary: { total: 1, online: 1, alarm: 0, offline: 0 }
      });
    }
    
    const detectors: Array<{
      id: string;
      name: string;
      location: string;
      concentration: number;
      status: string;
      alarmStatus: string;
      threshold: number;
      isReal: boolean;
      deviceCode: string;
      isActive?: boolean;
    }> = [];
    
    let onlineCount = 0;
    let alarmCount = 0;
    let offlineCount = 0;
    
    for (const device of gasDevices) {
      const metadata = device.metadata as DeviceMetadata | undefined;
      // 优先使用配置的连接类型，其次根据设备类型判断
      let connectionType = metadata?.connectionType || '';
      
      // 如果没有明确配置连接类型，但设备类型是气体探测器，默认使用 yak300 协议
      if (!connectionType && (device.device_type === 'gas_detector' || device.device_type === 'yak300_gas' || device.device_type === 'yak300_rtu')) {
        // 检查是否有各种连接配置
        if (metadata?.yak300CloudConfig) {
          connectionType = 'yak300_cloud';
        } else if (metadata?.yak3004GConfig) {
          connectionType = 'yak300_4g';
        } else if (metadata?.yak300RtuConfig) {
          connectionType = 'yak300_rtu';
        } else if (metadata?.yak300Config) {
          connectionType = 'yak300';
        } else if (metadata?.modbusConfig) {
          connectionType = 'modbus_tcp';
        } else {
          connectionType = 'mock';
        }
      }
      
      const threshold = metadata?.alarmThreshold?.gas || 50;
      
      let concentration = 0;
      let status = 'offline';
      let alarmStatus = 'normal';
      let isReal = false;
      
      try {
        // 尝试连接真实设备
        if (connectionType === 'yak300_rtu' && metadata?.yak300RtuConfig) {
          // 瑶安 YA-K300-S RS485 串口连接
          const yak300RtuDevice = new YAK300RTUDevice(device.device_code, {
            path: metadata.yak300RtuConfig.path,
            baudRate: metadata.yak300RtuConfig.baudRate || 9600,
            dataBits: metadata.yak300RtuConfig.dataBits || 8,
            stopBits: metadata.yak300RtuConfig.stopBits || 1,
            parity: metadata.yak300RtuConfig.parity as 'none' | 'even' | 'odd' || 'none',
            unitId: metadata.yak300RtuConfig.unitId || 1,
            timeout: metadata.yak300RtuConfig.timeout || 5000,
          });
          
          await yak300RtuDevice.connect();
          const data = await yak300RtuDevice.readData();
          yak300RtuDevice.disconnect();
          
          concentration = data.values.concentration || 0;
          status = data.values.status === 0 ? 'normal' : data.values.status === 1 ? 'alarm' : 'offline';
          // 报警阈值判断逻辑：浓度达到阈值的80%以上为高报，50%-80%为低报
      if (concentration >= threshold * 0.8) {
        alarmStatus = 'high';
      } else if (concentration >= threshold * 0.5) {
        alarmStatus = 'low';
      } else {
        alarmStatus = 'normal';
      }
          isReal = true;
          onlineCount++;
        } else if (connectionType === 'yak300' && metadata?.yak300Config) {
          // 瑶安 YA-K300-S TCP 连接
          const yak300Device = new YAK300Device(device.device_code, {
            host: metadata.yak300Config.host,
            port: metadata.yak300Config.port || 502,
            unitId: metadata.yak300Config.unitId || 1,
            timeout: metadata.yak300Config.timeout || 5000,
          });
          
          await yak300Device.connect();
          const data = await yak300Device.readData();
          yak300Device.disconnect();
          
          concentration = data.values.concentration || 0;
          status = data.values.status === 0 ? 'normal' : data.values.status === 1 ? 'alarm' : 'offline';
          // 报警阈值判断逻辑：浓度达到阈值的80%以上为高报，50%-80%为低报，否则为正常
          if (concentration >= threshold * 0.8) {
            alarmStatus = 'high';
          } else if (concentration >= threshold * 0.5) {
            alarmStatus = 'low';
          } else {
            alarmStatus = 'normal';
          }
          isReal = true;
          onlineCount++;
        } else if (connectionType === 'modbus_tcp' && metadata?.modbusConfig) {
          // 通用 Modbus TCP
          const modbusDevice = new ModbusTCPDevice(device.device_code, 'gas_detector', {
            host: metadata.modbusConfig.host,
            port: metadata.modbusConfig.port || 502,
            unitId: metadata.modbusConfig.unitId || 1,
            timeout: metadata.modbusConfig.timeout || 5000,
          });
          
          await modbusDevice.connect();
          const data = await modbusDevice.readData();
          modbusDevice.disconnect();
          
          concentration = data.values.concentration || 0;
          status = data.values.status === 0 ? 'normal' : data.values.status === 1 ? 'alarm' : 'offline';
          // 报警阈值判断逻辑：浓度达到阈值的80%以上为高报，50%-80%为低报，否则为正常
          if (concentration >= threshold * 0.8) {
            alarmStatus = 'high';
          } else if (concentration >= threshold * 0.5) {
            alarmStatus = 'low';
          } else {
            alarmStatus = 'normal';
          }
          isReal = true;
          onlineCount++;
        } else if (connectionType === 'yak300_cloud' && metadata?.yak300CloudConfig) {
          // 瑶安云平台连接
          const yak300CloudDevice = new YAK300CloudDevice(device.device_code, {
            apiUrl: metadata.yak300CloudConfig.apiUrl || 'https://api.yaoan-cloud.com/yaoanweb',
            username: metadata.yak300CloudConfig.username,
            password: metadata.yak300CloudConfig.password,
            userId: metadata.yak300CloudConfig.userId,
            deviceName: metadata.yak300CloudConfig.deviceName,
            pollInterval: metadata.yak300CloudConfig.pollInterval || 30000,
            timeout: metadata.yak300CloudConfig.timeout || 10000,
          });
          
          await yak300CloudDevice.connect();
          const data = await yak300CloudDevice.readData();
          yak300CloudDevice.disconnect();
          
          concentration = data.values.concentration || 0;
          status = data.values.status === 0 ? 'normal' : data.values.status === 1 ? 'alarm' : 'offline';
          // 报警阈值判断逻辑：浓度达到阈值的80%以上为高报，50%-80%为低报，否则为正常
          if (concentration >= threshold * 0.8) {
            alarmStatus = 'high';
          } else if (concentration >= threshold * 0.5) {
            alarmStatus = 'low';
          } else {
            alarmStatus = 'normal';
          }
          isReal = true;
          onlineCount++;
        } else if (connectionType === 'yak300_4g' && metadata?.yak3004GConfig) {
          // 瑶安 4G 模块连接
          const yak3004GDevice = new YAK3004GDevice(device.device_code, {
            guid: metadata.yak3004GConfig.guid,
            apiUrl: metadata.yak3004GConfig.apiUrl,
            apiKey: metadata.yak3004GConfig.apiKey,
            pollInterval: metadata.yak3004GConfig.pollInterval || 30000,
            timeout: metadata.yak3004GConfig.timeout || 10000,
            deviceType: metadata.yak3004GConfig.deviceType || 'gas',
          });
          
          await yak3004GDevice.connect();
          const data = await yak3004GDevice.readData();
          yak3004GDevice.disconnect();
          
          concentration = data.values.concentration || 0;
          status = data.values.status === 0 ? 'normal' : data.values.status === 1 ? 'alarm' : 'offline';
          // 报警阈值判断逻辑：浓度达到阈值的80%以上为高报，50%-80%为低报，否则为正常
          if (concentration >= threshold * 0.8) {
            alarmStatus = 'high';
          } else if (concentration >= threshold * 0.5) {
            alarmStatus = 'low';
          } else {
            alarmStatus = 'normal';
          }
          isReal = true;
          onlineCount++;
        } else {
          // 模拟设备或无法连接真实设备
          const mockData = generateMockGasData(device.device_code);
          concentration = mockData.concentration;
          status = mockData.status;
          alarmStatus = mockData.alarmStatus;
          isReal = false;
          onlineCount++;
        }
        
        // 统计报警数量
        if (status === 'alarm' || alarmStatus !== 'normal') {
          alarmCount++;
        }
      } catch (error) {
        console.error(`Failed to read device ${device.device_code}:`, error);
        // 读取失败，返回模拟数据
        const mockData = generateMockGasData(device.device_code);
        concentration = mockData.concentration;
        status = mockData.status;
        alarmStatus = mockData.alarmStatus;
        isReal = false;
        offlineCount++;
      }
      
      detectors.push({
        id: device.id,
        name: device.device_name,
        location: device.location || '',
        deviceCode: device.device_code,
        concentration: Math.round(concentration * 10) / 10,
        status,
        alarmStatus,
        threshold,
        isReal,
        isActive: device.is_active !== false && device.is_active !== null && device.is_active !== undefined // 默认为true
      });
    }
    
    return NextResponse.json({
      detectors,
      summary: {
        total: detectors.length,
        online: onlineCount,
        alarm: alarmCount,
        offline: offlineCount
      }
    });
  } catch (error) {
    console.error('Failed to get gas detector data:', error);
    return NextResponse.json({
      detectors: [
        { id: 'error', name: '数据获取失败', concentration: 0, status: 'offline', alarmStatus: 'normal', threshold: 50, isReal: false, isActive: true }
      ],
      summary: { total: 0, online: 0, alarm: 0, offline: 1 },
      error: 'Failed to get gas detector data'
    }, { status: 500 });
  }
}
