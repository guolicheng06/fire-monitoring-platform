/**
 * YA-K300-S 可燃气体探测器 RS485 读取工具
 * 
 * 使用方法：
 *   node simple-rtu.js                    # 使用默认配置
 *   node simple-rtu.js COM3              # 指定串口
 *   node simple-rtu.js COM3 9600 1       # 指定串口、波特率、从机地址
 * 
 * 依赖安装：
 *   npm install serialport modbus-serial
 */

// 兼容 serialport v12+ 的导入方式
const sp = require('serialport');
const SerialPort = sp.SerialPort || sp.default || sp;
const ModbusRTU = require('modbus-serial');

// ===================== 配置区域 =====================
const PORT = process.argv[2] || 'COM3';      // 串口号
const BAUDRATE = parseInt(process.argv[3]) || 9600;
const PARITY = 'none';
const STOPBITS = 1;
const BYTESIZE = 8;
const SLAVE_ADDR = parseInt(process.argv[4]) || 1;  // 从机地址
// ====================================================

const client = new ModbusRTU();

async function readGasDetector() {
  console.log('==========================================');
  console.log('  可燃气体报警器 RS485 检测程序');
  console.log('==========================================');
  console.log(`串口: ${PORT}`);
  console.log(`波特率: ${BAUDRATE}`);
  console.log(`从机地址: ${SLAVE_ADDR}`);
  console.log('');

  try {
    // 连接串口
    console.log('正在连接...');
    await client.connectRTUBuffered(PORT, {
      baudRate: BAUDRATE,
      parity: PARITY,
      stopBits: STOPBITS,
      dataBits: BYTESIZE,
    });
    client.setID(SLAVE_ADDR);
    client.setTimeout(1000);
    console.log('串口连接成功！');
    console.log('');

    // 循环读取数据
    let count = 0;
    while (true) {
      count++;
      console.log(`--- 第 ${count} 次读取 ---`);

      try {
        // 读取保持寄存器 (地址0，长度4)
        const result = await client.readHoldingRegisters(0, 4);
        
        // 解析数据
        const gasConcentration = result.data[0] / 10;  // 气体浓度 (%LEL)
        const deviceStatus = result.data[1];           // 设备状态
        const alarmStatus = result.data[2];            // 报警状态
        const temperature = result.data[3] / 10;      // 温度 (℃)

        // 设备状态: 0=正常, 1=报警, 2=故障
        const statusMap = { 0: '正常', 1: '报警', 2: '故障' };
        
        // 报警状态: 0=无报警, 1=低报, 2=高报
        const alarmMap = { 0: '无报警', 1: '低报', 2: '高报' };

        console.log(`✅ 气体浓度: ${gasConcentration} %LEL`);
        console.log(`✅ 设备状态: ${statusMap[deviceStatus] || '未知'} (${deviceStatus})`);
        console.log(`✅ 报警状态: ${alarmMap[alarmStatus] || '未知'} (${alarmStatus})`);
        console.log(`✅ 温度: ${temperature} ℃`);

      } catch (err) {
        console.log(`❌ 读取失败: ${err.message}`);
      }

      console.log('-'.repeat(40));
      await sleep(2000);  // 2秒间隔
    }

  } catch (err) {
    console.log(`❌ 连接失败: ${err.message}`);
    console.log('');
    console.log('请检查:');
    console.log('  1. 串口是否正确 (当前: ' + PORT + ')');
    console.log('  2. 设备是否连接');
    console.log('  3. USB转串口驱动是否安装');
  } finally {
    client.close();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行
readGasDetector();
