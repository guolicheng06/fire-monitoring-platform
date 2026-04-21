'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { AIAssistant } from '@/components/ai-assistant/ai-assistant';
import { cn } from '@/lib/utils';
import {
  MessageSquare, Brain, TrendingUp, AlertTriangle, CheckCircle,
  Building2, Radio, Flame, Wind, FileText, Download,
  ChevronRight, ChevronDown, Loader2, Send, RefreshCw,
  Shield, Users, Clock, MapPin
} from 'lucide-react';

// AI评估结果数据
const mockAssessments = [
  {
    id: 1,
    merchant: '串串香火锅',
    code: 'A001',
    location: 'A区 - 1楼后厨',
    overallRisk: 'high',
    scores: { fireLoad: 85, ignition: 72, density: 90, evacuation: 65 },
    recommendations: ['建议增加燃气报警器灵敏度', '优化后厨通风系统', '加强员工安全培训'],
    status: 'pending',
    lastUpdate: '2026-04-10 09:30',
  },
  {
    id: 2,
    merchant: '重庆火锅',
    code: 'A002',
    location: 'A区 - 2楼',
    overallRisk: 'high',
    scores: { fireLoad: 78, ignition: 68, density: 85, evacuation: 70 },
    recommendations: ['定期检查燃气管道', '增设应急疏散指示', '优化排烟系统'],
    status: 'completed',
    lastUpdate: '2026-04-09 15:20',
  },
  {
    id: 3,
    merchant: '烧烤专门店',
    code: 'B001',
    location: 'B区 - 1楼',
    overallRisk: 'medium',
    scores: { fireLoad: 65, ignition: 80, density: 55, evacuation: 75 },
    recommendations: ['规范炭火管理流程', '完善灭火器配置'],
    status: 'completed',
    lastUpdate: '2026-04-08 11:45',
  },
];

// 风险维度说明
const riskDimensions = [
  { key: 'fireLoad', name: '火灾荷载', icon: <Flame className="w-5 h-5" />, desc: '可燃物数量与分布' },
  { key: 'ignition', name: '点火源', icon: <AlertTriangle className="w-5 h-5" />, desc: '明火/电火花风险' },
  { key: 'density', name: '人员密度', icon: <Users className="w-5 h-5" />, desc: '场所人员密集程度' },
  { key: 'evacuation', name: '疏散难度', icon: <MapPin className="w-5 h-5" />, desc: '逃生路径复杂度' },
];

// 一铺一策四步法
const assessmentSteps = [
  { step: 1, name: '基础信息采集', desc: '商户基本信息、业态类型、面积、层高等' },
  { step: 2, name: '四维风险评估', desc: '火灾荷载、点火源、人员密度、疏散难度' },
  { step: 3, name: '规范符合性诊断', desc: '对照消防规范进行符合性检查' },
  { step: 4, name: '改造方案定制', desc: '基于评估结果生成个性化整改方案' },
];

export default function AIRiskPage() {
  const [selectedAssessment, setSelectedAssessment] = useState<typeof mockAssessments[0] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  // 模拟AI分析过程
  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  // 发送AI消息
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setAiMessages([...aiMessages, { role: 'user', content: inputMessage }]);
    setInputMessage('');
    // 模拟AI回复
    setTimeout(() => {
      setAiMessages(prev => [...prev, {
        role: 'ai',
        content: '根据当前平台数据分析，串串香火锅的风险指数较高，建议重点关注后厨燃气管道和通风系统。建议安排一次专项检查。'
      }]);
    }, 1500);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E5E5E5]">AI风险评估</h1>
            <p className="text-[#A0A0A0] text-sm mt-1">基于&quot;一铺一策&quot;四步法的智能风险评估</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors">
              <Download className="w-4 h-4" />
              导出报告
            </button>
            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-[#9C27B0] rounded-lg text-white hover:bg-[#7B1FA2] transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  启动AI评估
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI分析进度 */}
        {isAnalyzing && (
          <div className="bg-[#1E1E1E] rounded-lg p-5 border border-[#2D2D2D]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#9C27B0]/10">
                  <Brain className="w-5 h-5 text-[#9C27B0]" />
                </div>
                <div>
                  <p className="text-[#E5E5E5] font-medium">AI风险评估进行中</p>
                  <p className="text-[#6C6C6C] text-xs">正在分析商户消防安全数据...</p>
                </div>
              </div>
              <span className="text-[#9C27B0] font-mono text-lg">{analysisProgress}%</span>
            </div>
            <div className="h-2 bg-[#2D2D2D] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#9C27B0] to-[#E91E63] rounded-full transition-all duration-500"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {assessmentSteps.map(step => (
                <div key={step.step} className="text-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center',
                    analysisProgress >= step.step * 25
                      ? 'bg-[#9C27B0] text-white'
                      : 'bg-[#2D2D2D] text-[#6C6C6C]'
                  )}>
                    {analysisProgress >= step.step * 25 ? <CheckCircle className="w-4 h-4" /> : step.step}
                  </div>
                  <p className="text-[#E5E5E5] text-xs font-medium">{step.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 主体内容 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧 - 评估列表 */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* 评估步骤说明 */}
            <div className="bg-[#1E1E1E] rounded-lg p-5 border border-[#2D2D2D]">
              <h3 className="text-[#E5E5E5] font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#9C27B0]" />
                一铺一策四步法
              </h3>
              <div className="space-y-3">
                {assessmentSteps.map(step => (
                  <div key={step.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#9C27B0]/10 text-[#9C27B0] flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    <div>
                      <p className="text-[#E5E5E5] text-sm font-medium">{step.name}</p>
                      <p className="text-[#6C6C6C] text-xs">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 商户评估列表 */}
            <div className="bg-[#1E1E1E] rounded-lg p-5 border border-[#2D2D2D]">
              <h3 className="text-[#E5E5E5] font-semibold mb-4">风险评估结果</h3>
              <div className="space-y-3">
                {mockAssessments.map(assessment => (
                  <div
                    key={assessment.id}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-all',
                      selectedAssessment?.id === assessment.id
                        ? 'bg-[#9C27B0]/10 border-[#9C27B0]/30'
                        : 'bg-[#222222] border-[#3A3A3A] hover:border-[#9C27B0]/30'
                    )}
                    onClick={() => setSelectedAssessment(assessment)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#0078D4]" />
                        <span className="text-[#E5E5E5] font-medium text-sm">{assessment.merchant}</span>
                      </div>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        assessment.overallRisk === 'high'
                          ? 'bg-[#D32F2F]/10 text-[#D32F2F]'
                          : 'bg-[#FF9800]/10 text-[#FF9800]'
                      )}>
                        {assessment.overallRisk === 'high' ? '高风险' : '中风险'}
                      </span>
                    </div>
                    <p className="text-[#6C6C6C] text-xs">{assessment.location}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-[#A0A0A0]">
                      <span>更新时间: {assessment.lastUpdate}</span>
                      <span className={cn(
                        assessment.status === 'completed' ? 'text-[#4CAF50]' : 'text-[#FF9800]'
                      )}>
                        {assessment.status === 'completed' ? '已完成' : '待处理'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧 - 评估详情 */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {selectedAssessment ? (
              <>
                {/* 概览 */}
                <div className="bg-[#1E1E1E] rounded-lg p-5 border border-[#2D2D2D]">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-[#E5E5E5]">{selectedAssessment.merchant}</h2>
                      <p className="text-[#6C6C6C] text-sm mt-1">
                        {selectedAssessment.code} | {selectedAssessment.location}
                      </p>
                    </div>
                    <span className={cn(
                      'px-3 py-1.5 rounded text-sm font-medium',
                      selectedAssessment.overallRisk === 'high'
                        ? 'bg-[#D32F2F]/10 text-[#D32F2F]'
                        : 'bg-[#FF9800]/10 text-[#FF9800]'
                    )}>
                      {selectedAssessment.overallRisk === 'high' ? '高风险' : '中风险'}
                    </span>
                  </div>

                  {/* 四维雷达图 */}
                  <div className="grid grid-cols-4 gap-4">
                    {riskDimensions.map(dim => {
                      const score = selectedAssessment.scores[dim.key as keyof typeof selectedAssessment.scores];
                      return (
                        <div key={dim.key} className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={cn(
                              'p-2 rounded-lg',
                              score >= 70 ? 'bg-[#D32F2F]/10' : score >= 50 ? 'bg-[#FF9800]/10' : 'bg-[#4CAF50]/10'
                            )}>
                              <div className={cn(
                                'w-4 h-4',
                                score >= 70 ? 'text-[#D32F2F]' : score >= 50 ? 'text-[#FF9800]' : 'text-[#4CAF50]'
                              )}>
                                {dim.icon}
                              </div>
                            </div>
                          </div>
                          <p className="text-[#A0A0A0] text-xs mb-1">{dim.name}</p>
                          <p className="text-[#6C6C6C] text-xs mb-2">{dim.desc}</p>
                          <div className="flex items-end gap-2">
                            <span className={cn(
                              'text-2xl font-bold',
                              score >= 70 ? 'text-[#D32F2F]' : score >= 50 ? 'text-[#FF9800]' : 'text-[#4CAF50]'
                            )}>
                              {score}
                            </span>
                            <span className="text-[#6C6C6C] text-sm mb-1">分</span>
                          </div>
                          <div className="h-1.5 bg-[#2D2D2D] rounded-full mt-2 overflow-hidden">
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

                {/* 改造建议 */}
                <div className="bg-[#1E1E1E] rounded-lg p-5 border border-[#2D2D2D]">
                  <h3 className="text-[#E5E5E5] font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#FF9800]" />
                    AI改造建议
                  </h3>
                  <div className="space-y-3">
                    {selectedAssessment.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-[#222222] rounded-lg border border-[#3A3A3A]">
                        <div className="w-6 h-6 rounded-full bg-[#FF9800]/10 text-[#FF9800] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-[#E5E5E5] text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      setAiMessages(prev => [...prev, { 
                        role: 'user', 
                        content: `请为${selectedAssessment.merchant}生成完整的消防安全整改方案，包括：\n1. 风险分析\n2. 整改措施\n3. 实施计划\n4. 预算估算` 
                      }]);
                      setTimeout(() => {
                        setAiMessages(prev => [...prev, {
                          role: 'ai',
                          content: `【${selectedAssessment.merchant}】完整消防安全整改方案\n\n📋 一、风险分析\n根据四维风险评估，该商户存在以下主要风险：\n• 火灾荷载：${selectedAssessment.scores.fireLoad}分（较高）\n• 点火源：${selectedAssessment.scores.ignition}分（中等）\n• 人员密度：${selectedAssessment.scores.density}分（高）\n• 疏散难度：${selectedAssessment.scores.evacuation}分（中等）\n\n🔧 二、整改措施\n${selectedAssessment.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n📅 三、实施计划\n• 第一阶段（1-7天）：现场勘查与方案细化\n• 第二阶段（8-30天）：设备采购与安装\n• 第三阶段（31-60天）：人员培训与演练\n\n💰 四、预算估算\n• 设备升级：约3-5万元\n• 系统改造：约2-3万元\n• 培训演练：约0.5万元\n• 总计：约5.5-8.5万元\n\n建议优先处理高风险项目，确保在30天内完成主要整改工作。`
                        }]);
                      }, 1500);
                    }}
                    className="w-full mt-4 py-3 bg-[#9C27B0]/10 text-[#9C27B0] rounded-lg text-sm hover:bg-[#9C27B0]/20 transition-colors"
                  >
                    生成完整整改方案
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-[#1E1E1E] rounded-lg p-10 border border-[#2D2D2D] text-center">
                <Shield className="w-16 h-16 text-[#6C6C6C] mx-auto mb-4 opacity-50" />
                <p className="text-[#A0A0A0]">请从左侧选择一个商户查看AI风险评估详情</p>
              </div>
            )}

            {/* AI对话 */}
            <div className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D] overflow-hidden">
              <div className="p-4 border-b border-[#2D2D2D] bg-[#1E1E1E]">
                <h3 className="text-[#E5E5E5] font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#0078D4]" />
                  AI智能助手
                </h3>
              </div>
              {/* 消息列表 */}
              <div className="h-64 overflow-y-auto p-4 space-y-4">
                {aiMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-[#6C6C6C] mx-auto mb-3 opacity-50" />
                    <p className="text-[#A0A0A0] text-sm">发送消息与AI助手对话，获取消防安全建议</p>
                  </div>
                ) : (
                  aiMessages.map((msg, idx) => (
                    <div key={idx} className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}>
                      <div className={cn(
                        'max-w-[80%] rounded-lg p-3',
                        msg.role === 'user'
                          ? 'bg-[#0078D4] text-white'
                          : 'bg-[#222222] border border-[#3A3A3A]'
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* 输入框 */}
              <div className="p-4 border-t border-[#2D2D2D]">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="输入您的问题..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI助手组件 */}
      <AIAssistant />
    </AppShell>
  );
}
