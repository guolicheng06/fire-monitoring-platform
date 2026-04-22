/**
 * 瑶安 YA-K300-S 可燃气体探测器 Modbus RTU 连接器（RS485串口）
 * 
 * 设备规格：
 * - 气体类型：可燃气体（甲烷/丙烷等）
 * - 测量范围：0-100% LEL
 * - 通信协议：Modbus RTU (RS485)
 * - 报警输出：低报/高报
 * 
 * 串口参数：
 * - 波特率：9600
 * - 数据位：8
 * - 停止位：1
 * - 校验位：无
 * - 从机地址：1
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

// YA-K300-S RTU 连接配置
export interface YAK300RTUConnectionConfig {
  path: string;              // 串口路径，如 '/dev/ttyUSB0' 或 'COM3'
  baudRate: number;          // 波特率 (默认9600)
  dataBits: number;          // 数据位 (默认8)
  stopBits: number;          // 停止位 (默认1)
  parity: 'none' | 'even' | 'odd';  // 校验位 (默认'none')
  unitId: number;            // 从机地址 (1-255，默认1)
  timeout: number;           // 连接超时(ms，默认5000)
  registers?: Partial<YAK300RegisterMap>;  // 自定义寄存器映射
}

// YA-K300-S RTU 设备类
export class YAK300RTUDevice implements DeviceProtocol {
  private deviceCode: string;
  private config: YAK300RTUConnectionConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private connected: boolean = false;
  private registerMap: YAK300RegisterMap;
  
  // 报警阈值（可配置）
  private lowAlarmThreshold: number = 25;   // 低报阈值 %LEL
  private highAlarmThreshold: number = 50; // 高报阈值 %LEL

  constructor(deviceCode: string, config: YAK300RTUConnectionConfig) {
    this.deviceCode = deviceCode;
    this.config = {
      path: config.path,
      baudRate: config.baudRate || 9600,
      dataBits: config.dataBits || 8,
      stopBits: config.stopBits || 1,
      parity: config.parity || 'none',
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

      // 连接串口设备
      await this.client.connectRTUBuffered(this.config.path, {
        baudRate: this.config.baudRate,
        dataBits: this.config.dataBits,
        stopBits: this.config.stopBits,
        parity: this.config.parity,
      });
      
      this.connected = true;
      console.log(`[YA-K300-S RTU] Connected to device ${this.deviceCode} at ${this.config.path} (${this.config.baudRate}bps)`);

      // 连接成功后读取报警阈值
      await this.loadAlarmThresholds();
    } catch (error) {
      this.connected = false;
      console.error(`[YA-K300-S RTU] Failed to connect to ${this.deviceCode}:`, error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.connected) {
      try {
        this.client.close(() => {
          console.log(`[YA-K300-S RTU] Disconnected from device ${this.deviceCode}`);
        });
      } catch (error) {
        console.error(`[YA-K300-S RTU] Error disconnecting ${this.deviceCode}:`, error);
      }
      this.connected = false;
    }
  }

  getDeviceCode(): string {
    return this.deviceCode;
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
      console.error(`[YA-K300-S RTU] Error reading data from ${this.deviceCode}:`, error);
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
      console.error(`[YA-K300-S RTU] Error reading register ${address}:`, error);
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

      console.log(`[YA-K300-S RTU] Loaded thresholds: low=${this.lowAlarmThreshold}%LEL, high=${this.highAlarmThreshold}%LEL`);
    } catch (error) {
      console.error(`[YA-K300-S RTU] Error loading alarm thresholds:`, error);
    }
  }

  // 测试连接
  static async testConnection(config: YAK300RTUConnectionConfig): Promise<{ success: boolean; message: string }> {
    // 如果是测试路径（模拟环境），使用模拟数据
    const isTestPath = config.path === 'TEST' || config.path === 'MOCK' || config.path === '';
    
    if (isTestPath) {
      // 生成模拟数据用于测试
      const mockConcentration = Math.round((20 + Math.random() * 30) * 10) / 10;
      const mockStatus = Math.random() < 0.1 ? 2 : Math.random() < 0.15 ? 1 : 0;
      const mockAlarmStatus = mockStatus === 1 ? (Math.random() < 0.5 ? 2 : 1) : 0;
      
      return {
        success: true,
        message: `模拟测试成功！设备响应正常（气体浓度: ${mockConcentration}%LEL, 状态: ${mockStatus === 0 ? '正常' : mockStatus === 1 ? '报警' : '故障'}）\n提示: 当前为模拟数据，请确保实际使用时串口设备已正确连接。`,
      };
    }
    
    const client = new ModbusRTU();
    client.setID(config.unitId || 1);
    client.setTimeout(config.timeout || 5000);

    try {
      await client.connectRTUBuffered(config.path, {
        baudRate: config.baudRate || 9600,
        dataBits: config.dataBits || 8,
        stopBits: config.stopBits || 1,
        parity: config.parity || 'none',
      });
      
      // 尝试读取一个寄存器验证连接
      const result = await client.readHoldingRegisters(0, 1);
      client.close(() => {});
      
      if (result.data) {
        return { success: true, message: `连接成功，设备响应正常 (气体浓度寄存器值: ${result.data[0]})` };
      }
      return { success: true, message: '连接成功' };
    } catch (error) {
      const err = error as Error;
      // 简化错误消息，移除技术细节
      let message = err.message;
      console.log('[YA-K300-S RTU] Test connection error:', message);
      if (message.includes('No native build was found') || message.includes('bindings-cpp')) {
        message = '串口模块未找到兼容版本。请运行: pnpm add @serialport/bindings';
      } else if (message.includes('Permission denied')) {
        message = '串口权限不足。请以管理员身份运行，或检查用户是否有访问串口设备的权限。';
      } else if (message.includes('No such file') || message.includes('cannot open') || message.includes('ENOENT')) {
        message = '串口设备不存在。请检查USB转RS485设备是否已正确连接，端口号是否正确（如 COM3）。\n提示：可在Windows设备管理器中查看串口端口。';
      } else if (message.includes('Connection refused') || message.includes('ETIMEDOUT')) {
        message = '连接超时。请检查设备是否开机，串口线是否连接正常，以及波特率设置是否匹配。';
      } else {
        // 截断过长的错误消息
        message = message.split('\n')[0].substring(0, 100);
      }
      return { success: false, message: `连接失败: ${message}` };
    }
  }

  // 获取连接信息
  getConnectionInfo(): string {
    return `${this.config.path} @ ${this.config.baudRate}bps, ID=${this.config.unitId}`;
  }
}
