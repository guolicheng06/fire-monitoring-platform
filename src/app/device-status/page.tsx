'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Search, Radio, Wifi, WifiOff, AlertTriangle, Activity,
  Flame, Wind, Thermometer, Bell, Settings, RefreshCw,
  Eye, Power, TrendingUp, TrendingDown, X
} from 'lucide-react';

// 设备监控数据
const mockDevices = [
  { id: 1, code: 'GAS-A001', name: '可燃气体探测器', location: '串串香火锅', type: 'gas', status: 'online', signal: 95, battery: 85, lastUpdate: '2026-04-10 15:30' },
  { id: 2, code: 'GAS-A002', name: '可燃气体探测器', location: '串串香火锅', type: 'gas', status: 'online', signal: 88, battery: 78, lastUpdate: '2026-04-10 15:28' },
  { id: 3, code: 'SM-A101', name: '烟感探测器', location: '重庆火锅', type: 'smoke', status: 'online', signal: 92, battery: 90, lastUpdate: '2026-04-10 15:29' },
  { id: 4, code: 'TP-A102', name: '温感探测器', location: '重庆火锅', type: 'temp', status: 'online', signal: 85, battery: 82, lastUpdate: '2026-04-10 15:27' },
  { id: 5, code: 'GAS-B001', name: '可燃气体探测器', location: '烧烤专门店', type: 'gas', status: 'alarm', signal: 90, battery: 75, lastUpdate: '2026-04-10 15:25' },
  { id: 6, code: 'SD-C101', name: '声光报警器', location: '超市', type: 'sounder', status: 'fault', signal: 0, battery: 0, lastUpdate: '2026-04-10 10:15' },
  { id: 7, code: 'FC-001', name: '火灾报警控制器', location: '消防控制室', type: 'controller', status: 'online', signal: 100, battery: 100, lastUpdate: '2026-04-10 15:30' },
  { id: 8, code: 'MB-D101', name: '手动报警按钮', location: '星巴克', type: 'manual', status: 'offline', signal: 0, battery: 45, lastUpdate: '2026-04-09 18:00' },
];

// 设备类型配置
const deviceTypes = {
  gas: { name: '可燃气体', icon: <Wind className="w-5 h-5" />, color: 'text-[#0078D4]', bg: 'bg-[#0078D4]/10' },
  smoke: { name: '烟感', icon: <Activity className="w-5 h-5" />, color: 'text-[#2196F3]', bg: 'bg-[#2196F3]/10' },
  temp: { name: '温感', icon: <Thermometer className="w-5 h-5" />, color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10' },
  sounder: { name: '声光', icon: <Bell className="w-5 h-5" />, color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
  controller: { name: '控制器', icon: <Settings className="w-5 h-5" />, color: 'text-[#9C27B0]', bg: 'bg-[#9C27B0]/10' },
  manual: { name: '手报', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-[#607D8B]', bg: 'bg-[#607D8B]/10' },
};

// 状态配置
const statusConfig = {
  online: { label: '在线', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' },
  offline: { label: '离线', color: 'text-[#6C6C6C]', bg: 'bg-[#6C6C6C]/10' },
  fault: { label: '故障', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
  alarm: { label: '报警', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
};

// 设备配置接口
interface DeviceConfig {
  alarmThreshold: string;
  alarmDelay: string;
  linkageEnabled: boolean;
  notificationEnabled: boolean;
  autoReset: boolean;
  checkInterval: string;
}

export default function DeviceStatusPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<typeof mockDevices[0] | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState<DeviceConfig>({
    alarmThreshold: '10',
    alarmDelay: '30',
    linkageEnabled: true,
    notificationEnabled: true,
    autoReset: false,
    checkInterval: '60',
  });

  // 过滤数据
  const filteredDevices = mockDevices.filter(device => {
    const matchSearch = device.name.includes(searchTerm) || device.code.includes(searchTerm) || device.location.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || device.status === filterStatus;
    const matchType = filterType === 'all' || device.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  // 统计
  const stats = {
    total: mockDevices.length,
    online: mockDevices.filter(d => d.status === 'online').length,
    offline: mockDevices.filter(d => d.status === 'offline').length,
    fault: mockDevices.filter(d => d.status === 'fault').length,
    alarm: mockDevices.filter(d => d.status === 'alarm').length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E5E5E5]">设备状态监控</h1>
            <p className="text-[#A0A0A0] text-sm mt-1">实时监控所有设备在线状态、信号强度和电池电量</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors">
              <RefreshCw className="w-4 h-4" />
              刷新状态
            </button>
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0078D4]/10">
                <Radio className="w-5 h-5 text-[#0078D4]" />
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
                <Wifi className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">在线</p>
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
                <p className="text-[#A0A0A0] text-sm">报警</p>
                <p className="text-2xl font-bold text-[#FF9800]">{stats.alarm}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#D32F2F]/10">
                <AlertTriangle className="w-5 h-5 text-[#D32F2F]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">故障</p>
                <p className="text-2xl font-bold text-[#D32F2F]">{stats.fault}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#6C6C6C]/10">
                <WifiOff className="w-5 h-5 text-[#6C6C6C]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">离线</p>
                <p className="text-2xl font-bold text-[#6C6C6C]">{stats.offline}</p>
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
                  placeholder="搜索设备..."
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
                <option value="alarm">报警</option>
                <option value="fault">故障</option>
                <option value="offline">离线</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#A0A0A0] text-sm">类型:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                <option value="all">全部类型</option>
                <option value="gas">可燃气体</option>
                <option value="smoke">烟感</option>
                <option value="temp">温感</option>
                <option value="sounder">声光</option>
                <option value="controller">控制器</option>
                <option value="manual">手报</option>
              </select>
            </div>
          </div>
        </div>

        {/* 设备状态网格 */}
        <div className="grid grid-cols-4 gap-4">
          {filteredDevices.map((device) => {
            const typeConfig = deviceTypes[device.type as keyof typeof deviceTypes];
            const status = statusConfig[device.status as keyof typeof statusConfig];
            const isProblem = device.status === 'fault' || device.status === 'alarm' || device.status === 'offline';
            
            return (
              <div
                key={device.id}
                className={cn(
                  'bg-[#1E1E1E] rounded-lg border p-4 cursor-pointer transition-all hover:scale-[1.02]',
                  isProblem ? 'border-[#D32F2F]/30' : 'border-[#2D2D2D]'
                )}
                onClick={() => setSelectedDevice(device)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-2 rounded-lg', typeConfig.bg)}>
                      <div className={typeConfig.color}>{typeConfig.icon}</div>
                    </div>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', status.bg, status.color)}>
                    {status.label}
                  </span>
                </div>

                <h3 className="text-[#E5E5E5] font-medium text-sm mb-1">{device.name}</h3>
                <p className="text-[#6C6C6C] text-xs mb-3">{device.location}</p>

                {/* 信号强度 */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#A0A0A0]">信号强度</span>
                    <span className={cn(
                      device.signal >= 80 ? 'text-[#4CAF50]' :
                      device.signal >= 50 ? 'text-[#FF9800]' : 'text-[#D32F2F]'
                    )}>
                      {device.signal}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#2D2D2D] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        device.signal >= 80 ? 'bg-[#4CAF50]' :
                        device.signal >= 50 ? 'bg-[#FF9800]' : 'bg-[#D32F2F]'
                      )}
                      style={{ width: `${device.signal}%` }}
                    />
                  </div>
                </div>

                {/* 电池电量 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#A0A0A0]">电池</span>
                    <span className={cn(
                      device.battery >= 50 ? 'text-[#4CAF50]' :
                      device.battery >= 20 ? 'text-[#FF9800]' : 'text-[#D32F2F]'
                    )}>
                      {device.battery}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#2D2D2D] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        device.battery >= 50 ? 'bg-[#4CAF50]' :
                        device.battery >= 20 ? 'bg-[#FF9800]' : 'bg-[#D32F2F]'
                      )}
                      style={{ width: `${device.battery}%` }}
                    />
                  </div>
                </div>

                <p className="text-[#6C6C6C] text-xs">最后更新: {device.lastUpdate}</p>
              </div>
            );
          })}
        </div>

        {/* 设备详情弹窗 */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedDevice(null)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[500px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-3 rounded-lg', deviceTypes[selectedDevice.type as keyof typeof deviceTypes].bg)}>
                      <div className={deviceTypes[selectedDevice.type as keyof typeof deviceTypes].color}>
                        {deviceTypes[selectedDevice.type as keyof typeof deviceTypes].icon}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#E5E5E5]">{selectedDevice.name}</h2>
                      <p className="text-[#6C6C6C] text-sm font-mono">{selectedDevice.code}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-3 py-1 rounded text-sm font-medium',
                    statusConfig[selectedDevice.status as keyof typeof statusConfig].bg,
                    statusConfig[selectedDevice.status as keyof typeof statusConfig].color
                  )}>
                    {statusConfig[selectedDevice.status as keyof typeof statusConfig].label}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* 信号与电池 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A] text-center">
                    <div className={cn(
                      'text-4xl font-bold mb-2',
                      selectedDevice.signal >= 80 ? 'text-[#4CAF50]' :
                      selectedDevice.signal >= 50 ? 'text-[#FF9800]' : 'text-[#D32F2F]'
                    )}>
                      {selectedDevice.signal}
                    </div>
                    <p className="text-[#A0A0A0] text-sm">信号强度 (%)</p>
                    <div className="h-2 bg-[#2D2D2D] rounded-full mt-2 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          selectedDevice.signal >= 80 ? 'bg-[#4CAF50]' :
                          selectedDevice.signal >= 50 ? 'bg-[#FF9800]' : 'bg-[#D32F2F]'
                        )}
                        style={{ width: `${selectedDevice.signal}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A] text-center">
                    <div className={cn(
                      'text-4xl font-bold mb-2',
                      selectedDevice.battery >= 50 ? 'text-[#4CAF50]' :
                      selectedDevice.battery >= 20 ? 'text-[#FF9800]' : 'text-[#D32F2F]'
                    )}>
                      {selectedDevice.battery}
                    </div>
                    <p className="text-[#A0A0A0] text-sm">电池电量 (%)</p>
                    <div className="h-2 bg-[#2D2D2D] rounded-full mt-2 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          selectedDevice.battery >= 50 ? 'bg-[#4CAF50]' :
                          selectedDevice.battery >= 20 ? 'bg-[#FF9800]' : 'bg-[#D32F2F]'
                        )}
                        style={{ width: `${selectedDevice.battery}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">设备类型</p>
                    <p className={cn('text-sm font-medium', deviceTypes[selectedDevice.type as keyof typeof deviceTypes].color)}>
                      {deviceTypes[selectedDevice.type as keyof typeof deviceTypes].name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">安装位置</p>
                    <p className="text-[#E5E5E5] text-sm">{selectedDevice.location}</p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">设备状态</p>
                    <p className={statusConfig[selectedDevice.status as keyof typeof statusConfig].color}>
                      {statusConfig[selectedDevice.status as keyof typeof statusConfig].label}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">最后更新</p>
                    <p className="text-[#E5E5E5] text-sm">{selectedDevice.lastUpdate}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                >
                  关闭
                </button>
                <button 
                  onClick={() => setShowConfig(true)}
                  className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors"
                >
                  设备配置
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 设备配置弹窗 */}
        {showConfig && selectedDevice && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowConfig(false)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[500px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D] flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#E5E5E5]">设备配置</h2>
                  <p className="text-[#6C6C6C] text-sm mt-1">{selectedDevice.name} - {selectedDevice.code}</p>
                </div>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="p-1 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* 报警参数 */}
                <div>
                  <h3 className="text-[#E5E5E5] font-medium mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#0078D4]" />
                    报警参数
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#A0A0A0] text-xs mb-2">报警阈值</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={configForm.alarmThreshold}
                          onChange={(e) => setConfigForm({ ...configForm, alarmThreshold: e.target.value })}
                          className="flex-1 px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                        />
                        <span className="text-[#6C6C6C] text-sm">
                          {selectedDevice.type === 'gas' ? '%LEL' : selectedDevice.type === 'temp' ? '°C' : '%'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#A0A0A0] text-xs mb-2">报警延时</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={configForm.alarmDelay}
                          onChange={(e) => setConfigForm({ ...configForm, alarmDelay: e.target.value })}
                          className="flex-1 px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                        />
                        <span className="text-[#6C6C6C] text-sm">秒</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 联动设置 */}
                <div>
                  <h3 className="text-[#E5E5E5] font-medium mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#4CAF50]" />
                    联动设置
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-[#222222] rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors">
                      <div>
                        <p className="text-[#E5E5E5] text-sm">联动报警</p>
                        <p className="text-[#6C6C6C] text-xs">报警时自动触发声光报警器</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={configForm.linkageEnabled}
                        onChange={(e) => setConfigForm({ ...configForm, linkageEnabled: e.target.checked })}
                        className="w-4 h-4 rounded border-[#3A3A3A] bg-[#222222] text-[#0078D4] focus:ring-[#0078D4]"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-[#222222] rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors">
                      <div>
                        <p className="text-[#E5E5E5] text-sm">消息通知</p>
                        <p className="text-[#6C6C6C] text-xs">报警时发送手机推送通知</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={configForm.notificationEnabled}
                        onChange={(e) => setConfigForm({ ...configForm, notificationEnabled: e.target.checked })}
                        className="w-4 h-4 rounded border-[#3A3A3A] bg-[#222222] text-[#0078D4] focus:ring-[#0078D4]"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-[#222222] rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors">
                      <div>
                        <p className="text-[#E5E5E5] text-sm">自动复位</p>
                        <p className="text-[#6C6C6C] text-xs">报警恢复正常后自动复位</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={configForm.autoReset}
                        onChange={(e) => setConfigForm({ ...configForm, autoReset: e.target.checked })}
                        className="w-4 h-4 rounded border-[#3A3A3A] bg-[#222222] text-[#0078D4] focus:ring-[#0078D4]"
                      />
                    </label>
                  </div>
                </div>

                {/* 巡检设置 */}
                <div>
                  <h3 className="text-[#E5E5E5] font-medium mb-4 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#FF9800]" />
                    巡检设置
                  </h3>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-2">心跳间隔</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={configForm.checkInterval}
                        onChange={(e) => setConfigForm({ ...configForm, checkInterval: e.target.value })}
                        className="flex-1 px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                      />
                      <span className="text-[#6C6C6C] text-sm">秒</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setShowConfig(false)}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    // 保存配置
                    console.log('保存设备配置:', configForm);
                    setShowConfig(false);
                  }}
                  className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors"
                >
                  保存配置
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
