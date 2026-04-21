/**
 * Modbus TCP 设备连接器
 * 用于连接真实的 Modbus TCP 协议消防设备
 */

// 兼容 ES module 和 CommonJS
import ModbusRTUDefault from 'modbus-serial';
const ModbusRTU = (ModbusRTUDefault as unknown as { default?: typeof ModbusRTUDefault }).default || ModbusRTUDefault;

import { DeviceProtocol, DeviceData } from './device-manager';

// Modbus 寄存器地址配置
export interface ModbusRegisterConfig {
  address: number;      // 寄存器地址
  count: number;         // 寄存器数量
  type: 'coil' | 'holding' | 'input' | 'discrete';
}

// 设备连接配置
export interface DeviceConnectionConfig {
  host: string;          // 设备IP
  port: number;          // Modbus TCP 端口 (默认502)
  unitId: number;         // 从机地址 (1-255)
  timeout: number;       // 连接超时(ms)
}

// 设备寄存器映射配置
export interface DeviceRegisterMap {
  gas_concentration?: ModbusRegisterConfig;  // 气体浓度
  temperature?: ModbusRegisterConfig;        // 温度
  smoke_level?: ModbusRegisterConfig;        // 烟雾等级
  status?: ModbusRegisterConfig;             // 设备状态
  alarm_status?: ModbusRegisterConfig;       // 报警状态
}

// 气体探测器寄存器映射
const GAS_DETECTOR_MAP: DeviceRegisterMap = {
  gas_concentration: { address: 0, count: 1, type: 'holding' },
  status: { address: 1, count: 1, type: 'holding' },
  alarm_status: { address: 2, count: 1, type: 'holding' },
};

// 瑶安 YA-K300-S 气体探测器寄存器映射
// 地址0: 气体浓度(实际值=读取值/10)
// 地址1: 设备状态 (0=正常, 1=报警, 2=故障)
// 地址2: 报警状态 (0=无报警, 1=低报, 2=高报)
// 地址3: 温度值(实际值=读取值/10)
// 地址4: 气体类型
// 地址5: 量程上限
// 地址6: 低报阈值
// 地址7: 高报阈值
const YAK300_GAS_DETECTOR_MAP: DeviceRegisterMap = {
  gas_concentration: { address: 0, count: 1, type: 'holding' },
  status: { address: 1, count: 1, type: 'holding' },
  alarm_status: { address: 2, count: 1, type: 'holding' },
  temperature: { address: 3, count: 1, type: 'holding' },
};

// 温度探测器寄存器映射
const TEMPERATURE_DETECTOR_MAP: DeviceRegisterMap = {
  temperature: { address: 0, count: 1, type: 'holding' },
  status: { address: 1, count: 1, type: 'holding' },
  alarm_status: { address: 2, count: 1, type: 'holding' },
};

// 烟雾探测器寄存器映射
const SMOKE_DETECTOR_MAP: DeviceRegisterMap = {
  smoke_level: { address: 0, count: 1, type: 'holding' },
  status: { address: 1, count: 1, type: 'holding' },
  alarm_status: { address: 2, count: 1, type: 'holding' },
};

// 火灾报警器寄存器映射
const FIRE_ALARM_MAP: DeviceRegisterMap = {
  temperature: { address: 0, count: 1, type: 'holding' },
  smoke_level: { address: 1, count: 1, type: 'holding' },
  status: { address: 2, count: 1, type: 'holding' },
  alarm_status: { address: 3, count: 1, type: 'holding' },
};

// 获取设备类型对应的寄存器映射
function getRegisterMap(deviceType: string): DeviceRegisterMap {
  switch (deviceType) {
    case 'gas_detector':
      return GAS_DETECTOR_MAP;
    case 'yak300_gas_detector':
    case 'YA-K300-S':
      return YAK300_GAS_DETECTOR_MAP;
    case 'temperature_detector':
      return TEMPERATURE_DETECTOR_MAP;
    case 'smoke_detector':
      return SMOKE_DETECTOR_MAP;
    case 'fire_alarm':
      return FIRE_ALARM_MAP;
    default:
      return {};
  }
}

// 真实 Modbus TCP 设备
export class ModbusTCPDevice implements DeviceProtocol {
  private deviceCode: string;
  private deviceType: string;
  private config: DeviceConnectionConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private connected: boolean = false;
  private registerMap: DeviceRegisterMap;

  constructor(
    deviceCode: string,
    deviceType: string,
    config: DeviceConnectionConfig
  ) {
    this.deviceCode = deviceCode;
    this.deviceType = deviceType;
    this.config = {
      host: config.host,
      port: config.port || 502,
      unitId: config.unitId || 1,
      timeout: config.timeout || 5000,
    };
    this.registerMap = getRegisterMap(deviceType);
    this.client = new ModbusRTU();
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // 设置超时
      this.client.setID(this.config.unitId);
      this.client.setTimeout(this.config.timeout);

      // 连接设备
      await this.client.connectTCP(this.config.host, { port: this.config.port });
      this.connected = true;
      console.log(`[ModbusTCP] Connected to device ${this.deviceCode} at ${this.config.host}:${this.config.port}`);
    } catch (error) {
      this.connected = false;
      console.error(`[ModbusTCP] Failed to connect to ${this.deviceCode}:`, error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.connected) {
      try {
        this.client.close(() => {
          console.log(`[ModbusTCP] Disconnected from device ${this.deviceCode}`);
        });
      } catch (error) {
        console.error(`[ModbusTCP] Error disconnecting ${this.deviceCode}:`, error);
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
      // 读取气体浓度
      if (this.registerMap.gas_concentration) {
        const reg = this.registerMap.gas_concentration;
        const result = await this.readRegister(reg);
        values.concentration = result;
      }

      // 读取温度
      if (this.registerMap.temperature) {
        const reg = this.registerMap.temperature;
        const result = await this.readRegister(reg);
        // Modbus 返回的是原始值，通常需要除以10转换为实际温度
        values.temperature = result / 10;
      }

      // 读取烟雾等级
      if (this.registerMap.smoke_level) {
        const reg = this.registerMap.smoke_level;
        const result = await this.readRegister(reg);
        values.smokeLevel = result;
      }

      // 读取状态
      if (this.registerMap.status) {
        const reg = this.registerMap.status;
        const result = await this.readRegister(reg);
        values.status = result;
      }

      // 如果没有状态寄存器，根据报警状态判断
      if (!this.registerMap.status && this.registerMap.alarm_status) {
        const reg = this.registerMap.alarm_status;
        const alarmStatus = await this.readRegister(reg);
        if (alarmStatus > 0) {
          values.status = 1; // 报警
        } else {
          values.status = 0; // 正常
        }
      }

      return {
        deviceCode: this.deviceCode,
        deviceType: this.deviceType,
        values,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`[ModbusTCP] Error reading data from ${this.deviceCode}:`, error);
      // 读取失败时返回故障状态
      values.status = 2; // 故障
      return {
        deviceCode: this.deviceCode,
        deviceType: this.deviceType,
        values,
        timestamp: new Date(),
      };
    }
  }

  private async readRegister(config: ModbusRegisterConfig): Promise<number> {
    switch (config.type) {
      case 'holding':
        const holdingResult = await this.client.readHoldingRegisters(
          config.address,
          config.count
        );
        return holdingResult.data[0] || 0;

      case 'input':
        const inputResult = await this.client.readInputRegisters(
          config.address,
          config.count
        );
        return inputResult.data[0] || 0;

      case 'coil':
        const coilResult = await this.client.readCoils(
          config.address,
          config.count
        );
        return coilResult.data[0] ? 1 : 0;

      case 'discrete':
        const discreteResult = await this.client.readDiscreteInputs(
          config.address,
          config.count
        );
        return discreteResult.data[0] ? 1 : 0;

      default:
        return 0;
    }
  }

  getDeviceCode(): string {
    return this.deviceCode;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConfig(): DeviceConnectionConfig {
    return { ...this.config };
  }

  // 测试连接
  static async testConnection(config: DeviceConnectionConfig): Promise<{
    success: boolean;
    message: string;
    deviceInfo?: Record<string, unknown>;
  }> {
    const client = new ModbusRTU();
    
    try {
      client.setID(config.unitId);
      client.setTimeout(config.timeout || 5000);
      
      await client.connectTCP(config.host, { port: config.port || 502 });
      
      // 尝试读取设备基本信息
      const deviceInfo: Record<string, unknown> = {};
      
      try {
        const holdingResult = await client.readHoldingRegisters(0, 10);
        deviceInfo.registers = holdingResult.data.slice(0, 10);
      } catch {
        // 读取失败不影响连接测试
      }
      
      client.close();
      
      return {
        success: true,
        message: `成功连接到 ${config.host}:${config.port}`,
        deviceInfo,
      };
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

// 设备连接管理器
export class DeviceConnectionManager {
  private connections: Map<string, ModbusTCPDevice> = new Map();

  // 添加设备连接
  async addDevice(
    deviceCode: string,
    deviceType: string,
    config: DeviceConnectionConfig
  ): Promise<void> {
    const device = new ModbusTCPDevice(deviceCode, deviceType, config);
    await device.connect();
    this.connections.set(deviceCode, device);
    console.log(`[ConnectionManager] Added device: ${deviceCode}`);
  }

  // 移除设备连接
  removeDevice(deviceCode: string): void {
    const device = this.connections.get(deviceCode);
    if (device) {
      device.disconnect();
      this.connections.delete(deviceCode);
      console.log(`[ConnectionManager] Removed device: ${deviceCode}`);
    }
  }

  // 获取设备
  getDevice(deviceCode: string): ModbusTCPDevice | undefined {
    return this.connections.get(deviceCode);
  }

  // 检查设备是否已连接
  isConnected(deviceCode: string): boolean {
    const device = this.connections.get(deviceCode);
    return device?.isConnected() || false;
  }

  // 获取所有连接状态
  getAllConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [code, device] of this.connections) {
      status[code] = device.isConnected();
    }
    return status;
  }

  // 断开所有连接
  disconnectAll(): void {
    for (const [code, device] of this.connections) {
      device.disconnect();
    }
    this.connections.clear();
    console.log('[ConnectionManager] All connections closed');
  }
}

// 导出单例
export const connectionManager = new DeviceConnectionManager();
