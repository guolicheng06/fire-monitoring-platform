'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Search, Plus, Monitor, Wind, Thermometer, Activity, Bell,
  AlertTriangle, CheckCircle2, Edit, Trash2, Eye, Wifi, Battery,
  MapPin, Calendar, Filter, MoreVertical, ToggleLeft, ToggleRight,
  X, Loader2
} from 'lucide-react';

// 设备类型接口
interface Device {
  id: string;
  code: string;
  name: string;
  type: 'gas' | 'smoke' | 'temp' | 'sounder' | 'controller' | 'manual';
  location: string;
  floor: string;
  installDate: string;
  status: 'online' | 'offline' | 'fault' | 'alarm';
  threshold: string;
  brand: string;
  model: string;
  hasLinkage: boolean;
  customer_id?: string;
}

// 设备列表数据
const mockDevices: Device[] = [
  { id: '1', code: 'GAS-001', name: '可燃气体探测器', type: 'gas', location: 'A区-串串香火锅', floor: '1F', installDate: '2024-03-15', status: 'online', threshold: '10%LEL', brand: '海湾安全', model: 'GST-BT02', hasLinkage: true },
  { id: '2', code: 'GAS-002', name: '可燃气体探测器', type: 'gas', location: 'A区-重庆火锅', floor: '1F', installDate: '2024-03-18', status: 'online', threshold: '10%LEL', brand: '海湾安全', model: 'GST-BT02', hasLinkage: true },
  { id: '3', code: 'GAS-003', name: '可燃气体探测器', type: 'gas', location: 'B区-烧烤专门店', floor: '2F', installDate: '2024-04-01', status: 'alarm', threshold: '15%LEL', brand: '青鸟消防', model: 'JBF-61B20', hasLinkage: true },
  { id: '4', code: 'SM-001', name: '烟感探测器', type: 'smoke', location: 'A区-重庆火锅', floor: '1F', installDate: '2024-03-10', status: 'online', threshold: '0.15dB/m', brand: '海湾安全', model: 'GST-JTY-GF', hasLinkage: true },
  { id: '5', code: 'TP-001', name: '温感探测器', type: 'temp', location: 'C区-星巴克', floor: '1F', installDate: '2024-04-05', status: 'online', threshold: '70°C', brand: '利达消防', model: 'LD-5600', hasLinkage: false },
  { id: '6', code: 'SD-001', name: '声光报警器', type: 'sounder', location: 'A区-公共区域', floor: '1F', installDate: '2024-03-10', status: 'online', threshold: '110dB', brand: '泛海三江', model: 'DH9201', hasLinkage: true },
  { id: '7', code: 'FC-001', name: '火灾报警控制器', type: 'controller', location: '消防控制室', floor: 'B1F', installDate: '2024-01-01', status: 'online', threshold: '—', brand: '海湾安全', model: 'JB-QG-GST5000', hasLinkage: true },
  { id: '8', code: 'MB-001', name: '手动报警按钮', type: 'manual', location: 'A区-电梯旁', floor: '1F', installDate: '2024-03-10', status: 'online', threshold: '—', brand: '利达消防', model: 'LD-5800', hasLinkage: true },
  { id: '9', code: 'GAS-004', name: '可燃气体探测器', type: 'gas', location: 'C区-大娘水饺', floor: '1F', installDate: '2024-05-01', status: 'offline', threshold: '10%LEL', brand: '青鸟消防', model: 'JBF-61B20', hasLinkage: false },
  { id: '10', code: 'SM-002', name: '烟感探测器', type: 'smoke', location: 'D区-屈臣氏', floor: '2F', installDate: '2024-04-10', status: 'fault', threshold: '0.15dB/m', brand: '泛海三江', model: 'DH9501', hasLinkage: false },
];

// 设备类型配置
const deviceTypes = {
  gas: { name: '可燃气体', icon: Wind, color: 'text-[#0078D4]', bg: 'bg-[#0078D4]/10', border: 'border-[#0078D4]/30' },
  smoke: { name: '烟感', icon: Activity, color: 'text-[#2196F3]', bg: 'bg-[#2196F3]/10', border: 'border-[#2196F3]/30' },
  temp: { name: '温感', icon: Thermometer, color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10', border: 'border-[#FF9800]/30' },
  sounder: { name: '声光', icon: Bell, color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10', border: 'border-[#D32F2F]/30' },
  controller: { name: '控制器', icon: Monitor, color: 'text-[#9C27B0]', bg: 'bg-[#9C27B0]/10', border: 'border-[#9C27B0]/30' },
  manual: { name: '手报', icon: AlertTriangle, color: 'text-[#607D8B]', bg: 'bg-[#607D8B]/10', border: 'border-[#607D8B]/30' },
};

// 状态配置
const statusConfig = {
  online: { label: '在线', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' },
  offline: { label: '离线', color: 'text-[#6C6C6C]', bg: 'bg-[#6C6C6C]/10' },
  fault: { label: '故障', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
  alarm: { label: '报警', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
};

// 内部组件 - 使用 useSearchParams
function DeviceInfoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>(initialStatus);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editForm, setEditForm] = useState<Partial<Device>>({});
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 加载设备数据
  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/devices');
      if (res.ok) {
        const data = await res.json();
        // 映射API字段到页面接口
        const mappedDevices: Device[] = (data.devices || []).map((d: {
          id: string;
          device_code: string;
          device_type: string;
          device_name: string;
          location: string;
          install_date?: string;
          status: string;
          metadata?: Record<string, unknown>;
        }) => ({
          id: d.id,
          code: d.device_code || d.id,
          name: d.device_name || '未知设备',
          type: (() => {
            const t = d.device_type?.toLowerCase() || '';
            if (t.includes('yak300') || t.includes('gas')) return 'gas';
            if (t.includes('smoke')) return 'smoke';
            if (t.includes('temp') || t.includes('temperature')) return 'temp';
            if (t.includes('sounder') || t.includes('alarm')) return 'sounder';
            if (t.includes('controller') || t.includes('fire')) return 'controller';
            if (t.includes('manual')) return 'manual';
            return 'gas';
          })() as Device['type'],
          location: d.location || '未知位置',
          floor: (d.metadata?.zone as string || '未知') + '层',
          installDate: d.install_date || '',
          status: (d.status === 'online' ? 'online' : d.status === 'offline' ? 'offline' : d.status === 'fault' ? 'fault' : 'online') as Device['status'],
          threshold: d.metadata?.threshold as string || '—',
          brand: d.metadata?.brand as string || '未知品牌',
          model: d.metadata?.model as string || '未知型号',
          hasLinkage: Boolean(d.metadata?.hasLinkage),
        }));
        setDevices(mappedDevices.length > 0 ? mappedDevices : mockDevices);
      } else {
        setDevices(mockDevices);
      }
    } catch {
      setDevices(mockDevices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  // 处理编辑按钮点击
  const handleEdit = (device: Device, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingDevice(device);
    setEditForm({ ...device });
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingDevice) return;
    setSaving(true);
    try {
      // 这里可以调用API保存
      const res = await fetch(`/api/devices/${editingDevice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      
      if (res.ok) {
        // 更新本地数据
        setDevices(prev => prev.map(d => d.id === editingDevice.id ? { ...d, ...editForm } as Device : d));
        setEditingDevice(null);
        if (selectedDevice?.id === editingDevice.id) {
          setSelectedDevice({ ...selectedDevice, ...editForm } as Device);
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 过滤数据
  const filteredDevices = devices.filter(device => {
    const matchSearch = device.name.includes(searchTerm) || device.code.includes(searchTerm) || device.location.includes(searchTerm);
    const matchType = filterType === 'all' || device.type === filterType;
    const matchStatus = filterStatus === 'all' || device.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  // 分页
  const totalPages = Math.ceil(filteredDevices.length / pageSize);
  const paginatedDevices = filteredDevices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 统计
  const stats = {
    total: devices.length,
    gas: devices.filter(d => d.type === 'gas').length,
    smoke: devices.filter(d => d.type === 'smoke').length,
    fault: devices.filter(d => d.status === 'fault' || d.status === 'offline').length,
    alarm: devices.filter(d => d.status === 'alarm').length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E5E5E5]">设备信息管理</h1>
            <p className="text-[#A0A0A0] text-sm mt-1">管理所有消防设备的基础信息和配置参数</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors">
              <Plus className="w-4 h-4" />
              添加设备
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0078D4]/10">
                <Monitor className="w-5 h-5 text-[#0078D4]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">设备总数</p>
                <p className="text-2xl font-bold text-[#E5E5E5]">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0078D4]/10">
                <Wind className="w-5 h-5 text-[#0078D4]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">可燃气体</p>
                <p className="text-2xl font-bold text-[#0078D4]">{stats.gas}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#2196F3]/10">
                <Activity className="w-5 h-5 text-[#2196F3]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">烟感探测</p>
                <p className="text-2xl font-bold text-[#2196F3]">{stats.smoke}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#D32F2F]/10">
                <AlertTriangle className="w-5 h-5 text-[#D32F2F]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">异常设备</p>
                <p className="text-2xl font-bold text-[#D32F2F]">{stats.fault + stats.alarm}</p>
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
                  placeholder="搜索设备名称、编号、位置..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>
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
            <div className="flex items-center gap-2">
              <span className="text-[#A0A0A0] text-sm">状态:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                <option value="all">全部状态</option>
                <option value="online">在线</option>
                <option value="offline">离线</option>
                <option value="fault">故障</option>
                <option value="alarm">报警</option>
              </select>
            </div>
          </div>
        </div>

        {/* 设备列表 */}
        <div className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#222222]">
              <tr>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">设备编号</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">设备名称</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">类型</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">安装位置</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">报警阈值</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">状态</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">联动</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2D2D]">
              {paginatedDevices.map((device) => {
                const typeConfig = deviceTypes[device.type as keyof typeof deviceTypes] || deviceTypes.gas;
                const status = statusConfig[device.status as keyof typeof statusConfig] || statusConfig.online;
                const Icon = typeConfig.icon;

                return (
                  <tr
                    key={device.id}
                    className="hover:bg-[#2A2A2A] cursor-pointer transition-colors"
                    onClick={() => setSelectedDevice(device)}
                  >
                    <td className="px-4 py-4">
                      <span className="text-[#E5E5E5] text-sm font-mono">{device.code}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn('p-1.5 rounded', typeConfig.bg)}>
                          <Icon className={cn('w-4 h-4', typeConfig.color)} />
                        </div>
                        <span className="text-[#E5E5E5] text-sm">{device.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('text-sm', typeConfig.color)}>{typeConfig.name}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-[#E5E5E5] text-sm">{device.location}</p>
                        <p className="text-[#6C6C6C] text-xs">{device.floor}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[#A0A0A0] text-sm">{device.threshold}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('px-2 py-1 rounded text-xs font-medium', status.bg, status.color)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {device.hasLinkage ? (
                        <ToggleRight className="w-6 h-6 text-[#4CAF50]" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-[#6C6C6C]" />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedDevice(device); }}
                          className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleEdit(device, e)}
                          className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#D32F2F] transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 分页 */}
          <div className="px-4 py-3 border-t border-[#2D2D2D] flex items-center justify-between">
            <span className="text-[#6C6C6C] text-sm">
              共 {filteredDevices.length} 条记录
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#222222] border border-[#3A3A3A] rounded text-[#E5E5E5] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2A2A2A] transition-colors"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-[#E5E5E5] text-sm">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-[#222222] border border-[#3A3A3A] rounded text-[#E5E5E5] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2A2A2A] transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        </div>

        {/* 设备详情弹窗 */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedDevice(null)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[600px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <div className="flex items-center gap-3">
                  <div className={cn('p-3 rounded-lg', deviceTypes[selectedDevice.type as keyof typeof deviceTypes].bg)}>
                    {(() => {
                      const Icon = deviceTypes[selectedDevice.type as keyof typeof deviceTypes].icon;
                      return <Icon className={cn('w-6 h-6', deviceTypes[selectedDevice.type as keyof typeof deviceTypes].color)} />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[#E5E5E5]">{selectedDevice.name}</h2>
                    <p className="text-[#6C6C6C] text-sm font-mono">{selectedDevice.code}</p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                    <p className="text-[#6C6C6C] text-xs mb-1">设备类型</p>
                    <p className={cn('text-sm font-medium', deviceTypes[selectedDevice.type as keyof typeof deviceTypes].color)}>
                      {deviceTypes[selectedDevice.type as keyof typeof deviceTypes].name}
                    </p>
                  </div>
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                    <p className="text-[#6C6C6C] text-xs mb-1">安装位置</p>
                    <p className="text-[#E5E5E5] text-sm">{selectedDevice.location}</p>
                  </div>
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                    <p className="text-[#6C6C6C] text-xs mb-1">楼层</p>
                    <p className="text-[#E5E5E5] text-sm">{selectedDevice.floor}</p>
                  </div>
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                    <p className="text-[#6C6C6C] text-xs mb-1">安装日期</p>
                    <p className="text-[#E5E5E5] text-sm">{selectedDevice.installDate}</p>
                  </div>
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                    <p className="text-[#6C6C6C] text-xs mb-1">报警阈值</p>
                    <p className="text-[#E5E5E5] text-sm">{selectedDevice.threshold}</p>
                  </div>
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                    <p className="text-[#6C6C6C] text-xs mb-1">联动设置</p>
                    <p className="text-[#E5E5E5] text-sm">{selectedDevice.hasLinkage ? '已启用' : '未启用'}</p>
                  </div>
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                    <p className="text-[#6C6C6C] text-xs mb-1">品牌</p>
                    <p className="text-[#E5E5E5] text-sm">{selectedDevice.brand}</p>
                  </div>
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                    <p className="text-[#6C6C6C] text-xs mb-1">型号</p>
                    <p className="text-[#E5E5E5] text-sm">{selectedDevice.model}</p>
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
                  onClick={() => handleEdit(selectedDevice)}
                  className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors"
                >
                  编辑设备
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑设备弹窗 */}
        {editingDevice && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setEditingDevice(null)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[500px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D] flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#E5E5E5]">编辑设备</h2>
                <button 
                  onClick={() => setEditingDevice(null)}
                  className="p-1 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-1">设备编号</label>
                    <input
                      type="text"
                      value={editForm.code || ''}
                      onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-1">设备名称</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-1">设备类型</label>
                    <select
                      value={editForm.type || ''}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as Device['type'] })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    >
                      <option value="gas">可燃气体</option>
                      <option value="smoke">烟感</option>
                      <option value="temp">温感</option>
                      <option value="sounder">声光</option>
                      <option value="controller">控制器</option>
                      <option value="manual">手报</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-1">报警阈值</label>
                    <input
                      type="text"
                      value={editForm.threshold || ''}
                      onChange={(e) => setEditForm({ ...editForm, threshold: e.target.value })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-1">安装位置</label>
                    <input
                      type="text"
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-1">楼层</label>
                    <input
                      type="text"
                      value={editForm.floor || ''}
                      onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-1">品牌</label>
                    <input
                      type="text"
                      value={editForm.brand || ''}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-1">型号</label>
                    <input
                      type="text"
                      value={editForm.model || ''}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-1">状态</label>
                    <select
                      value={editForm.status || ''}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Device['status'] })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    >
                      <option value="online">在线</option>
                      <option value="offline">离线</option>
                      <option value="fault">故障</option>
                      <option value="alarm">报警</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-1">联动设置</label>
                    <div className="flex items-center h-[42px]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.hasLinkage || false}
                          onChange={(e) => setEditForm({ ...editForm, hasLinkage: e.target.checked })}
                          className="w-4 h-4 rounded border-[#3A3A3A] bg-[#222222] text-[#0078D4] focus:ring-[#0078D4]"
                        />
                        <span className="text-[#E5E5E5] text-sm">启用联动</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setEditingDevice(null)}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// 包装组件 - 使用 Suspense
export default function DeviceInfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0078D4] animate-spin" />
      </div>
    }>
      <DeviceInfoContent />
    </Suspense>
  );
}
