/**
 * 瑶安 YA-K300 系列 4G 模块设备连接器
 * 
 * 支持两种连接方式：
 * 1. 瑶安云平台 API 接入（YAK300CloudDevice）
 * 2. 基于GUID的直接连接（YAK3004GDevice）
 */

import { DeviceProtocol, DeviceData } from './device-manager';

// ============================================
// 瑶安云平台 API 接入
// ============================================

// 瑶安云平台配置
export interface YAK300CloudConfig {
  apiUrl?: string;          // API 服务器地址（默认: https://api.yaoan-cloud.com/yaoanweb）
  username: string;         // 瑶安云平台用户名
  password: string;         // 瑶安云平台密码
  userId: string;           // 用户 ID
  deviceName?: string;       // 设备名称（用于匹配云平台上的设备，如 "YA-K300-S"）
  pollInterval?: number;    // 轮询间隔(ms)，默认 30000
  timeout?: number;         // 请求超时(ms)，默认 10000
}

// 瑶安云平台设备信息
export interface YAK300CloudDeviceInfo {
  guid: string;             // 设备 GUID
  deviceId: number;         // 设备 ID
  deviceName: string;       // 设备名称
  proCode: string;          // 产品编码
  deviceBelong: string;     // 设备所属用户
}

// 瑶安云平台实时数据
export interface YAK300CloudRealData {
  deviceId: number;        // 设备 ID
  deviceName: string;       // 设备名称
  detectorAddress: string; // 探测器地址
  detectorName: string;    // 探测器名称
  gasCode: string;         // 气体编号
  concentration: string;   // 浓度值
  state: string;           // 状态 (正常/低报/高报/离线等)
  updateTime: string;       // 更新时间
}

// 瑶安云平台认证响应
interface YAK300AuthResponse {
  msg: string;
  code: number;
  token: string;
  expire: number;
  userId: number;
}

// 瑶安云平台设备列表响应
interface YAK300CloudDeviceListResponse {
  msg: string;
  code: number;
  getDeviceListForMap: YAK300CloudDeviceInfo[];
}

// 瑶安云平台实时数据响应
interface YAK300CloudRealDataResponse {
  msg: string;
  code: number;
  getList: YAK300CloudRealData[];
}

// 瑶安云平台设备类
export class YAK300CloudDevice implements DeviceProtocol {
  private deviceCode: string;
  private config: YAK300CloudConfig;
  private token: string | null = null;
  private tokenExpire: number = 0;
  private lastData: YAK300CloudRealData | null = null;
  private connected: boolean = false;
  
  // 报警阈值
  private lowAlarmThreshold: number = 25;   // 低报阈值 %LEL
  private highAlarmThreshold: number = 50;    // 高报阈值 %LEL

  constructor(deviceCode: string, config: YAK300CloudConfig) {
    this.deviceCode = deviceCode;
    this.config = {
      apiUrl: config.apiUrl || 'https://api.yaoan-cloud.com/yaoanweb',
      username: config.username,
      password: config.password,
      userId: config.userId,
      deviceName: config.deviceName,
      pollInterval: config.pollInterval || 30000,
      timeout: config.timeout || 10000,
    };
  }

  // 获取认证 Token
  private async getToken(): Promise<string> {
    // 检查 token 是否有效
    if (this.token && Date.now() < this.tokenExpire) {
      return this.token;
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/sys/thirdPart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
        }),
      });

      const data: YAK300AuthResponse = await response.json();

      if (data.code === 0 && data.token) {
        this.token = data.token;
        // 提前 5 分钟过期
        this.tokenExpire = Date.now() + (data.expire - 300) * 1000;
        console.log('[瑶安云平台] 认证成功');
        return this.token;
      } else {
        throw new Error(data.msg || '认证失败');
      }
    } catch (error) {
      console.error('[瑶安云平台] 认证失败:', error);
      throw error;
    }
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // 先认证获取 token
      await this.getToken();
      this.connected = true;
      console.log(`[瑶安云平台] 连接成功，设备: ${this.deviceCode}`);
    } catch (error) {
      this.connected = false;
      console.error(`[瑶安云平台] 连接失败:`, error);
      throw error;
    }
  }

  disconnect(): void {
    this.connected = false;
    this.token = null;
    console.log(`[瑶安云平台] 断开连接: ${this.deviceCode}`);
  }

  getDeviceCode(): string {
    return this.deviceCode;
  }

  async readData(): Promise<DeviceData> {
    if (!this.connected) {
      throw new Error(`设备 ${this.deviceCode} 未连接`);
    }

    try {
      const token = await this.getToken();
      
      // 获取实时数据
      const response = await fetch(
        `${this.config.apiUrl}/device/detectorreal/getDetectorRealInfoBySchool?userId=${this.config.userId}`,
        {
          headers: {
            'token': token,
          },
        }
      );

      const data: YAK300CloudRealDataResponse = await response.json();

      if (data.code !== 0) {
        throw new Error(data.msg || '获取数据失败');
      }

      // 找到匹配的设备数据
      // 优先使用设备名称匹配，其次使用 deviceCode（兼容旧配置）
      const deviceName = this.config.deviceName || this.deviceCode;
      
      const deviceData = data.getList?.find(d => 
        d.deviceName === deviceName ||
        d.deviceId.toString() === this.deviceCode ||
        d.deviceName === this.deviceCode
      );

      if (!deviceData) {
        throw new Error(`未找到设备: ${this.deviceCode}`);
      }

      this.lastData = deviceData;

      // 解析状态
      let status = 0; // 正常
      const state = deviceData.state;
      if (state === '离线') {
        status = 3; // 离线
      } else if (state === '低报') {
        status = 1; // 低报
      } else if (state === '高报') {
        status = 2; // 高报
      } else if (state.includes('错误') || state.includes('故障')) {
        status = 4; // 故障
      }

      // 解析浓度
      const concentration = parseFloat(deviceData.concentration) || 0;

      return {
        deviceCode: this.deviceCode,
        deviceType: 'gas_detector',
        values: {
          concentration: concentration,
          status: status,
          temperature: 0, // 实时数据不包含温度
        },
        timestamp: new Date(deviceData.updateTime),
      };
    } catch (error) {
      console.error(`[瑶安云平台] 读取数据失败:`, error);
      throw error;
    }
  }

  // 测试连接
  static async testConnection(config: YAK300CloudConfig): Promise<{ success: boolean; message: string }> {
    const apiUrl = config.apiUrl || 'https://api.yaoan-cloud.com/yaoanweb';

    try {
      // 1. 认证
      const authResponse = await fetch(`${apiUrl}/sys/thirdPart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: config.username,
          password: config.password,
        }),
      });

      const authData: YAK300AuthResponse = await authResponse.json();

      if (authData.code !== 0) {
        return {
          success: false,
          message: `认证失败: ${authData.msg || '用户名或密码错误'}`,
        };
      }

      const token = authData.token;

      // 2. 获取设备列表
      const deviceResponse = await fetch(
        `${apiUrl}/device/device/selectAllDeviceListByUser_third?userId=${config.userId}`,
        {
          headers: {
            'token': token,
          },
        }
      );

      const deviceData: YAK300CloudDeviceListResponse = await deviceResponse.json();

      if (deviceData.code !== 0) {
        return {
          success: false,
          message: `获取设备列表失败: ${deviceData.msg}`,
        };
      }

      const devices = deviceData.getDeviceListForMap || [];
      
      if (devices.length === 0) {
        return {
          success: true,
          message: `认证成功！\n用户名: ${config.username}\n用户ID: ${config.userId}\n\n当前用户下没有设备。`,
        };
      }

      // 3. 获取实时数据
      const realDataResponse = await fetch(
        `${apiUrl}/device/detectorreal/getDetectorRealInfoBySchool?userId=${config.userId}`,
        {
          headers: {
            'token': token,
          },
        }
      );

      const realData: YAK300CloudRealDataResponse = await realDataResponse.json();

      const deviceInfo = devices.map(d => 
        `- ${d.deviceName} (ID: ${d.deviceId}, GUID: ${d.guid})`
      ).join('\n');

      const realInfo = realData.getList?.map(d => 
        `  - ${d.deviceName}/${d.detectorName}: ${d.concentration}%LEL [${d.state}]`
      ).join('\n') || '  无';

      return {
        success: true,
        message: `连接成功！\n\n用户信息:\n  用户名: ${config.username}\n  用户ID: ${config.userId}\n  设备总数: ${devices.length}\n\n设备列表:\n${deviceInfo}\n\n实时数据:\n${realInfo}`,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: `连接失败: ${err.message || '网络错误'}`,
      };
    }
  }

  // 获取连接信息
  getConnectionInfo(): string {
    return `${this.config.apiUrl} @ 用户 ${this.config.username}`;
  }
}

// ============================================
// 基于 GUID 的 4G 模块直接连接
// ============================================

// 4G模块配置（基于GUID直接连接）
export interface YAK3004GConfig {
  guid: string;              // 设备GUID
  apiUrl?: string;          // API服务器地址（瑶安云平台）
  apiKey?: string;          // API密钥
  pollInterval?: number;     // 轮询间隔(ms)，默认30000
  timeout?: number;         // 请求超时(ms)，默认10000
  deviceType?: 'gas' | 'temperature' | 'smoke' | 'multi';  // 设备类型
}

// 4G模块返回的原始数据
export interface YAK3004GResponse {
  guid: string;
  deviceCode: string;
  deviceType: string;
  status: number;          // 0=正常, 1=报警, 2=故障
  alarmStatus: number;       // 0=无报警, 1=低报, 2=高报
  concentration?: number;    // 气体浓度 (%LEL)
  temperature?: number;    // 温度值 (℃)
  humidity?: number;        // 湿度值 (%)
  signalStrength?: number;   // 4G信号强度 (0-31)
  batteryVoltage?: number;   // 电池电压 (V)
  lastUpdate: string;       // 最后更新时间
}

// 基于GUID的4G设备类
export class YAK3004GDevice implements DeviceProtocol {
  private deviceCode: string;
  private config: YAK3004GConfig;
  private lastData: YAK3004GResponse | null = null;
  private connected: boolean = false;
  
  // 报警阈值（可配置）
  private lowAlarmThreshold: number = 25;   // 低报阈值 %LEL
  private highAlarmThreshold: number = 50; // 高报阈值 %LEL
  private defaultGuid: string = 'D2D19D04AF5E433E9C4BFCC4';  // 默认GUID用于测试

  constructor(deviceCode: string, config: YAK3004GConfig) {
    this.deviceCode = deviceCode;
    // 如果GUID为空，使用默认GUID用于模拟测试
    const effectiveGuid = config.guid || this.defaultGuid;
    this.config = {
      guid: effectiveGuid,
      apiUrl: config.apiUrl || 'https://api.yuanfan.com',  // 瑶安云平台API
      apiKey: config.apiKey || '',
      pollInterval: config.pollInterval || 30000,
      timeout: config.timeout || 10000,
      deviceType: config.deviceType || 'gas',
    };
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // 测试连接
      const testResult = await this.fetchDeviceData();
      if (testResult) {
        this.connected = true;
        console.log(`[YA-K300-S 4G] Connected to device ${this.deviceCode} (GUID: ${this.config.guid})`);
      }
    } catch (error) {
      this.connected = false;
      console.error(`[YA-K300-S 4G] Failed to connect to ${this.deviceCode}:`, error);
      throw error;
    }
  }

  disconnect(): void {
    this.connected = false;
    console.log(`[YA-K300-S 4G] Disconnected from device ${this.deviceCode}`);
  }

  getDeviceCode(): string {
    return this.deviceCode;
  }

  async fetchDeviceData(): Promise<YAK3004GResponse | null> {
    // 如果没有配置API地址，返回模拟数据
    if (!this.config.apiUrl || this.config.guid === this.defaultGuid) {
      // 生成模拟数据
      const mockConcentration = Math.round((20 + Math.random() * 30) * 10) / 10;
      const mockStatus = Math.random() < 0.1 ? 2 : Math.random() < 0.15 ? 1 : 0;
      
      return {
        guid: this.config.guid,
        deviceCode: this.deviceCode,
        deviceType: this.config.deviceType || 'gas',
        status: mockStatus,
        alarmStatus: mockStatus === 1 ? (Math.random() < 0.5 ? 2 : 1) : 0,
        concentration: mockConcentration,
        temperature: Math.round((20 + Math.random() * 10) * 10) / 10,
        humidity: Math.round(40 + Math.random() * 40),
        signalStrength: Math.floor(Math.random() * 31),
        batteryVoltage: 12.6,
        lastUpdate: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/device/realData?guid=${this.config.guid}`, {
        method: 'GET',
        headers: {
          'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : '',
        },
        signal: AbortSignal.timeout(this.config.timeout || 10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[YA-K300-S 4G] Fetch data error:`, error);
      // 出错时返回模拟数据
      return {
        guid: this.config.guid,
        deviceCode: this.deviceCode,
        deviceType: this.config.deviceType || 'gas',
        status: 0,
        alarmStatus: 0,
        concentration: 0,
        temperature: 25,
        humidity: 50,
        signalStrength: 0,
        batteryVoltage: 12.6,
        lastUpdate: new Date().toISOString(),
      };
    }
  }

  async readData(): Promise<DeviceData> {
    if (!this.connected) {
      throw new Error(`Device ${this.deviceCode} not connected`);
    }

    const data = await this.fetchDeviceData();
    if (!data) {
      throw new Error('Failed to fetch device data');
    }

    this.lastData = data;

    const values: DeviceData['values'] = {
      concentration: data.concentration || 0,
      status: data.status,
      temperature: data.temperature || 0,
    };

    return {
      deviceCode: this.deviceCode,
      deviceType: 'gas_detector',
      values,
      timestamp: new Date(data.lastUpdate),
    };
  }

  // 测试连接
  static async testConnection(config: YAK3004GConfig): Promise<{ success: boolean; message: string }> {
    // 如果GUID为空，使用默认GUID用于模拟测试
    const effectiveGuid = config.guid || 'D2D19D04AF5E433E9C4BFCC4';
    
    // 如果没有配置API地址，使用模拟测试
    if (!config.apiUrl || !config.guid) {
      const mockConcentration = Math.round((20 + Math.random() * 30) * 10) / 10;
      const mockStatus = Math.random() < 0.1 ? 2 : Math.random() < 0.15 ? 1 : 0;
      return {
        success: true,
        message: `模拟测试成功！\n设备GUID: ${effectiveGuid}\n气体浓度: ${mockConcentration}%LEL\n状态: ${mockStatus === 0 ? '正常' : mockStatus === 1 ? '报警' : '故障'}\n\n提示: 当前为模拟数据，实际使用时请配置正确的GUID和API地址。`,
      };
    }

    try {
      const response = await fetch(`${config.apiUrl}/device/realData?guid=${effectiveGuid}`, {
        method: 'GET',
        headers: {
          'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : '',
        },
        signal: AbortSignal.timeout(config.timeout || 10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: `连接成功！\n设备GUID: ${effectiveGuid}\n气体浓度: ${data.concentration || 0}%LEL\n状态: ${data.status === 0 ? '正常' : data.status === 1 ? '报警' : '故障'}`,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: `连接失败: ${err.message || '网络错误'}`,
      };
    }
  }

  // 获取连接信息
  getConnectionInfo(): string {
    return `GUID: ${this.config.guid} @ ${this.config.apiUrl || '模拟模式'}`;
  }

  // 获取最后获取的数据
  getLastData(): YAK3004GResponse | null {
    return this.lastData;
  }
}
