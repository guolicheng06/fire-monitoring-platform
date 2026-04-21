/**
 * 瑶安 YA-K300-S 4G 模块设备连接测试
 * 
 * 用途：测试 4G 模块设备的 HTTP API 连接
 * 设备GUID: D2D19D04AF5E433E9C4BFCC4
 * 
 * 运行方式: npx ts-node scripts/test-yak300-4g.ts
 */

import { YAK3004GDevice, YAK3004GConfig } from '../src/lib/yak300-4g';

async function testYAK3004GConnection() {
  console.log('=== 瑶安 YA-K300-S 4G 模块设备连接测试 ===\n');

  // 测试配置
  const config: YAK3004GConfig = {
    guid: 'D2D19D04AF5E433E9C4BFCC4',
    // apiUrl 和 apiKey 如果不提供，将使用模拟数据
    pollInterval: 30000,
    timeout: 10000,
    deviceType: 'gas',
  };

  console.log('测试配置:', JSON.stringify(config, null, 2));
  console.log('\n--- 测试连接 ---\n');

  // 测试连接
  const testResult = await YAK3004GDevice.testConnection(config);
  console.log('测试结果:', testResult);

  // 如果连接成功，创建设备实例并读取数据
  if (testResult.success) {
    console.log('\n--- 创建设备实例并读取数据 ---\n');
    
    const device = new YAK3004GDevice('TEST-4G-001', config);
    
    try {
      await device.connect();
      console.log('设备已连接\n');
      
      // 读取数据
      for (let i = 0; i < 3; i++) {
        const data = await device.readData();
        console.log(`读取 #${i + 1}:`, JSON.stringify(data, null, 2));
        console.log('');
        
        // 等待一下再读取
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // 获取连接信息
      console.log('连接信息:', device.getConnectionInfo());
      
      // 获取最后数据
      const lastData = device.getLastData();
      console.log('\n最后获取的数据:', JSON.stringify(lastData, null, 2));
      
      // 断开连接
      device.disconnect();
      console.log('\n设备已断开连接');
    } catch (error) {
      console.error('设备操作失败:', error);
    }
  }

  console.log('\n=== 测试完成 ===');
}

// 运行测试
testYAK3004GConnection().catch(console.error);
