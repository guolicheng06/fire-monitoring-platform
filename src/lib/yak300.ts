/**
 * 瑶安 YA-K300-S 可燃气体探测器 Modbus TCP 连接器
 * 
 * 设备规格：
 * - 气体类型：可燃气体（甲烷/丙烷等）
 * - 测量范围：0-100% LEL
 * - 通信协议：Modbus TCP / RTU
 * - 报警输出：低报/高报
 * 
 * Modbus 寄存器映射 (地址从0开始)：
 * - 0x0000: 气体浓度 (实际值 = 读取值 / 10，单位 %LEL)
 * - 0x0001: 设备状态 (0=正常, 1=报警, 2=故障)
 * - 0x0002: 报警状态 (0=无报警, 1=低报, 2=高报)
 * - 0x0003: 温度值 (实际值 = 读取值 / 10，单位 ℃)
 * - 0x0004: 气体类型 (1=甲烷, 2=丙烷, 3=丁烷, 等)
 * - 0x0005: 量程上限 (默认 100，代表 100%LEL)
 * - 0x0006: 低报阈值 (默认 25)
 * - 0x0007: 高报阈值 (默认 50)
 */

// 兼容 ES module 和 CommonJS
import ModbusRTUDefault from 'modbus-serial';
const ModbusRTU = (ModbusRTUDefault as unknown as { default?: typeof ModbusRTUDefault }).default || ModbusRTUDefault;

import { DeviceProtocol, DeviceData } from './device-manager';

// YA-K300-S 寄存器映射
export interface YAK300RegisterMap {
  gas_concentration: number;  // 气体浓度寄存器地址
  device_status: number;      // 设备状态寄存器地址
  alarm_status: number;       // 报警状态寄存器地址
  temperature: number;        // 温度寄存器地址
  gas_type: number;          // 气体类型寄存器地址
  range: number;             // 量程上限寄存器地址
  low_alarm_threshold: number;  // 低报阈值寄存器地址
  high_alarm_threshold: number; // 高报阈值寄存器地址
}

// YA-K300-S 默认寄存器映射
export const YAK300_DEFAULT_REGISTERS: YAK300RegisterMap = {
  gas_concentration: 0,
  device_status: 1,
  alarm_status: 2,
  temperature: 3,
  gas_type: 4,
  range: 5,
  low_alarm_threshold: 6,
  high_alarm_threshold: 7,
};

// 报警等级
export type AlarmLevel = 'normal' | 'low' | 'high' | 'fault';

// YA-K300-S 连接配置
export interface YAK300ConnectionConfig {
  host: string;          // 设备IP
  port: number;          // Modbus TCP 端口 (默认502)
  unitId: number;        // 从机地址 (1-255，默认1)
  timeout: number;       // 连接超时(ms，默认5000)
  registers?: Partial<YAK300RegisterMap>;  // 自定义寄存器映射
}

// YA-K300-S 设备类
export class YAK300Device implements DeviceProtocol {
  private deviceCode: string;
  private config: YAK300ConnectionConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private connected: boolean = false;
  private registerMap: YAK300RegisterMap;
  
  // 报警阈值（可配置）
  private lowAlarmThreshold: number = 25;   // 低报阈值 %LEL
  private highAlarmThreshold: number = 50; // 高报阈值 %LEL

  constructor(deviceCode: string, config: YAK300ConnectionConfig) {
    this.deviceCode = deviceCode;
    this.config = {
      host: config.host,
      port: config.port || 502,
      unitId: config.unitId || 1,
      timeout: config.timeout || 5000,
      registers: config.registers || {},
    };
    // 合并默认寄存器映射和自定义映射
    this.registerMap = { ...YAK300_DEFAULT_REGISTERS, ...this.config.registers };
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
      
      console.log(`[YA-K300-S] Connected to device ${this.deviceCode} at ${this.config.host}:${this.config.port}`);

      // 连接成功后读取报警阈值
      await this.loadAlarmThresholds();
    } catch (error) {
      this.connected = false;
      console.error(`[YA-K300-S] Failed to connect to ${this.deviceCode}:`, error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.connected) {
      try {
        this.client.close(() => {
          console.log(`[YA-K300-S] Disconnected from device ${this.deviceCode}`);
        });
      } catch (error) {
        console.error(`[YA-K300-S] Error disconnecting ${this.deviceCode}:`, error);
      }
      this.connected = false;
    }
  }

  async readData(): Promise<DeviceData> {
    if (!this.connected) {
      throw new Error(`Device ${this.deviceCode} not connected`);
    }

    const values: DeviceData['values'] = {};

    try {
      // 读取气体浓度 (地址0，值为实际浓度的10倍)
      const concentrationRaw = await this.readHoldingRegister(this.registerMap.gas_concentration);
      values.concentration = concentrationRaw / 10;

      // 读取设备状态 (0=正常, 1=报警, 2=故障)
      const deviceStatus = await this.readHoldingRegister(this.registerMap.device_status);
      values.status = deviceStatus;

      // 读取报警状态 (0=无报警, 1=低报, 2=高报)
      const alarmStatus = await this.readHoldingRegister(this.registerMap.alarm_status);

      // 读取温度 (地址3，值为实际温度的10倍)
      const temperatureRaw = await this.readHoldingRegister(this.registerMap.temperature);
      values.temperature = temperatureRaw / 10;

      // 根据报警状态设置设备状态
      if (deviceStatus === 2) {
        // 设备故障
        values.status = 2;
      } else if (alarmStatus > 0 || values.concentration >= this.lowAlarmThreshold) {
        // 有报警
        values.status = 1;
      } else {
        values.status = 0;
      }

      return {
        deviceCode: this.deviceCode,
        deviceType: 'gas_detector',
        values,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`[YA-K300-S] Error reading data from ${this.deviceCode}:`, error);
      // 读取失败时返回故障状态
      values.status = 2;
      return {
        deviceCode: this.deviceCode,
        deviceType: 'gas_detector',
        values,
        timestamp: new Date(),
      };
    }
  }

  private async readHoldingRegister(address: number): Promise<number> {
    try {
      const result = await this.client.readHoldingRegisters(address, 1);
      return result.data[0] || 0;
    } catch (error) {
      console.error(`[YA-K300-S] Error reading register ${address}:`, error);
      throw error;
    }
  }

  private async loadAlarmThresholds(): Promise<void> {
    try {
      // 读取低报阈值
      const lowThreshold = await this.readHoldingRegister(this.registerMap.low_alarm_threshold);
      if (lowThreshold > 0) {
        this.lowAlarmThreshold = lowThreshold / 10;
      }

      // 读取高报阈值
      const highThreshold = await this.readHoldingRegister(this.registerMap.high_alarm_threshold);
      if (highThreshold > 0) {
        this.highAlarmThreshold = highThreshold / 10;
      }

      console.log(`[YA-K300-S] Loaded alarm thresholds: low=${this.lowAlarmThreshold}%LEL, high=${this.highAlarmThreshold}%LEL`);
    } catch (error) {
      console.log(`[YA-K300-S] Could not load alarm thresholds, using defaults`);
    }
  }

  getDeviceCode(): string {
    return this.deviceCode;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConfig(): YAK300ConnectionConfig {
    return { ...this.config };
  }

  // 获取设备信息
  async getDeviceInfo(): Promise<{
    gasType: number;
    range: number;
    lowAlarmThreshold: number;
    highAlarmThreshold: number;
    firmware?: string;
  }> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    try {
      const [gasType, range, lowAlarm, highAlarm] = await Promise.all([
        this.readHoldingRegister(this.registerMap.gas_type),
        this.readHoldingRegister(this.registerMap.range),
        this.readHoldingRegister(this.registerMap.low_alarm_threshold),
        this.readHoldingRegister(this.registerMap.high_alarm_threshold),
      ]);

      return {
        gasType,
        range: range / 10,
        lowAlarmThreshold: lowAlarm / 10,
        highAlarmThreshold: highAlarm / 10,
      };
    } catch (error) {
      console.error(`[YA-K300-S] Error getting device info:`, error);
      throw error;
    }
  }

  // 获取报警等级
  getAlarmLevel(concentration: number): AlarmLevel {
    if (concentration >= this.highAlarmThreshold) {
      return 'high';
    } else if (concentration >= this.lowAlarmThreshold) {
      return 'low';
    }
    return 'normal';
  }

  // 设置报警阈值
  setAlarmThresholds(low: number, high: number): void {
    this.lowAlarmThreshold = low;
    this.highAlarmThreshold = high;
  }

  // 测试连接
  static async testConnection(config: YAK300ConnectionConfig): Promise<{
    success: boolean;
    message: string;
    deviceInfo?: {
      gasType: number;
      range: number;
      lowAlarm: number;
      highAlarm: number;
      firmware?: string;
    };
  }> {
    const client = new ModbusRTU();

    try {
      client.setID(config.unitId);
      client.setTimeout(config.timeout || 5000);

      await client.connectTCP(config.host, { port: config.port || 502 });

      // 读取设备基本信息
      const registers = { ...YAK300_DEFAULT_REGISTERS, ...config.registers };
      
      try {
        // 读取多个寄存器获取设备信息
        const [gasType, range, lowAlarm, highAlarm, concentration, deviceStatus] = await Promise.all([
          client.readHoldingRegisters(registers.gas_type, 1),
          client.readHoldingRegisters(registers.range, 1),
          client.readHoldingRegisters(registers.low_alarm_threshold, 1),
          client.readHoldingRegisters(registers.high_alarm_threshold, 1),
          client.readHoldingRegisters(registers.gas_concentration, 1),
          client.readHoldingRegisters(registers.device_status, 1),
        ]);

        client.close();

        return {
          success: true,
          message: `成功连接到瑶安 YA-K300-S 设备 ${config.host}:${config.port}`,
          deviceInfo: {
            gasType: gasType.data[0] || 0,
            range: (range.data[0] || 100) / 10,
            lowAlarm: (lowAlarm.data[0] || 25) / 10,
            highAlarm: (highAlarm.data[0] || 50) / 10,
            firmware: `浓度: ${(concentration.data[0] || 0) / 10}%LEL | 状态: ${deviceStatus.data[0] || 0}`,
          },
        };
      } catch (readError) {
        client.close();
        // 连接成功但读取失败，可能是寄存器地址不对
        return {
          success: true,
          message: `已连接到 ${config.host}:${config.port}，但读取设备信息失败。请检查设备型号和寄存器配置。`,
        };
      }
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
      return {
        success: false,
        message: `连接失败: ${message}`,
      };
    }
  }
}

// 气体类型映射表
export const GAS_TYPE_MAP: Record<number, string> = {
  1: '甲烷 (CH4)',
  2: '丙烷 (C3H8)',
  3: '丁烷 (C4H10)',
  4: '氢气 (H2)',
  5: '乙醇 (C2H5OH)',
  6: '乙烯 (C2H4)',
  7: '氨气 (NH3)',
  8: '一氧化碳 (CO)',
  9: '硫化氢 (H2S)',
  10: '二氧化硫 (SO2)',
};
