'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Search, Filter, AlertTriangle, Building2, MapPin,
  Flame, Wind, Users, Radio, Eye, Edit, TrendingUp
} from 'lucide-react';

// 商户风险评估数据
const mockRiskAssessments = [
  { id: 1, code: 'A001', name: '串串香火锅', category: '餐饮', area: 'A区', riskLevel: 'high', riskScore: 85, factors: { fireLoad: 90, ignition: 75, density: 85, evacuation: 60 }, hasGas: true, hasDetector: true, hasFireSystem: false },
  { id: 2, code: 'A002', name: '重庆火锅', category: '餐饮', area: 'A区', riskLevel: 'high', riskScore: 78, factors: { fireLoad: 80, ignition: 70, density: 80, evacuation: 65 }, hasGas: true, hasDetector: true, hasFireSystem: true },
  { id: 3, code: 'B001', name: '烧烤专门店', category: '餐饮', area: 'B区', riskLevel: 'high', riskScore: 72, factors: { fireLoad: 75, ignition: 85, density: 55, evacuation: 70 }, hasGas: true, hasDetector: true, hasFireSystem: false },
  { id: 4, code: 'B002', name: '川菜馆', category: '餐饮', area: 'B区', riskLevel: 'medium', riskScore: 55, factors: { fireLoad: 60, ignition: 55, density: 50, evacuation: 75 }, hasGas: true, hasDetector: true, hasFireSystem: true },
  { id: 5, code: 'C001', name: '永辉超市', category: '超市', area: 'C区', riskLevel: 'medium', riskScore: 48, factors: { fireLoad: 45, ignition: 40, density: 65, evacuation: 80 }, hasGas: false, hasDetector: true, hasFireSystem: true },
  { id: 6, code: 'D001', name: '星巴克咖啡', category: '餐饮', area: 'D区', riskLevel: 'low', riskScore: 28, factors: { fireLoad: 25, ignition: 30, density: 40, evacuation: 85 }, hasGas: false, hasDetector: true, hasFireSystem: true },
  { id: 7, code: 'D002', name: '麦当劳', category: '餐饮', area: 'D区', riskLevel: 'medium', riskScore: 52, factors: { fireLoad: 55, ignition: 45, density: 75, evacuation: 70 }, hasGas: false, hasDetector: true, hasFireSystem: true },
  { id: 8, code: 'E001', name: 'KTV娱乐', category: '娱乐', area: 'E区', riskLevel: 'high', riskScore: 68, factors: { fireLoad: 60, ignition: 50, density: 90, evacuation: 55 }, hasGas: false, hasDetector: true, hasFireSystem: true },
  { id: 9, code: 'F001', name: '药店', category: '药店', area: 'F区', riskLevel: 'low', riskScore: 22, factors: { fireLoad: 20, ignition: 25, density: 25, evacuation: 90 }, hasGas: false, hasDetector: true, hasFireSystem: true },
  { id: 10, code: 'G001', name: '理发店', category: '理发店', area: 'G区', riskLevel: 'low', riskScore: 18, factors: { fireLoad: 15, ignition: 20, density: 20, evacuation: 92 }, hasGas: false, hasDetector: false, hasFireSystem: true },
];

// 风险因素说明
const riskFactors = [
  { key: 'fireLoad', name: '火灾荷载', icon: <Flame className="w-4 h-4" />, desc: '可燃物数量与分布密度' },
  { key: 'ignition', name: '点火源', icon: <AlertTriangle className="w-4 h-4" />, desc: '明火/电火花风险等级' },
  { key: 'density', name: '人员密度', icon: <Users className="w-4 h-4" />, desc: '场所人员密集程度' },
  { key: 'evacuation', name: '疏散难度', icon: <MapPin className="w-4 h-4" />, desc: '逃生路径复杂度' },
];

export default function RiskLevelPage() {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<typeof mockRiskAssessments[0] | null>(null);

  // 过滤数据
  const filteredData = mockRiskAssessments.filter(item => {
    const matchLevel = filterLevel === 'all' || item.riskLevel === filterLevel;
    const matchArea = filterArea === 'all' || item.area === filterArea;
    const matchSearch = item.name.includes(searchTerm) || item.code.includes(searchTerm);
    return matchLevel && matchArea && matchSearch;
  });

  // 统计
  const stats = {
    total: mockRiskAssessments.length,
    high: mockRiskAssessments.filter(m => m.riskLevel === 'high').length,
    medium: mockRiskAssessments.filter(m => m.riskLevel === 'medium').length,
    low: mockRiskAssessments.filter(m => m.riskLevel === 'low').length,
  };

  // 风险等级配置
  const riskConfig = {
    high: { label: '高风险', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10', border: 'border-[#D32F2F]/30', bar: 'bg-[#D32F2F]' },
    medium: { label: '中风险', color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10', border: 'border-[#FF9800]/30', bar: 'bg-[#FF9800]' },
    low: { label: '低风险', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', border: 'border-[#4CAF50]/30', bar: 'bg-[#4CAF50]' },
  };

  // 获取唯一区域列表
  const areas = [...new Set(mockRiskAssessments.map(m => m.area))];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E5E5E5]">商户风险分级</h1>
            <p className="text-[#A0A0A0] text-sm mt-1">基于四维评估模型的风险等级划分</p>
          </div>
        </div>

        {/* 统计概览 */}
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
                <p className="text-[#A0A0A0] text-sm">高风险</p>
                <p className="text-2xl font-bold text-[#D32F2F]">{stats.high}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#FF9800]/10">
                <TrendingUp className="w-5 h-5 text-[#FF9800]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">中风险</p>
                <p className="text-2xl font-bold text-[#FF9800]">{stats.medium}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#4CAF50]/10">
                <Building2 className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">低风险</p>
                <p className="text-2xl font-bold text-[#4CAF50]">{stats.low}</p>
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
                  placeholder="搜索商户名称或编号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#A0A0A0] text-sm">风险等级:</span>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                <option value="all">全部</option>
                <option value="high">高风险</option>
                <option value="medium">中风险</option>
                <option value="low">低风险</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#A0A0A0] text-sm">区域:</span>
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                <option value="all">全部区域</option>
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 风险卡片列表 */}
        <div className="grid grid-cols-3 gap-4">
          {filteredData.map((item) => {
            const config = riskConfig[item.riskLevel as keyof typeof riskConfig];
            return (
              <div
                key={item.id}
                className={cn(
                  'bg-[#1E1E1E] rounded-lg border p-5 cursor-pointer transition-all hover:scale-[1.02]',
                  config.border
                )}
                onClick={() => setSelectedMerchant(item)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', config.bg)}>
                      <Building2 className={cn('w-5 h-5', config.color)} />
                    </div>
                    <div>
                      <h3 className="text-[#E5E5E5] font-medium">{item.name}</h3>
                      <p className="text-[#6C6C6C] text-xs">{item.code} | {item.category}</p>
                    </div>
                  </div>
                  <span className={cn('px-2 py-1 rounded text-xs font-medium', config.bg, config.color)}>
                    {config.label}
                  </span>
                </div>

                {/* 风险评分条 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#A0A0A0]">风险评分</span>
                    <span className={cn('font-bold', config.color)}>{item.riskScore}分</span>
                  </div>
                  <div className="h-2 bg-[#2D2D2D] rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', config.bar)}
                      style={{ width: `${item.riskScore}%` }}
                    />
                  </div>
                </div>

                {/* 安全配置状态 */}
                <div className="flex items-center gap-3 text-xs">
                  <span className={cn('flex items-center gap-1', item.hasGas ? 'text-[#4CAF50]' : 'text-[#6C6C6C]')}>
                    <Wind className="w-3 h-3" />
                    燃气{item.hasGas ? '有' : '无'}
                  </span>
                  <span className={cn('flex items-center gap-1', item.hasDetector ? 'text-[#4CAF50]' : 'text-[#6C6C6C]')}>
                    <Radio className="w-3 h-3" />
                    探测器{item.hasDetector ? '有' : '无'}
                  </span>
                  <span className={cn('flex items-center gap-1', item.hasFireSystem ? 'text-[#4CAF50]' : 'text-[#6C6C6C]')}>
                    <Flame className="w-3 h-3" />
                    消防{item.hasFireSystem ? '有' : '无'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 风险详情弹窗 */}
        {selectedMerchant && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedMerchant(null)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[700px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-3 rounded-lg', riskConfig[selectedMerchant.riskLevel as keyof typeof riskConfig].bg)}>
                      <Building2 className={cn('w-6 h-6', riskConfig[selectedMerchant.riskLevel as keyof typeof riskConfig].color)} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#E5E5E5]">{selectedMerchant.name}</h2>
                      <p className="text-[#6C6C6C] text-sm">{selectedMerchant.code} | {selectedMerchant.category} | {selectedMerchant.area}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-3 py-1.5 rounded text-sm font-medium',
                    riskConfig[selectedMerchant.riskLevel as keyof typeof riskConfig].bg,
                    riskConfig[selectedMerchant.riskLevel as keyof typeof riskConfig].color
                  )}>
                    {riskConfig[selectedMerchant.riskLevel as keyof typeof riskConfig].label}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* 四维风险评估 */}
                <div>
                  <h3 className="text-[#E5E5E5] font-semibold mb-4">四维风险评估</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {riskFactors.map((factor) => {
                      const score = selectedMerchant.factors[factor.key as keyof typeof selectedMerchant.factors];
                      return (
                        <div key={factor.key} className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={cn(
                              'p-2 rounded-lg',
                              score >= 70 ? 'bg-[#D32F2F]/10' : score >= 50 ? 'bg-[#FF9800]/10' : 'bg-[#4CAF50]/10'
                            )}>
                              <div className={cn(
                                'w-4 h-4',
                                score >= 70 ? 'text-[#D32F2F]' : score >= 50 ? 'text-[#FF9800]' : 'text-[#4CAF50]'
                              )}>
                                {factor.icon}
                              </div>
                            </div>
                            <div>
                              <p className="text-[#E5E5E5] font-medium text-sm">{factor.name}</p>
                              <p className="text-[#6C6C6C] text-xs">{factor.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-end gap-2">
                            <span className={cn(
                              'text-3xl font-bold',
                              score >= 70 ? 'text-[#D32F2F]' : score >= 50 ? 'text-[#FF9800]' : 'text-[#4CAF50]'
                            )}>
                              {score}
                            </span>
                            <span className="text-[#6C6C6C] text-sm mb-1">分</span>
                          </div>
                          <div className="h-2 bg-[#2D2D2D] rounded-full mt-2 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                score >= 70 ? 'bg-[#D32F2F]' : score >= 50 ? 'bg-[#FF9800]' : 'bg-[#4CAF50]'
                              )}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 安全配置 */}
                <div>
                  <h3 className="text-[#E5E5E5] font-semibold mb-4">安全设施配置</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className={cn(
                      'p-4 rounded-lg border text-center',
                      selectedMerchant.hasGas ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30' : 'bg-[#D32F2F]/10 border-[#D32F2F]/30'
                    )}>
                      <Wind className={cn('w-6 h-6 mx-auto mb-2', selectedMerchant.hasGas ? 'text-[#4CAF50]' : 'text-[#D32F2F]')} />
                      <p className="text-[#E5E5E5] text-sm font-medium">燃气设备</p>
                      <p className={cn('text-xs mt-1', selectedMerchant.hasGas ? 'text-[#4CAF50]' : 'text-[#D32F2F]')}>
                        {selectedMerchant.hasGas ? '已配置' : '未配置'}
                      </p>
                    </div>
                    <div className={cn(
                      'p-4 rounded-lg border text-center',
                      selectedMerchant.hasDetector ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30' : 'bg-[#D32F2F]/10 border-[#D32F2F]/30'
                    )}>
                      <Radio className={cn('w-6 h-6 mx-auto mb-2', selectedMerchant.hasDetector ? 'text-[#4CAF50]' : 'text-[#D32F2F]')} />
                      <p className="text-[#E5E5E5] text-sm font-medium">可燃气体探测器</p>
                      <p className={cn('text-xs mt-1', selectedMerchant.hasDetector ? 'text-[#4CAF50]' : 'text-[#D32F2F]')}>
                        {selectedMerchant.hasDetector ? '已安装' : '未安装'}
                      </p>
                    </div>
                    <div className={cn(
                      'p-4 rounded-lg border text-center',
                      selectedMerchant.hasFireSystem ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30' : 'bg-[#D32F2F]/10 border-[#D32F2F]/30'
                    )}>
                      <Flame className={cn('w-6 h-6 mx-auto mb-2', selectedMerchant.hasFireSystem ? 'text-[#4CAF50]' : 'text-[#D32F2F]')} />
                      <p className="text-[#E5E5E5] text-sm font-medium">火灾报警系统</p>
                      <p className={cn('text-xs mt-1', selectedMerchant.hasFireSystem ? 'text-[#4CAF50]' : 'text-[#D32F2F]')}>
                        {selectedMerchant.hasFireSystem ? '已配置' : '未配置'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setSelectedMerchant(null)}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                >
                  关闭
                </button>
                <button className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors">
                  查看整改方案
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
