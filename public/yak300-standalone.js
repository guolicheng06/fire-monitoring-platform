/**
 * 瑶安 YA-K300-S 设备连接独立脚本
 * 
 * 支持连接方式：
 * 1. RS485 串口连接 (Modbus RTU)
 * 2. 4G 模块连接 (HTTP API)
 * 3. HTTP 轮询 RS485 (通过 HTTP API 获取 Modbus RTU 数据)
 * 
 * 使用方法：
 *   # 安装依赖
 *   npm install
 *   
 *   # RS485 连接
 *   node yak300-standalone.js --mode rtu --path /dev/ttyUSB0 --unitId 1
 *   
 *   # 4G 模块连接
 *   node yak300-standalone.js --mode 4g --guid D2D19D04AF5E433E9C4BFCC4
 *   
 *   # 4G 模块连接 (带瑶安云API)
 *   node yak300-standalone.js --mode 4g --guid YOUR_GUID --apiUrl https://api.example.com --apiKey YOUR_KEY
 *   
 *   # HTTP 轮询 RS485 (设备通过本地 HTTP 服务暴露串口数据)
 *   node yak300-standalone.js --mode http485 --apiUrl http://192.168.1.100:8080/get485
 *   
 *   # 帮助信息
 *   node yak300-standalone.js --help
 */

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ==================== 依赖检查与自动安装 ====================

function checkAndInstallDependencies() {
  const requiredPackages = ['serialport', '@serialport/parser-byte-length'];
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  // 读取 package.json
  let packageJson = {};
  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (e) {
      console.warn('无法读取 package.json，将创建新的');
    }
  }
  
  // 检查依赖
  const deps = { ...packageJson.dependencies, ...packageJson.optionalDependencies };
  const missingPackages = requiredPackages.filter(pkg => !deps[pkg]);
  
  if (missingPackages.length > 0) {
    console.log('检测到缺少依赖，正在安装...');
    console.log('需要的包:', missingPackages.join(', '));
    
    try {
      const { execSync } = require('child_process');
      // 安装缺少的包
      execSync(`npm install ${missingPackages.join(' ')} --save`, { 
        stdio: 'inherit',
        cwd: __dirname
      });
      console.log('依赖安装完成！');
      return true;
    } catch (e) {
      console.error('依赖安装失败，请手动运行: npm install');
      return false;
    }
  }
  
  return true;
}

// 在启动时检查依赖
try {
  require('serialport');
  require('@serialport/parser-byte-length');
} catch (e) {
  console.log('===========================================');
  console.log('  首次运行，正在安装依赖...');
  console.log('===========================================');
  const success = checkAndInstallDependencies();
  if (!success) {
    console.error('依赖安装失败，请手动运行: npm install');
    process.exit(1);
  }
}

// ==================== 瑶安 YA-K300-S RS485 设备连接器 ====================

// YA-K300-S 寄存器映射
const YAK300_REGISTERS = {
  gas_concentration: 0,     // 气体浓度
  device_status: 1,          // 设备状态
  alarm_status: 2,           // 报警状态
  temperature: 3,            // 温度
  gas_type: 4,               // 气体类型
  range: 5,                  // 量程上限
  low_alarm_threshold: 6,    // 低报阈值
  high_alarm_threshold: 7   // 高报阈值
};

/**
 * YA-K300-S RS485 设备类 - 使用 modbus-serial
 */
class YAK300RTU {
  constructor(options = {}) {
    this.options = {
      path: options.path || '/dev/ttyUSB0',      // 串口路径
      baudRate: options.baudRate || 9600,        // 波特率
      dataBits: options.dataBits || 8,          // 数据位
      stopBits: options.stopBits || 1,          // 停止位
      parity: options.parity || 'none',         // 校验位
      unitId: options.unitId || 1,              // 从机地址
      timeout: options.timeout || 5000           // 超时时间
    };
    this.client = null;
    this.isConnected = false;
  }
  
  /**
   * 连接 RS485 设备
   */
  async connect() {
    try {
      // 使用 modbus-serial
      const ModbusRTU = require('modbus-serial');
      this.client = new ModbusRTU();
      
      console.log(`[RS485] 正在连接串口 ${this.options.path}...`);
      
      await this.client.connectRTUBuffered(this.options.path, {
        baudRate: this.options.baudRate,
        parity: this.options.parity || 'none',
        stopBits: this.options.stopBits || 1,
        dataBits: this.options.dataBits || 8,
      });
      
      this.client.setID(this.options.unitId);
      this.client.setTimeout(this.options.timeout);
      
      console.log(`[RS485] 串口 ${this.options.path} 已打开`);
      console.log(`[RS485] 波特率: ${this.options.baudRate}, 从机地址: ${this.options.unitId}`);
      this.isConnected = true;
      
    } catch (error) {
      throw new Error(`RS485 连接失败: ${error.message}`);
    }
  }
  
  /**
   * 读取设备数据
   */
  async readData() {
    if (!this.isConnected) {
      throw new Error('设备未连接');
    }
    
    try {
      // 读取保持寄存器 (地址0-7)
      const result = await this.client.readHoldingRegisters(0, 8);
      return this.parseRegisters(result.data);
    } catch (error) {
      throw new Error(`读取数据失败: ${error.message}`);
    }
  }
  
  /**
   * 解析寄存器数据
   */
  parseRegisters(registers) {
    const gasConcentration = registers[YAK300_REGISTERS.gas_concentration] / 10;
    const deviceStatus = registers[YAK300_REGISTERS.device_status];
    const alarmStatus = registers[YAK300_REGISTERS.alarm_status];
    const temperature = registers[YAK300_REGISTERS.temperature] / 10;
    const gasType = registers[YAK300_REGISTERS.gas_type];
    const range = registers[YAK300_REGISTERS.range];
    const lowAlarmThreshold = registers[YAK300_REGISTERS.low_alarm_threshold];
    const highAlarmThreshold = registers[YAK300_REGISTERS.high_alarm_threshold];
    
    // 设备状态映射
    const statusMap = { 0: '正常', 1: '报警', 2: '故障' };
    // 报警状态映射
    const alarmMap = { 0: '无报警', 1: '低报', 2: '高报' };
    // 气体类型映射
    const gasTypeMap = { 1: '甲烷', 2: '丙烷', 3: '丁烷', 4: '戊烷', 5: '乙烯', 6: '乙炔', 7: '氢气' };
    
    return {
      gasConcentration,    // 气体浓度 (%LEL)
      deviceStatus,         // 设备状态 (0=正常, 1=报警, 2=故障)
      deviceStatusText: statusMap[deviceStatus] || '未知',
      alarmStatus,          // 报警状态 (0=无报警, 1=低报, 2=高报)
      alarmStatusText: alarmMap[alarmStatus] || '未知',
      temperature,          // 温度 (℃)
      gasType,              // 气体类型
      gasTypeText: gasTypeMap[gasType] || '未知',
      range,                // 量程上限
      lowAlarmThreshold,    // 低报阈值
      highAlarmThreshold,   // 高报阈值
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 关闭连接
   */
  close() {
    if (this.client) {
      this.client.close();
      this.isConnected = false;
    }
  }
}

// ==================== 瑶安 YA-K300-S 4G 设备连接器 ====================

/**
 * YA-K300-S 4G 设备类
 */
class YAK3004G {
  constructor(options = {}) {
    this.options = {
      guid: options.guid || 'D2D19D04AF5E433E9C4BFCC4',
      apiUrl: options.apiUrl || '',
      apiKey: options.apiKey || '',
      pollInterval: options.pollInterval || 30000,
      timeout: options.timeout || 10000,
      deviceType: options.deviceType || 'gas'
    };
    this.lastData = null;
    this.isConnected = false;
  }
  
  /**
   * 获取设备数据
   */
  async fetchData() {
    // 如果有瑶安云API配置，使用API获取数据
    if (this.options.apiUrl) {
      return await this.fetchFromAPI();
    }
    
    // 否则使用模拟数据（用于测试）
    return this.generateMockData();
  }
  
  /**
   * 从瑶安云API获取数据
   */
  async fetchFromAPI() {
    return new Promise((resolve, reject) => {
      const url = new URL(this.options.apiUrl);
      url.searchParams.append('guid', this.options.guid);
      if (this.options.apiKey) {
        url.searchParams.append('apiKey', this.options.apiKey);
      }
      
      const client = url.protocol === 'https:' ? https : http;
      const timeoutId = setTimeout(() => {
        reject(new Error('请求超时'));
      }, this.options.timeout);
      
      const req = client.get(url.toString(), (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          clearTimeout(timeoutId);
          
          try {
            const json = JSON.parse(data);
            
            if (json.code === 0) {
              const result = this.parseAPIResponse(json.data);
              this.lastData = result;
              this.isConnected = true;
              resolve(result);
            } else {
              reject(new Error(`API错误: ${json.msg}`));
            }
          } catch (e) {
            reject(new Error(`数据解析失败: ${e.message}`));
          }
        });
      });
      
      req.on('error', (e) => {
        clearTimeout(timeoutId);
        reject(e);
      });
    });
  }
  
  /**
   * 解析API响应
   */
  parseAPIResponse(data) {
    return {
      gasConcentration: data.concentration || 0,
      deviceStatus: data.status || 0,
      deviceStatusText: ['正常', '报警', '故障'][data.status] || '未知',
      alarmStatus: data.alarmStatus || 0,
      alarmStatusText: ['无报警', '低报', '高报'][data.alarmStatus] || '未知',
      temperature: data.temperature || 0,
      signalStrength: data.signalStrength || 0,
      batteryVoltage: data.batteryVoltage || 0,
      timestamp: data.lastUpdate || new Date().toISOString()
    };
  }
  
  /**
   * 生成模拟数据
   */
  generateMockData() {
    // 模拟气体浓度在 0-80%LEL 之间波动
    const gasConcentration = Math.random() * 80;
    const baseTemp = 25 + Math.random() * 10;
    
    // 模拟报警逻辑
    let deviceStatus = 0; // 正常
    let alarmStatus = 0;  // 无报警
    
    if (gasConcentration > 50) {
      deviceStatus = 1;
      alarmStatus = gasConcentration > 75 ? 2 : 1;
    }
    
    return {
      gasConcentration,
      deviceStatus,
      deviceStatusText: ['正常', '报警', '故障'][deviceStatus],
      alarmStatus,
      alarmStatusText: ['无报警', '低报', '高报'][alarmStatus],
      temperature: baseTemp,
      signalStrength: 20 + Math.floor(Math.random() * 10),
      batteryVoltage: 12.5 + Math.random() * 0.5,
      timestamp: new Date().toISOString(),
      note: '【模拟数据】请配置 --apiUrl 连接真实瑶安云平台'
    };
  }
  
  /**
   * 连接设备
   */
  async connect() {
    try {
      this.lastData = await this.fetchData();
      this.isConnected = true;
      console.log(`[4G] 设备已连接 (GUID: ${this.options.guid})`);
      return true;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }
  
  /**
   * 轮询设备数据
   */
  startPolling(callback) {
    console.log(`[4G] 开始轮询数据 (间隔: ${this.options.pollInterval}ms)`);
    
    const poll = async () => {
      try {
        const data = await this.fetchData();
        if (callback) {
          callback(null, data);
        }
      } catch (error) {
        if (callback) {
          callback(error, null);
        }
      }
      
      // 设置下一次轮询
      setTimeout(poll, this.options.pollInterval);
    };
    
    poll();
  }
}

// ==================== 瑶安 YA-K300-S HTTP 轮询 RS485 设备连接器 ====================

/**
 * YA-K300-S HTTP 轮询 RS485 设备类
 * 
 * 适用场景：
 * - 设备通过 RS485 转 WiFi/以太网 模块暴露 HTTP API
 * - 设备通过本地 HTTP 服务将 Modbus RTU 数据转换为 JSON
 * - 适合无法直接访问串口，但可以通过网络获取串口数据的场景
 * 
 * HTTP API 响应格式要求：
 * {
 *   "hex": "0103001400FA02E8..." // Modbus RTU 响应十六进制字符串
 * }
 * 
 * 或者直接返回寄存器数据：
 * {
 *   "concentration": 15.5,       // 气体浓度 (%LEL)
 *   "status": 0,                // 设备状态 (0=正常, 1=报警, 2=故障)
 *   "alarmStatus": 0,            // 报警状态 (0=无报警, 1=低报, 2=高报)
 *   "temperature": 25.5,        // 温度 (℃)
 *   "gasType": 1,                // 气体类型
 *   "range": 100,               // 量程上限
 *   "lowAlarm": 25,              // 低报阈值
 *   "highAlarm": 50              // 高报阈值
 * }
 */
class YAK300HTTPRTU {
  constructor(options = {}) {
    this.options = {
      apiUrl: options.apiUrl || 'http://localhost:8080/get485',
      timeout: options.timeout || 10000,
      pollInterval: options.pollInterval || 5000
    };
    this.isConnected = false;
    this.lastData = null;
  }
  
  /**
   * 从 HTTP API 获取数据
   */
  async fetchData() {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(this.options.apiUrl);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const req = client.get(this.options.apiUrl, { timeout: this.options.timeout }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const result = this.parseResponse(json);
            this.lastData = result;
            this.isConnected = true;
            resolve(result);
          } catch (e) {
            reject(new Error(`HTTP 响应解析失败: ${e.message}`));
          }
        });
      });
      
      req.on('error', (e) => {
        reject(new Error(`HTTP 请求失败: ${e.message}`));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('HTTP 请求超时'));
      });
    });
  }
  
  /**
   * 解析 HTTP API 响应
   */
  parseResponse(data) {
    // 如果直接返回寄存器数据
    if (typeof data.concentration === 'number') {
      return {
        gasConcentration: data.concentration,
        deviceStatus: data.status || 0,
        deviceStatusText: ['正常', '报警', '故障'][data.status] || '未知',
        alarmStatus: data.alarmStatus || 0,
        alarmStatusText: ['无报警', '低报', '高报'][data.alarmStatus] || '未知',
        temperature: data.temperature || 0,
        gasType: data.gasType || 1,
        gasTypeText: ['甲烷', '丙烷', '丁烷', '戊烷', '乙烯', '乙炔', '氢气'][data.gasType - 1] || '未知',
        range: data.range || 100,
        lowAlarmThreshold: data.lowAlarm || 25,
        highAlarmThreshold: data.highAlarm || 50,
        timestamp: data.timestamp || new Date().toISOString()
      };
    }
    
    // 如果返回十六进制 Modbus RTU 数据
    if (data.hex) {
      try {
        const parsed = ModbusRTUParser.parse(data.hex);
        const registers = parsed.registers;
        
        const gasConcentration = registers[YAK300_REGISTERS.gas_concentration] / 10;
        const deviceStatus = registers[YAK300_REGISTERS.device_status];
        const alarmStatus = registers[YAK300_REGISTERS.alarm_status];
        const temperature = registers[YAK300_REGISTERS.temperature] / 10;
        const gasType = registers[YAK300_REGISTERS.gas_type];
        const range = registers[YAK300_REGISTERS.range];
        const lowAlarmThreshold = registers[YAK300_REGISTERS.low_alarm_threshold];
        const highAlarmThreshold = registers[YAK300_REGISTERS.high_alarm_threshold];
        
        const gasTypeMap = { 1: '甲烷', 2: '丙烷', 3: '丁烷', 4: '戊烷', 5: '乙烯', 6: '乙炔', 7: '氢气' };
        
        return {
          gasConcentration,
          deviceStatus,
          deviceStatusText: ['正常', '报警', '故障'][deviceStatus] || '未知',
          alarmStatus,
          alarmStatusText: ['无报警', '低报', '高报'][alarmStatus] || '未知',
          temperature,
          gasType,
          gasTypeText: gasTypeMap[gasType] || '未知',
          range,
          lowAlarmThreshold,
          highAlarmThreshold,
          timestamp: new Date().toISOString()
        };
      } catch (e) {
        throw new Error(`Modbus RTU 解析失败: ${e.message}`);
      }
    }
    
    throw new Error('不支持的响应格式');
  }
  
  /**
   * 连接设备
   */
  async connect() {
    try {
      this.lastData = await this.fetchData();
      this.isConnected = true;
      console.log(`[HTTP-RS485] 设备已连接`);
      console.log(`[HTTP-RS485] API地址: ${this.options.apiUrl}`);
      return true;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }
  
  /**
   * 轮询设备数据
   */
  startPolling(callback) {
    console.log(`[HTTP-RS485] 开始轮询数据 (间隔: ${this.options.pollInterval}ms)`);
    
    const poll = async () => {
      try {
        const data = await this.fetchData();
        if (callback) {
          callback(null, data);
        }
      } catch (error) {
        console.error(`[HTTP-RS485] 获取数据失败: ${error.message}`);
        if (callback) {
          callback(error, null);
        }
      }
      
      setTimeout(poll, this.options.pollInterval);
    };
    
    poll();
  }
}

// ==================== 命令行参数解析 ====================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'rtu',           // rtu | 4g | http485
    path: '/dev/ttyUSB0',  // RS485 串口路径
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    unitId: 1,
    timeout: 5000,
    guid: 'D2D19D04AF5E433E9C4BFCC4',
    apiUrl: '',
    apiKey: '',
    pollInterval: 30000,
    interval: 5000,        // RS485 读取间隔
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--mode':
        options.mode = args[++i];
        break;
      case '--path':
        options.path = args[++i];
        break;
      case '--baudRate':
        options.baudRate = parseInt(args[++i]);
        break;
      case '--dataBits':
        options.dataBits = parseInt(args[++i]);
        break;
      case '--stopBits':
        options.stopBits = parseInt(args[++i]);
        break;
      case '--parity':
        options.parity = args[++i];
        break;
      case '--unitId':
        options.unitId = parseInt(args[++i]);
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]);
        break;
      case '--guid':
        options.guid = args[++i];
        break;
      case '--apiUrl':
        options.apiUrl = args[++i];
        break;
      case '--apiKey':
        options.apiKey = args[++i];
        break;
      case '--pollInterval':
        options.pollInterval = parseInt(args[++i]);
        break;
      case '--interval':
        options.interval = parseInt(args[++i]);
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }
  
  return options;
}

// ==================== 帮助信息 ====================

function showHelp() {
  console.log(`
瑶安 YA-K300-S 设备连接工具
============================

使用语法:
  node yak300-standalone.js [选项]

选项:
  --mode <模式>           连接模式: rtu (RS485串口) / 4g (4G模块) / http485 (HTTP轮询RS485), 默认: rtu
  
RS485 串口模式选项:
  --path <路径>           串口设备路径, 默认: /dev/ttyUSB0
  --baudRate <波特率>     波特率, 默认: 9600
  --dataBits <数据位>     数据位 (7/8), 默认: 8
  --stopBits <停止位>     停止位 (1/2), 默认: 1
  --parity <校验>         校验位: none/even/odd, 默认: none
  --unitId <地址>         从机地址, 默认: 1
  --timeout <超时>        超时时间(ms), 默认: 5000
  --interval <间隔>       读取间隔(ms), 默认: 5000

4G 模块模式选项:
  --guid <GUID>           设备GUID, 默认: D2D19D04AF5E433E9C4BFCC4
  --apiUrl <URL>          瑶安云API地址
  --apiKey <密钥>         API密钥
  --pollInterval <间隔>   轮询间隔(ms), 默认: 30000
  --timeout <超时>        请求超时(ms), 默认: 10000

HTTP 轮询 RS485 模式选项:
  --apiUrl <URL>          HTTP API地址, 默认: http://localhost:8080/get485
  --pollInterval <间隔>   轮询间隔(ms), 默认: 5000
  --timeout <超时>        请求超时(ms), 默认: 10000

示例:
  # RS485 连接
  node yak300-standalone.js --mode rtu --path /dev/ttyUSB0 --unitId 1
  
  # Windows COM端口
  node yak300-standalone.js --mode rtu --path COM3 --baudRate 9600
  
  # 4G 模块 (模拟数据)
  node yak300-standalone.js --mode 4g --guid D2D19D04AF5E433E9C4BFCC4
  
  # 4G 模块 (连接瑶安云)
  node yak300-standalone.js --mode 4g --guid YOUR_GUID --apiUrl https://api.example.com/data --apiKey YOUR_KEY
  
  # HTTP 轮询 RS485 (获取本地 HTTP 服务返回的 Modbus RTU 十六进制数据)
  node yak300-standalone.js --mode http485 --apiUrl http://192.168.1.100:8080/get485
  
  # HTTP 轮询 RS485 (直接返回 JSON 格式数据)
  node yak300-standalone.js --mode http485 --apiUrl http://192.168.1.100:8080/api/gas

设备寄存器映射 (YA-K300-S):
  地址 0: 气体浓度 (实际值 = 读取值 / 10, 单位 %LEL)
  地址 1: 设备状态 (0=正常, 1=报警, 2=故障)
  地址 2: 报警状态 (0=无报警, 1=低报, 2=高报)
  地址 3: 温度值 (实际值 = 读取值 / 10, 单位 ℃)
  地址 4: 气体类型 (1=甲烷, 2=丙烷, 等)
  地址 5: 量程上限 (默认 100)
  地址 6: 低报阈值 (默认 25)
  地址 7: 高报阈值 (默认 50)

HTTP API 响应格式 (HTTP 轮询 RS485 模式):
  格式1 - Modbus RTU 十六进制:
    {"hex": "0103001400FA02E8000000000000000000640019003200"}
  
  格式2 - 直接 JSON:
    {"concentration": 15.5, "status": 0, "alarmStatus": 0, "temperature": 25.5}

输出格式:
  气体浓度: XX%LEL
  设备状态: 正常/报警/故障
  报警状态: 无报警/低报/高报
  温度: XX℃

首次使用:
  1. 安装依赖: npm install
  2. Linux/macOS: 确保当前用户有串口权限: sudo usermod -a -G dialout $USER
  3. Windows: 安装 CH340/CH341 串口驱动 (public/drivers/CH341SER.EXE)
  4. 运行: node yak300-standalone.js --mode rtu --path /dev/ttyUSB0

  `);
}

// ==================== 主程序 ====================

async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }
  
  const modeNames = {
    'rtu': 'RS485 串口',
    '4g': '4G 模块',
    'http485': 'HTTP 轮询 RS485'
  };
  
  console.log('===========================================');
  console.log('  瑶安 YA-K300-S 设备连接工具');
  console.log('===========================================');
  console.log(`  连接模式: ${modeNames[options.mode] || options.mode}`);
  console.log('===========================================\n');
  
  try {
    if (options.mode === 'rtu') {
      // RS485 模式
      console.log('[RS485] 初始化设备连接...');
      console.log(`  串口路径: ${options.path}`);
      console.log(`  波特率: ${options.baudRate}`);
      console.log(`  从机地址: ${options.unitId}\n`);
      
      const device = new YAK300RTU(options);
      
      try {
        await device.connect();
        
        console.log('\n[RS485] 开始读取数据 (按 Ctrl+C 退出)...\n');
        
        // 定期读取数据
        const readLoop = async () => {
          try {
            const data = await device.readData();
            
            console.log('-------------------------------------------');
            console.log(`[${data.timestamp}]`);
            console.log(`  气体浓度: ${data.gasConcentration.toFixed(1)}%LEL`);
            console.log(`  设备状态: ${data.deviceStatusText}`);
            console.log(`  报警状态: ${data.alarmStatusText}`);
            console.log(`  温度: ${data.temperature.toFixed(1)}℃`);
            console.log(`  气体类型: ${data.gasTypeText}`);
            console.log(`  低报阈值: ${data.lowAlarmThreshold}%LEL`);
            console.log(`  高报阈值: ${data.highAlarmThreshold}%LEL`);
            console.log('-------------------------------------------');
            
            // 报警提示
            if (data.alarmStatus === 1) {
              console.log('\n⚠️  【低报警告】气体浓度超过低报阈值！\n');
            } else if (data.alarmStatus === 2) {
              console.log('\n🚨 【高报报警】气体浓度超过高报阈值！\n');
            }
          } catch (err) {
            console.error(`[RS485] 读取失败: ${err.message}`);
          }
          
          setTimeout(readLoop, options.interval);
        };
        
        readLoop();
        
      } catch (error) {
        console.error(`[RS485] 连接失败: ${error.message}`);
        console.log('\n提示:');
        console.log('  1. 检查串口路径是否正确');
        console.log('  2. 确保有权限访问串口 (Linux: sudo usermod -a -G dialout $USER)');
        console.log('  3. 检查串口是否被其他程序占用');
        console.log('  4. 安装 CH340/CH341 串口驱动');
        process.exit(1);
      }
      
    } else if (options.mode === '4g') {
      // 4G 模式
      console.log('[4G] 初始化设备连接...');
      console.log(`  设备GUID: ${options.guid}`);
      if (options.apiUrl) {
        console.log(`  API地址: ${options.apiUrl}`);
      } else {
        console.log('  API地址: (使用模拟数据)');
      }
      console.log('');
      
      const device = new YAK3004G(options);
      
      try {
        await device.connect();
        
        console.log('\n[4G] 开始轮询数据 (按 Ctrl+C 退出)...\n');
        
        device.startPolling((err, data) => {
          if (err) {
            console.error(`[4G] 获取数据失败: ${err.message}`);
            return;
          }
          
          console.log('-------------------------------------------');
          console.log(`[${data.timestamp}]`);
          console.log(`  气体浓度: ${data.gasConcentration.toFixed(1)}%LEL`);
          console.log(`  设备状态: ${data.deviceStatusText}`);
          console.log(`  报警状态: ${data.alarmStatusText}`);
          console.log(`  温度: ${data.temperature.toFixed(1)}℃`);
          
          if (data.signalStrength) {
            console.log(`  信号强度: ${data.signalStrength} (0-31)`);
          }
          if (data.batteryVoltage) {
            console.log(`  电池电压: ${data.batteryVoltage.toFixed(2)}V`);
          }
          if (data.note) {
            console.log(`  ${data.note}`);
          }
          console.log('-------------------------------------------');
          
          // 报警提示
          if (data.alarmStatus === 1) {
            console.log('\n⚠️  【低报警告】气体浓度超过低报阈值！\n');
          } else if (data.alarmStatus === 2) {
            console.log('\n🚨 【高报报警】气体浓度超过高报阈值！\n');
          }
        });
        
      } catch (error) {
        console.error(`[4G] 连接失败: ${error.message}`);
        console.log('\n提示:');
        console.log('  1. 检查设备GUID是否正确');
        console.log('  2. 检查网络连接');
        console.log('  3. 确认瑶安云API地址和密钥');
        console.log('  4. 检查设备是否在线');
        process.exit(1);
      }
      
    } else if (options.mode === 'http485') {
      // HTTP 轮询 RS485 模式
      console.log('[HTTP-RS485] 初始化设备连接...');
      console.log(`  API地址: ${options.apiUrl || 'http://localhost:8080/get485'}`);
      console.log(`  轮询间隔: ${options.pollInterval}ms`);
      console.log('');
      
      const device = new YAK300HTTPRTU(options);
      
      try {
        await device.connect();
        
        console.log('\n[HTTP-RS485] 开始轮询数据 (按 Ctrl+C 退出)...\n');
        
        device.startPolling((err, data) => {
          if (err) {
            console.error(`[HTTP-RS485] 获取数据失败: ${err.message}`);
            return;
          }
          
          console.log('-------------------------------------------');
          console.log(`[${data.timestamp}]`);
          console.log(`  气体浓度: ${data.gasConcentration.toFixed(1)}%LEL`);
          console.log(`  设备状态: ${data.deviceStatusText}`);
          console.log(`  报警状态: ${data.alarmStatusText}`);
          console.log(`  温度: ${data.temperature.toFixed(1)}℃`);
          console.log(`  气体类型: ${data.gasTypeText}`);
          console.log(`  低报阈值: ${data.lowAlarmThreshold}%LEL`);
          console.log(`  高报阈值: ${data.highAlarmThreshold}%LEL`);
          console.log('-------------------------------------------');
          
          // 报警提示
          if (data.alarmStatus === 1) {
            console.log('\n⚠️  【低报警告】气体浓度超过低报阈值！\n');
          } else if (data.alarmStatus === 2) {
            console.log('\n🚨 【高报报警】气体浓度超过高报阈值！\n');
          }
        });
        
      } catch (error) {
        console.error(`[HTTP-RS485] 连接失败: ${error.message}`);
        console.log('\n提示:');
        console.log('  1. 检查 HTTP API 地址是否正确');
        console.log('  2. 检查网络连接');
        console.log('  3. 确认 HTTP 服务是否正在运行');
        console.log('  4. 检查 HTTP API 返回的数据格式');
        process.exit(1);
      }
      
    } else {
      console.error(`不支持的连接模式: ${options.mode}`);
      console.log('支持的模式: rtu (RS485串口), 4g (4G模块), http485 (HTTP轮询RS485)');
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`错误: ${error.message}`);
    process.exit(1);
  }
}

// 处理 Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n正在关闭连接...');
  process.exit(0);
});

// 运行主程序
main();
