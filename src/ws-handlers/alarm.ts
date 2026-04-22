import { WebSocketServer, WebSocket } from 'ws';
import type { WsMessage } from '../lib/ws-client';
import { deviceManager } from '@/lib/device-manager';
import { alarmOps, deviceOps } from '@/lib/db-operations';

// 所有活跃的WebSocket连接
const clients = new Set<WebSocket>();

// 广播消息给所有客户端
function broadcast(msg: WsMessage) {
  const data = JSON.stringify(msg);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// 处理报警回调
function handleAlarm(alarm: any, device: any, customer: any) {
  broadcast({
    type: 'alarm:new',
    payload: {
      alarm,
      device,
      customer,
    },
  });
}

// 设置报警监控端点
export function setupAlarmHandler(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    console.log('[WS/Alarm] Client connected, total:', clients.size);

    ws.on('message', (raw) => {
      try {
        const msg: WsMessage = JSON.parse(raw.toString());
        
        switch (msg.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', payload: null }));
            break;

          case 'alarm:get_pending':
            // 获取待处理报警
            alarmOps.getPending().then((alarms) => {
              ws.send(JSON.stringify({
                type: 'alarm:list',
                payload: alarms,
              }));
            });
            break;

          case 'alarm:acknowledge':
            // 确认报警
            const { id, acknowledgedBy } = msg.payload as any;
            if (id && acknowledgedBy) {
              alarmOps.acknowledge(id, acknowledgedBy).then((alarm) => {
                ws.send(JSON.stringify({
                  type: 'alarm:acknowledged',
                  payload: alarm,
                }));
                // 广播更新
                broadcast({
                  type: 'alarm:updated',
                  payload: alarm,
                });
              });
            }
            break;

          case 'alarm:resolve':
            // 处理报警
            const { id: alarmId, resolvedBy, resolution } = msg.payload as any;
            if (alarmId && resolvedBy && resolution) {
              alarmOps.resolve(alarmId, resolvedBy, resolution).then((alarm) => {
                ws.send(JSON.stringify({
                  type: 'alarm:resolved',
                  payload: alarm,
                }));
                // 广播更新
                broadcast({
                  type: 'alarm:updated',
                  payload: alarm,
                });
              });
            }
            break;

          default:
            console.log('[WS/Alarm] Unknown message type:', msg.type);
        }
      } catch (error) {
        console.error('[WS/Alarm] Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('[WS/Alarm] Client disconnected, total:', clients.size);
    });

    ws.on('error', (error) => {
      console.error('[WS/Alarm] WebSocket error:', error);
      clients.delete(ws);
    });

    // 发送连接成功消息
    ws.send(JSON.stringify({
      type: 'connected',
      payload: { message: 'Connected to alarm notification service' },
    }));
  });
}

// 设置设备数据端点
export function setupDeviceHandler(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS/Device] Client connected');

    ws.on('message', async (raw) => {
      try {
        const msg: WsMessage = JSON.parse(raw.toString());
        
        switch (msg.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', payload: null }));
            break;

          case 'device:get_all':
            // 获取所有设备
            const devices = await deviceOps.getAll();
            ws.send(JSON.stringify({
              type: 'device:list',
              payload: devices,
            }));
            break;

          case 'device:get_stats':
            // 获取设备统计
            const stats = await deviceOps.getStats();
            ws.send(JSON.stringify({
              type: 'device:stats',
              payload: stats,
            }));
            break;

          case 'device:read':
            // 读取设备数据
            const { deviceId } = msg.payload as any;
            if (deviceId) {
              const data = await deviceManager.readDevice(deviceId);
              ws.send(JSON.stringify({
                type: 'device:data',
                payload: data,
              }));
            }
            break;

          case 'device:get_by_customer':
            // 根据商户获取设备
            const { customerId } = msg.payload as any;
            if (customerId) {
              const customerDevices = await deviceOps.getByCustomer(customerId);
              ws.send(JSON.stringify({
                type: 'device:list',
                payload: customerDevices,
              }));
            }
            break;

          default:
            console.log('[WS/Device] Unknown message type:', msg.type);
        }
      } catch (error) {
        console.error('[WS/Device] Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      console.log('[WS/Device] Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('[WS/Device] WebSocket error:', error);
    });
  });
}

// 设置设备管理端点
export function setupDeviceManagerHandler(wss: WebSocketServer) {
  // 设置报警回调
  deviceManager.setAlarmCallback(handleAlarm);

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS/DeviceManager] Client connected');

    // 定期广播设备状态
    const interval = setInterval(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          const stats = await deviceOps.getStats();
          ws.send(JSON.stringify({
            type: 'device:stats',
            payload: stats,
          }));
        } catch (error) {
          console.error('[WS/DeviceManager] Error getting stats:', error);
        }
      }
    }, 10000);

    ws.on('close', () => {
      clearInterval(interval);
      console.log('[WS/DeviceManager] Client disconnected');
    });

    ws.on('error', (error) => {
      clearInterval(interval);
      console.error('[WS/DeviceManager] WebSocket error:', error);
    });
  });
}
