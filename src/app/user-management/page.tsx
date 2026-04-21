'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { PermissionGuard } from '@/components/permission-guard';
import { cn } from '@/lib/utils';
import {
  Users, Plus, Search, Edit, Trash2, UserCog, Shield,
  CheckCircle, XCircle, Eye, EyeOff, Loader2, RefreshCw,
  AlertCircle, Clock, Mail, Phone, Lock
} from 'lucide-react';

// 用户信息
interface UserInfo {
  id: string;
  username: string;
  email: string;
  realName: string | null;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: Array<{
    roleId: string;
    roleCode: string;
    roleName: string;
    permissions: string[];
    customerId: string | null;
  }>;
}

// 角色信息
interface Role {
  id: string;
  roleCode: string;
  roleName: string;
  description: string | null;
  permissions: string[];
}

// 角色配置
const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: '管理员', color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
  property_manager: { label: '物业', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' },
  technician: { label: '施工员', color: 'text-[#2196F3]', bg: 'bg-[#2196F3]/10' },
  owner: { label: '业主', color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10' },
  viewer: { label: '访客', color: 'text-[#6C6C6C]', bg: 'bg-[#6C6C6C]/10' },
};

export default function UserManagementPage() {
  const router = useRouter();
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    realName: '',
    phone: '',
    roleCode: '',
    isActive: true,
  });

  // 加载用户列表
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      if (result.success) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  // 加载角色列表
  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      const result = await response.json();
      if (result.success) {
        setRoles(result.roles);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadUsers(), loadRoles()]);
      setLoading(false);
    };
    init();
  }, []);

  // 过滤用户
  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.realName && user.realName.toLowerCase().includes(search))
    );
  });

  // 打开添加弹窗
  const openAddModal = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      realName: '',
      phone: '',
      roleCode: roles[0]?.roleCode || '',
      isActive: true,
    });
    setEditingUser(null);
    setShowAddModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (user: UserInfo) => {
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      realName: user.realName || '',
      phone: user.phone || '',
      roleCode: user.roles[0]?.roleCode || '',
      isActive: user.isActive,
    });
    setEditingUser(user);
    setShowAddModal(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.username || !formData.email) {
      alert('请填写必填项');
      return;
    }

    if (!editingUser && !formData.password) {
      alert('请输入密码');
      return;
    }

    setSubmitting(true);

    try {
      if (editingUser) {
        // 更新用户
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            realName: formData.realName,
            phone: formData.phone,
            isActive: formData.isActive,
            roleCode: formData.roleCode,
            newPassword: formData.password || undefined,
          }),
        });
        const result = await response.json();
        if (!result.success) {
          alert(result.message || '更新失败');
          return;
        }
      } else {
        // 创建用户
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (!result.success) {
          alert(result.message || '创建失败');
          return;
        }
      }

      setShowAddModal(false);
      loadUsers();
    } catch (error) {
      console.error('Submit error:', error);
      alert('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除用户
  const handleDelete = async (userId: string) => {
    if (!confirm('确定要删除该用户吗？')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        loadUsers();
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('删除失败');
    }
  };

  // 切换用户状态
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const result = await response.json();
      if (result.success) {
        loadUsers();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#0078D4] animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <PermissionGuard permission="users:view">
      <AppShell>
        <div className="space-y-6">
          {/* 页面标题 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#E5E5E5]">用户管理</h1>
            <p className="text-[#A0A0A0] text-sm mt-1">管理系统用户账号和权限</p>
          </div>
          {hasPermission('users:add') && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加用户
            </button>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0078D4]/10">
                <Users className="w-5 h-5 text-[#0078D4]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">用户总数</p>
                <p className="text-2xl font-bold text-[#E5E5E5]">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#4CAF50]/10">
                <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">启用用户</p>
                <p className="text-2xl font-bold text-[#4CAF50]">{users.filter(u => u.isActive).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#6C6C6C]/10">
                <XCircle className="w-5 h-5 text-[#6C6C6C]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">禁用用户</p>
                <p className="text-2xl font-bold text-[#6C6C6C]">{users.filter(u => !u.isActive).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#FF9800]/10">
                <Shield className="w-5 h-5 text-[#FF9800]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">角色数量</p>
                <p className="text-2xl font-bold text-[#FF9800]">{roles.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C6C6C]" />
              <input
                type="text"
                placeholder="搜索用户名、邮箱或姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              />
            </div>
            <button
              onClick={loadUsers}
              className="p-2 rounded-lg bg-[#222222] border border-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#222222]">
                <tr>
                  <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-medium">用户</th>
                  <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-medium">角色</th>
                  <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-medium">联系方式</th>
                  <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-medium">最后登录</th>
                  <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-medium">状态</th>
                  <th className="px-4 py-3 text-right text-[#A0A0A0] text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D2D2D]">
                {filteredUsers.map((user) => {
                  const roleInfo = user.roles[0];
                  const config = roleConfig[roleInfo?.roleCode] || roleConfig.viewer;
                  
                  return (
                    <tr key={user.id} className="hover:bg-[#2A2A2A] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#3A3A3A] flex items-center justify-center">
                            <span className="text-[#E5E5E5] font-medium">
                              {user.realName?.[0] || user.username[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-[#E5E5E5] font-medium">{user.realName || user.username}</p>
                            <p className="text-[#6C6C6C] text-xs">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-1 rounded text-xs font-medium', config.bg, config.color)}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-sm">
                          <p className="text-[#A0A0A0] flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="text-[#A0A0A0] flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[#A0A0A0] text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '从未登录'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          user.isActive ? 'bg-[#4CAF50]/10 text-[#4CAF50]' : 'bg-[#6C6C6C]/10 text-[#6C6C6C]'
                        )}>
                          {user.isActive ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission('users:edit') && (
                            <>
                              <button
                                onClick={() => toggleUserStatus(user.id, user.isActive)}
                                className={cn(
                                  'p-1.5 rounded hover:bg-[#3A3A3A] transition-colors',
                                  user.isActive ? 'text-[#FF9800]' : 'text-[#4CAF50]'
                                )}
                                title={user.isActive ? '禁用用户' : '启用用户'}
                              >
                                {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {hasPermission('users:delete') && user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-1.5 rounded hover:bg-[#D32F2F]/10 text-[#D32F2F] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 text-[#3A3A3A] mx-auto mb-3" />
              <p className="text-[#6C6C6C]">暂无用户数据</p>
            </div>
          )}
        </div>

        {/* 添加/编辑用户弹窗 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[500px] max-h-[90vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <h2 className="text-lg font-bold text-[#E5E5E5]">
                  {editingUser ? '编辑用户' : '添加用户'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#A0A0A0] text-sm mb-2">用户名 *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={!!editingUser}
                      className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4] disabled:opacity-50"
                      placeholder="登录用户名"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-sm mb-2">邮箱 *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!editingUser}
                      className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4] disabled:opacity-50"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-2">
                    密码 {editingUser && '(留空则不修改)'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C6C6C]" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                      placeholder={editingUser ? '留空不修改' : '请输入密码'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#A0A0A0] text-sm mb-2">姓名</label>
                    <input
                      type="text"
                      value={formData.realName}
                      onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                      className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                      placeholder="真实姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] text-sm mb-2">电话</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                      placeholder="手机号码"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-2">角色</label>
                  <select
                    value={formData.roleCode}
                    onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                    className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.roleCode}>{role.roleName}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-[#3A3A3A] bg-[#222222] text-[#0078D4] focus:ring-[#0078D4]"
                  />
                  <label htmlFor="isActive" className="text-[#A0A0A0] text-sm">启用账号</label>
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? '保存' : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
    </PermissionGuard>
  );
}
