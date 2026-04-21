/**
 * 本地模拟 HTTP 服务器
 * 
 * 用于测试 HTTP 轮询 RS485 模式
 * 
 * 使用方法：
 *   node mock-http-server.js
 * 
 * 默认监听端口: 8099
 * 访问地址: http://127.0.0.1:8099/read
 */

const http = require('http');
const PORT = process.env.PORT || 8099;

// 模拟 Modbus RTU 数据
function generateModbusRTUData() {
  // 模拟气体浓度在 0-80%LEL 之间波动
  const gasConcentration = Math.floor(Math.random() * 800); // 原始值 (需要/10)
  const temperature = Math.floor((250 + Math.random() * 100)); // 原始值 (需要/10)
  const deviceStatus = gasConcentration > 500 ? 1 : 0;
  const alarmStatus = gasConcentration > 750 ? 2 : (gasConcentration > 500 ? 1 : 0);
  
  // 构建 Modbus RTU 响应 (从机地址 + 功能码 + 字节数 + 数据 + CRC)
  // 地址0: 气体浓度 (2字节)
  // 地址1: 设备状态 (2字节)
  // 地址2: 报警状态 (2字节)
  // 地址3: 温度 (2字节)
  // 地址4: 气体类型 (2字节) - 甲烷
  // 地址5: 量程上限 (2字节) - 100
  // 地址6: 低报阈值 (2字节) - 25
  // 地址7: 高报阈值 (2字节) - 50
  
  const registers = [
    gasConcentration,  // 地址0: 气体浓度
    deviceStatus,     // 地址1: 设备状态
    alarmStatus,      // 地址2: 报警状态
    temperature,      // 地址3: 温度
    1,                // 地址4: 气体类型 (甲烷)
    100,              // 地址5: 量程上限
    25,               // 地址6: 低报阈值
    50                // 地址7: 高报阈值
  ];
  
  // 计算 CRC16 (Modbus)
  function calculateCRC16(data) {
    let crc = 0xFFFF;
    for (const byte of data) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x0001) {
          crc = (crc >> 1) ^ 0xA001;
        } else {
          crc = crc >> 1;
        }
      }
    }
    return crc;
  }
  
  // 构建响应数据
  const slaveAddress = 1;
  const functionCode = 0x03;
  const byteCount = registers.length * 2;
  
  const dataBytes = [];
  for (const reg of registers) {
    dataBytes.push((reg >> 8) & 0xFF); // 高字节
    dataBytes.push(reg & 0xFF);        // 低字节
  }
  
  const crcData = [slaveAddress, functionCode, byteCount, ...dataBytes];
  const crc = calculateCRC16(crcData);
  const crcLow = crc & 0xFF;
  const crcHigh = (crc >> 8) & 0xFF;
  
  const response = Buffer.from([slaveAddress, functionCode, byteCount, ...dataBytes, crcLow, crcHigh]);
  
  return response.toString('hex');
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  if (req.url === '/read' || req.url === '/') {
    // 返回 Modbus RTU 十六进制数据
    const hexData = generateModbusRTUData();
    
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    
    const response = {
      hex: hexData,
      timestamp: new Date().toISOString(),
      note: '模拟 Modbus RTU 响应数据'
    };
    
    console.log(`[${new Date().toISOString()}] 返回数据: ${hexData}`);
    res.end(JSON.stringify(response, null, 2));
    
  } else if (req.url === '/json') {
    // 返回直接 JSON 格式
    const gasConcentration = Math.random() * 80;
    const temperature = 25 + Math.random() * 10;
    const deviceStatus = gasConcentration > 50 ? 1 : 0;
    const alarmStatus = gasConcentration > 75 ? 2 : (gasConcentration > 50 ? 1 : 0);
    
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    
    const response = {
      concentration: parseFloat(gasConcentration.toFixed(1)),
      status: deviceStatus,
      alarmStatus: alarmStatus,
      temperature: parseFloat(temperature.toFixed(1)),
      gasType: 1,
      range: 100,
      lowAlarm: 25,
      highAlarm: 50,
      timestamp: new Date().toISOString(),
      note: '模拟直接 JSON 格式数据'
    };
    
    console.log(`[${new Date().toISOString()}] 返回 JSON 数据:`, response);
    res.end(JSON.stringify(response, null, 2));
    
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', availableEndpoints: ['/read', '/json', '/health'] }));
  }
});

server.listen(PORT, () => {
  console.log('===========================================');
  console.log('  本地模拟 HTTP 服务器');
  console.log('===========================================');
  console.log(`  监听端口: ${PORT}`);
  console.log('===========================================');
  console.log('');
  console.log('可用端点:');
  console.log('  GET /read   - 返回 Modbus RTU 十六进制数据');
  console.log('  GET /json   - 返回直接 JSON 格式数据');
  console.log('  GET /health - 健康检查');
  console.log('');
  console.log('测试命令:');
  console.log(`  curl http://127.0.0.1:${PORT}/read`);
  console.log('');
  console.log('脚本连接测试:');
  console.log(`  node yak300-standalone.js --mode http485 --apiUrl http://127.0.0.1:${PORT}/read`);
  console.log('');
  console.log('按 Ctrl+C 停止服务器');
  console.log('===========================================');
});

// 处理错误
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请先停止占用该端口的程序，或修改 PORT 环境变量`);
  } else {
    console.error('服务器错误:', err);
  }
  process.exit(1);
});
