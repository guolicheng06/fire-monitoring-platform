/**
 * 瑶安 YA-K300-S 可燃气体探测器 HTTP 轮询 RS485 数据连接器
 * 
 * 适用场景：
 * - RS485 设备通过本地 HTTP 服务暴露（如 127.0.0.1:8099）
 * - 设备不支持直接 TCP 连接
 * 
 * HTTP API 格式：
 * GET http://127.0.0.1:8099/get485
 * Response: {
 *   "code": 0,
 *   "msg": "success",
 *   "device": 1,
 *   "data": "0103001400FA02E8..." // Modbus RTU 响应（十六进制字符串）
 * }
 * 
 * Modbus RTU 响应解析（YA-K300-S）：
 * - 地址1 (0x00): 气体浓度 (实际值 = 读取值 / 10, 单位 %LEL)
 * - 地址2 (0x01): 设备状态 (0=正常, 1=报警, 2=故障)
 * - 地址3 (0x02): 报警状态 (0=无报警, 1=低报, 2=高报)
 * - 地址4 (0x03): 温度值 (实际值 = 读取值 / 10, 单位 ℃)
 */

import { DeviceProtocol, DeviceData } from './device-manager';

export interface YAK300HTTPConfig {
  apiUrl: string;           // HTTP API 地址，如 'http://127.0.0.1:8099/get485'
  pollInterval: number;     // 轮询间隔(ms)，默认 30000
  timeout: number;          // 请求超时(ms)，默认 10000
  unitId?: number;          // 从机地址，默认 1
}

// YA-K300 HTTP 设备类
export class YAK300HTTPDevice implements DeviceProtocol {
  private deviceCode: string;
  private config: YAK300HTTPConfig;
  private connected: boolean = false;
  
  // 报警阈值
  private lowAlarmThreshold: number = 25;   // 低报阈值 %LEL
  private highAlarmThreshold: number = 50; // 高报阈值 %LEL

  constructor(deviceCode: string, config: YAK300HTTPConfig) {
    this.deviceCode = deviceCode;
    this.config = {
      apiUrl: config.apiUrl,
      pollInterval: config.pollInterval || 30000,
      timeout: config.timeout || 10000,
      unitId: config.unitId || 1,
    };
  }

  async connect(): Promise<void> {
    this.connected = true;
    console.log(`[YA-K300 HTTP] Connected to device ${this.deviceCode} via ${this.config.apiUrl}`);
  }

  disconnect(): void {
    this.connected = false;
    console.log(`[YA-K300 HTTP] Disconnected from device ${this.deviceCode}`);
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
      const response = await fetch(this.config.apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const result = await response.json() as {
        code: number;
        msg: string;
        device: number;
        data: string;
      };

      if (result.code !== 0) {
        throw new Error(`API error: ${result.msg}`);
      }

      // 解析 Modbus RTU 十六进制响应
      const modbusData = this.parseModbusRTU(result.data);
      
      if (modbusData) {
        values.concentration = modbusData.concentration;
        values.status = modbusData.status;
        values.temperature = modbusData.temperature;
        
        // 根据报警状态调整设备状态
        if (modbusData.status === 2) {
          values.status = 2; // 故障
        } else if (modbusData.alarmStatus > 0 || modbusData.concentration >= this.lowAlarmThreshold) {
          values.status = 1; // 报警
        } else {
          values.status = 0; // 正常
        }
      } else {
        values.status = 2; // 解析失败视为故障
      }

      return {
        deviceCode: this.deviceCode,
        deviceType: 'gas_detector',
        values,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`[YA-K300 HTTP] Error reading data from ${this.deviceCode}:`, error);
      values.status = 2;
      return {
        deviceCode: this.deviceCode,
        deviceType: 'gas_detector',
        values,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 解析 Modbus RTU 十六进制响应
   * 标准 Modbus RTU 响应格式：
   * [地址(1字节)][功能码(1字节)][数据长度(1字节)][数据(N字节)][CRC(2字节)]
   */
  private parseModbusRTU(hexString: string): {
    concentration: number;
    status: number;
    alarmStatus: number;
    temperature: number;
  } | null {
    try {
      if (!hexString || typeof hexString !== 'string') {
        return null;
      }

      // 移除空格和换行
      const cleanHex = hexString.replace(/\s/g, '').trim();
      
      if (cleanHex.length < 10) {
        console.warn('[YA-K300 HTTP] Invalid Modbus response length:', cleanHex.length);
        return null;
      }

      // 解析十六进制字符串
      const buffer = Buffer.from(cleanHex, 'hex');
      
      if (buffer.length < 7) {
        return null;
      }

      const address = buffer[0];
      const functionCode = buffer[1];
      const dataLength = buffer[2];
      
      // 简单校验：从机地址和功能码
      if (address !== this.config.unitId) {
        console.warn(`[YA-K300 HTTP] Address mismatch: expected ${this.config.unitId}, got ${address}`);
      }
      
      // 功能码 0x03 = 读保持寄存器
      if (functionCode !== 0x03) {
        console.warn(`[YA-K300 HTTP] Unexpected function code: 0x${functionCode.toString(16)}`);
      }

      // 解析寄存器数据
      // YA-K300-S 寄存器映射:
      // 0x00: 气体浓度 (实际值 = 读取值 / 10)
      // 0x01: 设备状态 (0=正常, 1=报警, 2=故障)
      // 0x02: 报警状态 (0=无报警, 1=低报, 2=高报)
      // 0x03: 温度值 (实际值 = 读取值 / 10)
      
      // 数据格式: [数据长度][寄存器0高][寄存器0低][寄存器1高][寄存器1低]...
      const registers: number[] = [];
      for (let i = 0; i < dataLength / 2 && (3 + i * 2 + 1) < buffer.length; i++) {
        const high = buffer[3 + i * 2];
        const low = buffer[4 + i * 2];
        registers.push((high << 8) | low);
      }

      const concentration = registers[0] !== undefined ? registers[0] / 10 : 0;
      const status = registers[1] !== undefined ? registers[1] : 0;
      const alarmStatus = registers[2] !== undefined ? registers[2] : 0;
      const temperature = registers[3] !== undefined ? registers[3] / 10 : 0;

      console.log(`[YA-K300 HTTP] Parsed data: concentration=${concentration}%LEL, status=${status}, alarm=${alarmStatus}, temp=${temperature}°C`);

      return {
        concentration,
        status,
        alarmStatus,
        temperature,
      };
    } catch (error) {
      console.error('[YA-K300 HTTP] Failed to parse Modbus RTU response:', error);
      return null;
    }
  }

  /**
   * 测试连接
   */
  static async testConnection(config: YAK300HTTPConfig): Promise<{ success: boolean; message: string }> {
    if (!config.apiUrl) {
      return { success: false, message: '请输入 HTTP API 地址' };
    }

    try {
      const response = await fetch(config.apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(config.timeout || 10000),
      });

      if (!response.ok) {
        return { success: false, message: `HTTP 错误: ${response.status} ${response.statusText}` };
      }

      const result = await response.json() as {
        code: number;
        msg: string;
        device?: number;
        data?: string;
      };

      if (result.code !== 0) {
        return { success: false, message: `API 返回错误: ${result.msg}` };
      }

      // 尝试解析数据
      const device = new YAK300HTTPDevice('TEST', config);
      const modbusData = device.parseModbusRTU(result.data || '');

      if (modbusData) {
        return {
          success: true,
          message: `连接成功！设备 ${result.device || 1} 返回数据：气体浓度 ${modbusData.concentration}%LEL, 状态 ${modbusData.status === 0 ? '正常' : modbusData.status === 1 ? '报警' : '故障'}, 温度 ${modbusData.temperature}°C`,
        };
      } else {
        return {
          success: true,
          message: `连接成功！但数据格式无法解析，请检查 Modbus RTU 数据格式。原始数据: ${result.data?.substring(0, 50)}...`,
        };
      }
    } catch (error) {
      const err = error as Error;
      let message = err.message;
      
      if (message.includes('timeout') || message.includes('Timeout')) {
        message = '连接超时，请检查 HTTP API 是否可达';
      } else if (message.includes('fetch') || message.includes('network')) {
        message = '网络错误，请检查 API 地址是否正确';
      }
      
      return { success: false, message: `连接失败: ${message}` };
    }
  }

  // 获取连接信息
  getConnectionInfo(): string {
    return `${this.config.apiUrl} (轮询间隔: ${this.config.pollInterval}ms)`;
  }
}
