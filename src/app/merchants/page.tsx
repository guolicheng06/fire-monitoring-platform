'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Search, Plus, Filter, Download, Building2, MapPin,
  Phone, AlertTriangle, Radio, Flame, ChevronDown,
  Edit, Trash2, Eye, MoreHorizontal, CheckCircle,
  Loader2, RefreshCw, X
} from 'lucide-react';

// 风险等级配置
const riskConfig = {
  high: { label: '高风险', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10', border: 'border-[#D32F2F]/30' },
  medium: { label: '中风险', color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10', border: 'border-[#FF9800]/30' },
  low: { label: '低风险', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', border: 'border-[#4CAF50]/30' },
  unrated: { label: '未评级', color: 'text-[#6C6C6C]', bg: 'bg-[#6C6C6C]/10', border: 'border-[#6C6C6C]/30' },
};

// 商户数据接口
interface Merchant {
  id: string;
  name: string;
  use_type: string;
  district: string;
  risk_level: string;
  has_detector: boolean;
  detector_count: number;
  night_open: boolean;
  open_fire: boolean;
  density_level: string;
  metadata?: Record<string, unknown>;
}

// 编辑表单接口
interface EditForm {
  name: string;
  use_type: string;
  district: string;
  risk_level: string;
  has_detector: boolean;
  detector_count: number;
  night_open: boolean;
  open_fire: boolean;
  density_level: string;
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    use_type: '',
    district: '',
    risk_level: 'unrated',
    has_detector: false,
    detector_count: 0,
    night_open: false,
    open_fire: false,
    density_level: '',
  });
  const [saving, setSaving] = useState(false);
  const pageSize = 10;

  // 加载商户数据
  const loadMerchants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setMerchants(data.customers || []);
      }
    } catch (error) {
      console.error('加载商户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  // 过滤数据
  const filteredMerchants = merchants.filter(merchant => {
    const matchSearch = merchant.name.includes(searchTerm) || 
                       merchant.use_type?.includes(searchTerm);
    const matchRisk = filterRisk === 'all' || merchant.risk_level === filterRisk;
    const matchDistrict = filterDistrict === 'all' || merchant.district === filterDistrict;
    return matchSearch && matchRisk && matchDistrict;
  });

  // 分页
  const totalPages = Math.ceil(filteredMerchants.length / pageSize);
  const paginatedMerchants = filteredMerchants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 统计
  const stats = {
    total: merchants.length,
    highRisk: merchants.filter(m => m.risk_level === 'high').length,
    mediumRisk: merchants.filter(m => m.risk_level === 'medium').length,
    lowRisk: merchants.filter(m => m.risk_level === 'low').length,
    unrated: merchants.filter(m => m.risk_level === 'unrated').length,
  };

  // 区域统计
  const districtStats = merchants.reduce((acc, m) => {
    const district = m.district || '未知';
    if (!acc[district]) acc[district] = 0;
    acc[district]++;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E5E5E5]">商户信息管理</h1>
            <p className="text-[#A0A0A0] text-sm mt-1">管理商业综合体内所有商户的消防安全信息</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadMerchants}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              刷新
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors">
              <Download className="w-4 h-4" />
              导出数据
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors">
              <Plus className="w-4 h-4" />
              添加商户
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0078D4]/10">
                <Building2 className="w-5 h-5 text-[#0078D4]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">商户总数</p>
                <p className="text-2xl font-bold text-[#E5E5E5]">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#D32F2F]/10">
                <AlertTriangle className="w-5 h-5 text-[#D32F2F]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">高风险商户</p>
                <p className="text-2xl font-bold text-[#D32F2F]">{stats.highRisk}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#FF9800]/10">
                <AlertTriangle className="w-5 h-5 text-[#FF9800]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">中风险商户</p>
                <p className="text-2xl font-bold text-[#FF9800]">{stats.mediumRisk}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#4CAF50]/10">
                <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">低风险商户</p>
                <p className="text-2xl font-bold text-[#4CAF50]">{stats.lowRisk}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 筛选工具栏 */}
        <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
          <div className="flex flex-wrap items-center gap-4">
            {/* 搜索 */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C6C6C]" />
                <input
                  type="text"
                  placeholder="搜索商户名称或编号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>

            {/* 风险等级筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-[#A0A0A0] text-sm">风险等级:</span>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                <option value="all">全部</option>
                <option value="high">高风险</option>
                <option value="medium">中风险</option>
                <option value="low">低风险</option>
                <option value="unrated">未评级</option>
              </select>
            </div>

            {/* 区域筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-[#A0A0A0] text-sm">区域:</span>
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                <option value="all">全部区域</option>
                {Object.keys(districtStats).map(d => (
                  <option key={d} value={d}>{d} ({districtStats[d]})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#0078D4] animate-spin" />
              <span className="ml-3 text-[#A0A0A0]">加载商户数据...</span>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1A1A1A]">
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">门店编号</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">业态类型</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">探测器数量</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">夜间营业</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">明火经营</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">区域</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">人员密度</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">风险等级</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMerchants.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-[#6C6C6C]">
                        暂无数据，请点击右上角"刷新"按钮加载数据
                      </td>
                    </tr>
                  ) : (
                    paginatedMerchants.map((merchant) => {
                      const risk = riskConfig[merchant.risk_level as keyof typeof riskConfig] || riskConfig.unrated;
                      return (
                        <tr
                          key={merchant.id}
                          className="border-t border-[#2D2D2D] hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                          onClick={() => setSelectedMerchant(merchant)}
                        >
                          <td className="px-4 py-3 text-[#E5E5E5] text-sm font-mono">{merchant.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#0078D4]" />
                              <span className="text-[#E5E5E5] text-sm">{merchant.use_type || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-sm">
                              <Radio className="w-4 h-4 text-[#4CAF50]" />
                              {merchant.detector_count || 0}台
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              merchant.night_open ? 'bg-[#FF9800]/10 text-[#FF9800]' : 'bg-[#4CAF50]/10 text-[#4CAF50]'
                            )}>
                              {merchant.night_open ? '是' : '否'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'flex items-center gap-1 text-sm',
                              merchant.open_fire ? 'text-[#FF9800]' : 'text-[#4CAF50]'
                            )}>
                              <Flame className="w-4 h-4" />
                              {merchant.open_fire ? '是' : '否'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-[#0078D4]/10 text-[#0078D4] rounded text-xs">
                              {merchant.district}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#A0A0A0] text-sm">{merchant.density_level || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-1 rounded text-xs font-medium', risk.bg, risk.color)}>
                              {risk.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedMerchant(merchant); }}
                                className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMerchant(merchant);
                                  setEditForm({
                                    name: merchant.name,
                                    use_type: merchant.use_type || '',
                                    district: merchant.district || '',
                                    risk_level: merchant.risk_level || 'unrated',
                                    has_detector: merchant.has_detector || false,
                                    detector_count: merchant.detector_count || 0,
                                    night_open: merchant.night_open || false,
                                    open_fire: merchant.open_fire || false,
                                    density_level: merchant.density_level || '',
                                  });
                                }}
                                className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#D32F2F] transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {/* 分页 */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#2D2D2D]">
                <p className="text-[#A0A0A0] text-sm">
                  显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredMerchants.length)} 条，共 {filteredMerchants.length} 条
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-[#222222] border border-[#3A3A3A] rounded text-[#A0A0A0] text-sm disabled:opacity-50 hover:bg-[#2A2A2A] transition-colors"
                  >
                    首页
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-[#222222] border border-[#3A3A3A] rounded text-[#A0A0A0] text-sm disabled:opacity-50 hover:bg-[#2A2A2A] transition-colors"
                  >
                    上一页
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'px-3 py-1.5 rounded text-sm transition-colors',
                          currentPage === page
                            ? 'bg-[#0078D4] text-white'
                            : 'bg-[#222222] border border-[#3A3A3A] text-[#A0A0A0] hover:bg-[#2A2A2A]'
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-[#222222] border border-[#3A3A3A] rounded text-[#A0A0A0] text-sm disabled:opacity-50 hover:bg-[#2A2A2A] transition-colors"
                  >
                    下一页
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-[#222222] border border-[#3A3A3A] rounded text-[#A0A0A0] text-sm disabled:opacity-50 hover:bg-[#2A2A2A] transition-colors"
                  >
                    末页
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 商户详情弹窗 */}
        {selectedMerchant && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedMerchant(null)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[600px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-[#0078D4]/10">
                      <Building2 className="w-6 h-6 text-[#0078D4]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#E5E5E5]">{selectedMerchant.name}</h2>
                      <p className="text-[#A0A0A0] text-sm">{selectedMerchant.use_type || '未知业态'} - {selectedMerchant.district}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-3 py-1 rounded text-sm font-medium',
                    riskConfig[selectedMerchant.risk_level as keyof typeof riskConfig]?.bg || 'bg-[#6C6C6C]/10',
                    riskConfig[selectedMerchant.risk_level as keyof typeof riskConfig]?.color || 'text-[#6C6C6C]'
                  )}>
                    {riskConfig[selectedMerchant.risk_level as keyof typeof riskConfig]?.label || '未知'}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">门店编号</p>
                    <p className="text-[#E5E5E5] font-mono">{selectedMerchant.name}</p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">业态类型</p>
                    <p className="text-[#E5E5E5]">{selectedMerchant.use_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">探测器数量</p>
                    <p className="text-[#E5E5E5]">{selectedMerchant.detector_count || 0} 台</p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">人员密度评级</p>
                    <p className="text-[#E5E5E5]">{selectedMerchant.density_level || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">夜间营业</p>
                    <p className={cn('font-medium', selectedMerchant.night_open ? 'text-[#FF9800]' : 'text-[#4CAF50]')}>
                      {selectedMerchant.night_open ? '是' : '否'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">明火经营</p>
                    <p className={cn('font-medium', selectedMerchant.open_fire ? 'text-[#D32F2F]' : 'text-[#4CAF50]')}>
                      {selectedMerchant.open_fire ? '是' : '否'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">所属区域</p>
                    <p className="text-[#E5E5E5]">{selectedMerchant.district}</p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">探测器安装</p>
                    <p className={cn('font-medium', selectedMerchant.has_detector ? 'text-[#4CAF50]' : 'text-[#D32F2F]')}>
                      {selectedMerchant.has_detector ? '已安装' : '未安装'}
                    </p>
                  </div>
                </div>

                {/* 风险评估 */}
                <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                  <h3 className="text-[#E5E5E5] font-medium mb-3">风险评估</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[#A0A0A0] text-sm">风险等级</span>
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        riskConfig[selectedMerchant.risk_level as keyof typeof riskConfig]?.bg || 'bg-[#6C6C6C]/10',
                        riskConfig[selectedMerchant.risk_level as keyof typeof riskConfig]?.color || 'text-[#6C6C6C]'
                      )}>
                        {riskConfig[selectedMerchant.risk_level as keyof typeof riskConfig]?.label || '未评级'}
                      </span>
                    </div>
                    {selectedMerchant.open_fire && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#A0A0A0] text-sm flex items-center gap-1">
                          <Flame className="w-4 h-4 text-[#FF9800]" /> 明火风险
                        </span>
                        <span className="text-[#FF9800] text-sm">高</span>
                      </div>
                    )}
                    {selectedMerchant.night_open && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#A0A0A0] text-sm">夜间营业风险</span>
                        <span className="text-[#FF9800] text-sm">需重点监控</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 设备状态 */}
                <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                  <h3 className="text-[#E5E5E5] font-medium mb-3">关联设备</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#4CAF50]" />
                      <div>
                        <p className="text-[#A0A0A0] text-xs">探测器数量</p>
                        <p className="text-[#E5E5E5]">{selectedMerchant.detector_count || 0} 台</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#4CAF50]" />
                      <div>
                        <p className="text-[#A0A0A0] text-xs">在线状态</p>
                        <p className="text-[#4CAF50]">{selectedMerchant.has_detector ? '正常' : '未安装'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button onClick={() => setSelectedMerchant(null)} className="px-4 py-2 bg-[#222222] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors">
                  关闭
                </button>
                <button 
                  onClick={() => {
                    setEditingMerchant(selectedMerchant);
                    setEditForm({
                      name: selectedMerchant.name,
                      use_type: selectedMerchant.use_type || '',
                      district: selectedMerchant.district || '',
                      risk_level: selectedMerchant.risk_level || 'unrated',
                      has_detector: selectedMerchant.has_detector || false,
                      detector_count: selectedMerchant.detector_count || 0,
                      night_open: selectedMerchant.night_open || false,
                      open_fire: selectedMerchant.open_fire || false,
                      density_level: selectedMerchant.density_level || '',
                    });
                    setSelectedMerchant(null);
                  }}
                  className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors"
                >
                  编辑信息
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑商户弹窗 */}
        {editingMerchant && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setEditingMerchant(null)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[500px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D] flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#E5E5E5]">编辑商户信息</h2>
                <button 
                  onClick={() => setEditingMerchant(null)}
                  className="p-1 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-2">门店编号</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-2">业态类型</label>
                    <select
                      value={editForm.use_type}
                      onChange={(e) => setEditForm({ ...editForm, use_type: e.target.value })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    >
                      <option value="">请选择</option>
                      <option value="餐饮">餐饮</option>
                      <option value="超市">超市</option>
                      <option value="服装">服装</option>
                      <option value="娱乐">娱乐</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-2">区域</label>
                    <select
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    >
                      <option value="">请选择</option>
                      <option value="A区">A区</option>
                      <option value="B区">B区</option>
                      <option value="C区">C区</option>
                      <option value="D区">D区</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-2">风险等级</label>
                    <select
                      value={editForm.risk_level}
                      onChange={(e) => setEditForm({ ...editForm, risk_level: e.target.value })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    >
                      <option value="unrated">未评级</option>
                      <option value="low">低风险</option>
                      <option value="medium">中风险</option>
                      <option value="high">高风险</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-2">人员密度</label>
                    <select
                      value={editForm.density_level}
                      onChange={(e) => setEditForm({ ...editForm, density_level: e.target.value })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    >
                      <option value="">请选择</option>
                      <option value="低密级">低密级</option>
                      <option value="中密级">中密级</option>
                      <option value="高密级">高密级</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-xs mb-2">探测器数量</label>
                    <input
                      type="number"
                      value={editForm.detector_count}
                      onChange={(e) => setEditForm({ ...editForm, detector_count: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between p-3 bg-[#222222] rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors">
                    <div>
                      <p className="text-[#E5E5E5] text-sm">探测器安装</p>
                      <p className="text-[#6C6C6C] text-xs">是否已安装可燃气体探测器</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editForm.has_detector}
                      onChange={(e) => setEditForm({ ...editForm, has_detector: e.target.checked })}
                      className="w-4 h-4 rounded border-[#3A3A3A] bg-[#222222] text-[#0078D4] focus:ring-[#0078D4]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-[#222222] rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors">
                    <div>
                      <p className="text-[#E5E5E5] text-sm">夜间营业</p>
                      <p className="text-[#6C6C6C] text-xs">是否在夜间营业</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editForm.night_open}
                      onChange={(e) => setEditForm({ ...editForm, night_open: e.target.checked })}
                      className="w-4 h-4 rounded border-[#3A3A3A] bg-[#222222] text-[#0078D4] focus:ring-[#0078D4]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-[#222222] rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors">
                    <div>
                      <p className="text-[#E5E5E5] text-sm">明火经营</p>
                      <p className="text-[#6C6C6C] text-xs">是否使用明火进行经营活动</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editForm.open_fire}
                      onChange={(e) => setEditForm({ ...editForm, open_fire: e.target.checked })}
                      className="w-4 h-4 rounded border-[#3A3A3A] bg-[#222222] text-[#0078D4] focus:ring-[#0078D4]"
                    />
                  </label>
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setEditingMerchant(null)}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const res = await fetch(`/api/customers/${editingMerchant.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(editForm),
                      });
                      if (res.ok) {
                        setMerchants(prev => prev.map(m => m.id === editingMerchant.id ? { ...m, ...editForm } : m));
                        setEditingMerchant(null);
                      }
                    } catch (error) {
                      console.error('保存失败:', error);
                    } finally {
                      setSaving(false);
                    }
                  }}
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
