'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Minimize2, Maximize2, Send, Bot, Loader2, BarChart3, RefreshCw, Flame, Radio, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PlatformStats {
  devices: { total: number; online: number; offline: number; fault: number };
  alarms: { total: number; pending: number; todayCount: number };
  customers: { total: number };
}

interface AIAssistantProps {
  botId?: string;
  title?: string;
  welcomeMessage?: string;
}

const DEFAULT_BOT_ID = '7620784551534739507';
const DEFAULT_TITLE = '安全助手';
const DEFAULT_WELCOME = '您好！我是消防安全智能助手，可以帮您解答报警处理、设备维护、安全检查等问题。';

// 平台数据上下文说明
const PLATFORM_CONTEXT = `【当前监控平台数据接口】
您可以通过访问 /api/platform-data 获取平台实时数据：

1. 获取完整数据: /api/platform-data?type=full
   - 返回: 总商户数、总设备数、在线设备、故障设备、总报警、待处理报警、今日报警

2. 获取设备列表: /api/platform-data?type=devices
   - 可选参数: customer_id, status (online/offline/fault)

3. 获取报警记录: /api/platform-data?type=alarms
   - 可选参数: customer_id, device_id, status

4. 获取商户列表: /api/platform-data?type=customers

【设备类型】
- fire_alarm: 火灾报警器
- gas_detector: 可燃气体探测器
- temperature_detector: 温度探测器
- smoke_detector: 烟雾探测器

【报警级别】
- critical: 紧急 (红色)
- danger: 危险 (橙色)
- warning: 警告 (黄色)
- info: 提示 (蓝色)

【报警状态】
- pending: 待处理
- acknowledged: 已确认
- resolved: 已处理
- closed: 已关闭

请根据用户问题，主动调用相关接口获取最新数据进行分析和回答。`;

export function AIAssistant({
  botId = DEFAULT_BOT_ID,
  title = DEFAULT_TITLE,
  welcomeMessage = DEFAULT_WELCOME,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // 加载平台统计数据
  const loadPlatformStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/platform-data?type=dashboard');
      if (res.ok) {
        const data = await res.json();
        setPlatformStats({
          devices: data.data.stats.devices,
          alarms: data.data.stats.alarms,
          customers: { total: data.data.customers.length },
        });
      }
    } catch (error) {
      console.error('Failed to load platform stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // 初始化欢迎消息
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadPlatformStats();
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, welcomeMessage, loadPlatformStats]);

  // 生成带数据的用户消息
  const generateContextMessage = useCallback((userInput: string) => {
    if (!platformStats) {
      return userInput;
    }

    const contextInfo = `
【用户问题】
${userInput}

【当前平台实时数据】
- 总商户数: ${platformStats.customers.total}
- 总设备数: ${platformStats.devices.total}
- 在线设备: ${platformStats.devices.online}
- 故障设备: ${platformStats.devices.fault}
- 总报警数: ${platformStats.alarms.total}
- 待处理报警: ${platformStats.alarms.pending}
- 今日报警: ${platformStats.alarms.todayCount}

请根据以上实时数据回答用户问题。`;

    return contextInfo;
  }, [platformStats]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 生成带上下文的用户消息
    const contextMessage = generateContextMessage(userMessage.content);

    // 将上下文消息发送到Coze智能体
    const fullMessage = `${PLATFORM_CONTEXT}\n\n${contextMessage}`;

    // 复制到剪贴板并提示用户
    try {
      await navigator.clipboard.writeText(fullMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `已为您准备上下文数据，点击下方"打开完整对话"按钮粘贴到智能体对话框中。我会告诉您当前平台的实时状态：\n\n• 总设备: ${platformStats?.devices.total || 0} | 在线: ${platformStats?.devices.online || 0} | 故障: ${platformStats?.devices.fault || 0}\n• 待处理报警: ${platformStats?.alarms.pending || 0} | 今日报警: ${platformStats?.alarms.todayCount || 0}\n• 商户总数: ${platformStats?.customers.total || 0}`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `当前平台状态：\n\n• 总设备: ${platformStats?.devices.total || 0} | 在线: ${platformStats?.devices.online || 0} | 故障: ${platformStats?.devices.fault || 0}\n• 待处理报警: ${platformStats?.alarms.pending || 0} | 今日报警: ${platformStats?.alarms.todayCount || 0}\n• 商户总数: ${platformStats?.customers.total || 0}\n\n点击"打开完整对话"可以与智能体进行更详细的交流。`,
          timestamp: new Date(),
        },
      ]);
    }

    setIsLoading(false);
  };

  // 发送平台数据到Coze
  const sendPlatformContext = async () => {
    if (!platformStats) return;

    const contextText = `${PLATFORM_CONTEXT}

【当前实时数据】
- 商户总数: ${platformStats.customers.total}
- 设备总数: ${platformStats.devices.total}
- 在线设备: ${platformStats.devices.online}
- 离线设备: ${platformStats.devices.offline}
- 故障设备: ${platformStats.devices.fault}
- 报警总数: ${platformStats.alarms.total}
- 待处理报警: ${platformStats.alarms.pending}
- 今日报警: ${platformStats.alarms.todayCount}

请根据以上数据提供分析和建议。`;

    try {
      await navigator.clipboard.writeText(contextText);
      // 提示用户
      const msg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '已将平台实时数据复制到剪贴板！\n\n请在智能体对话框中粘贴（Ctrl+V）获取完整上下文，然后描述您想了解的问题。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg]);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // 切换窗口最小化
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // 处理键盘发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 打开完整对话
  const openFullChat = () => {
    // 准备要发送的数据
    const contextData = platformStats ? `
【当前平台实时状态】
总设备: ${platformStats.devices.total} | 在线: ${platformStats.devices.online} | 故障: ${platformStats.devices.fault}
报警: ${platformStats.alarms.total}条 | 待处理: ${platformStats.alarms.pending} | 今日: ${platformStats.alarms.todayCount}
商户: ${platformStats.customers.total}家

请提供分析和建议。` : '';

    // 打开新窗口并传递数据
    const url = `https://code.coze.cn/web-sdk/${botId}`;
    const newWindow = window.open(url, '_blank');

    // 如果可以，尝试通过postMessage传递数据
    if (newWindow) {
      newWindow.onload = () => {
        newWindow.postMessage({
          type: 'PLATFORM_CONTEXT',
          data: {
            stats: platformStats,
            context: PLATFORM_CONTEXT,
          }
        }, '*');
      };
    }
  };

  return (
    <>
      {/* 悬浮按钮 */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 z-50 transition-all duration-300 hover:scale-105"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 text-white" />
          {platformStats?.alarms.pending && platformStats.alarms.pending > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-bold">
              {platformStats.alarms.pending > 9 ? '9+' : platformStats.alarms.pending}
            </span>
          )}
        </Button>
      )}

      {/* 聊天窗口 */}
      {isOpen && !isMinimized && (
        <Card className="fixed bottom-6 right-6 w-[420px] h-[600px] shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0 mt-1">
                    在线
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMinimize}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 实时数据卡片 */}
            {platformStats && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <Radio className="h-4 w-4 mx-auto mb-1" />
                  <div className="font-bold">{platformStats.devices.total}</div>
                  <div className="text-white/70">设备总数</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                  <div className="font-bold">{platformStats.alarms.pending}</div>
                  <div className="text-white/70">待处理报警</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <Flame className="h-4 w-4 mx-auto mb-1" />
                  <div className="font-bold">{platformStats.customers.total}</div>
                  <div className="text-white/70">商户总数</div>
                </div>
              </div>
            )}
          </div>

          {/* 消息区域 */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg p-3',
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                      : 'bg-white border shadow-sm'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={cn(
                      'text-xs mt-1',
                      msg.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                    )}
                  >
                    {msg.timestamp.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  <span className="text-sm text-muted-foreground">AI思考中...</span>
                </div>
              </div>
            )}
          </CardContent>

          {/* 输入区域 */}
          <div className="p-4 border-t bg-white space-y-3">
            {/* 快捷操作 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={sendPlatformContext}
                disabled={!platformStats}
                className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                发送平台数据
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPlatformStats}
                disabled={isLoadingStats}
                className="flex-1"
              >
                <RefreshCw className={cn('h-3 w-3 mr-1', isLoadingStats && 'animate-spin')} />
                刷新状态
              </Button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的问题..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={openFullChat}
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              打开完整对话
            </Button>
          </div>
        </Card>
      )}

      {/* 最小化状态 */}
      {isOpen && isMinimized && (
        <Button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 h-12 px-4 rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 z-50 flex items-center gap-2"
        >
          <Bot className="h-5 w-5 text-white" />
          <span className="text-white font-medium">{title}</span>
          {platformStats?.alarms.pending && platformStats.alarms.pending > 0 && (
            <Badge variant="secondary" className="bg-white text-red-600 text-xs">
              {platformStats.alarms.pending}
            </Badge>
          )}
        </Button>
      )}
    </>
  );
}

// 嵌入式智能体组件（用于页面内嵌）
interface EmbeddedBotProps {
  botId?: string;
  className?: string;
}

export function EmbeddedBot({ botId = DEFAULT_BOT_ID, className = '' }: EmbeddedBotProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn('relative', className)}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="text-sm text-muted-foreground">加载智能体中...</span>
          </div>
        </div>
      )}
      <iframe
        src={`https://code.coze.cn/web-sdk/${botId}`}
        className="w-full h-full rounded-lg border-0"
        onLoad={() => setIsLoaded(true)}
        allow="clipboard-write"
        title="AI Assistant"
      />
    </div>
  );
}

export default AIAssistant;
