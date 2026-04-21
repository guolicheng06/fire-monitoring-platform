// WebSocket消息类型定义
export interface WsMessage<T = unknown> {
  type: string;
  payload: T;
}

// WebSocket连接选项
export interface WsOptions {
  path: string;
  onMessage: (msg: WsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  heartbeatMs?: number;
}

// 创建WebSocket连接
export function createWsConnection(opts: WsOptions): { 
  send: (msg: WsMessage) => void; 
  close: () => void;
  isConnected: () => boolean;
} {
  let ws: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setInterval> | null = null;
  let closed = false;
  
  const {
    path,
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    heartbeatMs = 30000,
  } = opts;

  function connect() {
    if (typeof window === 'undefined') return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    try {
      ws = new WebSocket(`${protocol}//${host}${path}`);
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      onError?.(new Event('error'));
      return;
    }

    ws.onopen = () => {
      console.log('[WebSocket] Connected to', path);
      // 启动心跳
      heartbeatTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', payload: null }));
        }
      }, heartbeatMs);
      onOpen?.();
    };

    ws.onmessage = (e) => {
      try {
        const msg: WsMessage = JSON.parse(e.data);
        // 忽略pong消息
        if (msg.type === 'pong') return;
        onMessage(msg);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      onClose?.();
      
      // 自动重连
      if (reconnect && !closed) {
        console.log(`[WebSocket] Reconnecting in ${reconnectInterval}ms...`);
        reconnectTimer = setTimeout(connect, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      onError?.(error);
    };
  }

  connect();

  return {
    send: (msg: WsMessage) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      } else {
        console.warn('[WebSocket] Cannot send, not connected');
      }
    },
    close: () => {
      closed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (ws) {
        ws.close();
        ws = null;
      }
    },
    isConnected: () => ws?.readyState === WebSocket.OPEN,
  };
}

// React Hook for WebSocket
import { useEffect, useRef, useCallback, useState } from 'react';

export function useWebSocket(path: string, onMessage: (msg: WsMessage) => void) {
  const connRef = useRef<ReturnType<typeof createWsConnection> | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    connRef.current = createWsConnection({
      path,
      onMessage,
      onOpen: () => setIsConnected(true),
      onClose: () => setIsConnected(false),
      onError: () => setIsConnected(false),
    });

    return () => {
      connRef.current?.close();
    };
  }, [path]);

  const send = useCallback((msg: WsMessage) => {
    connRef.current?.send(msg);
  }, []);

  return { send, isConnected };
}
