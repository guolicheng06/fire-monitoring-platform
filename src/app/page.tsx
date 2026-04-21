'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Flame, AlertTriangle, Thermometer, Wind, Activity,
  Radio, Wifi, WifiOff, Building2, Clock, CheckCircle,
  TrendingUp, TrendingDown, Bell, RefreshCw,
  ArrowUpRight, Eye, UserCheck, Wrench, Tablet,
  MessageSquare, Smartphone, Volume2, X, BellRing
} from 'lucide-react';

// 设备统计数据
interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  fault: number;
}

// 报警统计数据
interface AlarmStats {
  total: number;
  pending: number;
  critical: number;
  danger: number;
  warning: number;
  todayCount: number;
}

// 商户统计
interface MerchantStats {
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

// 首页燃气报警信息类型
interface HomeGasAlarmInfo {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  location: string;
  concentration: number;
  alarmStatus: string;
  threshold: number;
  time: Date;
}

// 报警状态配置
const gasAlarmConfig = {
  normal: { label: '正常', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' },
  warning: { label: '预警', color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10' },
  low: { label: '低报', color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10' },
  high: { label: '高报', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
  alarm: { label: '报警', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
};

// 设备类型统计
const deviceTypeStats = [
  { type: 'gas_detector', name: '可燃气体探测器', icon: <Wind className="w-5 h-5" />, count: 48, online: 45, alarm: 2 },
  { type: 'fire_alarm', name: '火灾报警器', icon: <Flame className="w-5 h-5" />, count: 32, online: 30, alarm: 1 },
  { type: 'temperature_detector', name: '温度探测器', icon: <Thermometer className="w-5 h-5" />, count: 28, online: 26, alarm: 0 },
  { type: 'smoke_detector', name: '烟雾探测器', icon: <Activity className="w-5 h-5" />, count: 24, online: 22, alarm: 1 },
];

// 模拟报警数据
const recentAlarms = [
  { id: 1, device: '可燃气体探测器 A1-01', location: '串串香火锅 - 后厨', level: 'danger', value: '65%LEL', time: '2分钟前', status: 'pending' },
  { id: 2, device: '烟感探测器 B2-03', location: '重庆火锅 - 大厅', level: 'warning', value: '35%', time: '15分钟前', status: 'pending' },
  { id: 3, device: '温度探测器 C1-05', location: '超市冷藏区', level: 'info', value: '42°C', time: '32分钟前', status: 'acknowledged' },
  { id: 4, device: '可燃气体探测器 A2-02', location: '烧烤店 - 储存室', level: 'critical', value: '85%LEL', time: '1小时前', status: 'resolved' },
];

// 设备状态卡片组件
function StatCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = 'blue',
  onClick
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'blue' | 'red' | 'orange' | 'green';
  onClick?: () => void;
}) {
  const colorMap = {
    blue: 'from-[#0078D4] to-[#0056B3]',
    red: 'from-[#D32F2F] to-[#B71C1C]',
    orange: 'from-[#FF9800] to-[#F57C00]',
    green: 'from-[#4CAF50] to-[#388E3C]',
  };

  return (
    <div 
      className="bg-[#1E1E1E] rounded-lg p-3 lg:p-5 border border-[#2D2D2D] hover:border-[#3A3A3A] transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[#A0A0A0] text-xs lg:text-sm mb-1 lg:mb-2 truncate">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-[#E5E5E5]">{value}</p>
          {trend && trendValue && (
            <div className={cn('flex items-center gap-1 mt-1 lg:mt-2 text-xs', trend === 'up' ? 'text-[#4CAF50]' : 'text-[#D32F2F]')}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4" /> : <TrendingDown className="w-3 h-3 lg:w-4 lg:h-4" />}
              <span className="hidden sm:inline">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={cn('p-1.5 lg:p-2 rounded-lg bg-gradient-to-br shrink-0', colorMap[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// 设备类型卡片组件
function DeviceTypeCard({ item, index, onClick }: { item: typeof deviceTypeStats[0]; index: number; onClick?: () => void }) {
  const colors = ['from-[#0078D4] to-[#0056B3]', 'from-[#FF5722] to-[#E64A19]', 'from-[#FF9800] to-[#F57C00]', 'from-[#9C27B0] to-[#7B1FA2]'];
  
  return (
    <div 
      className="bg-[#1E1E1E] rounded-lg p-3 lg:p-4 border border-[#2D2D2D] hover:border-[#3A3A3A] transition-all cursor-pointer group"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 lg:gap-4">
        <div className={cn('p-2 lg:p-3 rounded-lg bg-gradient-to-br shrink-0', colors[index % colors.length])}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[#E5E5E5] font-medium text-xs lg:text-sm mb-0.5 lg:mb-1 truncate">{item.name}</h4>
          <div className="flex items-center gap-2 lg:gap-4 text-xs text-[#A0A0A0]">
            <span className="flex items-center gap-0.5 lg:gap-1">
              <Radio className="w-3 h-3" />
              {item.online}/{item.count}
            </span>
            {item.alarm > 0 && (
              <span className="flex items-center gap-0.5 lg:gap-1 text-[#FF9800]">
                <AlertTriangle className="w-3 h-3" />
                {item.alarm}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* 进度条 */}
      <div className="mt-4">
        <div className="h-1.5 bg-[#2D2D2D] rounded-full overflow-hidden">
          <div 
            className={cn('h-full rounded-full transition-all', colors[index % colors.length].replace('from-', 'bg-'))}
            style={{ width: `${(item.online / item.count) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// 报警记录行组件
function AlarmRow({ alarm, onClick }: { alarm: typeof recentAlarms[0]; onClick?: () => void }) {
  const router = require('next/navigation').useRouter();
  const levelConfig = {
    critical: { label: '紧急', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10', border: 'border-[#D32F2F]/30' },
    danger: { label: '危险', color: 'text-[#FF5722]', bg: 'bg-[#FF5722]/10', border: 'border-[#FF5722]/30' },
    warning: { label: '警告', color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10', border: 'border-[#FF9800]/30' },
    info: { label: '提示', color: 'text-[#2196F3]', bg: 'bg-[#2196F3]/10', border: 'border-[#2196F3]/30' },
  };

  const config = levelConfig[alarm.level as keyof typeof levelConfig];
  const isPending = alarm.status === 'pending';

  return (
    <div 
      className={cn(
        'flex items-center gap-2 lg:gap-4 p-2 lg:p-4 rounded-lg border transition-all cursor-pointer hover:opacity-90',
        config.bg, config.border,
        isPending && 'animate-pulse-alarm'
      )}
      onClick={() => router.push('/fire-device')}
    >
      <div className={cn('w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full shrink-0', config.color.replace('text-', 'bg-'))} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 lg:gap-2 mb-0.5 lg:mb-1">
          <span className="text-[#E5E5E5] font-medium text-xs lg:text-sm truncate">{alarm.device}</span>
          <span className={cn('text-xs px-1.5 lg:px-2 py-0.5 rounded shrink-0', config.bg, config.color)}>{config.label}</span>
        </div>
        <p className="text-[#A0A0A0] text-xs truncate hidden sm:block">{alarm.location}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[#E5E5E5] font-mono text-xs lg:text-sm">{alarm.value}</p>
        <p className="text-[#6C6C6C] text-xs hidden lg:block">{alarm.time}</p>
      </div>
      {isPending && (
        <button 
          onClick={(e) => { e.stopPropagation(); router.push('/fire-device'); }}
          className="px-2 lg:px-3 py-1 bg-[#0078D4] text-white text-xs rounded hover:bg-[#0056B3] transition-colors shrink-0"
        >
          处理
        </button>
      )}
    </div>
  );
}

// 风险商户卡片
function RiskMerchantCard({ name, risk, location, onClick }: { name: string; risk: 'high' | 'medium' | 'low'; location: string; onClick?: () => void }) {
  const riskConfig = {
    high: { label: '高风险', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10', border: 'border-[#D32F2F]/30' },
    medium: { label: '中风险', color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10', border: 'border-[#FF9800]/30' },
    low: { label: '低风险', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', border: 'border-[#4CAF50]/30' },
  };

  const config = riskConfig[risk];

  return (
    <div 
      className={cn('p-2 lg:p-4 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity', config.bg, config.border)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-1 lg:mb-2">
        <h4 className="text-[#E5E5E5] font-medium text-xs lg:text-sm truncate flex-1">{name}</h4>
        <span className={cn('text-xs px-1.5 lg:px-2 py-0.5 rounded shrink-0 ml-1', config.bg, config.color)}>{config.label}</span>
      </div>
      <p className="text-[#A0A0A0] text-xs hidden sm:block truncate">{location}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({ total: 132, online: 129, offline: 3, fault: 0 });
  const [alarmStats, setAlarmStats] = useState<AlarmStats>({ total: 156, pending: 8, critical: 1, danger: 3, warning: 4, todayCount: 12 });
  const [merchantStats, setMerchantStats] = useState<MerchantStats>({ total: 74, highRisk: 12, mediumRisk: 28, lowRisk: 34 });
  const [selectedGasDetector, setSelectedGasDetector] = useState(0);
  const [gasValue, setGasValue] = useState(8);
  const [gasDetectors, setGasDetectors] = useState<Array<{
    id: string;
    name: string;
    location: string;
    concentration: number;
    status: string;
    alarmStatus: string;
    threshold: number;
    isReal: boolean;
    isActive?: boolean;
  }>>([]);
  const [isLoadingGasData, setIsLoadingGasData] = useState(true);
  
  // 燃气报警弹窗状态
  const [homeGasAlarmPopup, setHomeGasAlarmPopup] = useState<HomeGasAlarmInfo | null>(null);
  const [homeGasSoundEnabled, setHomeGasSoundEnabled] = useState(true);
  const homeGasAudioRef = useRef<HTMLAudioElement | null>(null);
  const previousHomeGasAlarmsRef = useRef<Set<string>>(new Set());

  // 获取真实气体探测器数据
  useEffect(() => {
    const fetchGasData = async () => {
      try {
        const response = await fetch('/api/devices/gas-realtime');
        const data = await response.json();
        
        if (data.detectors && data.detectors.length > 0) {
          setGasDetectors(data.detectors);
          setIsLoadingGasData(false);
          
          // 检测真实设备的报警 - 只针对真实设备
          const realDevices = data.detectors.filter((d: typeof gasDetectors[0]) => d.isReal);
          for (const device of realDevices) {
            const isAlarming = device.alarmStatus !== 'normal' || device.status === 'alarm';
            const alarmKey = `${device.id}-${device.alarmStatus}`;
            
            // 如果是新的报警（不在上一次的报警列表中）
            if (isAlarming && !previousHomeGasAlarmsRef.current.has(alarmKey)) {
              // 创建报警信息
              const alarmInfo: HomeGasAlarmInfo = {
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
              setHomeGasAlarmPopup(alarmInfo);
              
              // 播放报警声音
              if (homeGasSoundEnabled && homeGasAudioRef.current) {
                homeGasAudioRef.current.play().catch(() => {});
              }
            }
          }
          
          // 更新已处理的报警列表
          previousHomeGasAlarmsRef.current.clear();
          for (const device of realDevices) {
            if (device.alarmStatus !== 'normal' || device.status === 'alarm') {
              previousHomeGasAlarmsRef.current.add(`${device.id}-${device.alarmStatus}`);
            }
          }
          
          // 如果选择了有效的探测器索引且有真实数据，更新显示值
          if (selectedGasDetector < data.detectors.length) {
            setGasValue(data.detectors[selectedGasDetector].concentration);
          } else if (data.detectors.length > 0) {
            setGasValue(data.detectors[0].concentration);
            setSelectedGasDetector(0);
          }
        } else {
          // 没有真实设备，使用模拟数据
          setGasDetectors([
            { id: 'demo-01', name: '演示设备 - 后厨', location: '', concentration: 12.5, status: 'normal', alarmStatus: 'normal', threshold: 50, isReal: false, isActive: true },
          ]);
          setIsLoadingGasData(false);
        }
      } catch (error) {
        console.error('Failed to fetch gas data:', error);
        // 使用默认模拟数据
        setGasDetectors([
          { id: 'demo-01', name: '演示设备 - 后厨', location: '', concentration: 12.5, status: 'normal', alarmStatus: 'normal', threshold: 50, isReal: false, isActive: true },
        ]);
        setIsLoadingGasData(false);
      }
    };

    fetchGasData();
    
    // 每2秒刷新一次瑶安云平台真实数据
    const interval = setInterval(fetchGasData, 2000);
    return () => clearInterval(interval);
  }, [homeGasSoundEnabled]);

  // 当选择的探测器变化时更新显示值
  useEffect(() => {
    if (gasDetectors.length > 0 && selectedGasDetector < gasDetectors.length) {
      setGasValue(gasDetectors[selectedGasDetector].concentration);
    }
  }, [selectedGasDetector, gasDetectors]);

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* 左侧 - 气体监控 */}
        <div className="lg:col-span-3 space-y-4">
          {/* 气体浓度实时监控 */}
          <div className="bg-[#1E1E1E] rounded-lg p-4 lg:p-5 border border-[#2D2D2D]">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-[#E5E5E5] font-semibold flex items-center gap-2 text-sm lg:text-base">
                <Wind className="w-4 h-4 lg:w-5 lg:h-5 text-[#0078D4]" />
                可燃气体浓度
              </h3>
              <span className="text-[#6C6C6C] text-xs">%LEL</span>
            </div>
            
            {/* 大数字显示 */}
            <div className="text-center py-3 lg:py-6">
              <div className={cn(
                'text-4xl sm:text-5xl lg:text-6xl font-bold font-mono transition-colors',
                gasValue < 8 ? 'text-[#4CAF50]' :
                gasValue < 20 ? 'text-[#FF9800]' :
                'text-[#D32F2F]'
              )}>
                {gasValue.toFixed(1)}
              </div>
              <div className={cn(
                'mt-1 lg:mt-2 text-xs lg:text-sm',
                gasValue < 8 ? 'text-[#4CAF50]' :
                gasValue < 20 ? 'text-[#FF9800]' :
                'text-[#D32F2F]'
              )}>
                {gasValue < 8 ? '正常' : gasValue < 20 ? '预警' : '报警'}
              </div>
            </div>

            {/* 进度条 */}
            <div className="h-2 lg:h-3 bg-[#2D2D2D] rounded-full overflow-hidden mb-3 lg:mb-4">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  gasValue < 8 ? 'bg-[#4CAF50]' :
                  gasValue < 20 ? 'bg-[#FF9800]' :
                  'bg-[#D32F2F]'
                )}
                style={{ width: `${(gasValue / 12) * 100}%` }}
              />
            </div>

            {/* 探测器选择 */}
            <div className="space-y-2">
              <label className="text-[#A0A0A0] text-xs">选择探测器</label>
              <select
                value={selectedGasDetector}
                onChange={(e) => setSelectedGasDetector(Number(e.target.value))}
                className="w-full bg-[#222222] border border-[#3A3A3A] rounded-lg px-3 py-2 text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                {gasDetectors.map((detector, idx) => (
                  <option key={detector.id} value={idx}>
                    {detector.isReal ? '📡' : '📋'} {detector.name}{detector.isActive === false ? ' [已停用]' : ''}
                  </option>
                ))}
              </select>
              {gasDetectors.length > 0 && selectedGasDetector < gasDetectors.length && gasDetectors[selectedGasDetector].isReal && (
                <p className="text-[#4CAF50] text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse"></span>
                  实时数据
                </p>
              )}
              {gasDetectors.length > 0 && selectedGasDetector < gasDetectors.length && !gasDetectors[selectedGasDetector].isReal && (
                <p className="text-[#FF9800] text-xs">
                  模拟数据（暂无真实设备）
                </p>
              )}
              {gasDetectors.length > 0 && selectedGasDetector < gasDetectors.length && gasDetectors[selectedGasDetector].isActive === false && (
                <p className="text-[#9E9E9E] text-xs">
                  此设备已停用，数据仅供参考
                </p>
              )}
            </div>
          </div>

          {/* 设备状态概览 */}
          <div className="bg-[#1E1E1E] rounded-lg p-4 lg:p-5 border border-[#2D2D2D]">
            <h3 className="text-[#E5E5E5] font-semibold mb-3 lg:mb-4 flex items-center gap-2 text-sm lg:text-base">
              <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-[#0078D4]" />
              设备状态
            </h3>
            <div className="space-y-2 lg:space-y-3">
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-[#2A2A2A] p-2 -mx-2 rounded-lg transition-colors"
                onClick={() => router.push('/device-info?status=online')}
              >
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-[#4CAF50]" />
                  <span className="text-[#A0A0A0] text-sm">在线设备</span>
                </div>
                <span className="text-[#E5E5E5] font-semibold">{deviceStats.online}</span>
              </div>
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-[#2A2A2A] p-2 -mx-2 rounded-lg transition-colors"
                onClick={() => router.push('/device-info?status=offline')}
              >
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-[#6C6C6C]" />
                  <span className="text-[#A0A0A0] text-sm">离线设备</span>
                </div>
                <span className="text-[#A0A0A0] font-semibold">{deviceStats.offline}</span>
              </div>
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-[#2A2A2A] p-2 -mx-2 rounded-lg transition-colors"
                onClick={() => router.push('/device-info?status=fault')}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D32F2F]" />
                  <span className="text-[#A0A0A0] text-sm">故障设备</span>
                </div>
                <span className="text-[#D32F2F] font-semibold">{deviceStats.fault}</span>
              </div>
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="bg-[#1E1E1E] rounded-lg p-4 lg:p-5 border border-[#2D2D2D]">
            <h3 className="text-[#E5E5E5] font-semibold mb-3 lg:mb-4 text-sm lg:text-base">快捷操作</h3>
            <div className="grid grid-cols-4 gap-2 lg:gap-3">
              <button 
                onClick={() => router.push('/device-status')}
                className="flex flex-col items-center gap-1 lg:gap-2 p-2 lg:p-4 bg-[#222222] rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-[#0078D4]" />
                <span className="text-[#A0A0A0] text-xs">设备巡检</span>
              </button>
              <button 
                onClick={() => router.push('/fire-device')}
                className="flex flex-col items-center gap-1 lg:gap-2 p-2 lg:p-4 bg-[#222222] rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4 lg:w-5 lg:h-5 text-[#4CAF50]" />
                <span className="text-[#A0A0A0] text-xs">确认报警</span>
              </button>
              <button 
                onClick={() => router.push('/device-info')}
                className="flex flex-col items-center gap-1 lg:gap-2 p-2 lg:p-4 bg-[#222222] rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              >
                <Wrench className="w-4 h-4 lg:w-5 lg:h-5 text-[#FF9800]" />
                <span className="text-[#A0A0A0] text-xs">设备维护</span>
              </button>
              <button 
                onClick={() => router.push('/ai-chat')}
                className="flex flex-col items-center gap-1 lg:gap-2 p-2 lg:p-4 bg-[#222222] rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 lg:w-5 lg:h-5 text-[#9C27B0]" />
                <span className="text-[#A0A0A0] text-xs">AI对话</span>
              </button>
            </div>
          </div>
        </div>

        {/* 中间 - 主监控区 */}
        <div className="lg:col-span-6 space-y-4 lg:space-y-6">
          {/* 统计卡片行 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <StatCard
              title="总设备数"
              value={deviceStats.total}
              icon={<Radio className="w-4 h-4 lg:w-5 lg:h-5 text-white" />}
              trend="up"
              trendValue="+3"
              color="blue"
              onClick={() => router.push('/device-info')}
            />
            <StatCard
              title="待处理报警"
              value={alarmStats.pending}
              icon={<Bell className="w-4 h-4 lg:w-5 lg:h-5 text-white" />}
              color="red"
              onClick={() => router.push('/fire-device')}
            />
            <StatCard
              title="总报警数"
              value={alarmStats.total}
              icon={<AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />}
              trend="down"
              trendValue="-12%"
              color="orange"
              onClick={() => router.push('/fire-device')}
            />
            <StatCard
              title="商户总数"
              value={merchantStats.total}
              icon={<Building2 className="w-4 h-4 lg:w-5 lg:h-5 text-white" />}
              color="green"
              onClick={() => router.push('/merchants')}
            />
          </div>

          {/* 设备类型分布 */}
          <div className="bg-[#1E1E1E] rounded-lg p-4 lg:p-5 border border-[#2D2D2D]">
            <h3 className="text-[#E5E5E5] font-semibold mb-3 lg:mb-4 flex items-center gap-2 text-sm lg:text-base">
              <Tablet className="w-4 h-4 lg:w-5 lg:h-5 text-[#0078D4]" />
              设备类型分布
            </h3>
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              {deviceTypeStats.map((item, idx) => (
                <DeviceTypeCard 
                  key={item.type} 
                  item={item} 
                  index={idx} 
                  onClick={() => router.push(`/device-info?type=${item.type}`)}
                />
              ))}
            </div>
          </div>

          {/* 最近报警记录 */}
          <div className="bg-[#1E1E1E] rounded-lg p-4 lg:p-5 border border-[#2D2D2D]">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-[#E5E5E5] font-semibold flex items-center gap-2 text-sm lg:text-base">
                <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-[#D32F2F]" />
                最近报警
              </h3>
              <button 
                onClick={() => router.push('/fire-device')}
                className="text-[#0078D4] text-xs lg:text-sm hover:underline flex items-center gap-1 cursor-pointer"
              >
                查看全部 <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4" />
              </button>
            </div>
            <div className="space-y-2 lg:space-y-3">
              {recentAlarms.map(alarm => (
                <AlarmRow key={alarm.id} alarm={alarm} />
              ))}
            </div>
          </div>
        </div>

        {/* 右侧 - AI和数据 */}
        <div className="lg:col-span-3 space-y-4">
          {/* AI风险评估 */}
          <div className="bg-[#1E1E1E] rounded-lg p-4 lg:p-5 border border-[#2D2D2D]">
            <h3 className="text-[#E5E5E5] font-semibold mb-3 lg:mb-4 flex items-center gap-2 text-sm lg:text-base">
              <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-[#9C27B0]" />
              AI风险评估
            </h3>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#A0A0A0] text-xs lg:text-sm">今日风险指数</span>
                <span className="text-[#FF9800] font-semibold text-sm lg:text-base">中等</span>
              </div>
              <div className="h-1.5 lg:h-2 bg-[#2D2D2D] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#4CAF50] via-[#FF9800] to-[#D32F2F] rounded-full" style={{ width: '55%' }} />
              </div>
              <div className="grid grid-cols-2 gap-2 lg:gap-4 text-center">
                <div 
                  className="bg-[#222222] rounded-lg p-2 lg:p-3 cursor-pointer hover:bg-[#2A2A2A] transition-colors"
                  onClick={() => router.push('/ai-risk?tab=hiddens')}
                >
                  <p className="text-[#E5E5E5] text-base lg:text-lg font-bold">12</p>
                  <p className="text-[#6C6C6C] text-xs">隐患排查</p>
                </div>
                <div 
                  className="bg-[#222222] rounded-lg p-2 lg:p-3 cursor-pointer hover:bg-[#2A2A2A] transition-colors"
                  onClick={() => router.push('/ai-risk?tab=fixed')}
                >
                  <p className="text-[#4CAF50] text-base lg:text-lg font-bold">8</p>
                  <p className="text-[#6C6C6C] text-xs">已整改</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/ai-risk')}
                className="w-full py-2 bg-[#9C27B0]/10 text-[#9C27B0] rounded-lg text-xs lg:text-sm hover:bg-[#9C27B0]/20 transition-colors cursor-pointer"
              >
                查看一铺一策报告
              </button>
            </div>
          </div>

          {/* 商户风险预览 */}
          <div className="bg-[#1E1E1E] rounded-lg p-4 lg:p-5 border border-[#2D2D2D]">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-[#E5E5E5] font-semibold flex items-center gap-2 text-sm lg:text-base">
                <Building2 className="w-4 h-4 lg:w-5 lg:h-5 text-[#0078D4]" />
                商户风险预览
              </h3>
              <button 
                onClick={() => router.push('/merchants')}
                className="text-[#0078D4] text-xs hover:underline flex items-center gap-1 cursor-pointer"
              >
                查看全部 <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:gap-3">
              {[
                { id: 'A1', risk: 'high' as const },
                { id: 'A2', risk: 'medium' as const },
                { id: 'A3', risk: 'low' as const },
                { id: 'B1', risk: 'high' as const },
                { id: 'B2', risk: 'low' as const },
                { id: 'B3', risk: 'medium' as const },
                { id: 'C1', risk: 'medium' as const },
                { id: 'C2', risk: 'high' as const },
                { id: 'C3', risk: 'low' as const },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105',
                    item.risk === 'high' ? 'bg-[#D32F2F]/20 text-[#D32F2F] border border-[#D32F2F]/30' :
                    item.risk === 'medium' ? 'bg-[#FF9800]/20 text-[#FF9800] border border-[#FF9800]/30' :
                    'bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/30'
                  )}
                  onClick={() => router.push('/merchants')}
                >
                  <span className="text-sm lg:text-base font-bold">{item.id}</span>
                  <span className={cn(
                    'text-[10px] lg:text-xs',
                    item.risk === 'high' ? 'text-[#D32F2F]' :
                    item.risk === 'medium' ? 'text-[#FF9800]' :
                    'text-[#4CAF50]'
                  )}>
                    {item.risk === 'high' ? '高' : item.risk === 'medium' ? '中' : '低'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-[#A0A0A0]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#D32F2F]" /> 高风险 {merchantStats.highRisk}家
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FF9800]" /> 中风险 {merchantStats.mediumRisk}家
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#4CAF50]" /> 低风险 {merchantStats.lowRisk}家
              </span>
            </div>
          </div>
        </div>

        {/* 移除底部商户风险墙 - 已改为卡片放在右侧 */}
      </div>
      
      {/* 报警音频 */}
      <audio ref={homeGasAudioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR4AJ4Olw7SypohNdzSdu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZe0o8TpjO3NXheR4AJ4Olw7SypYhNdj+cu9HZ" type="audio/wav" />
      </audio>
      
      {/* 首页真实设备燃气报警弹窗 */}
      {homeGasAlarmPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-pulse">
          <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2D1A1A] rounded-2xl w-[450px] border-2 border-[#D32F2F] shadow-2xl shadow-[#D32F2F]/50 overflow-hidden">
            {/* 报警头部 */}
            <div className="bg-[#D32F2F] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg animate-pulse">
                  <BellRing className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">燃气报警</h2>
                  <p className="text-white/80 text-sm">真实设备报警</p>
                </div>
              </div>
              <button
                onClick={() => setHomeGasAlarmPopup(null)}
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
                    <p className="text-[#E5E5E5] font-mono">{homeGasAlarmPopup.deviceCode}</p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs">设备名称</p>
                    <p className="text-[#E5E5E5]">{homeGasAlarmPopup.deviceName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[#6C6C6C] text-xs">安装位置</p>
                    <p className="text-[#E5E5E5]">{homeGasAlarmPopup.location}</p>
                  </div>
                </div>
              </div>
              
              {/* 浓度显示 */}
              <div className="bg-[#D32F2F]/10 rounded-lg p-5 text-center border border-[#D32F2F]/30">
                <p className="text-[#A0A0A0] text-sm mb-2">当前浓度</p>
                <div className="text-5xl font-bold font-mono text-[#D32F2F] mb-2">
                  {homeGasAlarmPopup.concentration}
                  <span className="text-2xl text-[#D32F2F]/70">%LEL</span>
                </div>
                <p className="text-[#6C6C6C] text-sm">
                  报警阈值: {homeGasAlarmPopup.threshold}%LEL
                </p>
                <div className="h-4 bg-[#2D2D2D] rounded-full mt-3 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      homeGasAlarmPopup.concentration >= homeGasAlarmPopup.threshold ? 'bg-[#D32F2F]' : 'bg-[#FF9800]'
                    )}
                    style={{ width: `${Math.min(100, homeGasAlarmPopup.concentration)}%` }}
                  />
                </div>
              </div>
              
              {/* 报警状态 */}
              <div className="flex items-center justify-between bg-[#222222] rounded-lg p-3 border border-[#3A3A3A]">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    gasAlarmConfig[homeGasAlarmPopup.alarmStatus as keyof typeof gasAlarmConfig]?.bg || 'bg-[#D32F2F]/10',
                    gasAlarmConfig[homeGasAlarmPopup.alarmStatus as keyof typeof gasAlarmConfig]?.color || 'text-[#D32F2F]'
                  )}>
                    {gasAlarmConfig[homeGasAlarmPopup.alarmStatus as keyof typeof gasAlarmConfig]?.label || '报警'}
                  </span>
                  <span className="text-[#6C6C6C] text-xs">
                    {homeGasAlarmPopup.time.toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={() => setHomeGasSoundEnabled(!homeGasSoundEnabled)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    homeGasSoundEnabled ? 'bg-[#4CAF50]/20 text-[#4CAF50]' : 'bg-[#3A3A3A] text-[#6C6C6C]'
                  )}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setHomeGasAlarmPopup(null)}
                  className="flex-1 px-4 py-3 bg-[#D32F2F] rounded-lg text-white font-semibold hover:bg-[#B71C1C] transition-colors"
                >
                  我已知晓
                </button>
                <button
                  onClick={() => {
                    setHomeGasAlarmPopup(null);
                    router.push('/gas-device');
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
    </AppShell>
  );
}
