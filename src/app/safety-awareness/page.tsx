'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  AlertTriangle, 
  Map, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Home,
  Bell,
  Lightbulb,
  ChevronLeft,
  ArrowLeft,
  Search,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppShell } from '@/components/app-shell';
import { 
  knowledgeBase, 
  categoryNames, 
  escapeGuides, 
  fireCases, 
  hazardCheckList, 
  dailyTips,
  getTodayTip,
  type KnowledgeCategory,
  type KnowledgeItem
} from '@/lib/safety-knowledge';

// Tab类型
type TabType = 'home' | 'knowledge' | 'escape' | 'cases' | 'check' | 'tips';

// 分类图标
const CategoryIcon = ({ category }: { category: KnowledgeCategory }) => {
  const icons: Record<KnowledgeCategory, React.ReactNode> = {
    fire_prevention: <span className="text-red-400">🔥</span>,
    fire_extinguisher: <span className="text-orange-400">🛡️</span>,
    escape: <span className="text-green-400">🏃</span>,
    electricity: <span className="text-yellow-400">⚡</span>,
    gas: <span className="text-blue-400">💧</span>,
    daily: <span className="text-purple-400">🏠</span>,
    law: <span className="text-gray-400">📋</span>,
    cargo: <span className="text-amber-400">📦</span>,
    electrical: <span className="text-cyan-400">🔌</span>,
    highrise: <span className="text-pink-400">🏢</span>
  };
  return <span className="text-2xl">{icons[category]}</span>;
};

// Tab 映射 - 同时支持菜单ID和tab值
const tabIdMap: Record<string, TabType> = {
  // 从菜单ID映射
  'safety-overview': 'home',
  'safety-awareness': 'home',
  'safety-knowledge': 'knowledge',
  'safety-escape': 'escape',
  'safety-cases': 'cases',
  'safety-check': 'check',
  'safety-tips': 'tips',
  // 从tab值映射
  'home': 'home',
  'knowledge': 'knowledge',
  'escape': 'escape',
  'cases': 'cases',
  'check': 'check',
  'tips': 'tips'
};

function SafetyAwarenessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeItem | null>(null);
  const [checkResults, setCheckResults] = useState<Record<string, number>>({});
  const [selectedCase, setSelectedCase] = useState<typeof fireCases[0] | null>(null);
  const [selectedEscapeGuide, setSelectedEscapeGuide] = useState<typeof escapeGuides[0] | null>(null);
  const [todayTip, setTodayTip] = useState<typeof dailyTips[0] | null>(null);

  useEffect(() => {
    setTodayTip(getTodayTip());
  }, []);

  // 根据 URL 参数切换 Tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabIdMap[tab]) {
      setActiveTab(tabIdMap[tab]);
    } else {
      setActiveTab('home');
    }
  }, [searchParams]);

  // 处理 Tab 切换
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // 筛选知识
  const filteredKnowledge = knowledgeBase.filter(item => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // 计算自查总分
  const totalScore = Object.values(checkResults).reduce((sum, score) => sum + score, 0);
  const maxScore = hazardCheckList.length * 10;
  const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // 获取分数等级
  const getScoreLevel = () => {
    if (scorePercentage >= 90) return { level: '优秀', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (scorePercentage >= 70) return { level: '良好', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (scorePercentage >= 50) return { level: '一般', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { level: '较差', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const scoreLevel = getScoreLevel();

  const tabs = [
    { id: 'home' as const, label: '首页', icon: <Home className="w-4 h-4" /> },
    { id: 'knowledge' as const, label: '知识库', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'escape' as const, label: '逃生指南', icon: <Map className="w-4 h-4" /> },
    { id: 'cases' as const, label: '案例警示', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'check' as const, label: '隐患自查', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'tips' as const, label: '每日提示', icon: <Lightbulb className="w-4 h-4" /> },
  ];

  return (
    <div className="h-full bg-[#0A0A0A]">
      {/* 页面标题 */}
      <div className="border-b border-gray-800">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-medium text-white">消防安全意识</h1>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="p-6 overflow-auto" style={{ height: 'calc(100vh - 120px)' }}>
        {/* 主页内容 */}
        <div className="max-w-6xl mx-auto">
          {/* 首页 */}
          {activeTab === 'home' && (
          <div className="space-y-6">
            {/* 今日提示 */}
            {todayTip && (
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/30 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-orange-400 font-medium mb-1">今日消防安全提示</h3>
                    <p className="text-gray-200 text-lg mb-2">{todayTip.title}</p>
                    <p className="text-gray-400">{todayTip.content}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 功能入口 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleTabChange('knowledge')}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 hover:border-gray-600 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-medium text-white mb-1">消防安全知识</h3>
                <p className="text-sm text-gray-400">学习防火知识</p>
              </button>

              <button
                onClick={() => handleTabChange('escape')}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 hover:border-gray-600 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Map className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="font-medium text-white mb-1">逃生指南</h3>
                <p className="text-sm text-gray-400">掌握逃生技能</p>
              </button>

              <button
                onClick={() => handleTabChange('cases')}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 hover:border-gray-600 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="font-medium text-white mb-1">案例警示</h3>
                <p className="text-sm text-gray-400">吸取火灾教训</p>
              </button>

              <button
                onClick={() => handleTabChange('check')}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 hover:border-gray-600 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="font-medium text-white mb-1">隐患自查</h3>
                <p className="text-sm text-gray-400">排查身边隐患</p>
              </button>
            </div>

            {/* 重要知识 */}
            <div>
              <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                重要防火知识
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {knowledgeBase.filter(k => k.importance === 'high').slice(0, 4).map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedKnowledge(item)}
                    className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-left hover:bg-gray-800 hover:border-gray-600 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <CategoryIcon category={item.category} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white mb-1 truncate">{item.title}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{item.content}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 知识库 */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="搜索消防安全知识..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 分类筛选 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm transition-all',
                  selectedCategory === 'all'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
                )}
              >
                全部
              </button>
              {Object.entries(categoryNames).map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as KnowledgeCategory)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm transition-all',
                    selectedCategory === key
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
                  )}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* 知识列表 */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredKnowledge.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedKnowledge(item)}
                  className={cn(
                    'bg-gray-800/50 border rounded-xl p-4 text-left hover:bg-gray-800 transition-all',
                    item.importance === 'high' ? 'border-orange-500/30 hover:border-orange-500/50' : 'border-gray-700 hover:border-gray-600'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      item.importance === 'high' ? 'bg-orange-500/20' : 'bg-gray-700/50'
                    )}>
                      <CategoryIcon category={item.category} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white truncate">{item.title}</h3>
                        {item.importance === 'high' && (
                          <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">重要</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">{item.content}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-700/50 text-gray-500 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredKnowledge.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>没有找到相关知识</p>
              </div>
            )}
          </div>
        )}

        {/* 逃生指南 */}
        {activeTab === 'escape' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-medium text-white">逃生指南</h1>
              <span className="text-gray-500 text-sm">{escapeGuides.length} 个场景</span>
            </div>

            {selectedEscapeGuide ? (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedEscapeGuide(null)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  返回列表
                </button>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h2 className="text-xl font-medium text-white mb-2">{selectedEscapeGuide.title}</h2>
                  <p className="text-blue-400 mb-6">{selectedEscapeGuide.scenario}</p>

                  <div className="mb-6">
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm">✓</span>
                      逃生步骤
                    </h3>
                    <div className="space-y-3">
                      {selectedEscapeGuide.steps.map((step, index) => (
                        <div key={index} className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center text-sm flex-shrink-0">
                            {index + 1}
                          </span>
                          <p className="text-gray-300">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-sm">!</span>
                      注意事项
                    </h3>
                    <div className="space-y-2">
                      {selectedEscapeGuide.tips.map((tip, index) => (
                        <div key={index} className="flex gap-3 text-gray-400">
                          <span>•</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {escapeGuides.map(guide => (
                  <button
                    key={guide.id}
                    onClick={() => setSelectedEscapeGuide(guide)}
                    className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-left hover:bg-gray-800 hover:border-gray-600 transition-all"
                  >
                    <h3 className="font-medium text-white mb-2">{guide.title}</h3>
                    <p className="text-sm text-gray-400 mb-4">{guide.scenario}</p>
                    <div className="flex items-center gap-2 text-blue-400 text-sm">
                      查看详情
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 案例警示 */}
        {activeTab === 'cases' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-medium text-white">案例警示</h1>
              <span className="text-gray-500 text-sm">{fireCases.length} 个案例</span>
            </div>

            {selectedCase ? (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  返回列表
                </button>

                <div className="bg-gray-800/50 border border-red-500/30 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-medium text-white mb-1">{selectedCase.title}</h2>
                      <p className="text-gray-400 text-sm">{selectedCase.location} · {selectedCase.date}</p>
                    </div>
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-lg">警示案例</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-400">{selectedCase.casualties}</div>
                      <div className="text-xs text-gray-500">死亡人数</div>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-orange-400">{selectedCase.injured}</div>
                      <div className="text-xs text-gray-500">受伤人数</div>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-400">{selectedCase.loss}</div>
                      <div className="text-xs text-gray-500">损失情况</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-white font-medium mb-2">事故原因</h3>
                    <p className="text-gray-300 bg-gray-700/30 rounded-lg p-3">{selectedCase.cause}</p>
                  </div>

                  <div>
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                      教训启示
                    </h3>
                    <div className="space-y-2">
                      {selectedCase.lessons.map((lesson, index) => (
                        <div key={index} className="flex gap-3 text-gray-300 bg-orange-500/10 rounded-lg p-3">
                          <span className="text-orange-400">•</span>
                          <span>{lesson}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {fireCases.map(fireCase => (
                  <button
                    key={fireCase.id}
                    onClick={() => setSelectedCase(fireCase)}
                    className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-left hover:bg-gray-800 hover:border-red-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-white">{fireCase.title}</h3>
                      {fireCase.casualties > 0 && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                          {fireCase.casualties}人死亡
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{fireCase.location} · {fireCase.date}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{fireCase.lessons[0]}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 隐患自查 */}
        {activeTab === 'check' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-medium text-white">消防隐患自查</h1>
              {Object.keys(checkResults).length > 0 && (
                <button
                  onClick={() => {
                    setCheckResults({});
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  重置
                </button>
              )}
            </div>

            {/* 得分卡片 */}
            {Object.keys(checkResults).length > 0 && (
              <div className={cn('border rounded-xl p-6', scoreLevel.bg)}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-medium mb-1">自查结果</h3>
                    <p className="text-gray-400 text-sm">已回答 {Object.keys(checkResults).length}/{hazardCheckList.length} 题</p>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-3xl font-bold', scoreLevel.color)}>{scorePercentage}%</div>
                    <div className={cn('text-sm', scoreLevel.color)}>{scoreLevel.level}</div>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all', scorePercentage >= 70 ? 'bg-green-500' : scorePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500')}
                    style={{ width: `${scorePercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* 自查问题 */}
            <div className="space-y-4">
              {hazardCheckList.map((item, index) => {
                const currentResult = checkResults[item.id];
                const isAnswered = currentResult !== undefined;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'bg-gray-800/50 border rounded-xl p-4',
                      isAnswered ? 'border-blue-500/30' : 'border-gray-700'
                    )}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-6 h-6 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center text-sm flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.question}</p>
                        <p className="text-gray-500 text-sm mt-1">{item.category}</p>
                      </div>
                      {isAnswered && (
                        <span className={cn(
                          'px-2 py-0.5 text-xs rounded',
                          currentResult >= 7 ? 'bg-green-500/20 text-green-400' :
                          currentResult >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        )}>
                          {currentResult >= 7 ? '良好' : currentResult >= 4 ? '一般' : '需改进'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {item.options.map((option, optIndex) => (
                        <button
                          key={optIndex}
                          onClick={() => {
                            setCheckResults(prev => ({
                              ...prev,
                              [item.id]: option.score
                            }));
                          }}
                          className={cn(
                            'p-3 rounded-lg text-left text-sm transition-all',
                            currentResult === option.score
                              ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                              : 'bg-gray-700/30 border border-transparent text-gray-400 hover:bg-gray-700/50'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {isAnswered && (
                      <div className="mt-3 p-3 bg-gray-700/30 rounded-lg">
                        <p className="text-sm text-gray-400">
                          <span className="text-blue-400">建议：</span>
                          {item.options.find(o => o.score === currentResult)?.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 每日提示 */}
        {activeTab === 'tips' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-medium text-white">每日提示</h1>
              <span className="text-gray-500 text-sm">{dailyTips.length} 条提示</span>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">今日</span>
                    <span className="text-yellow-400 font-medium">{todayTip?.title}</span>
                  </div>
                  <p className="text-gray-300">{todayTip?.content}</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {dailyTips.map((tip, index) => (
                <div
                  key={tip.day}
                  className={cn(
                    'bg-gray-800/50 border rounded-xl p-4',
                    index === (new Date().getDate() % dailyTips.length)
                      ? 'border-yellow-500/30'
                      : 'border-gray-700'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      index === (new Date().getDate() % dailyTips.length)
                        ? 'bg-yellow-500/20'
                        : 'bg-gray-700/50'
                    )}>
                      <span className="text-lg">{tip.day <= 15 ? '🌙' : tip.day <= 20 ? '☀️' : '🔥'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-500 text-sm">第{tip.day}天</span>
                        {index === (new Date().getDate() % dailyTips.length) && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">今日</span>
                        )}
                      </div>
                      <h3 className="font-medium text-white mb-1">{tip.title}</h3>
                      <p className="text-sm text-gray-400">{tip.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* 知识详情弹窗 */}
      {selectedKnowledge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <CategoryIcon category={selectedKnowledge.category} />
                </div>
                <div>
                  <h3 className="font-medium text-white">{selectedKnowledge.title}</h3>
                  <p className="text-xs text-gray-500">{categoryNames[selectedKnowledge.category]}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedKnowledge(null)}
                className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-300 leading-relaxed mb-4">{selectedKnowledge.content}</p>
              <div className="flex flex-wrap gap-2">
                {selectedKnowledge.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-800 text-gray-400 text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 包装组件，处理 Suspense
export default function SafetyAwarenessPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="h-full bg-[#0A0A0A] flex items-center justify-center">
          <div className="text-gray-400">加载中...</div>
        </div>
      }>
        <SafetyAwarenessContent />
      </Suspense>
    </AppShell>
  );
}
