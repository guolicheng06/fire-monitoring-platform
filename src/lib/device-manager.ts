import { deviceOps, alarmOps, customerOps, type Device, type AlarmRecord, type Customer } from '@/lib/db-operations';
import { ModbusTCPDevice, type DeviceConnectionConfig } from './modbus-tcp';
import { YAK300Device, type YAK300ConnectionConfig } from './yak300';
import { YAK300RTUDevice, type YAK300RTUConnectionConfig } from './yak300-rtu';
import { YAK3004GDevice, type YAK3004GConfig } from './yak300-4g';
import { YAK300HTTPDevice, type YAK300HTTPConfig } from './yak300-http';
import { GSTFireAlarmDevice, type GSTConnectionConfig, type GSTDeviceModel } from './gst-fire-alarm';

// 设备协议接口
export interface DeviceProtocol {
  connect(): Promise<void>;
  disconnect(): void;
  readData(): Promise<DeviceData>;
  getDeviceCode(): string;
}

export interface DeviceData {
  deviceCode: string;
  deviceType: string;
  values: {
    temperature?: number;    // 温度 (℃)
    concentration?: number;   // 气体浓度 (PPM)
    smokeLevel?: number;      // 烟雾等级 (0-100)
    status?: number;          // 设备状态 (0=正常, 1=报警, 2=故障)
  };
  timestamp: Date;
}

// 设备元数据接口
export interface DeviceMetadata {
  // 连接类型: 'mock' | 'modbus_tcp' | 'yak300' | 'yak300_rtu' | 'yak300_4g' | 'yak300_http485' | 'gst_fire'
  connectionType?: 'mock' | 'modbus_tcp' | 'yak300' | 'yak300_rtu' | 'yak300_4g' | 'yak300_http485' | 'gst_fire';
  // Modbus TCP 配置
  modbusConfig?: {
    host: string;
    port: number;
    unitId: number;
    timeout?: number;
  };
  // 瑶安 YA-K300-S TCP 配置
  yak300Config?: {
    host: string;
    port: number;
    unitId: number;
    timeout?: number;
    registers?: Record<string, number>;
  };
  // 瑶安 YA-K300-S RTU 配置 (RS485串口)
  yak300RtuConfig?: {
    path: string;              // 串口路径，如 '/dev/ttyUSB0' 或 'COM3'
    baudRate: number;         // 波特率 (默认9600)
    dataBits: number;         // 数据位 (默认8)
    stopBits: number;         // 停止位 (默认1)
    parity: 'none' | 'even' | 'odd';  // 校验位 (默认'none')
    unitId: number;           // 从机地址 (默认1)
    timeout?: number;         // 超时时间(ms)
    registers?: Record<string, number>;
  };
  // 瑶安 YA-K300-S HTTP 轮询 RS485 配置
  yak300HttpConfig?: {
    apiUrl: string;           // HTTP API 地址
    pollInterval?: number;    // 轮询间隔(ms)
    timeout?: number;         // 请求超时(ms)
    unitId?: number;          // 从机地址
  };
  // 瑶安 YA-K300-S 4G模块配置
  yak3004GConfig?: {
    guid: string;             // 设备GUID (如 D2D19D04AF5E433E9C4BFCC4)
    apiUrl?: string;          // API服务器地址（瑶安云平台）
    apiKey?: string;          // API密钥
    pollInterval?: number;    // 轮询间隔(ms)，默认30000
    timeout?: number;         // 请求超时(ms)，默认10000
    deviceType?: 'gas' | 'temperature' | 'smoke' | 'multi';  // 设备类型
  };
  // 海湾 GST 火灾报警控制器配置
  gstConfig?: {
    host: string;
    port: number;
    unitId: number;
    timeout?: number;
    model: string;  // 设备型号，如 'JB-QG-GST5000'
    pollInterval?: number;
  };
  // 报警阈值
  alarmThreshold?: {
    gas?: number;        // 气体浓度阈值 (PPM 或 %LEL)
    temperature?: number; // 温度阈值 (℃)
    smoke?: number;      // 烟雾等级阈值 (0-100)
  };
  // 设备型号
  model?: string;        // 设备型号，如 'YA-K300-S', 'YA-K300-4G', 'JB-QG-GST5000'
}

// 模拟Modbus TCP设备
export class MockModbusDevice implements DeviceProtocol {
  private deviceCode: string;
  private deviceType: string;
  private connected: boolean = false;
  private faultProbability: number = 0.02;
  private alarmProbability: number = 0.01;

  constructor(deviceCode: string, deviceType: string) {
    this.deviceCode = deviceCode;
    this.deviceType = deviceType;
  }

  async connect(): Promise<void> {
    // 模拟连接延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    console.log(`[Modbus] Device ${this.deviceCode} connected`);
  }

  disconnect(): void {
    this.connected = false;
    console.log(`[Modbus] Device ${this.deviceCode} disconnected`);
  }

  async readData(): Promise<DeviceData> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    // 模拟Modbus读取延迟
    await new Promise(resolve => setTimeout(resolve, 50));

    const values: DeviceData['values'] = {};

    switch (this.deviceType) {
      case 'gas_detector':
        // 可燃气体探测器
        values.concentration = this.generateGasConcentration();
        values.status = this.generateStatus();
        break;

      case 'temperature_detector':
        // 温度探测器
        values.temperature = this.generateTemperature();
        values.status = this.generateStatus();
        break;

      case 'smoke_detector':
        // 烟雾探测器
        values.smokeLevel = this.generateSmokeLevel();
        values.status = this.generateStatus();
        break;

      case 'fire_alarm':
        // 火灾报警器（综合）
        values.temperature = this.generateTemperature();
        values.smokeLevel = this.generateSmokeLevel();
        values.status = this.generateStatus();
        break;

      default:
        values.status = 0;
    }

    return {
      deviceCode: this.deviceCode,
      deviceType: this.deviceType,
      values,
      timestamp: new Date(),
    };
  }

  getDeviceCode(): string {
    return this.deviceCode;
  }

  private generateGasConcentration(): number {
    // 模拟瑶安 YA-K300-S 气体浓度，正常范围 0-30%LEL，低报阈值 25%LEL，高报阈值 50%LEL
    // 设备量程为 0-100%LEL，寄存器值需要/10转换
    const base = Math.random() * 30;  // 正常范围 0-30%LEL
    if (Math.random() < this.alarmProbability * 2) {
      // 模拟低报报警（浓度 25-50%LEL）
      return 25 + Math.random() * 25;
    }
    if (Math.random() < this.alarmProbability) {
      // 模拟高报报警（浓度 50-100%LEL，存在爆炸风险）
      return 50 + Math.random() * 50;
    }
    return base;
  }

  private generateTemperature(): number {
    // 模拟温度，正常范围 20-35℃
    const base = 20 + Math.random() * 15;
    if (Math.random() < this.alarmProbability) {
      // 模拟报警（温度异常升高）
      return 60 + Math.random() * 40;
    }
    return base;
  }

  private generateSmokeLevel(): number {
    // 模拟烟雾等级，0-100
    const base = Math.random() * 10;
    if (Math.random() < this.alarmProbability) {
      // 模拟报警（烟雾浓度升高）
      return 50 + Math.random() * 50;
    }
    return base;
  }

  private generateStatus(): number {
    if (Math.random() < this.faultProbability) {
      return 2; // 故障
    }
    if (Math.random() < this.alarmProbability * 3) {
      return 1; // 报警
    }
    return 0; // 正常
  }
}

// 设备管理器
export class DeviceManager {
  private devices: Map<string, DeviceProtocol> = new Map();
  private deviceMap: Map<string, Device> = new Map();
  private isRunning: boolean = false;
  private pollingInterval: number = 5000; // 5秒轮询
  private onAlarm?: (alarm: AlarmRecord, device: Device, customer: Customer) => void;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor() {}

  // 设置报警回调
  setAlarmCallback(callback: (alarm: AlarmRecord, device: Device, customer: Customer) => void): void {
    this.onAlarm = callback;
  }

  // 添加设备
  async addDevice(device: Device): Promise<void> {
    let protocol: DeviceProtocol;
    const metadata = device.metadata as DeviceMetadata | undefined;
    
    // 根据连接类型和设备型号选择设备实现
    if (metadata?.connectionType === 'yak300_rtu' && metadata?.yak300RtuConfig) {
      // 瑶安 YA-K300-S RTU 设备 (RS485串口)
      const yak300RtuDevice = new YAK300RTUDevice(
        device.device_code,
        {
          path: metadata.yak300RtuConfig.path,
          baudRate: metadata.yak300RtuConfig.baudRate || 9600,
          dataBits: metadata.yak300RtuConfig.dataBits || 8,
          stopBits: metadata.yak300RtuConfig.stopBits || 1,
          parity: metadata.yak300RtuConfig.parity || 'none',
          unitId: metadata.yak300RtuConfig.unitId || 1,
          timeout: metadata.yak300RtuConfig.timeout || 5000,
          registers: metadata.yak300RtuConfig.registers,
        }
      );
      await yak300RtuDevice.connect();
      protocol = yak300RtuDevice;
      console.log(`[DeviceManager] Added YA-K300-S RTU device: ${device.device_name} (${device.device_code}) at ${metadata.yak300RtuConfig.path} (${metadata.yak300RtuConfig.baudRate}bps)`);
    } else if (metadata?.connectionType === 'yak300' && metadata?.yak300Config) {
      // 瑶安 YA-K300-S TCP 设备
      const yak300Device = new YAK300Device(
        device.device_code,
        {
          host: metadata.yak300Config.host,
          port: metadata.yak300Config.port || 502,
          unitId: metadata.yak300Config.unitId || 1,
          timeout: metadata.yak300Config.timeout || 5000,
          registers: metadata.yak300Config.registers,
        }
      );
      await yak300Device.connect();
      protocol = yak300Device;
      console.log(`[DeviceManager] Added YA-K300-S device: ${device.device_name} (${device.device_code}) at ${metadata.yak300Config.host}:${metadata.yak300Config.port}`);
    } else if (metadata?.connectionType === 'yak300_4g' && metadata?.yak3004GConfig) {
      // 瑶安 YA-K300-S 4G模块设备
      const yak3004GDevice = new YAK3004GDevice(
        device.device_code,
        {
          guid: metadata.yak3004GConfig.guid,
          apiUrl: metadata.yak3004GConfig.apiUrl,
          apiKey: metadata.yak3004GConfig.apiKey,
          pollInterval: metadata.yak3004GConfig.pollInterval || 30000,
          timeout: metadata.yak3004GConfig.timeout || 10000,
          deviceType: metadata.yak3004GConfig.deviceType || 'gas',
        }
      );
      await yak3004GDevice.connect();
      protocol = yak3004GDevice;
      console.log(`[DeviceManager] Added YA-K300-S 4G device: ${device.device_name} (${device.device_code}) GUID: ${metadata.yak3004GConfig.guid}`);
    } else if (metadata?.connectionType === 'yak300_http485' && metadata?.yak300HttpConfig) {
      // 瑶安 YA-K300-S HTTP 轮询 RS485 设备
      const yak300HttpDevice = new YAK300HTTPDevice(
        device.device_code,
        {
          apiUrl: metadata.yak300HttpConfig.apiUrl,
          pollInterval: metadata.yak300HttpConfig.pollInterval || 30000,
          timeout: metadata.yak300HttpConfig.timeout || 10000,
          unitId: metadata.yak300HttpConfig.unitId || 1,
        }
      );
      await yak300HttpDevice.connect();
      protocol = yak300HttpDevice;
      console.log(`[DeviceManager] Added YA-K300-S HTTP RS485 device: ${device.device_name} (${device.device_code}) at ${metadata.yak300HttpConfig.apiUrl}`);
    } else if (metadata?.connectionType === 'gst_fire' && metadata?.gstConfig) {
      // 海湾 GST 火灾报警控制器
      const gstDevice = new GSTFireAlarmDevice(
        device.device_code,
        {
          host: metadata.gstConfig.host,
          port: metadata.gstConfig.port || 502,
          unitId: metadata.gstConfig.unitId || 1,
          timeout: metadata.gstConfig.timeout || 5000,
          model: (metadata.gstConfig.model as GSTDeviceModel) || 'generic',
          pollInterval: metadata.gstConfig.pollInterval || 1000,
        }
      );
      await gstDevice.connect();
      protocol = gstDevice;
      console.log(`[DeviceManager] Added GST Fire Alarm device: ${device.device_name} (${device.device_code}) at ${metadata.gstConfig.host}:${metadata.gstConfig.port} (${metadata.gstConfig.model})`);
    } else if (metadata?.connectionType === 'modbus_tcp' && metadata?.modbusConfig) {
      // 真实 Modbus TCP 设备
      const modbusDevice = new ModbusTCPDevice(
        device.device_code,
        device.device_type,
        {
          host: metadata.modbusConfig.host,
          port: metadata.modbusConfig.port || 502,
          unitId: metadata.modbusConfig.unitId || 1,
          timeout: metadata.modbusConfig.timeout || 5000,
        }
      );
      await modbusDevice.connect();
      protocol = modbusDevice;
      console.log(`[DeviceManager] Added real Modbus TCP device: ${device.device_name} (${device.device_code}) at ${metadata.modbusConfig.host}:${metadata.modbusConfig.port}`);
    } else {
      // 模拟设备 (默认)
      protocol = new MockModbusDevice(device.device_code, device.device_type);
      await protocol.connect();
      console.log(`[DeviceManager] Added mock device: ${device.device_name} (${device.device_code})`);
    }
    
    this.devices.set(device.id, protocol);
    this.deviceMap.set(device.id, device);
  }

  // 移除设备
  removeDevice(deviceId: string): void {
    const protocol = this.devices.get(deviceId);
    if (protocol) {
      protocol.disconnect();
      this.devices.delete(deviceId);
      this.deviceMap.delete(deviceId);
    }
  }

  // 从数据库加载所有设备
  async loadDevicesFromDb(): Promise<void> {
    const devices = await deviceOps.getAll();
    let loadedCount = 0;
    let failedCount = 0;
    
    for (const device of devices) {
      if (device.is_active) {
        try {
          await this.addDevice(device);
          loadedCount++;
        } catch (error) {
          failedCount++;
          console.error(`[DeviceManager] Failed to load device ${device.device_code}:`, error);
          // 将设备状态设置为离线
          await deviceOps.updateStatus(device.id, 'offline');
        }
      }
    }
    console.log(`[DeviceManager] Loaded ${devices.length} devices from database (${loadedCount} loaded, ${failedCount} failed)`);
  }

  // 启动监控
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.intervalId = setInterval(async () => {
      await this.pollAllDevices();
    }, this.pollingInterval);
    
    console.log('[DeviceManager] Started monitoring');
  }

  // 停止监控
  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    
    // 断开所有设备连接
    for (const [deviceId, protocol] of this.devices) {
      protocol.disconnect();
    }
    this.devices.clear();
    this.deviceMap.clear();
    
    console.log('[DeviceManager] Stopped monitoring');
  }

  // 轮询所有设备
  private async pollAllDevices(): Promise<void> {
    for (const [deviceId, protocol] of this.devices) {
      try {
        const device = this.deviceMap.get(deviceId);
        if (!device) continue;

        const data = await protocol.readData();
        
        // 更新设备状态
        let newStatus: 'online' | 'offline' | 'fault' = 'online';
        if (data.values.status === 2) {
          newStatus = 'fault';
        } else if (data.values.status === 0) {
          newStatus = 'online';
        }
        
        if (device.status !== newStatus) {
          await deviceOps.updateStatus(deviceId, newStatus);
          device.status = newStatus;
          this.deviceMap.set(deviceId, device);
        }

        // 检查是否需要生成报警
        if (data.values.status === 1) {
          await this.generateAlarm(data, device);
        }
      } catch (error) {
        console.error(`[DeviceManager] Error polling device ${deviceId}:`, error);
      }
    }
  }

  // 生成报警记录
  private async generateAlarm(data: DeviceData, device: Device): Promise<void> {
    let alarmType = '';
    let alarmLevel: 'info' | 'warning' | 'danger' | 'critical' = 'warning';
    let alarmMessage = '';
    let alarmValue = '';

    switch (data.deviceType) {
      case 'gas_detector':
        alarmType = 'gas_leak';
        alarmValue = `${data.values.concentration}%LEL`;
        // 瑶安 YA-K300-S 报警阈值：低报 25%LEL，高报 50%LEL
        if (data.values.concentration && data.values.concentration > 75) {
          alarmLevel = 'critical';
          alarmMessage = '可燃气体浓度严重超标，存在爆炸风险！';
        } else if (data.values.concentration && data.values.concentration > 50) {
          alarmLevel = 'danger';
          alarmMessage = '可燃气体高报，请立即撤离人员进行检查！';
        } else if (data.values.concentration && data.values.concentration > 25) {
          alarmLevel = 'warning';
          alarmMessage = '可燃气体低报，请注意通风检查！';
        } else {
          alarmLevel = 'warning';
          alarmMessage = '检测到可燃气体，请关注！';
        }
        break;

      case 'temperature_detector':
        alarmType = 'high_temperature';
        alarmValue = `${data.values.temperature}℃`;
        if (data.values.temperature && data.values.temperature > 70) {
          alarmLevel = 'critical';
          alarmMessage = '环境温度严重过高，可能发生火灾！';
        } else if (data.values.temperature && data.values.temperature > 50) {
          alarmLevel = 'danger';
          alarmMessage = '环境温度异常升高，请检查！';
        } else {
          alarmLevel = 'warning';
          alarmMessage = '环境温度偏高，请关注！';
        }
        break;

      case 'smoke_detector':
        alarmType = 'smoke_detection';
        alarmValue = `Level ${data.values.smokeLevel}`;
        if (data.values.smokeLevel && data.values.smokeLevel > 80) {
          alarmLevel = 'critical';
          alarmMessage = '检测到大量烟雾，可能发生火灾！';
        } else if (data.values.smokeLevel && data.values.smokeLevel > 50) {
          alarmLevel = 'danger';
          alarmMessage = '检测到烟雾，请立即检查！';
        } else {
          alarmLevel = 'warning';
          alarmMessage = '检测到少量烟雾，请关注！';
        }
        break;

      case 'fire_alarm':
        alarmType = 'fire_alarm';
        alarmMessage = '火灾报警触发！';
        alarmLevel = 'critical';
        break;

      default:
        alarmType = 'unknown';
        alarmLevel = 'warning';
        alarmMessage = '设备报警';
    }

    try {
      // 获取商户信息
      const customer = await customerOps.getById(device.customer_id);
      
      // 创建报警记录
      const alarm = await alarmOps.create({
        device_id: device.id,
        customer_id: device.customer_id,
        alarm_type: alarmType,
        alarm_level: alarmLevel,
        alarm_message: alarmMessage,
        alarm_value: alarmValue,
        location: device.location,
        status: 'pending',
      });

      console.log(`[DeviceManager] Alarm generated: ${alarmType} - ${alarmMessage}`);

      // 调用回调
      if (this.onAlarm && customer) {
        this.onAlarm(alarm, device, customer);
      }
    } catch (error) {
      console.error(`[DeviceManager] Error creating alarm record:`, error);
    }
  }

  // 手动触发设备数据读取（用于测试）
  async readDevice(deviceId: string): Promise<DeviceData | null> {
    const protocol = this.devices.get(deviceId);
    if (!protocol) return null;
    
    try {
      return await protocol.readData();
    } catch (error) {
      console.error(`[DeviceManager] Error reading device ${deviceId}:`, error);
      return null;
    }
  }
}

// 导出单例
export const deviceManager = new DeviceManager();
