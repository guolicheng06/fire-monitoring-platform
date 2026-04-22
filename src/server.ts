import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';

// 导入WebSocket处理器
import { setupAlarmHandler, setupDeviceHandler } from './ws-handlers/alarm';

// 导入设备管理器
import { deviceManager } from './lib/device-manager';

const dev = process.env.COZE_PROJECT_ENV !== 'PROD';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '5000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// WebSocket路由注册
const wssMap = new Map<string, WebSocketServer>();

function registerWsEndpoint(path: string): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  wssMap.set(path, wss);
  return wss;
}

function handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
  const { pathname } = new URL(req.url!, `http://${req.headers.host}`);
  const wss = wssMap.get(pathname);
  if (wss) {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  } else if (!dev) {
    // 生产环境销毁未注册的 upgrade 请求
    socket.destroy();
  }
}

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  // 注册 WebSocket 端点
  const alarmWss = registerWsEndpoint('/ws/alarm');
  const deviceWss = registerWsEndpoint('/ws/device');
  
  // 设置处理器
  setupAlarmHandler(alarmWss);
  setupDeviceHandler(deviceWss);

  server.on('upgrade', handleUpgrade);

  // 启动设备管理器
  try {
    await deviceManager.loadDevicesFromDb();
    deviceManager.start();
    console.log('[Server] Device manager started');
  } catch (error) {
    console.error('[Server] Failed to start device manager:', error);
  }

  server.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : process.env.COZE_PROJECT_ENV
      }`,
    );
    console.log('[Server] WebSocket endpoints:');
    console.log('  - /ws/alarm (报警推送)');
    console.log('  - /ws/device (设备数据)');
  });
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('[Server] Shutting down...');
  deviceManager.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Server] Shutting down...');
  deviceManager.stop();
  process.exit(0);
});
