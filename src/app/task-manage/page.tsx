'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Search, Plus, Filter, ClipboardList, Clock, User,
  MapPin, Wrench, CheckCircle, AlertCircle, Camera,
  ChevronDown, Edit, Trash2, Eye, MoreHorizontal,
  Image, FileText, Send, RefreshCw, Calendar, Loader2,
  X, AlertTriangle, Check
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { PermissionGuard } from '@/components/permission-guard';

// 任务数据结构
interface Task {
  id: string;
  task_code?: string;
  title: string;
  location: string;
  assignee: string;
  assignee_id?: string;
  creator: string;
  creator_id?: string;
  priority: string;
  status: string;
  createTime?: string;
  created_at?: string;
  deadline: string;
  deadline_at?: string;
  description: string;
}

// 任务记录数据结构
interface TaskRecord {
  id: string;
  task_id: string;
  action: string;
  operator_name: string;
  operator_role: string;
  content: string;
  old_status: string;
  new_status: string;
  created_at: string;
}

// 状态配置
const statusConfig = {
  pending: { label: '待接收', color: 'text-[#2196F3]', bg: 'bg-[#2196F3]/10' },
  received: { label: '已接收', color: 'text-[#9C27B0]', bg: 'bg-[#9C27B0]/10' },
  processing: { label: '处理中', color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10' },
  completed: { label: '已完成', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' },
  cancelled: { label: '已取消', color: 'text-[#6C6C6C]', bg: 'bg-[#6C6C6C]/10' },
};

// 优先级配置
const priorityConfig = {
  high: { label: '紧急', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10', border: 'border-[#D32F2F]/30' },
  medium: { label: '普通', color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10', border: 'border-[#FF9800]/30' },
  low: { label: '低', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', border: 'border-[#4CAF50]/30' },
};

// 获取状态文本
function getStatusText(status: string): string {
  return statusConfig[status as keyof typeof statusConfig]?.label || status;
}

// 获取操作文本
function getActionText(action: string): string {
  const actionMap: Record<string, string> = {
    created: '创建',
    assigned: '分配',
    received: '接收',
    started: '开始处理',
    completed: '完成',
    cancelled: '取消',
    updated: '更新',
  };
  return actionMap[action] || action;
}

// 获取操作颜色
function getActionColor(action: string): string {
  const colorMap: Record<string, string> = {
    created: 'border-[#2196F3]',
    assigned: 'border-[#9C27B0]',
    received: 'border-[#FF9800]',
    started: 'border-[#FF9800]',
    completed: 'border-[#4CAF50]',
    cancelled: 'border-[#6C6C6C]',
    updated: 'border-[#A0A0A0]',
  };
  return colorMap[action] || 'border-[#A0A0A0]';
}

// 执行人列表 - 只允许派发给施工员
const assignees = [
  { id: '1', name: '张明', role: '施工员', phone: '138****1234' },
  { id: '2', name: '李华', role: '施工员', phone: '139****5678' },
  { id: '3', name: '王强', role: '施工员', phone: '137****9012' },
];

// 筛选出施工员的执行人列表（派发任务时使用）
const technicianAssignees = assignees.filter(a => a.role === '施工员');

// 创建任务表单类型
interface TaskFormData {
  title: string;
  location: string;
  assigneeId: string;
  priority: string;
  deadline: string;
  description: string;
  tools: string;
}

export default function TaskManagePage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskRecords, setTaskRecords] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchingTask, setDispatchingTask] = useState<Task | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [dispatchMessage, setDispatchMessage] = useState('');
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [dispatchError, setDispatchError] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 判断用户角色
  const isAdminOrProperty = user?.roles.some(r => 
    r.roleCode === 'admin' || r.roleCode === 'property_manager'
  );
  const isTechnician = user?.roles.some(r => r.roleCode === 'technician');
  
  // 获取当前施工员对应的执行人ID
  const currentTechnicianId = isTechnician && user?.realName 
    ? assignees.find(a => a.name === user.realName)?.id 
    : null;

  // 当前用户ID（用于任务接收判断）
  const currentUserId = currentTechnicianId || (user?.id?.toString() || '');
  
  // 当前用户角色（用于UI显示判断）
  const userRole = isAdminOrProperty ? 'admin' : isTechnician ? 'installer' : 'other';

  // 加载任务数据
  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (searchTerm) params.set('search', searchTerm);
      
      const response = await fetch(`/api/tasks?${params.toString()}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // 转换数据格式
        const formattedTasks: Task[] = result.data.map((t: Record<string, unknown>) => ({
          id: t.id as string,
          task_code: t.task_code as string,
          title: t.title as string,
          location: t.location as string || '',
          assignee: t.assignee_name as string || '未分配',
          assignee_id: t.assignee_id as string || '',
          creator: t.creator_name as string || '系统',
          creator_id: t.creator_id as string || '',
          priority: t.priority as string || 'medium',
          status: t.status as string || 'pending',
          createTime: t.created_at ? new Date(t.created_at as string).toLocaleString('zh-CN') : '',
          created_at: t.created_at as string,
          deadline: t.deadline ? new Date(t.deadline as string).toLocaleString('zh-CN').split(' ')[0] : '',
          deadline_at: t.deadline as string,
          description: t.description as string || '',
        }));
        setTasks(formattedTasks);
      } else {
        // 如果API失败，使用模拟数据
        console.warn('任务API返回失败，使用模拟数据');
        setTasks([]);
      }
    } catch (error) {
      console.error('加载任务失败:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // 加载任务记录
  const loadTaskRecords = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/records?taskId=${taskId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setTaskRecords(result.data);
      } else {
        setTaskRecords([]);
      }
    } catch (error) {
      console.error('加载任务记录失败:', error);
      setTaskRecords([]);
    }
  };

  // 页面加载时获取任务
  useEffect(() => {
    loadTasks();
  }, []);

  // 创建任务表单状态
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    location: '',
    assigneeId: '',
    priority: 'medium',
    deadline: '',
    description: '',
    tools: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState('');

  // 过滤任务（所有用户都能看到所有任务）
  const filteredTasks = tasks.filter(task => {
    // 施工员只能看到分配给自己的任务，但可以接收新任务
    // 其他角色可以查看所有任务
    const matchSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || task.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  // 分页
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 统计
  const stats = {
    total: filteredTasks.length,
    pending: filteredTasks.filter(t => t.status === 'pending').length,
    processing: filteredTasks.filter(t => t.status === 'processing').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
  };

  // 接收任务（施工员接收派发给自己的任务，记录操作并同步到数据库）
  const handleReceiveTask = async (task: Task) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/tasks/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          operatorId: user.id,
          operatorName: user.realName || '未知用户',
          operatorRole: 'installer',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 刷新任务列表
        await loadTasks();
        alert('任务已接收，开始处理');
      } else {
        alert(result.message || '接收失败');
      }
    } catch (error) {
      console.error('接收任务失败:', error);
      alert('接收任务失败，请重试');
    }
  };

  // 开始处理任务（施工员开始处理已接收的任务）
  const handleStartTask = async (task: Task) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/tasks/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          action: 'start',
          operatorId: user.id,
          operatorName: user.realName || '未知用户',
          operatorRole: 'installer',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadTasks();
        alert('任务已开始处理');
      } else {
        alert(result.message || '操作失败');
      }
    } catch (error) {
      console.error('开始处理任务失败:', error);
      alert('操作失败，请重试');
    }
  };

  // 完成任务的回调（用于子组件触发）
  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/tasks/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          action: 'complete',
          operatorId: user.id,
          operatorName: user.realName || '未知用户',
          operatorRole: 'installer',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadTasks();
      } else {
        alert(result.message || '操作失败');
      }
    } catch (error) {
      console.error('完成任务失败:', error);
    }
  };

  // 打开完成任务弹窗
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeResult, setCompleteResult] = useState('');
  const [completeTask, setCompleteTask] = useState<Task | null>(null);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const openCompleteModal = (task: Task) => {
    setCompleteTask(task);
    setCompleteResult('');
    setUploadedPhotos([]);
    setCompleteLoading(false);
    setShowCompleteModal(true);
  };

  // 处理照片上传
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    // 模拟上传过程
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 模拟上传延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      // 创建本地预览URL
      const previewUrl = URL.createObjectURL(file);
      setUploadedPhotos(prev => [...prev, previewUrl]);
    }
    
    setIsUploading(false);
  };

  // 删除已上传的照片
  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos(prev => {
      const newPhotos = [...prev];
      // 释放URL对象
      URL.revokeObjectURL(newPhotos[index]);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const handleSubmitComplete = async () => {
    if (!completeTask || !user) return;
    
    // 验证处理结果
    if (!completeResult.trim()) {
      alert('请输入任务完成情况说明');
      return;
    }

    setCompleteLoading(true);
    
    try {
      // 调用API完成任务
      const response = await fetch('/api/tasks/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: completeTask.id,
          action: 'complete',
          operatorId: user.id,
          operatorName: user.realName || '未知用户',
          operatorRole: 'installer',
          result: completeResult,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadTasks();
        setShowCompleteModal(false);
        setCompleteTask(null);
        alert('任务已完成');
      } else {
        alert(result.message || '提交失败，请重试');
      }
    } catch (error) {
      console.error('完成任务失败:', error);
      alert('提交失败，请重试');
    } finally {
      setCompleteLoading(false);
    }
  };

  // 打开创建任务弹窗
  const openAddModal = () => {
    setFormData({
      title: '',
      location: '',
      assigneeId: '',
      priority: 'medium',
      deadline: '',
      description: '',
      tools: '',
    });
    setCreateSuccess(false);
    setCreateError('');
    setShowAddModal(true);
  };

  // 提交创建任务
  const handleCreateTask = async () => {
    // 验证表单
    if (!formData.title.trim()) {
      setCreateError('请输入任务标题');
      return;
    }
    if (!formData.location.trim()) {
      setCreateError('请输入任务地点');
      return;
    }
    if (!formData.assigneeId) {
      setCreateError('请选择执行人');
      return;
    }
    if (!formData.deadline) {
      setCreateError('请选择截止时间');
      return;
    }
    if (!formData.description.trim()) {
      setCreateError('请输入任务描述');
      return;
    }

    setCreateLoading(true);
    setCreateError('');

    try {
      // 调用API创建任务
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          priority: formData.priority,
          assigneeId: formData.assigneeId || undefined,
          assigneeName: assignees.find(a => a.id === formData.assigneeId)?.name,
          creatorId: user?.id,
          creatorName: user?.realName || '系统管理员',
          deadline: formData.deadline,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 刷新任务列表
        await loadTasks();
        setCreateSuccess(true);

        // 2秒后关闭弹窗
        setTimeout(() => {
          setShowAddModal(false);
          setCreateSuccess(false);
        }, 2000);
      } else {
        setCreateError(result.message || '创建任务失败');
      }
    } catch (error) {
      console.error('创建任务失败:', error);
      setCreateError('创建任务失败，请重试');
    } finally {
      setCreateLoading(false);
    }
  };

  // 打开派发弹窗
  const openDispatchModal = (task: Task) => {
    setDispatchingTask(task);
    setSelectedAssignee(task.assignee_id || '');
    setDispatchMessage('');
    setDispatchSuccess(false);
    setDispatchError('');
    setShowDispatchModal(true);
  };

  // 执行派发
  const handleDispatch = async () => {
    if (!selectedAssignee || !dispatchingTask) return;

    setDispatchLoading(true);
    setDispatchError('');

    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 1500));

      const assignee = assignees.find(a => a.id === selectedAssignee);

      // 更新任务状态
      setTasks(tasks.map(t =>
        t.id === dispatchingTask.id
          ? { ...t, assignee: assignee?.name || '', assigneeId: selectedAssignee, status: 'pending' as const }
          : t
      ));

      setDispatchSuccess(true);

      // 2秒后关闭
      setTimeout(() => {
        setShowDispatchModal(false);
        setDispatchingTask(null);
      }, 2000);
    } catch {
      setDispatchError('派发失败，请重试');
    } finally {
      setDispatchLoading(false);
    }
  };

  return (
    <PermissionGuard permission="tasks:view">
      <AppShell>
        <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E5E5E5]">任务管理</h1>
            <p className="text-[#A0A0A0] text-sm mt-1">创建、派发和处理消防安全任务</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors">
              <RefreshCw className="w-4 h-4" />
              同步数据
            </button>
            <button
              onClick={() => { setShowAddModal(true); setSelectedTask(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors"
            >
              <Plus className="w-4 h-4" />
              创建任务
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0078D4]/10">
                <ClipboardList className="w-5 h-5 text-[#0078D4]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">任务总数</p>
                <p className="text-2xl font-bold text-[#E5E5E5]">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#2196F3]/10">
                <Clock className="w-5 h-5 text-[#2196F3]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">待接收</p>
                <p className="text-2xl font-bold text-[#2196F3]">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#FF9800]/10">
                <Wrench className="w-5 h-5 text-[#FF9800]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">处理中</p>
                <p className="text-2xl font-bold text-[#FF9800]">{stats.processing}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#4CAF50]/10">
                <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">已完成</p>
                <p className="text-2xl font-bold text-[#4CAF50]">{stats.completed}</p>
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
                  placeholder="搜索任务名称或地点..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>

            {/* 状态筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-[#A0A0A0] text-sm">状态:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                <option value="all">全部</option>
                <option value="pending">待接收</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
              </select>
            </div>

            {/* 优先级筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-[#A0A0A0] text-sm">优先级:</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                <option value="all">全部</option>
                <option value="high">紧急</option>
                <option value="medium">普通</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>
        </div>

        {/* 任务列表 */}
        <div className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D] overflow-hidden">
          <div className="divide-y divide-[#2D2D2D]">
            {paginatedTasks.map((task) => {
              const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
              const status = statusConfig[task.status as keyof typeof statusConfig];
              return (
                <div
                  key={task.id}
                  className="p-5 hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedTask(task);
                    loadTaskRecords(task.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-[#E5E5E5] font-medium truncate">{task.title}</h3>
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium flex-shrink-0', priority.bg, priority.color)}>
                          {priority.label}
                        </span>
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium flex-shrink-0', status.bg, status.color)}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-[#A0A0A0]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {task.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {task.assignee}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {task.createTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          截止: {task.deadline}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* 派发按钮：仅管理员可见 */}
                      {task.status === 'pending' && userRole === 'admin' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); openDispatchModal(task); }}
                          className="px-3 py-1.5 bg-[#2196F3] text-white text-sm rounded hover:bg-[#1976D2] transition-colors"
                        >
                          派发
                        </button>
                      )}
                      {/* 接收并处理按钮：仅施工员可见，针对已派发给自己的 pending 任务 */}
                      {task.status === 'pending' && userRole === 'installer' && task.assignee_id === currentUserId && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleReceiveTask(task); }}
                          className="px-3 py-1.5 bg-[#FF9800] text-white text-sm rounded hover:bg-[#F57C00] transition-colors"
                        >
                          接收并处理
                        </button>
                      )}
                      {/* 完成按钮：仅施工员可见，处理中的任务 */}
                      {task.status === 'processing' && userRole === 'installer' && task.assignee_id === currentUserId && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); openCompleteModal(task); }}
                          className="px-3 py-1.5 bg-[#4CAF50] text-white text-sm rounded hover:bg-[#388E3C] transition-colors"
                        >
                          完成
                        </button>
                      )}
                      <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-[#6C6C6C] text-sm truncate">{task.description}</p>
                </div>
              );
            })}
          </div>

          {/* 分页 */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2D2D2D]">
            <p className="text-[#A0A0A0] text-sm">
              显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredTasks.length)} 条，共 {filteredTasks.length} 条
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
              <span className="px-3 py-1.5 text-[#E5E5E5] text-sm">
                第 {currentPage} / {totalPages} 页
              </span>
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
        </div>

        {/* 创建任务弹窗 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[600px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <h2 className="text-lg font-bold text-[#E5E5E5]">创建新任务</h2>
              </div>
              <div className="p-6 space-y-4">
                {/* 错误提示 */}
                {createError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {createError}
                  </div>
                )}
                {/* 成功提示 */}
                {createSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                    任务创建成功！正在跳转...
                  </div>
                )}
                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-2">任务标题</label>
                  <input
                    type="text"
                    placeholder="请输入任务标题"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#A0A0A0] text-sm mb-2">任务地点</label>
                    <input
                      type="text"
                      placeholder="请输入地点"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-sm mb-2">执行人</label>
                    <select
                      value={formData.assigneeId}
                      onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                      className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                    >
                      <option value="">请选择执行人</option>
                      {technicianAssignees.map(a => (
                        <option key={a.id} value={a.id}>{a.name} - {a.role}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#A0A0A0] text-sm mb-2">优先级</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                      className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                    >
                      <option value="low">低</option>
                      <option value="medium">普通</option>
                      <option value="high">紧急</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-sm mb-2">截止时间</label>
                    <input
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                      className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-2">任务描述</label>
                  <textarea
                    rows={4}
                    placeholder="请详细描述任务内容..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-2">所需工具</label>
                  <input
                    type="text"
                    placeholder="如：螺丝刀、检测仪等（用逗号分隔）"
                    value={formData.tools}
                    onChange={(e) => setFormData(prev => ({ ...prev, tools: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={createLoading}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={createLoading || createSuccess}
                  className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      创建中...
                    </>
                  ) : createSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      创建成功
                    </>
                  ) : (
                    '创建并派发'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 派发任务弹窗 */}
        {showDispatchModal && dispatchingTask && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => !dispatchLoading && setShowDispatchModal(false)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[500px] border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              {dispatchSuccess ? (
                // 派发成功状态
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4CAF50]/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-[#4CAF50]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#E5E5E5] mb-2">派发成功</h3>
                  <p className="text-[#A0A0A0] text-sm">任务已派发给 {assignees.find(a => a.id === selectedAssignee)?.name}</p>
                </div>
              ) : (
                // 派发表单状态
                <>
                  <div className="p-6 border-b border-[#2D2D2D]">
                    <h2 className="text-lg font-bold text-[#E5E5E5]">任务派发</h2>
                    <p className="text-[#6C6C6C] text-sm mt-1 truncate">{dispatchingTask.title}</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* 错误提示 */}
                    {dispatchError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {dispatchError}
                      </div>
                    )}
                    {/* 成功提示 */}
                    {dispatchSuccess && (
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                        派发成功！任务已分配给 {assignees.find(a => a.id === selectedAssignee)?.name}
                      </div>
                    )}
                    {/* 任务信息 */}
                    <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[#6C6C6C] text-xs">任务地点</p>
                          <p className="text-[#E5E5E5]">{dispatchingTask.location}</p>
                        </div>
                        <div>
                          <p className="text-[#6C6C6C] text-xs">截止时间</p>
                          <p className="text-[#E5E5E5]">{dispatchingTask.deadline}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[#6C6C6C] text-xs">任务描述</p>
                          <p className="text-[#E5E5E5]">{dispatchingTask.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 选择执行人 */}
                    <div>
                      <label className="block text-[#A0A0A0] text-sm mb-2">选择执行人</label>
                      <div className="space-y-2">
                        {technicianAssignees.map((assignee) => (
                          <div
                            key={assignee.id}
                            onClick={() => setSelectedAssignee(assignee.id)}
                            className={cn(
                              'p-3 rounded-lg border cursor-pointer transition-all',
                              selectedAssignee === assignee.id
                                ? 'bg-[#2196F3]/10 border-[#2196F3]'
                                : 'bg-[#222222] border-[#3A3A3A] hover:border-[#4A4A4A]'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#3A3A3A] flex items-center justify-center">
                                  <User className="w-4 h-4 text-[#A0A0A0]" />
                                </div>
                                <div>
                                  <p className="text-[#E5E5E5] font-medium">{assignee.name}</p>
                                  <p className="text-[#6C6C6C] text-xs">{assignee.role}</p>
                                </div>
                              </div>
                              {selectedAssignee === assignee.id && (
                                <div className="w-5 h-5 rounded-full bg-[#2196F3] flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 派发消息 */}
                    <div>
                      <label className="block text-[#A0A0A0] text-sm mb-2">派发消息（可选）</label>
                      <textarea
                        value={dispatchMessage}
                        onChange={(e) => setDispatchMessage(e.target.value)}
                        placeholder="添加备注信息..."
                        rows={3}
                        className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4] resize-none"
                      />
                    </div>
                  </div>
                  <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                    <button
                      onClick={() => setShowDispatchModal(false)}
                      disabled={dispatchLoading}
                      className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleDispatch}
                      disabled={!selectedAssignee || dispatchLoading || dispatchSuccess}
                      className="px-4 py-2 bg-[#2196F3] rounded-lg text-white hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {dispatchLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          派发中...
                        </>
                      ) : dispatchSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          派发成功
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          确认派发
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 完成任务弹窗 */}
        {showCompleteModal && completeTask && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowCompleteModal(false)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[600px] max-h-[85vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D] sticky top-0 bg-[#1E1E1E]">
                <h2 className="text-lg font-bold text-[#E5E5E5]">完成任务</h2>
                <p className="text-[#6C6C6C] text-sm mt-1 truncate">{completeTask.title}</p>
              </div>
              <div className="p-6 space-y-4">
                {/* 任务信息 */}
                <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#6C6C6C] text-xs">任务地点</p>
                      <p className="text-[#E5E5E5]">{completeTask.location}</p>
                    </div>
                    <div>
                      <p className="text-[#6C6C6C] text-xs">截止时间</p>
                      <p className="text-[#E5E5E5]">{completeTask.deadline}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[#6C6C6C] text-xs">任务描述</p>
                      <p className="text-[#E5E5E5]">{completeTask.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* 照片上传 */}
                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-2">
                    上传照片 <span className="text-[#6C6C6C] text-xs">(可选)</span>
                  </label>
                  <div className="border-2 border-dashed border-[#3A3A3A] rounded-lg p-4 hover:border-[#0078D4] transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                      disabled={isUploading}
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-8 h-8 text-[#0078D4] animate-spin mb-2" />
                          <span className="text-[#A0A0A0] text-sm">上传中...</span>
                        </>
                      ) : uploadedPhotos.length === 0 ? (
                        <>
                          <Camera className="w-8 h-8 text-[#6C6C6C] mb-2" />
                          <span className="text-[#A0A0A0] text-sm">点击上传任务照片</span>
                          <span className="text-[#6C6C6C] text-xs mt-1">支持 JPG、PNG 格式</span>
                        </>
                      ) : (
                        <span className="text-[#0078D4] text-sm flex items-center gap-1">
                          <Plus className="w-4 h-4" />
                          添加更多照片
                        </span>
                      )}
                    </label>
                  </div>
                  
                  {/* 已上传照片预览 */}
                  {uploadedPhotos.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`照片 ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg border border-[#3A3A3A]"
                          />
                          <button
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-[#D32F2F] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 完成任务说明 */}
                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-2">
                    处理结果 <span className="text-[#D32F2F]">*</span>
                  </label>
                  <textarea
                    value={completeResult}
                    onChange={(e) => setCompleteResult(e.target.value)}
                    placeholder="请输入任务完成情况说明..."
                    rows={4}
                    className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4] resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3 sticky bottom-0 bg-[#1E1E1E]">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  disabled={completeLoading}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitComplete}
                  disabled={completeLoading}
                  className="px-4 py-2 bg-[#4CAF50] rounded-lg text-white hover:bg-[#388E3C] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {completeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      确认完成
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 任务详情弹窗 */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedTask(null)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[700px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#E5E5E5]">{selectedTask.title}</h2>
                    <p className="text-[#6C6C6C] text-sm mt-1">任务编号: TASK-{selectedTask.id.toString().padStart(4, '0')}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      priorityConfig[selectedTask.priority as keyof typeof priorityConfig].bg,
                      priorityConfig[selectedTask.priority as keyof typeof priorityConfig].color
                    )}>
                      {priorityConfig[selectedTask.priority as keyof typeof priorityConfig].label}
                    </span>
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      statusConfig[selectedTask.status as keyof typeof statusConfig].bg,
                      statusConfig[selectedTask.status as keyof typeof statusConfig].color
                    )}>
                      {statusConfig[selectedTask.status as keyof typeof statusConfig].label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">任务地点</p>
                    <p className="text-[#E5E5E5] flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedTask.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">执行人</p>
                    <p className="text-[#E5E5E5] flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedTask.assignee}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">创建人</p>
                    <p className="text-[#E5E5E5]">{selectedTask.creator}</p>
                  </div>
                  <div>
                    <p className="text-[#6C6C6C] text-xs mb-1">截止时间</p>
                    <p className="text-[#E5E5E5] flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedTask.deadline}
                    </p>
                  </div>
                </div>

                {/* 任务描述 */}
                <div>
                  <p className="text-[#6C6C6C] text-xs mb-2">任务描述</p>
                  <p className="text-[#E5E5E5] bg-[#222222] rounded-lg p-4">{selectedTask.description}</p>
                </div>

                {/* 施工照片 */}
                <div>
                  <p className="text-[#6C6C6C] text-xs mb-3">施工照片 (3张)</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: '施工前', color: 'text-[#FF9800]', key: 'before' },
                      { type: '施工中', color: 'text-[#2196F3]', key: 'processing' },
                      { type: '施工后', color: 'text-[#4CAF50]', key: 'after' },
                    ].map((photo, idx) => (
                      <div 
                        key={photo.key} 
                        className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A] hover:border-[#0078D4] transition-colors cursor-pointer"
                        onClick={() => {
                          const input = document.getElementById(`photo-${photo.key}`) as HTMLInputElement;
                          input?.click();
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`photo-${photo.key}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              console.log(`上传${photo.type}照片:`, file);
                              alert(`${photo.type}照片上传功能已触发`);
                            }
                          }}
                        />
                        <div className="aspect-square bg-[#1E1E1E] rounded-lg flex items-center justify-center mb-2">
                          <Camera className="w-8 h-8 text-[#6C6C6C]" />
                        </div>
                        <p className={cn('text-xs text-center', photo.color)}>{photo.type}</p>
                        <p className="text-[#6C6C6C] text-xs text-center mt-1">点击上传</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 施工日志 */}
                <div>
                  <p className="text-[#6C6C6C] text-xs mb-3">操作记录</p>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                    {taskRecords.length > 0 ? (
                      taskRecords.map((record) => (
                        <div 
                          key={record.id} 
                          className={cn('bg-[#222222] rounded-lg p-4 border-l-2', getActionColor(record.action))}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[#E5E5E5] text-sm font-medium">
                              {record.operator_name}
                              <span className="text-[#6C6C6C] ml-2 text-xs">({record.operator_role})</span>
                            </span>
                            <span className="text-[#6C6C6C] text-xs">
                              {new Date(record.created_at).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <p className="text-[#A0A0A0] text-sm">
                            {getActionText(record.action)}: {record.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-[#6C6C6C] text-sm text-center py-4">
                        暂无操作记录
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                >
                  关闭
                </button>
                {selectedTask.status === 'processing' && userRole === 'installer' && selectedTask.assignee_id === currentUserId && (
                  <button 
                    onClick={() => {
                      setSelectedTask(null);
                      openCompleteModal(selectedTask);
                    }}
                    className="px-4 py-2 bg-[#4CAF50] rounded-lg text-white hover:bg-[#388E3C] transition-colors"
                  >
                    确认完成
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
    </PermissionGuard>
  );
}
