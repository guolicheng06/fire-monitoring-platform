'use client';

import { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Search, Filter, Wind, AlertTriangle, CheckCircle, XCircle,
  Radio, Activity, Settings, RefreshCw, Eye, Edit, Power,
  Flame, Gauge, Wifi, WifiOff, X, Bell, Volume2, LineChart
} from 'lucide-react';
import { 
  AreaChart as RechartsAreaChart, 
  Area as RechartsArea, 
  XAxis as RechartsXAxis, 
  YAxis as RechartsYAxis, 
  CartesianGrid as RechartsCartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer as RechartsResponsiveContainer,
  ReferenceLine as RechartsReferenceLine 
} from 'recharts';

// 设备类型定义
interface GasDetector {
  id: string;
  name: string;
  location: string;
  deviceCode: string;
  concentration: number;
  status: string;
  alarmStatus: string;
  threshold: number;
  isReal: boolean;
}

// 报警信息类型
interface AlarmInfo {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  location: string;
  concentration: number;
  alarmStatus: string;
  threshold: number;
  time: Date;
}

// 历史数据点类型
interface HistoryDataPoint {
  time: string;
  timeStr: string;
  concentration: number;
  alarmStatus: string;
}

// 设备状态配置
const statusConfig = {
  online: { label: '在线', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', icon: <Wifi className="w-4 h-4" /> },
  offline: { label: '离线', color: 'text-[#6C6C6C]', bg: 'bg-[#6C6C6C]/10', icon: <WifiOff className="w-4 h-4" /> },
  normal: { label: '正常', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', icon: <CheckCircle className="w-4 h-4" /> },
  alarm: { label: '报警', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10', icon: <XCircle className="w-4 h-4" /> },
  fault: { label: '故障', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10', icon: <XCircle className="w-4 h-4" /> },
};

// 报警状态配置
const alarmConfig = {
  normal: { label: '正常', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' },
  warning: { label: '预警', color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10' },
  low: { label: '低报', color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10' },
  high: { label: '高报', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
  alarm: { label: '报警', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
  offline: { label: '离线', color: 'text-[#6C6C6C]', bg: 'bg-[#6C6C6C]/10' },
  fault: { label: '故障', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
};

export default function GasDevicePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAlarm, setFilterAlarm] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<GasDetector | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [detectors, setDetectors] = useState<GasDetector[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // 报警弹窗状态
  const [alarmPopup, setAlarmPopup] = useState<AlarmInfo | null>(null);
  const [alarmHistory, setAlarmHistory] = useState<AlarmInfo[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousAlarmsRef = useRef<Set<string>>(new Set());
  
  // 曲线图状态
  const [showChart, setShowChart] = useState(false);
  const [chartDeviceId, setChartDeviceId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<Map<string, HistoryDataPoint[]>>(new Map());
  const MAX_HISTORY_POINTS = 60; // 最多保存60个数据点
  const historyDataRef = useRef<Map<string, HistoryDataPoint[]>>(new Map());

  // 配置表单
  const [configForm, setConfigForm] = useState({
    alarmThreshold: '50',
    warningThreshold: '30',
    alarmDelay: '10',
    linkageValve: true,
    linkageFan: true,
    notificationEnabled: true,
    autoReset: false,
    checkInterval: '30',
  });

  // 从API获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/devices/gas-realtime');
        const data = await response.json();
        if (data.detectors) {
          setDetectors(data.detectors);
          setLastUpdate(new Date());
          
          // 记录历史数据（针对真实设备）
          const now = new Date();
          const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          for (const device of data.detectors) {
            if (device.isReal) {
              const newPoint: HistoryDataPoint = {
                time: now.toISOString(),
                timeStr,
                concentration: device.concentration,
                alarmStatus: device.alarmStatus,
              };
              
              // 更新ref中的历史数据
              const deviceHistory = historyDataRef.current.get(device.id) || [];
              deviceHistory.push(newPoint);
              if (deviceHistory.length > MAX_HISTORY_POINTS) {
                deviceHistory.shift();
              }
              historyDataRef.current.set(device.id, deviceHistory);
            }
          }
          
          // 检测真实设备的报警 - 只针对真实设备
          const realDevices = data.detectors.filter((d: GasDetector) => d.isReal);
          for (const device of realDevices) {
            const isAlarming = device.alarmStatus !== 'normal' || device.status === 'alarm';
            const alarmKey = `${device.id}-${device.alarmStatus}`;
            
            // 如果是新的报警（不在上一次的报警列表中）
            if (isAlarming && !previousAlarmsRef.current.has(alarmKey)) {
              // 创建报警信息
              const alarmInfo: AlarmInfo = {
                deviceId: device.id,
                deviceCode: device.deviceCode,
                deviceName: device.name,
                location: device.location || '未知位置',
                concentration: device.concentration,
                alarmStatus: device.alarmStatus,
                threshold: device.threshold,
                time: new Date(),
              };
              
              // 触发报警弹窗
              setAlarmPopup(alarmInfo);
              
              // 添加到历史记录
              setAlarmHistory(prev => [alarmInfo, ...prev.slice(0, 9)]);
              
              // 播放报警声音
              if (soundEnabled && audioRef.current) {
                audioRef.current.play().catch(() => {});
              }
            }
          }
          
          // 更新已处理的报警列表
          previousAlarmsRef.current.clear();
          for (const device of realDevices) {
            if (device.alarmStatus !== 'normal' || device.status === 'alarm') {
              previousAlarmsRef.current.add(`${device.id}-${device.alarmStatus}`);
            }
          }
          
          // 同步历史数据到state
          setHistoryData(new Map(historyDataRef.current));
        }
        setIsLoading(false);
      } catch (error) {
        console.error('获取燃气设备数据失败:', error);
        setIsLoading(false);
      }
    };

    fetchData();
    // 每2秒刷新一次
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  // 过滤数据
  const filteredDevices = detectors.filter(device => {
    const matchSearch = 
      device.name.includes(searchTerm) || 
      device.deviceCode.includes(searchTerm) || 
      device.location.includes(searchTerm);
    
    // 状态过滤：online/normal -> 在线, offline -> 离线, alarm/fault -> 故障
    let deviceStatus = 'online';
    if (device.status === 'offline') deviceStatus = 'offline';
    else if (device.status === 'alarm' || device.status === 'fault') deviceStatus = 'fault';
    
    const matchStatus = filterStatus === 'all' || deviceStatus === filterStatus;
    
    // 报警过滤
    const matchAlarm = filterAlarm === 'all' || device.alarmStatus === filterAlarm;
    
    return matchSearch && matchStatus && matchAlarm;
  });

  // 统计
  const stats = {
    total: detectors.length,
    online: detectors.filter(d => d.status !== 'offline' && d.status !== 'fault').length,
    alarm: detectors.filter(d => d.alarmStatus !== 'normal').length,
    offline: detectors.filter(d => d.status === 'offline' || d.status === 'fault').length,
    realDevices: detectors.filter(d => d.isReal).length,
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/devices/gas-realtime');
      const data = await response.json();
      if (data.detectors) {
        setDetectors(data.detectors);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('刷新失败:', error);
    }
    setIsLoading(false);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[#0078D4]/20">
              <Wind className="w-7 h-7 text-[#0078D4]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#E5E5E5]">燃气设备管理</h1>
              <p className="text-[#A0A0A0] text-sm mt-1">
                可燃气体探测系统监控与管理 
                {stats.realDevices > 0 && (
                  <span className="ml-2 text-[#4CAF50]">📡 {stats.realDevices}台真实设备已接入</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-[#6C6C6C] text-sm">
                最后更新: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              刷新数据
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0078D4]/10">
                <Wind className="w-5 h-5 text-[#0078D4]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">设备总数</p>
                <p className="text-2xl font-bold text-[#E5E5E5]">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#4CAF50]/10">
                <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">在线设备</p>
                <p className="text-2xl font-bold text-[#4CAF50]">{stats.online}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#FF9800]/10">
                <AlertTriangle className="w-5 h-5 text-[#FF9800]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">预警/报警</p>
                <p className="text-2xl font-bold text-[#FF9800]">{stats.alarm}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#D32F2F]/10">
                <XCircle className="w-5 h-5 text-[#D32F2F]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">故障/离线</p>
                <p className="text-2xl font-bold text-[#D32F2F]">{stats.offline}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 筛选工具栏 */}
        <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C6C6C]" />
                <input
                  type="text"
                  placeholder="搜索设备名称、编号或位置..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#A0A0A0] text-sm">状态:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                <option value="all">全部</option>
                <option value="online">在线</option>
                <option value="offline">离线</option>
                <option value="fault">故障</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#A0A0A0] text-sm">报警:</span>
              <select
                value={filterAlarm}
                onChange={(e) => setFilterAlarm(e.target.value)}
                className="px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                <option value="all">全部</option>
                <option value="normal">正常</option>
                <option value="warning">预警</option>
                <option value="alarm">报警</option>
              </select>
            </div>
          </div>
        </div>

        {/* 设备列表 */}
        <div className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1A1A1A]">
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">设备编号</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">设备名称</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">安装位置</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">浓度(%LEL)</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">状态</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">报警状态</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#6C6C6C]">
                    加载中...
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#6C6C6C]">
                    暂无设备数据
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  const deviceStatus = device.status === 'offline' || device.status === 'fault' 
                    ? device.status 
                    : 'online';
                  const status = statusConfig[deviceStatus as keyof typeof statusConfig] || statusConfig.online;
                  const alarm = alarmConfig[device.alarmStatus as keyof typeof alarmConfig] || alarmConfig.normal;
                  const isAlarm = device.alarmStatus !== 'normal';
                  
                  return (
                    <tr
                      key={device.id}
                      className={cn(
                        'border-t border-[#2D2D2D] hover:bg-[#2A2A2A] transition-colors cursor-pointer',
                        isAlarm && 'animate-pulse-alarm'
                      )}
                      onClick={() => setSelectedDevice(device)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[#E5E5E5] text-sm font-mono">{device.deviceCode}</span>
                          {device.isReal && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#4CAF50]/20 text-[#4CAF50]">
                              真实
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Wind className="w-4 h-4 text-[#0078D4]" />
                          <span className="text-[#E5E5E5] text-sm">{device.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#A0A0A0] text-sm">{device.location || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-[#2D2D2D] rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                device.concentration >= device.threshold ? 'bg-[#D32F2F]' :
                                device.concentration >= device.threshold * 0.8 ? 'bg-[#FF9800]' : 'bg-[#4CAF50]'
                              )}
                              style={{ width: `${Math.min(100, (device.concentration / 100) * 100)}%` }}
                            />
                          </div>
                          <span className={cn(
                            'text-sm font-mono',
                            device.concentration >= device.threshold ? 'text-[#D32F2F]' :
                            device.concentration >= device.threshold * 0.8 ? 'text-[#FF9800]' : 'text-[#E5E5E5]'
                          )}>
                            {device.concentration}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('flex items-center gap-1 text-sm', status.color)}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-1 rounded text-xs font-medium', alarm.bg, alarm.color)}>
                          {alarm.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors" title="查看详情">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors" title="设备配置">
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 设备详情弹窗 */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedDevice(null)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[500px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-[#0078D4]/10">
                      <Wind className="w-6 h-6 text-[#0078D4]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#E5E5E5]">{selectedDevice.name}</h2>
                      <p className="text-[#6C6C6C] text-sm font-mono">{selectedDevice.deviceCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedDevice.isReal && (
                      <span className="px-2 py-1 rounded text-xs bg-[#4CAF50]/20 text-[#4CAF50]">
                        📡 真实设备
                      </span>
                    )}
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      alarmConfig[selectedDevice.alarmStatus as keyof typeof alarmConfig]?.bg || 'bg-[#4CAF50]/10',
                      alarmConfig[selectedDevice.alarmStatus as keyof typeof alarmConfig]?.color || 'text-[#4CAF50]'
                    )}>
                      {alarmConfig[selectedDevice.alarmStatus as keyof typeof alarmConfig]?.label || '正常'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* 实时浓度 */}
                <div className="bg-[#222222] rounded-lg p-5 border border-[#3A3A3A] text-center">
                  <p className="text-[#A0A0A0] text-sm mb-2">实时浓度</p>
                  <div className={cn(
                    'text-5xl font-bold font-mono mb-2',
                    selectedDevice.concentration >= selectedDevice.threshold ? 'text-[#D32F2F]' :
                    selectedDevice.concentration >= selectedDevice.threshold * 0.8 ? 'text-[#FF9800]' : 'text-[#4CAF50]'
                  )}>
                    {selectedDevice.concentration}
                    <span className="text-xl text-[#A0A0A0]">%LEL</span>
                  </div>
                  <p className="text-[#6C6C6C] text-sm">报警阈值: {selectedDevice.threshold}%LEL</p>
                  <div className="h-4 bg-[#2D2D2D] rounded-full mt-4 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        selectedDevice.concentration >= selectedDevice.threshold ? 'bg-[#D32F2F]' :
                        selectedDevice.concentration >= selectedDevice.threshold * 0.8 ? 'bg-[#FF9800]' : 'bg-[#4CAF50]'
                      )}
                      style={{ width: `${Math.min(100, selectedDevice.concentration)}%` }}
                    />
                  </div>
                </div>

                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">安装位置</p>
                    <p className="text-[#E5E5E5]">{selectedDevice.location || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">设备状态</p>
                    <p className={statusConfig[selectedDevice.status as keyof typeof statusConfig]?.color || 'text-[#4CAF50]'}>
                      {statusConfig[selectedDevice.status as keyof typeof statusConfig]?.label || '正常'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">数据来源</p>
                    <p className={selectedDevice.isReal ? 'text-[#4CAF50]' : 'text-[#A0A0A0]'}>
                      {selectedDevice.isReal ? '📡 瑶安云平台实时数据' : '📋 模拟数据'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">连接类型</p>
                    <p className="text-[#E5E5E5]">{selectedDevice.isReal ? '云平台 (yak300_cloud)' : '模拟连接'}</p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3 pt-4">
                  <button 
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg transition-colors",
                      selectedDevice.isReal 
                        ? "bg-[#0078D4] text-white hover:bg-[#0066B4]" 
                        : "bg-[#3A3A3A] text-[#6C6C6C] cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (selectedDevice.isReal) {
                        setChartDeviceId(selectedDevice.id);
                        setShowChart(true);
                      }
                    }}
                    disabled={!selectedDevice.isReal}
                    title={selectedDevice.isReal ? "查看历史浓度曲线" : "模拟设备不支持查看历史数据"}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <LineChart className="w-4 h-4" />
                      {selectedDevice.isReal ? '查看历史曲线' : '查看历史曲线'}
                    </div>
                  </button>
                  <button 
                    className="flex-1 px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                    onClick={() => setShowConfig(true)}
                  >
                    设备配置
                  </button>
                </div>
              </div>
              <button 
                className="absolute top-4 right-4 p-1 rounded hover:bg-[#3A3A3A] text-[#6C6C6C] hover:text-[#E5E5E5]"
                onClick={() => setSelectedDevice(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* 设备配置弹窗 */}
        {showConfig && selectedDevice && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowConfig(false)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[500px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <h2 className="text-xl font-bold text-[#E5E5E5]">设备配置</h2>
                <p className="text-[#6C6C6C] text-sm mt-1">{selectedDevice.deviceCode} - {selectedDevice.name}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#A0A0A0] text-sm mb-2">报警阈值 (%LEL)</label>
                    <input
                      type="number"
                      value={configForm.alarmThreshold}
                      onChange={(e) => setConfigForm({...configForm, alarmThreshold: e.target.value})}
                      className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-sm mb-2">预警阈值 (%LEL)</label>
                    <input
                      type="number"
                      value={configForm.warningThreshold}
                      onChange={(e) => setConfigForm({...configForm, warningThreshold: e.target.value})}
                      className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#222222] rounded-lg">
                  <div>
                    <p className="text-[#E5E5E5]">燃气切断阀联动</p>
                    <p className="text-[#6C6C6C] text-xs">报警时自动切断燃气</p>
                  </div>
                  <button
                    onClick={() => setConfigForm({...configForm, linkageValve: !configForm.linkageValve})}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors',
                      configForm.linkageValve ? 'bg-[#4CAF50]' : 'bg-[#3A3A3A]'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 bg-white rounded-full transition-transform',
                      configForm.linkageValve && 'translate-x-6'
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#222222] rounded-lg">
                  <div>
                    <p className="text-[#E5E5E5]">排风机联动</p>
                    <p className="text-[#6C6C6C] text-xs">报警时自动启动排风</p>
                  </div>
                  <button
                    onClick={() => setConfigForm({...configForm, linkageFan: !configForm.linkageFan})}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors',
                      configForm.linkageFan ? 'bg-[#4CAF50]' : 'bg-[#3A3A3A]'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 bg-white rounded-full transition-transform',
                      configForm.linkageFan && 'translate-x-6'
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#222222] rounded-lg">
                  <div>
                    <p className="text-[#E5E5E5]">短信通知</p>
                    <p className="text-[#6C6C6C] text-xs">报警时发送短信通知</p>
                  </div>
                  <button
                    onClick={() => setConfigForm({...configForm, notificationEnabled: !configForm.notificationEnabled})}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors',
                      configForm.notificationEnabled ? 'bg-[#4CAF50]' : 'bg-[#3A3A3A]'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 bg-white rounded-full transition-transform',
                      configForm.notificationEnabled && 'translate-x-6'
                    )} />
                  </button>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    className="flex-1 px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0066B4] transition-colors"
                    onClick={() => setShowConfig(false)}
                  >
                    保存配置
                  </button>
                  <button 
                    className="flex-1 px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                    onClick={() => setShowConfig(false)}
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 报警音频 */}
        <audio ref={audioRef} preload="auto">
          <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR4AJ4Olw7SypohNdzSdu9HZe0o8TpfN2teleR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZ" type="audio/wav" />
        </audio>
        
        {/* 真实设备报警弹窗 */}
        {alarmPopup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-pulse">
            <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2D1A1A] rounded-2xl w-[450px] border-2 border-[#D32F2F] shadow-2xl shadow-[#D32F2F]/50 overflow-hidden">
              {/* 报警头部 */}
              <div className="bg-[#D32F2F] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg animate-pulse">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">燃气报警</h2>
                    <p className="text-white/80 text-sm">真实设备报警</p>
                  </div>
                </div>
                <button
                  onClick={() => setAlarmPopup(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              {/* 报警内容 */}
              <div className="p-6 space-y-4">
                {/* 设备信息 */}
                <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-[#D32F2F]" />
                    <span className="text-[#D32F2F] font-semibold">危险！检测到燃气泄漏</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[#6C6C6C] text-xs">设备编号</p>
                      <p className="text-[#E5E5E5] font-mono">{alarmPopup.deviceCode}</p>
                    </div>
                    <div>
                      <p className="text-[#6C6C6C] text-xs">设备名称</p>
                      <p className="text-[#E5E5E5]">{alarmPopup.deviceName}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[#6C6C6C] text-xs">安装位置</p>
                      <p className="text-[#E5E5E5]">{alarmPopup.location}</p>
                    </div>
                  </div>
                </div>
                
                {/* 浓度显示 */}
                <div className="bg-[#D32F2F]/10 rounded-lg p-5 text-center border border-[#D32F2F]/30">
                  <p className="text-[#A0A0A0] text-sm mb-2">当前浓度</p>
                  <div className="text-5xl font-bold font-mono text-[#D32F2F] mb-2">
                    {alarmPopup.concentration}
                    <span className="text-2xl text-[#D32F2F]/70">%LEL</span>
                  </div>
                  <p className="text-[#6C6C6C] text-sm">
                    报警阈值: {alarmPopup.threshold}%LEL
                  </p>
                  <div className="h-4 bg-[#2D2D2D] rounded-full mt-3 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        alarmPopup.concentration >= alarmPopup.threshold ? 'bg-[#D32F2F]' : 'bg-[#FF9800]'
                      )}
                      style={{ width: `${Math.min(100, alarmPopup.concentration)}%` }}
                    />
                  </div>
                </div>
                
                {/* 报警状态 */}
                <div className="flex items-center justify-between bg-[#222222] rounded-lg p-3 border border-[#3A3A3A]">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      alarmConfig[alarmPopup.alarmStatus as keyof typeof alarmConfig]?.bg || 'bg-[#D32F2F]/10',
                      alarmConfig[alarmPopup.alarmStatus as keyof typeof alarmConfig]?.color || 'text-[#D32F2F]'
                    )}>
                      {alarmConfig[alarmPopup.alarmStatus as keyof typeof alarmConfig]?.label || '报警'}
                    </span>
                    <span className="text-[#6C6C6C] text-xs">
                      {alarmPopup.time.toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      soundEnabled ? 'bg-[#4CAF50]/20 text-[#4CAF50]' : 'bg-[#3A3A3A] text-[#6C6C6C]'
                    )}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setAlarmPopup(null)}
                    className="flex-1 px-4 py-3 bg-[#D32F2F] rounded-lg text-white font-semibold hover:bg-[#B71C1C] transition-colors"
                  >
                    我已知晓
                  </button>
                  <button
                    onClick={() => setSelectedDevice(detectors.find(d => d.id === alarmPopup.deviceId) || null)}
                    className="flex-1 px-4 py-3 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] font-semibold hover:bg-[#2A2A2A] transition-colors"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 历史曲线图弹窗 */}
        {showChart && chartDeviceId && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowChart(false)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[900px] max-h-[85vh] overflow-hidden border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              {/* 头部 */}
              <div className="p-6 border-b border-[#2D2D2D] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-[#0078D4]/10">
                    <LineChart className="w-6 h-6 text-[#0078D4]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#E5E5E5]">浓度历史曲线</h2>
                    <p className="text-[#6C6C6C] text-sm">
                      {detectors.find(d => d.id === chartDeviceId)?.deviceCode} - 
                      {detectors.find(d => d.id === chartDeviceId)?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4">
                    <p className="text-[#6C6C6C] text-xs">数据点</p>
                    <p className="text-[#E5E5E5] font-semibold">
                      {historyData.get(chartDeviceId)?.length || 0} / {MAX_HISTORY_POINTS}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowChart(false)}
                    className="p-2 rounded-lg hover:bg-[#3A3A3A] text-[#6C6C6C] hover:text-[#E5E5E5]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* 图表内容 */}
              <div className="p-6">
                {/* 统计信息 */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {(() => {
                    const data = historyData.get(chartDeviceId) || [];
                    const concentrations = data.map(d => d.concentration);
                    const max = concentrations.length > 0 ? Math.max(...concentrations) : 0;
                    const min = concentrations.length > 0 ? Math.min(...concentrations) : 0;
                    const avg = concentrations.length > 0 ? concentrations.reduce((a, b) => a + b, 0) / concentrations.length : 0;
                    const current = data.length > 0 ? data[data.length - 1].concentration : 0;
                    const threshold = detectors.find(d => d.id === chartDeviceId)?.threshold || 50;
                    
                    return (
                      <>
                        <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                          <p className="text-[#6C6C6C] text-xs mb-1">当前值</p>
                          <p className={cn(
                            'text-2xl font-bold',
                            current >= threshold ? 'text-[#D32F2F]' : 
                            current >= threshold * 0.8 ? 'text-[#FF9800]' : 'text-[#4CAF50]'
                          )}>
                            {current.toFixed(1)} <span className="text-sm text-[#6C6C6C]">%LEL</span>
                          </p>
                        </div>
                        <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                          <p className="text-[#6C6C6C] text-xs mb-1">最大值</p>
                          <p className="text-2xl font-bold text-[#D32F2F]">
                            {max.toFixed(1)} <span className="text-sm text-[#6C6C6C]">%LEL</span>
                          </p>
                        </div>
                        <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                          <p className="text-[#6C6C6C] text-xs mb-1">最小值</p>
                          <p className="text-2xl font-bold text-[#4CAF50]">
                            {min.toFixed(1)} <span className="text-sm text-[#6C6C6C]">%LEL</span>
                          </p>
                        </div>
                        <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                          <p className="text-[#6C6C6C] text-xs mb-1">平均值</p>
                          <p className="text-2xl font-bold text-[#2196F3]">
                            {avg.toFixed(1)} <span className="text-sm text-[#6C6C6C]">%LEL</span>
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {/* 图表 */}
                <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                  {historyData.get(chartDeviceId) && historyData.get(chartDeviceId)!.length > 0 ? (
                    <RechartsResponsiveContainer width="100%" height={350}>
                      <RechartsAreaChart data={historyData.get(chartDeviceId)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorConcentration" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0078D4" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#0078D4" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <RechartsCartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" />
                        <RechartsXAxis 
                          dataKey="timeStr" 
                          stroke="#6C6C6C"
                          fontSize={11}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <RechartsYAxis 
                          stroke="#6C6C6C"
                          fontSize={11}
                          tickLine={false}
                          domain={[0, 100]}
                          label={{ value: '%LEL', angle: -90, position: 'insideLeft', fill: '#6C6C6C' }}
                        />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: '#1E1E1E', 
                            border: '1px solid #3A3A3A',
                            borderRadius: '8px',
                            color: '#E5E5E5'
                          }}
                          labelStyle={{ color: '#A0A0A0' }}
                          formatter={(value: number, name: string, props: any) => [
                            <span key="value" className="text-[#E5E5E5] font-mono font-bold">{value.toFixed(1)} %LEL</span>,
                            <span key="time" className="text-[#6C6C6C] text-xs ml-2">{props.payload.timeStr}</span>
                          ]}
                        />
                        {/* 报警阈值线 */}
                        <RechartsReferenceLine 
                          y={detectors.find(d => d.id === chartDeviceId)?.threshold || 50} 
                          stroke="#D32F2F" 
                          strokeDasharray="5 5" 
                          label={{ 
                            value: '报警阈值', 
                            position: 'right', 
                            fill: '#D32F2F',
                            fontSize: 11
                          }} 
                        />
                        {/* 预警阈值线 */}
                        <RechartsReferenceLine 
                          y={(detectors.find(d => d.id === chartDeviceId)?.threshold || 50) * 0.5} 
                          stroke="#FF9800" 
                          strokeDasharray="3 3"
                          label={{ 
                            value: '预警', 
                            position: 'right', 
                            fill: '#FF9800',
                            fontSize: 10
                          }}
                        />
                        <RechartsArea
                          type="monotone"
                          dataKey="concentration"
                          stroke="#0078D4"
                          strokeWidth={2}
                          fill="url(#colorConcentration)"
                          dot={false}
                          activeDot={{ r: 6, fill: '#0078D4', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </RechartsAreaChart>
                    </RechartsResponsiveContainer>
                  ) : (
                    <div className="h-[350px] flex items-center justify-center text-[#6C6C6C]">
                      <div className="text-center">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>正在收集数据...</p>
                        <p className="text-sm mt-1">刷新页面后，数据将逐渐显示</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 图例说明 */}
                <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-[#0078D4]" />
                    <span className="text-[#A0A0A0]">浓度曲线</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-[#D32F2F] border-dashed" style={{ borderTop: '2px dashed #D32F2F', height: 0 }} />
                    <span className="text-[#A0A0A0]">报警阈值</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-[#FF9800] border-dashed" style={{ borderTop: '2px dashed #FF9800', height: 0 }} />
                    <span className="text-[#A0A0A0]">预警阈值</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
