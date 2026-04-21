'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import {
  Home, Building2, Tablet, Settings, LayoutDashboard,
  Users, Shield, UserCog, ClipboardList, MessageSquare,
  ChevronLeft, ChevronRight, LogOut, User, Bell,
  Flame, Wind, Thermometer, AlertTriangle, X, Menu,
  Bot, LogIn, ChevronDown, UserCircle, MapPin, Clock, AlertCircle,
  BookOpen, Map, CheckCircle2, Lightbulb
} from 'lucide-react';

// 菜单项类型
interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

// 菜单配置
const menuItems: MenuItem[] = [
  { id: 'dashboard', label: '首页', icon: <Home className="w-5 h-5" />, path: '/' },
  { id: 'safety', label: '安全意识', icon: <BookOpen className="w-5 h-5" />, children: [
    { id: 'safety-overview', label: '安全意识', icon: <Home className="w-4 h-4" />, path: '/safety-awareness' },
    { id: 'safety-knowledge', label: '知识库', icon: <BookOpen className="w-4 h-4" />, path: '/safety-awareness?tab=knowledge' },
    { id: 'safety-escape', label: '逃生指南', icon: <Map className="w-4 h-4" />, path: '/safety-awareness?tab=escape' },
    { id: 'safety-cases', label: '案例警示', icon: <AlertCircle className="w-4 h-4" />, path: '/safety-awareness?tab=cases' },
    { id: 'safety-check', label: '隐患自查', icon: <CheckCircle2 className="w-4 h-4" />, path: '/safety-awareness?tab=check' },
    { id: 'safety-tips', label: '每日提示', icon: <Lightbulb className="w-4 h-4" />, path: '/safety-awareness?tab=tips' },
  ]},
  { id: 'region', label: '区域管理', icon: <Building2 className="w-5 h-5" />, children: [
    { id: 'merchants', label: '商户信息', icon: <Building2 className="w-4 h-4" />, path: '/merchants' },
    { id: 'risk-level', label: '风险分级', icon: <AlertTriangle className="w-4 h-4" />, path: '/risk-level' },
  ]},
  { id: 'device', label: '设备管理', icon: <Tablet className="w-5 h-5" />, children: [
    { id: 'gas-device', label: '燃气设备', icon: <Wind className="w-4 h-4" />, path: '/gas-device' },
    { id: 'fire-device', label: '火灾报警', icon: <Flame className="w-4 h-4" />, path: '/fire-device' },
    { id: 'device-status', label: '设备监控', icon: <Thermometer className="w-4 h-4" />, path: '/device-status' },
    { id: 'device-connect', label: '设备接入', icon: <Settings className="w-4 h-4" />, path: '/device-connect' },
  ]},
  { id: 'system', label: '系统管理', icon: <Settings className="w-5 h-5" />, children: [
    { id: 'user-manage', label: '用户管理', icon: <Users className="w-4 h-4" />, path: '/user-management' },
    { id: 'role-manage', label: '角色管理', icon: <Shield className="w-4 h-4" />, path: '/role-manage' },
    { id: 'permission-manage', label: '权限管理', icon: <UserCog className="w-4 h-4" />, path: '/permission-manage' },
    { id: 'task-manage', label: '任务管理', icon: <ClipboardList className="w-4 h-4" />, path: '/task-manage' },
  ]},
  { id: 'monitor', label: '平台监控', icon: <LayoutDashboard className="w-5 h-5" />, children: [
    { id: 'device-info', label: '设备信息', icon: <Tablet className="w-4 h-4" />, path: '/device-info' },
    { id: 'admin-info', label: '管理员信息', icon: <User className="w-4 h-4" />, path: '/admin-info' },
  ]},
  { id: 'ai-module', label: 'AI模块', icon: <MessageSquare className="w-5 h-5" />, children: [
    { id: 'ai-chat', label: 'AI对话', icon: <MessageSquare className="w-4 h-4" />, path: '/ai-chat' },
    { id: 'ai-risk', label: 'AI风险评估', icon: <AlertTriangle className="w-4 h-4" />, path: '/ai-risk' },
  ]},
];

// 扁平化菜单项（包含所有子菜单）
const flattenedMenuItems: MenuItem[] = menuItems.reduce((acc, item) => {
  acc.push(item);
  if (item.children) {
    acc.push(...item.children);
  }
  return acc;
}, [] as MenuItem[]);

// 任务提醒数据类型
interface TaskNotification {
  id: number;
  title: string;
  location: string;
  assigneeId: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  creator: string;
}

// 优先级配置
const priorityConfig = {
  high: { label: '紧急', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10', border: 'border-[#D32F2F]/30' },
  medium: { label: '普通', color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10', border: 'border-[#FF9800]/30' },
  low: { label: '低', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', border: 'border-[#4CAF50]/30' },
};

// 施工员ID映射（基于真实姓名）
const technicianIdMap: Record<string, string> = {
  '张明': '1',
  '李华': '2',
  '王强': '3',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, logout, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tabs, setTabs] = useState<{ id: string; label: string; path: string }[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 任务提醒相关状态
  const [taskNotifications, setTaskNotifications] = useState<TaskNotification[]>([]);
  const [showTaskNotificationModal, setShowTaskNotificationModal] = useState(false);
  const [hasShownNotifications, setHasShownNotifications] = useState(false);

  // 判断是否是施工员
  const isTechnician = authUser?.roles?.some(r => r.roleCode === 'technician') || false;
  
  // 获取当前施工员的ID
  const currentTechnicianId = useCallback(() => {
    if (!authUser?.realName) return null;
    return technicianIdMap[authUser.realName] || null;
  }, [authUser?.realName]);

  // 模拟获取待接收任务（实际项目中应从API获取）
  const fetchPendingTasks = useCallback(async () => {
    if (!isTechnician) return;
    
    const techId = currentTechnicianId();
    if (!techId) return;

    // 模拟API请求获取待接收任务
    const mockPendingTasks: TaskNotification[] = [
      { id: 1, title: '串串香火锅 - 燃气管道检修', location: 'A区 - 1楼后厨', assigneeId: '1', priority: 'high' as const, deadline: '2026-04-10 18:00', creator: '系统管理员' },
      { id: 5, title: '烧烤店 - 风机维护', location: 'B区 - 排烟系统', assigneeId: '2', priority: 'medium' as const, deadline: '2026-04-12 18:00', creator: '物业管理员' },
      { id: 7, title: '火锅店 - 报警器更换', location: 'A区 - 2楼', assigneeId: techId, priority: 'high' as const, deadline: '2026-04-11 12:00', creator: '系统管理员' },
    ].filter(task => task.assigneeId === techId);

    // 如果有新任务且还没有显示过通知
    if (mockPendingTasks.length > 0 && !hasShownNotifications) {
      setTaskNotifications(mockPendingTasks);
      setShowTaskNotificationModal(true);
    }
  }, [isTechnician, currentTechnicianId, hasShownNotifications]);

  // 定时检查新任务（每30秒检查一次）
  useEffect(() => {
    if (!isTechnician) return;

    // 首次加载时检查一次
    const timer = setTimeout(() => {
      fetchPendingTasks();
    }, 2000); // 延迟2秒后检查，让用户先看到页面

    // 设置定时轮询
    const intervalId = setInterval(() => {
      fetchPendingTasks();
    }, 30000); // 每30秒检查一次

    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, [isTechnician, fetchPendingTasks]);

  // 处理任务通知弹窗关闭
  const handleCloseTaskNotification = () => {
    setShowTaskNotificationModal(false);
    setHasShownNotifications(true);
  };

  // 跳转到任务管理页面
  const handleGoToTaskManage = () => {
    setShowTaskNotificationModal(false);
    setHasShownNotifications(true);
    router.push('/task-manage');
  };

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 移动端菜单切换时禁止背景滚动
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // 初始化：根据当前路由设置激活状态
  useEffect(() => {
    const currentItem = flattenedMenuItems.find(item => item.path === pathname);
    if (currentItem) {
      setActiveTab(currentItem.id);
      
      // 如果是子菜单，确保父菜单展开
      const parentMenu = menuItems.find(item => 
        item.children?.some(child => child.id === currentItem.id)
      );
      if (parentMenu && !expandedMenus.includes(parentMenu.id)) {
        setExpandedMenus(prev => [...prev, parentMenu.id]);
      }
      
      // 添加到 tabs
      if (!tabs.find(t => t.id === currentItem.id)) {
        setTabs(prev => {
          if (prev.find(t => t.id === currentItem.id)) return prev;
          return [...prev, { id: currentItem.id, label: currentItem.label, path: currentItem.path! }];
        });
      }
    }
  }, [pathname]);

  // 切换菜单展开/收起
  const toggleMenuExpand = (menuId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // 点击菜单项
  const handleMenuClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      // 有子菜单，展开/收起
      toggleMenuExpand(item.id, { stopPropagation: () => {} } as React.MouseEvent);
    } else if (item.path) {
      // 跳转到对应页面
      router.push(item.path);
      setActiveTab(item.id);
      
      // 添加到 tabs
      if (!tabs.find(t => t.id === item.id)) {
        setTabs(prev => [...prev, { id: item.id, label: item.label, path: item.path! }]);
      }
      
      // 移动端关闭菜单
      setMobileMenuOpen(false);
    }
  };

  // 关闭Tab
  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabId === 'dashboard') return;
    
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    // 如果关闭的是当前激活的tab，切换到其他tab
    if (activeTab === tabId) {
      const closedIndex = tabs.findIndex(t => t.id === tabId);
      const nextTab = newTabs[Math.min(closedIndex, newTabs.length - 1)];
      if (nextTab) {
        router.push(nextTab.path);
        setActiveTab(nextTab.id);
      }
    }
  };

  // 点击Tab
  const handleTabClick = (tab: typeof tabs[0]) => {
    router.push(tab.path);
    setActiveTab(tab.id);
  };

  // 检查菜单项是否被选中（包括子菜单）
  const isMenuActive = (item: MenuItem) => {
    if (item.path === pathname) return true;
    if (item.children) {
      return item.children.some(child => child.path === pathname);
    }
    return false;
  };

  // 检查是否是当前打开的子菜单
  const isChildActive = (item: MenuItem) => {
    return item.children?.some(child => child.id === activeTab);
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A]">
      {/* 移动端遮罩层 */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'flex flex-col bg-[#111111] border-r border-[#2D2D2D] transition-all duration-300 z-50',
          'fixed lg:relative inset-y-0 left-0',
          'transform lg:transform-none',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo区域 */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#2D2D2D]">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-[#0078D4] to-[#0056B3] flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-[#E5E5E5] text-sm hidden sm:inline">智慧消防监控</span>
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded hover:bg-[#2A2A2A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              'p-1.5 rounded hover:bg-[#2A2A2A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors',
              'hidden lg:block'
            )}
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* 菜单列表 */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus.includes(item.id);
            const isActive = isMenuActive(item);
            const isChildOfActive = isChildActive(item);

            return (
              <div key={item.id}>
                {/* 父菜单项 */}
                <div
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200',
                    (isActive || isChildOfActive) 
                      ? 'bg-[#2A2A2A] text-[#0078D4] border-l-[3px] border-[#0078D4]' 
                      : 'text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-[#E5E5E5] border-l-[3px] border-transparent',
                    sidebarCollapsed && 'justify-center px-0'
                  )}
                  style={{ paddingLeft: sidebarCollapsed ? '0' : (isChildOfActive && !isActive ? '24px' : '16px') }}
                  onClick={() => handleMenuClick(item)}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                      {hasChildren && (
                        <ChevronRight 
                          className={cn('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-90')} 
                          onClick={(e) => toggleMenuExpand(item.id, e)}
                        />
                      )}
                    </>
                  )}
                </div>
                
                {/* 子菜单 */}
                {!sidebarCollapsed && hasChildren && isExpanded && (
                  <div className="overflow-hidden">
                    {item.children!.map((child) => {
                      const isChildActive = pathname === child.path;
                      return (
                        <div
                          key={child.id}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-200',
                            isChildActive
                              ? 'bg-[#0078D4]/10 text-[#0078D4] border-l-[3px] border-[#0078D4]'
                              : 'text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-[#E5E5E5] border-l-[3px] border-transparent',
                            sidebarCollapsed && 'justify-center px-0'
                          )}
                          style={{ paddingLeft: '40px' }}
                          onClick={() => handleMenuClick(child)}
                        >
                          <span className="flex-shrink-0">{child.icon}</span>
                          <span className="flex-1 truncate text-sm">{child.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 用户信息 - 点击展开菜单 */}
        <div className="p-4 border-t border-[#2D2D2D] relative" ref={userMenuRef}>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#333] animate-pulse" />
              {!sidebarCollapsed && (
                <div className="flex-1">
                  <div className="h-4 w-20 bg-[#333] rounded animate-pulse mb-1" />
                  <div className="h-3 w-16 bg-[#333] rounded animate-pulse" />
                </div>
              )}
            </div>
          ) : authUser ? (
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-[#2A2A2A] -m-1 p-2 rounded-lg transition-colors"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0078D4] to-[#0056B3] flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[#E5E5E5] text-sm font-medium truncate">{authUser.realName || authUser.username}</p>
                  <p className="text-[#6C6C6C] text-xs truncate">{authUser.roles?.[0]?.roleName || '用户'}</p>
                </div>
              )}
              {!sidebarCollapsed && (
                <ChevronDown className={cn('w-4 h-4 text-[#6C6C6C] transition-transform', userMenuOpen && 'rotate-180')} />
              )}
            </div>
          ) : (
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-[#2A2A2A] -m-1 p-2 rounded-lg transition-colors"
              onClick={() => router.push('/login')}
            >
              <div className="w-9 h-9 rounded-full bg-[#333] flex items-center justify-center shrink-0">
                <UserCircle className="w-5 h-5 text-[#6C6C6C]" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1">
                  <p className="text-[#A0A0A0] text-sm">未登录</p>
                  <p className="text-[#6C6C6C] text-xs">点击登录</p>
                </div>
              )}
            </div>
          )}
          
          {/* 用户菜单下拉 */}
          {userMenuOpen && authUser && !sidebarCollapsed && (
            <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-[#1E1E1E] border border-[#2D2D2D] rounded-lg shadow-xl overflow-hidden z-50">
              {/* 用户信息 */}
              <div className="p-3 border-b border-[#2D2D2D]">
                <p className="text-[#E5E5E5] text-sm font-medium">{authUser.realName || authUser.username}</p>
                <p className="text-[#6C6C6C] text-xs mt-0.5">{authUser.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  {authUser.roles?.map((role) => (
                    <span key={role.roleId} className="text-xs px-2 py-0.5 bg-[#0078D4]/10 text-[#0078D4] rounded">
                      {role.roleName}
                    </span>
                  ))}
                </div>
              </div>
              {/* 操作按钮 */}
              <div className="p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(false);
                    router.push('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-[#E5E5E5] rounded transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  切换账号
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setUserMenuOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 - 移动端显示汉堡菜单 */}
        <div className="h-12 bg-[#111111] border-b border-[#2D2D2D] flex items-center px-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded hover:bg-[#2A2A2A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors lg:hidden mr-2"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Tab栏 */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors text-sm whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-[#0078D4]/20 text-[#0078D4]'
                    : 'text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-[#E5E5E5]'
                )}
                onClick={() => handleTabClick(tab)}
              >
                <span>{tab.label}</span>
                {tab.id !== 'dashboard' && (
                  <button
                    onClick={(e) => closeTab(tab.id, e)}
                    className="p-0.5 rounded hover:bg-[#3A3A3A] hover:text-[#E5E5E5]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* 施工员任务提醒弹窗 */}
      {showTaskNotificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-5 border-b border-[#2D2D2D]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0078D4]/20 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-[#0078D4]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#E5E5E5]">您有新的任务待接收</h3>
                  <p className="text-sm text-[#6C6C6C]">共 {taskNotifications.length} 个任务</p>
                </div>
              </div>
              <button
                onClick={handleCloseTaskNotification}
                className="p-2 rounded-lg hover:bg-[#2A2A2A] text-[#6C6C6C] hover:text-[#E5E5E5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 任务列表 */}
            <div className="max-h-[400px] overflow-y-auto p-2">
              {taskNotifications.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'p-4 rounded-lg border mb-2 last:mb-0 transition-all hover:bg-[#252525]',
                    priorityConfig[task.priority].border,
                    priorityConfig[task.priority].bg
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* 任务标题和优先级 */}
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-[#E5E5E5] font-medium truncate">{task.title}</h4>
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium shrink-0',
                          priorityConfig[task.priority].bg,
                          priorityConfig[task.priority].color
                        )}>
                          {priorityConfig[task.priority].label}
                        </span>
                      </div>

                      {/* 任务详情 */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{task.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>截止: {task.deadline}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                          <User className="w-4 h-4 shrink-0" />
                          <span>派发人: {task.creator}</span>
                        </div>
                      </div>
                    </div>

                    {/* 紧急图标 */}
                    {task.priority === 'high' && (
                      <div className="w-8 h-8 rounded-full bg-[#D32F2F]/20 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4 text-[#D32F2F]" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 弹窗底部操作 */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#2D2D2D]">
              <button
                onClick={handleCloseTaskNotification}
                className="px-4 py-2 rounded-lg border border-[#2D2D2D] text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-[#E5E5E5] transition-colors text-sm font-medium"
              >
                稍后处理
              </button>
              <button
                onClick={handleGoToTaskManage}
                className="px-4 py-2 rounded-lg bg-[#0078D4] text-white hover:bg-[#0066B3] transition-colors text-sm font-medium flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                查看并接收任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
