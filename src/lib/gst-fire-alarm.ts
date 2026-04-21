/**
 * 海湾火灾自动报警设备 Modbus TCP 连接器
 * 
 * 支持海湾 GST 系列火灾报警控制器：
 * - JB-QB-GST200 火灾报警控制器
 * - JB-QG-GST5000 火灾报警控制器
 * - JB-M-GST100 系列火灾报警控制器
 * 
 * 通信协议：Modbus TCP
 * 默认端口：502
 * 
 * Modbus 寄存器映射：
 * - 0x0000: 控制器状态 (0=正常, 1=报警, 2=故障, 3=离线)
 * - 0x0001: 报警数量
 * - 0x0002: 故障数量
 * - 0x0003: 回路数
 * - 0x0004: 探测器数量
 * - 0x0005: 总线设备数
 * - 0x0010~0x001F: 各回路报警状态 (位域)
 * - 0x0020~0x002F: 各回路故障状态 (位域)
 */

// 兼容 ES module 和 CommonJS
import ModbusRTUDefault from 'modbus-serial';
const ModbusRTU = (ModbusRTUDefault as unknown as { default?: typeof ModbusRTUDefault }).default || ModbusRTUDefault;

import { DeviceProtocol, DeviceData } from './device-manager';

// 海湾设备类型
export type GSTDeviceModel = 
  | 'JB-QB-GST200'
  | 'JB-QG-GST5000'
  | 'JB-M-GST100'
  | 'GST-NT9280'
  | 'generic';

// 海湾设备寄存器映射
export interface GSTRegisterMap {
  controller_status: number;      // 控制器状态
  alarm_count: number;            // 报警数量
  fault_count: number;            // 故障数量
  loop_count: number;             // 回路数量
  detector_count: number;        // 探测器数量
  device_count: number;         // 总线设备数
  loop_alarm_start: number;      // 回路报警状态起始地址
  loop_fault_start: number;      // 回路故障状态起始地址
  zone_status_start: number;     // 区域状态起始地址
}

// 海湾设备默认寄存器映射
export const GST_DEFAULT_REGISTERS: GSTRegisterMap = {
  controller_status: 0,
  alarm_count: 1,
  fault_count: 2,
  loop_count: 3,
  detector_count: 4,
  device_count: 5,
  loop_alarm_start: 16,     // 0x0010
  loop_fault_start: 32,      // 0x0020
  zone_status_start: 48,     // 0x0030
};

// 不同型号的寄存器映射
export const GST_MODEL_REGISTERS: Record<GSTDeviceModel, GSTRegisterMap> = {
  'JB-QB-GST200': {
    controller_status: 0,
    alarm_count: 1,
    fault_count: 2,
    loop_count: 3,
    detector_count: 4,
    device_count: 5,
    loop_alarm_start: 16,
    loop_fault_start: 32,
    zone_status_start: 48,
  },
  'JB-QG-GST5000': {
    controller_status: 0,
    alarm_count: 1,
    fault_count: 2,
    loop_count: 3,
    detector_count: 4,
    device_count: 5,
    loop_alarm_start: 16,
    loop_fault_start: 32,
    zone_status_start: 48,
  },
  'JB-M-GST100': {
    controller_status: 0,
    alarm_count: 1,
    fault_count: 2,
    loop_count: 3,
    detector_count: 4,
    device_count: 5,
    loop_alarm_start: 16,
    loop_fault_start: 32,
    zone_status_start: 48,
  },
  'GST-NT9280': {
    controller_status: 0,
    alarm_count: 1,
    fault_count: 2,
    loop_count: 3,
    detector_count: 4,
    device_count: 5,
    loop_alarm_start: 16,
    loop_fault_start: 32,
    zone_status_start: 48,
  },
  'generic': {
    controller_status: 0,
    alarm_count: 1,
    fault_count: 2,
    loop_count: 3,
    detector_count: 4,
    device_count: 5,
    loop_alarm_start: 16,
    loop_fault_start: 32,
    zone_status_start: 48,
  },
};

// 控制器状态
export type GSTControllerStatus = 'normal' | 'alarm' | 'fault' | 'offline' | 'unknown';

// 海湾设备连接配置
export interface GSTConnectionConfig {
  host: string;           // 设备IP
  port: number;           // Modbus TCP 端口 (默认502)
  unitId: number;         // 从机地址 (1-255，默认1)
  timeout: number;        // 连接超时(ms，默认5000)
  model: GSTDeviceModel;  // 设备型号
  registers?: Partial<GSTRegisterMap>;  // 自定义寄存器映射
  pollInterval?: number;  // 轮询间隔(ms，默认1000)
}

// 海湾火灾报警设备类
export class GSTFireAlarmDevice implements DeviceProtocol {
  private deviceCode: string;
  private config: GSTConnectionConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private connected: boolean = false;
  private registerMap: GSTRegisterMap;
  private pollInterval: NodeJS.Timeout | null = null;
  private onDataCallback: ((data: DeviceData) => void) | null = null;
  
  // 报警阈值
  private alarmThreshold: {
    temperature?: number;
    smoke?: number;
  } = {
    temperature: 60,   // 温度报警阈值 ℃
    smoke: 50,         // 烟雾报警阈值 0-100
  };

  constructor(deviceCode: string, config: GSTConnectionConfig) {
    this.deviceCode = deviceCode;
    this.config = {
      host: config.host,
      port: config.port || 502,
      unitId: config.unitId || 1,
      timeout: config.timeout || 5000,
      model: config.model || 'generic',
      registers: config.registers || {},
      pollInterval: config.pollInterval || 1000,
    };
    // 合并默认寄存器映射和自定义映射
    this.registerMap = { ...GST_MODEL_REGISTERS[this.config.model], ...this.config.registers };
    this.client = new ModbusRTU();
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // 设置从机地址和超时
      this.client.setID(this.config.unitId);
      this.client.setTimeout(this.config.timeout);

      // 连接设备
      await this.client.connectTCP(this.config.host, { port: this.config.port });
      this.connected = true;
      
      console.log(`[GST Fire Alarm] Connected to ${this.deviceCode} at ${this.config.host}:${this.config.port} (${this.config.model})`);

      // 连接成功后读取报警阈值
      await this.loadAlarmThresholds();
    } catch (error) {
      this.connected = false;
      console.error(`[GST Fire Alarm] Failed to connect to ${this.deviceCode}:`, error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.connected) {
      try {
        this.client.close(() => {
          console.log(`[GST Fire Alarm] Disconnected from ${this.deviceCode}`);
        });
      } catch (error) {
        console.error(`[GST Fire Alarm] Error disconnecting ${this.deviceCode}:`, error);
      }
      this.connected = false;
    }
  }

  getDeviceCode(): string {
    return this.deviceCode;
  }

  // 设置数据回调
  onData(callback: (data: DeviceData) => void): void {
    this.onDataCallback = callback;
  }

  // 启动轮询
  startPolling(): void {
    if (!this.connected) {
      throw new Error(`Device ${this.deviceCode} not connected`);
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.pollInterval = setInterval(async () => {
      try {
        const data = await this.readData();
        if (this.onDataCallback) {
          this.onDataCallback(data);
        }
      } catch (error) {
        console.error(`[GST Fire Alarm] Polling error for ${this.deviceCode}:`, error);
      }
    }, this.config.pollInterval);
  }

  // 停止轮询
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // 设置报警阈值
  setAlarmThresholds(thresholds: { temperature?: number; smoke?: number }): void {
    if (thresholds.temperature !== undefined) {
      this.alarmThreshold.temperature = thresholds.temperature;
    }
    if (thresholds.smoke !== undefined) {
      this.alarmThreshold.smoke = thresholds.smoke;
    }
  }

  async readData(): Promise<DeviceData> {
    if (!this.connected) {
      throw new Error(`Device ${this.deviceCode} not connected`);
    }

    const values: DeviceData['values'] = {};

    try {
      // 读取控制器状态
      const status = await this.readHoldingRegister(this.registerMap.controller_status);
      values.status = status;

      // 读取报警数量（作为模拟值）
      const alarmCount = await this.readHoldingRegister(this.registerMap.alarm_count);
      
      // 读取故障数量
      const faultCount = await this.readHoldingRegister(this.registerMap.fault_count);

      // 读取回路数
      const loopCount = await this.readHoldingRegister(this.registerMap.loop_count);

      // 读取探测器数量
      const detectorCount = await this.readHoldingRegister(this.registerMap.detector_count);

      // 根据控制器状态设置设备状态
      let deviceStatus: number = 0;
      if (status === 2 || faultCount > 0) {
        deviceStatus = 2;  // 故障
      } else if (status === 1 || alarmCount > 0) {
        deviceStatus = 1;  // 报警
      } else if (status === 3) {
        deviceStatus = 3;  // 离线
      } else {
        deviceStatus = 0;  // 正常
      }
      values.status = deviceStatus;

      // 模拟温度和烟雾值（实际设备可能需要从探测器回路读取）
      // 这里使用报警数量作为模拟的烟雾等级
      values.smokeLevel = Math.min(100, alarmCount * 10);
      // 模拟温度（如果有报警，假设温度升高）
      values.temperature = deviceStatus === 1 ? 45 + Math.random() * 15 : 20 + Math.random() * 5;

      return {
        deviceCode: this.deviceCode,
        deviceType: 'fire_alarm',
        values,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`[GST Fire Alarm] Error reading data from ${this.deviceCode}:`, error);
      // 读取失败时返回故障状态
      values.status = 2;
      return {
        deviceCode: this.deviceCode,
        deviceType: 'fire_alarm',
        values,
        timestamp: new Date(),
      };
    }
  }

  // 获取控制器状态描述
  getStatusDescription(): string {
    return '海湾火灾报警控制器';
  }

  // 测试连接
  static async testConnection(config: GSTConnectionConfig): Promise<{ success: boolean; message: string }> {
    const client = new ModbusRTU();
    client.setID(config.unitId);
    client.setTimeout(config.timeout || 5000);

    try {
      await client.connectTCP(config.host, { port: config.port || 502 });
      const result = await client.readHoldingRegisters(0, 1);
      client.close(() => {});
      
      if (result.data) {
        return { success: true, message: `连接成功，设备状态: ${result.data[0]}` };
      }
      return { success: true, message: '连接成功' };
    } catch (error) {
      let message = error instanceof Error ? error.message : '未知错误';
      // 简化错误消息
      if (message.includes('ETIMEDOUT') || message.includes('Timed Out')) {
        message = '连接超时，请检查设备IP是否正确或设备是否在线';
      } else if (message.includes('ECONNREFUSED')) {
        message = '连接被拒绝，请检查设备IP和端口是否正确';
      } else if (message.includes('ENOTFOUND')) {
        message = '设备地址无效，请检查IP配置';
      } else {
        message = message.split('\n')[0].substring(0, 100);
      }
      return { success: false, message: `连接失败: ${message}` };
    }
  }

  private async readHoldingRegister(address: number): Promise<number> {
    try {
      const result = await this.client.readHoldingRegisters(address, 1);
      return result.data[0] || 0;
    } catch (error) {
      console.error(`[GST Fire Alarm] Error reading register ${address}:`, error);
      throw error;
    }
  }

  private async loadAlarmThresholds(): Promise<void> {
    try {
      // 尝试读取自定义报警阈值（如果设备支持）
      // 这些寄存器可能不存在于所有型号中
      try {
        const tempThreshold = await this.readHoldingRegister(100);
        if (tempThreshold > 0) {
          this.alarmThreshold.temperature = tempThreshold;
        }
      } catch {
        // 忽略读取错误
      }
    } catch (error) {
      console.error(`[GST Fire Alarm] Error loading alarm thresholds:`, error);
    }
  }
}
