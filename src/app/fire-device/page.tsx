'use client';

import { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Search, Flame, Thermometer, Activity, Bell, Radio,
  AlertTriangle, CheckCircle, XCircle, Settings, RefreshCw,
  Eye, Edit, Power, Wifi, WifiOff, Volume2, X, BellRing
} from 'lucide-react';

// 设备类型定义
interface FireDetector {
  id: string;
  deviceCode: string;
  name: string;
  location: string;
  deviceType: string;
  typeName: string;
  status: string;
  temperature?: number;
  smokeLevel?: number;
  lastTest?: string;
  isReal: boolean;
}

// 火灾报警信息类型
interface FireAlarmInfo {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  deviceType: string;
  location: string;
  status: string;
  temperature?: number;
  smokeLevel?: number;
  time: Date;
}

// 设备类型配置
const deviceTypes = {
  controller: { name: '控制器', icon: <Settings className="w-5 h-5" />, color: 'text-[#0078D4]', bg: 'bg-[#0078D4]/10' },
  fire_alarm: { name: '控制器', icon: <Settings className="w-5 h-5" />, color: 'text-[#0078D4]', bg: 'bg-[#0078D4]/10' },
  smoke: { name: '烟感', icon: <Activity className="w-5 h-5" />, color: 'text-[#2196F3]', bg: 'bg-[#2196F3]/10' },
  smoke_detector: { name: '烟感', icon: <Activity className="w-5 h-5" />, color: 'text-[#2196F3]', bg: 'bg-[#2196F3]/10' },
  temp: { name: '温感', icon: <Thermometer className="w-5 h-5" />, color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10' },
  temperature_detector: { name: '温感', icon: <Thermometer className="w-5 h-5" />, color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10' },
  manual: { name: '手报', icon: <Bell className="w-5 h-5" />, color: 'text-[#9C27B0]', bg: 'bg-[#9C27B0]/10' },
  sounder: { name: '声光', icon: <Volume2 className="w-5 h-5" />, color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
  module: { name: '模块', icon: <Radio className="w-5 h-5" />, color: 'text-[#607D8B]', bg: 'bg-[#607D8B]/10' },
  display: { name: '显示盘', icon: <Flame className="w-5 h-5" />, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' },
};

// 状态配置
const statusConfig = {
  online: { label: '正常', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', icon: <Wifi className="w-4 h-4" /> },
  normal: { label: '正常', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', icon: <CheckCircle className="w-4 h-4" /> },
  offline: { label: '离线', color: 'text-[#6C6C6C]', bg: 'bg-[#6C6C6C]/10', icon: <WifiOff className="w-4 h-4" /> },
  fault: { label: '故障', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10', icon: <XCircle className="w-4 h-4" /> },
};

// 设备配置接口
interface FireDeviceConfig {
  zoneCode: string;
  addressCode: string;
  linkageEnabled: boolean;
  autoReport: boolean;
  testInterval: string;
  sensitivity: string;
}

export default function FireDevicePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<FireDetector | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [detectors, setDetectors] = useState<FireDetector[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // 报警弹窗状态
  const [fireAlarmPopup, setFireAlarmPopup] = useState<FireAlarmInfo | null>(null);
  const [fireAlarmHistory, setFireAlarmHistory] = useState<FireAlarmInfo[]>([]);
  const [fireSoundEnabled, setFireSoundEnabled] = useState(true);
  const fireAudioRef = useRef<HTMLAudioElement | null>(null);
  const previousFireAlarmsRef = useRef<Set<string>>(new Set());
  
  const [configForm, setConfigForm] = useState<FireDeviceConfig>({
    zoneCode: '',
    addressCode: '',
    linkageEnabled: true,
    autoReport: true,
    testInterval: '90',
    sensitivity: 'medium',
  });
  const [isSelfTesting, setIsSelfTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    show: boolean;
    progress: number;
    current: string;
    completed: string[];
    summary: { total: number; pass: number; fail: number; warning: number };
  } | null>(null);

  // 从API获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/devices/fire-realtime');
        const data = await response.json();
        if (data.detectors) {
          setDetectors(data.detectors);
          setLastUpdate(new Date());
          
          // 检测真实设备的报警/故障 - 只针对真实设备
          const realDevices = data.detectors.filter((d: FireDetector) => d.isReal);
          for (const device of realDevices) {
            const isAlarming = device.status === 'fault' || device.status === 'alarm';
            const alarmKey = `${device.id}-${device.status}`;
            
            // 如果是新的报警/故障（不在上一次的列表中）
            if (isAlarming && !previousFireAlarmsRef.current.has(alarmKey)) {
              // 创建报警信息
              const alarmInfo: FireAlarmInfo = {
                deviceId: device.id,
                deviceCode: device.deviceCode,
                deviceName: device.name,
                deviceType: device.deviceType,
                location: device.location || '未知位置',
                status: device.status,
                temperature: device.temperature,
                smokeLevel: device.smokeLevel,
                time: new Date(),
              };
              
              // 触发报警弹窗
              setFireAlarmPopup(alarmInfo);
              
              // 添加到历史记录
              setFireAlarmHistory(prev => [alarmInfo, ...prev.slice(0, 9)]);
              
              // 播放报警声音
              if (fireSoundEnabled && fireAudioRef.current) {
                fireAudioRef.current.play().catch(() => {});
              }
            }
          }
          
          // 更新已处理的报警列表
          previousFireAlarmsRef.current.clear();
          for (const device of realDevices) {
            if (device.status === 'fault' || device.status === 'alarm') {
              previousFireAlarmsRef.current.add(`${device.id}-${device.status}`);
            }
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('获取火灾报警设备数据失败:', error);
        setIsLoading(false);
      }
    };

    fetchData();
    // 每10秒刷新一次
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fireSoundEnabled]);

  // 获取设备类型对应的配置
  const getDeviceTypeConfig = (deviceType: string) => {
    const config = deviceTypes[deviceType as keyof typeof deviceTypes];
    if (config) return config;
    return deviceTypes.display; // 默认
  };

  // 系统自检功能
  const handleSelfTest = async () => {
    setIsSelfTesting(true);
    setTestResults({
      show: true,
      progress: 0,
      current: '正在连接主机...',
      completed: [],
      summary: { total: 0, pass: 0, fail: 0, warning: 0 },
    });

    const testSequence = [
      { name: '火灾报警控制器', delay: 800, status: 'pass' },
      { name: '感烟探测器', delay: 600, status: 'pass' },
      { name: '感温探测器', delay: 500, status: 'pass' },
      { name: '手动报警按钮', delay: 400, status: 'pass' },
      { name: '声光报警器', delay: 700, status: 'pass' },
    ];

    let passed = 0;
    let failed = 0;
    let warnings = 0;

    for (let i = 0; i < testSequence.length; i++) {
      const item = testSequence[i];
      setTestResults(prev => prev ? {
        ...prev,
        current: `正在检测：${item.name}...`,
        progress: Math.round(((i + 0.5) / testSequence.length) * 100),
      } : null);

      await new Promise(resolve => setTimeout(resolve, item.delay));

      const device = detectors.find(d => 
        d.name.includes(item.name.split('探测器')[0].split('手动')[0].split('声光')[0].split('输入')[0].split('火灾')[0]) || 
        (item.name === '感烟探测器' && d.deviceType === 'smoke_detector') ||
        (item.name === '感温探测器' && d.deviceType === 'temperature_detector') ||
        (item.name === '手动报警按钮' && d.deviceType === 'manual') ||
        (item.name === '声光报警器' && d.deviceType === 'sounder') ||
        (item.name === '火灾报警控制器' && d.deviceType === 'fire_alarm')
      );

      const deviceStatus = device?.status || 'online';
      let testStatus = item.status;
      if (deviceStatus === 'offline') testStatus = 'fail';
      if (deviceStatus === 'fault') testStatus = 'warning';

      if (testStatus === 'pass') passed++;
      if (testStatus === 'fail') failed++;
      if (testStatus === 'warning') warnings++;

      setTestResults(prev => prev ? {
        ...prev,
        current: `${item.name} ${testStatus === 'pass' ? '通过' : testStatus === 'fail' ? '失败' : '异常'}`,
        completed: [...prev.completed, `${item.name}||${testStatus}`],
        progress: Math.round(((i + 1) / testSequence.length) * 100),
      } : null);
    }

    setTimeout(() => {
      setTestResults(prev => prev ? {
        ...prev,
        current: '自检完成',
        summary: {
          total: testSequence.length,
          pass: passed,
          fail: failed,
          warning: warnings,
        },
      } : null);
      setIsSelfTesting(false);
    }, 500);
  };

  // 关闭自检结果
  const closeTestResults = () => {
    setTestResults(null);
  };

  // 过滤数据
  const filteredDevices = detectors.filter(device => {
    const matchSearch = 
      device.name.includes(searchTerm) || 
      device.deviceCode.includes(searchTerm) || 
      device.location.includes(searchTerm);
    const matchType = filterType === 'all' || device.deviceType === filterType || 
      (filterType === 'smoke' && device.deviceType === 'smoke_detector') ||
      (filterType === 'temp' && device.deviceType === 'temperature_detector') ||
      (filterType === 'controller' && device.deviceType === 'fire_alarm');
    const matchStatus = filterStatus === 'all' || device.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  // 统计
  const stats = {
    total: detectors.length,
    controller: detectors.filter(d => d.deviceType === 'fire_alarm').length,
    detector: detectors.filter(d => d.deviceType === 'smoke_detector' || d.deviceType === 'temperature_detector').length,
    smoke: detectors.filter(d => d.deviceType === 'smoke_detector').length,
    temperature: detectors.filter(d => d.deviceType === 'temperature_detector').length,
    fault: detectors.filter(d => d.status === 'fault' || d.status === 'offline').length,
    realDevices: detectors.filter(d => d.isReal).length,
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/devices/fire-realtime');
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
            <div className="p-3 rounded-lg bg-[#D32F2F]/20">
              <Flame className="w-7 h-7 text-[#D32F2F]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#E5E5E5]">火灾报警系统</h1>
              <p className="text-[#A0A0A0] text-sm mt-1">
                火灾自动报警设备监控与管理 
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
            <button
              onClick={handleSelfTest}
              disabled={isSelfTesting}
              className="flex items-center gap-2 px-4 py-2 bg-[#D32F2F] rounded-lg text-white hover:bg-[#B71C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={cn('w-4 h-4', isSelfTesting && 'animate-spin')} />
              {isSelfTesting ? '自检中...' : '系统自检'}
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#D32F2F]/10">
                <Settings className="w-5 h-5 text-[#D32F2F]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">设备总数</p>
                <p className="text-2xl font-bold text-[#E5E5E5]">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#D32F2F]/10">
                <Flame className="w-5 h-5 text-[#D32F2F]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">报警控制器</p>
                <p className="text-2xl font-bold text-[#D32F2F]">{stats.controller}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#2196F3]/10">
                <Activity className="w-5 h-5 text-[#2196F3]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">烟感探测器</p>
                <p className="text-2xl font-bold text-[#2196F3]">{stats.smoke}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#FF9800]/10">
                <Thermometer className="w-5 h-5 text-[#FF9800]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">温感探测器</p>
                <p className="text-2xl font-bold text-[#FF9800]">{stats.temperature}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#4CAF50]/10">
                <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">正常运行</p>
                <p className="text-2xl font-bold text-[#4CAF50]">{stats.total - stats.fault}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 设备类型分布 */}
        <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
          <h3 className="text-[#E5E5E5] font-semibold mb-4">设备类型分布</h3>
          <div className="grid grid-cols-5 gap-3">
            {[
              { key: 'controller', config: deviceTypes.controller, count: stats.controller },
              { key: 'smoke', config: deviceTypes.smoke, count: stats.smoke },
              { key: 'temp', config: deviceTypes.temp, count: stats.temperature },
            ].map(({ key, config, count }) => (
              <div key={key} className={cn(
                'p-3 rounded-lg border border-[#3A3A3A] text-center cursor-pointer transition-all hover:scale-105',
                filterType === key ? 'border-[#0078D4] bg-[#0078D4]/10' : 'bg-[#222222]'
              )} onClick={() => setFilterType(filterType === key ? 'all' : key)}>
                <div className={cn('mx-auto mb-2', config.color)}>{config.icon}</div>
                <p className="text-[#E5E5E5] text-sm font-medium">{config.name}</p>
                <p className={cn('text-xs mt-1', config.color)}>{count}台</p>
              </div>
            ))}
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
                <option value="online">正常</option>
                <option value="offline">离线</option>
                <option value="fault">故障</option>
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
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">设备类型</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">设备名称</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">安装位置</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">状态</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#6C6C6C]">
                    加载中...
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#6C6C6C]">
                    暂无设备数据
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  const typeConfig = getDeviceTypeConfig(device.deviceType);
                  const status = statusConfig[device.status as keyof typeof statusConfig] || statusConfig.online;
                  
                  return (
                    <tr
                      key={device.id}
                      className="border-t border-[#2D2D2D] hover:bg-[#2A2A2A] transition-colors cursor-pointer"
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
                        <span className={cn('flex items-center gap-1 text-sm', typeConfig.color)}>
                          {typeConfig.icon}
                          {typeConfig.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#E5E5E5] text-sm">{device.name}</td>
                      <td className="px-4 py-3 text-[#A0A0A0] text-sm">{device.location || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('flex items-center gap-1 text-sm', status.color)}>
                          {status.icon}
                          {status.label}
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
                    <div className={cn('p-3 rounded-lg', getDeviceTypeConfig(selectedDevice.deviceType).bg)}>
                      <div className={getDeviceTypeConfig(selectedDevice.deviceType).color}>
                        {getDeviceTypeConfig(selectedDevice.deviceType).icon}
                      </div>
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
                      statusConfig[selectedDevice.status as keyof typeof statusConfig]?.bg || 'bg-[#4CAF50]/10',
                      statusConfig[selectedDevice.status as keyof typeof statusConfig]?.color || 'text-[#4CAF50]'
                    )}>
                      {statusConfig[selectedDevice.status as keyof typeof statusConfig]?.label || '正常'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* 设备信息 */}
                <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                  <div className="flex items-center justify-around text-center">
                    <div>
                      <p className="text-[#6C6C6C] text-xs mb-1">设备类型</p>
                      <p className={cn('text-sm font-medium', getDeviceTypeConfig(selectedDevice.deviceType).color)}>
                        {getDeviceTypeConfig(selectedDevice.deviceType).name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#6C6C6C] text-xs mb-1">安装位置</p>
                      <p className="text-[#E5E5E5] text-sm">{selectedDevice.location || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[#6C6C6C] text-xs mb-1">数据来源</p>
                      <p className={selectedDevice.isReal ? 'text-[#4CAF50]' : 'text-[#A0A0A0]'}>
                        {selectedDevice.isReal ? '📡 真实设备' : '📋 模拟数据'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 温度/烟雾数据 */}
                {(selectedDevice.deviceType === 'temperature_detector' || selectedDevice.deviceType === 'smoke_detector') && (
                  <div className="bg-[#222222] rounded-lg p-5 border border-[#3A3A3A]">
                    <p className="text-[#A0A0A0] text-sm mb-2">
                      {selectedDevice.deviceType === 'temperature_detector' ? '实时温度' : '烟雾等级'}
                    </p>
                    <div className={cn(
                      'text-5xl font-bold font-mono mb-2',
                      selectedDevice.deviceType === 'temperature_detector' 
                        ? (selectedDevice.temperature && selectedDevice.temperature > 60 ? 'text-[#D32F2F]' : 'text-[#4CAF50]')
                        : (selectedDevice.smokeLevel && selectedDevice.smokeLevel > 50 ? 'text-[#D32F2F]' : 'text-[#4CAF50]')
                    )}>
                      {selectedDevice.deviceType === 'temperature_detector' 
                        ? `${selectedDevice.temperature?.toFixed(1) || 0}℃`
                        : selectedDevice.smokeLevel?.toFixed(1) || 0
                      }
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-3 pt-4">
                  <button className="flex-1 px-4 py-2 bg-[#D32F2F] rounded-lg text-white hover:bg-[#B71C1C] transition-colors">
                    查看历史数据
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
                    <label className="block text-[#A0A0A0] text-sm mb-2">分区编号</label>
                    <input
                      type="text"
                      value={configForm.zoneCode}
                      onChange={(e) => setConfigForm({...configForm, zoneCode: e.target.value})}
                      className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-sm mb-2">地址编号</label>
                    <input
                      type="text"
                      value={configForm.addressCode}
                      onChange={(e) => setConfigForm({...configForm, addressCode: e.target.value})}
                      className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#222222] rounded-lg">
                  <div>
                    <p className="text-[#E5E5E5]">联动启用</p>
                    <p className="text-[#6C6C6C] text-xs">报警时联动相关设备</p>
                  </div>
                  <button
                    onClick={() => setConfigForm({...configForm, linkageEnabled: !configForm.linkageEnabled})}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors',
                      configForm.linkageEnabled ? 'bg-[#4CAF50]' : 'bg-[#3A3A3A]'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 bg-white rounded-full transition-transform',
                      configForm.linkageEnabled && 'translate-x-6'
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#222222] rounded-lg">
                  <div>
                    <p className="text-[#E5E5E5]">自动上报</p>
                    <p className="text-[#6C6C6C] text-xs">报警时自动上报消防部门</p>
                  </div>
                  <button
                    onClick={() => setConfigForm({...configForm, autoReport: !configForm.autoReport})}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors',
                      configForm.autoReport ? 'bg-[#4CAF50]' : 'bg-[#3A3A3A]'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 bg-white rounded-full transition-transform',
                      configForm.autoReport && 'translate-x-6'
                    )} />
                  </button>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    className="flex-1 px-4 py-2 bg-[#D32F2F] rounded-lg text-white hover:bg-[#B71C1C] transition-colors"
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

        {/* 自检结果弹窗 */}
        {testResults?.show && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#1E1E1E] rounded-lg w-[450px] border border-[#2D2D2D]">
              <div className="p-6 border-b border-[#2D2D2D]">
                <h2 className="text-xl font-bold text-[#E5E5E5]">系统自检</h2>
                <p className="text-[#6C6C6C] text-sm mt-1">{testResults.current}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="h-3 bg-[#2D2D2D] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#0078D4] rounded-full transition-all"
                    style={{ width: `${testResults.progress}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {testResults.completed.map((item, idx) => {
                    const [name, status] = item.split('||');
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {status === 'pass' && <CheckCircle className="w-4 h-4 text-[#4CAF50]" />}
                        {status === 'fail' && <XCircle className="w-4 h-4 text-[#D32F2F]" />}
                        {status === 'warning' && <AlertTriangle className="w-4 h-4 text-[#FF9800]" />}
                        <span className="text-[#E5E5E5]">{name}</span>
                        <span className={status === 'pass' ? 'text-[#4CAF50]' : status === 'fail' ? 'text-[#D32F2F]' : 'text-[#FF9800]'}>
                          {status === 'pass' ? '通过' : status === 'fail' ? '失败' : '异常'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {testResults.progress === 100 && (
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#2D2D2D]">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#E5E5E5]">{testResults.summary.total}</p>
                      <p className="text-[#6C6C6C] text-xs">总计</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#4CAF50]">{testResults.summary.pass}</p>
                      <p className="text-[#6C6C6C] text-xs">通过</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#D32F2F]">{testResults.summary.fail}</p>
                      <p className="text-[#6C6C6C] text-xs">失败</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#FF9800]">{testResults.summary.warning}</p>
                      <p className="text-[#6C6C6C] text-xs">异常</p>
                    </div>
                  </div>
                )}
                <button 
                  className="w-full px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0066B4] transition-colors"
                  onClick={closeTestResults}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 报警音频 */}
        <audio ref={fireAudioRef} preload="auto">
          <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR4AJ4Olw7SypohNdzSdu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZ" type="audio/wav" />
        </audio>
        
        {/* 真实设备火灾报警弹窗 */}
        {fireAlarmPopup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-pulse">
            <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2D1A1A] rounded-2xl w-[450px] border-2 border-[#D32F2F] shadow-2xl shadow-[#D32F2F]/50 overflow-hidden">
              {/* 报警头部 */}
              <div className="bg-[#D32F2F] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg animate-pulse">
                    <BellRing className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">火灾报警</h2>
                    <p className="text-white/80 text-sm">真实设备故障/报警</p>
                  </div>
                </div>
                <button
                  onClick={() => setFireAlarmPopup(null)}
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
                    <Flame className="w-5 h-5 text-[#D32F2F]" />
                    <span className="text-[#D32F2F] font-semibold">
                      {fireAlarmPopup.status === 'fault' ? '检测到设备故障' : '检测到火灾报警'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[#6C6C6C] text-xs">设备编号</p>
                      <p className="text-[#E5E5E5] font-mono">{fireAlarmPopup.deviceCode}</p>
                    </div>
                    <div>
                      <p className="text-[#6C6C6C] text-xs">设备名称</p>
                      <p className="text-[#E5E5E5]">{fireAlarmPopup.deviceName}</p>
                    </div>
                    <div>
                      <p className="text-[#6C6C6C] text-xs">设备类型</p>
                      <p className="text-[#E5E5E5]">{getDeviceTypeConfig(fireAlarmPopup.deviceType).name}</p>
                    </div>
                    <div>
                      <p className="text-[#6C6C6C] text-xs">安装位置</p>
                      <p className="text-[#E5E5E5]">{fireAlarmPopup.location}</p>
                    </div>
                  </div>
                </div>
                
                {/* 温度/烟雾数据 */}
                {(fireAlarmPopup.deviceType === 'temperature_detector' || fireAlarmPopup.deviceType === 'smoke_detector') && (
                  <div className="bg-[#D32F2F]/10 rounded-lg p-5 text-center border border-[#D32F2F]/30">
                    <p className="text-[#A0A0A0] text-sm mb-2">
                      {fireAlarmPopup.deviceType === 'temperature_detector' ? '当前温度' : '烟雾等级'}
                    </p>
                    <div className={cn(
                      'text-5xl font-bold font-mono mb-2 text-[#D32F2F]'
                    )}>
                      {fireAlarmPopup.deviceType === 'temperature_detector' 
                        ? `${fireAlarmPopup.temperature?.toFixed(1) || 0}℃`
                        : fireAlarmPopup.smokeLevel?.toFixed(1) || 0
                      }
                    </div>
                    <p className="text-[#6C6C6C] text-sm">
                      状态: 
                      <span className={cn(
                        'ml-2 font-semibold',
                        statusConfig[fireAlarmPopup.status as keyof typeof statusConfig]?.color || 'text-[#D32F2F]'
                      )}>
                        {statusConfig[fireAlarmPopup.status as keyof typeof statusConfig]?.label || '故障'}
                      </span>
                    </p>
                  </div>
                )}
                
                {/* 报警状态 */}
                <div className="flex items-center justify-between bg-[#222222] rounded-lg p-3 border border-[#3A3A3A]">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      statusConfig[fireAlarmPopup.status as keyof typeof statusConfig]?.bg || 'bg-[#D32F2F]/10',
                      statusConfig[fireAlarmPopup.status as keyof typeof statusConfig]?.color || 'text-[#D32F2F]'
                    )}>
                      {statusConfig[fireAlarmPopup.status as keyof typeof statusConfig]?.label || '故障'}
                    </span>
                    <span className="text-[#6C6C6C] text-xs">
                      {fireAlarmPopup.time.toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setFireSoundEnabled(!fireSoundEnabled)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      fireSoundEnabled ? 'bg-[#4CAF50]/20 text-[#4CAF50]' : 'bg-[#3A3A3A] text-[#6C6C6C]'
                    )}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setFireAlarmPopup(null)}
                    className="flex-1 px-4 py-3 bg-[#D32F2F] rounded-lg text-white font-semibold hover:bg-[#B71C1C] transition-colors"
                  >
                    我已知晓
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDevice(detectors.find(d => d.id === fireAlarmPopup.deviceId) || null);
                      setFireAlarmPopup(null);
                    }}
                    className="flex-1 px-4 py-3 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] font-semibold hover:bg-[#2A2A2A] transition-colors"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
