'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Search, Plus, User, Shield, Phone, Mail,
  Edit, Trash2, Eye, Key, LogIn, MoreHorizontal,
  ChevronDown, Check, X
} from 'lucide-react';

// 用户数据
const mockUsers = [
  { id: 1, name: '系统管理员', username: 'admin', phone: '138****0001', email: 'admin@fire.com', role: '超级管理员', isSuperAdmin: true, lastLogin: '2026-04-10 09:30', status: 'active' },
  { id: 2, name: '张明', username: 'zhangming', phone: '139****0002', email: 'zhangm@fire.com', role: '施工员', isSuperAdmin: false, lastLogin: '2026-04-10 08:15', status: 'active' },
  { id: 3, name: '李华', username: 'lihua', phone: '137****0003', email: 'lih@fire.com', role: '物业管理员', isSuperAdmin: false, lastLogin: '2026-04-09 18:45', status: 'active' },
  { id: 4, name: '王强', username: 'wangqiang', phone: '136****0004', email: 'wangq@fire.com', role: '工程监理', isSuperAdmin: false, lastLogin: '2026-04-08 14:20', status: 'inactive' },
  { id: 5, name: '赵雪', username: 'zhaoxue', phone: '135****0005', email: 'zhaox@fire.com', role: '设计人员', isSuperAdmin: false, lastLogin: '2026-04-10 10:00', status: 'active' },
];

// 角色数据
const mockRoles = [
  { id: 1, name: '超级管理员', isSuperAdmin: true, userCount: 1, permissions: ['*'] },
  { id: 2, name: '施工员', isSuperAdmin: false, userCount: 5, permissions: ['dashboard:view', 'device:view', 'task:view', 'task:receive'] },
  { id: 3, name: '物业管理员', isSuperAdmin: false, userCount: 3, permissions: ['dashboard:view', 'device:view', 'alarm:view', 'maintenance:view'] },
  { id: 4, name: '工程监理', isSuperAdmin: false, userCount: 2, permissions: ['dashboard:view', 'task:view', 'task:approve'] },
  { id: 5, name: '设计人员', isSuperAdmin: false, userCount: 4, permissions: ['dashboard:view', 'data:view', 'data:export'] },
];

// 菜单权限树
const menuPermissions = [
  { id: 'dashboard', name: '首页', actions: ['view'] },
  { id: 'merchants', name: '商户管理', actions: ['view', 'add', 'edit', 'delete'] },
  { id: 'device', name: '设备管理', actions: ['view', 'add', 'edit', 'delete', 'config'] },
  { id: 'alarm', name: '报警管理', actions: ['view', 'acknowledge', 'resolve'] },
  { id: 'task', name: '任务管理', actions: ['view', 'add', 'assign', 'approve'] },
  { id: 'system', name: '系统管理', actions: ['view', 'manage'] },
];

export default function UserManagePage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [selectedRole, setSelectedRole] = useState<typeof mockRoles[0] | null>(null);

  // 过滤用户
  const filteredUsers = mockUsers.filter(user =>
    user.name.includes(searchTerm) || user.username.includes(searchTerm)
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E5E5E5]">用户与权限管理</h1>
            <p className="text-[#A0A0A0] text-sm mt-1">管理系统用户、角色和权限分配</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowRoleModal(true); setSelectedRole(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
            >
              <Shield className="w-4 h-4" />
              添加角色
            </button>
            <button
              onClick={() => { setShowAddModal(true); setSelectedUser(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加用户
            </button>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D]">
          <div className="flex border-b border-[#2D2D2D]">
            <button
              onClick={() => setActiveTab('users')}
              className={cn(
                'px-6 py-4 text-sm font-medium transition-colors',
                activeTab === 'users'
                  ? 'text-[#0078D4] border-b-2 border-[#0078D4] bg-[#0A0A0A]'
                  : 'text-[#A0A0A0] hover:text-[#E5E5E5]'
              )}
            >
              <User className="w-4 h-4 inline mr-2" />
              用户列表
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={cn(
                'px-6 py-4 text-sm font-medium transition-colors',
                activeTab === 'roles'
                  ? 'text-[#0078D4] border-b-2 border-[#0078D4] bg-[#0A0A0A]'
                  : 'text-[#A0A0A0] hover:text-[#E5E5E5]'
              )}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              角色管理
            </button>
          </div>

          {/* 用户列表 */}
          {activeTab === 'users' && (
            <div className="p-4">
              {/* 搜索 */}
              <div className="mb-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C6C6C]" />
                  <input
                    type="text"
                    placeholder="搜索用户名或姓名..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              {/* 表格 */}
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1A1A1A]">
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">用户</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">角色</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">联系方式</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">最后登录</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">状态</th>
                    <th className="px-4 py-3 text-left text-[#A0A0A0] text-sm font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-[#2D2D2D] hover:bg-[#2A2A2A] transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0078D4]/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-[#0078D4]" />
                          </div>
                          <div>
                            <p className="text-[#E5E5E5] font-medium">{user.name}</p>
                            <p className="text-[#6C6C6C] text-xs">{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          user.isSuperAdmin
                            ? 'bg-[#9C27B0]/10 text-[#9C27B0]'
                            : 'bg-[#0078D4]/10 text-[#0078D4]'
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-[#A0A0A0] text-sm flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </p>
                          <p className="text-[#A0A0A0] text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#A0A0A0] text-sm">{user.lastLogin}</td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          user.status === 'active'
                            ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
                            : 'bg-[#6C6C6C]/10 text-[#6C6C6C]'
                        )}>
                          {user.status === 'active' ? '正常' : '停用'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors">
                            <Key className="w-4 h-4" />
                          </button>
                          {!user.isSuperAdmin && (
                            <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#D32F2F] transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 角色列表 */}
          {activeTab === 'roles' && (
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4">
                {mockRoles.map((role) => (
                  <div
                    key={role.id}
                    className="bg-[#222222] rounded-lg p-5 border border-[#3A3A3A] hover:border-[#0078D4]/50 transition-all cursor-pointer"
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          role.isSuperAdmin ? 'bg-[#9C27B0]/10' : 'bg-[#0078D4]/10'
                        )}>
                          <Shield className={cn(
                            'w-5 h-5',
                            role.isSuperAdmin ? 'text-[#9C27B0]' : 'text-[#0078D4]'
                          )} />
                        </div>
                        <div>
                          <h3 className="text-[#E5E5E5] font-medium">{role.name}</h3>
                          <p className="text-[#6C6C6C] text-xs">{role.userCount} 个用户</p>
                        </div>
                      </div>
                      {role.isSuperAdmin && (
                        <span className="px-2 py-0.5 bg-[#9C27B0]/10 text-[#9C27B0] text-xs rounded">
                          超级管理员
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[#6C6C6C] text-xs">权限列表:</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 4).map((perm, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-[#2D2D2D] text-[#A0A0A0] text-xs rounded">
                            {perm}
                          </span>
                        ))}
                        {role.permissions.length > 4 && (
                          <span className="px-2 py-0.5 text-[#6C6C6C] text-xs">
                            +{role.permissions.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#3A3A3A] flex justify-end gap-2">
                      <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      {!role.isSuperAdmin && (
                        <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#D32F2F] transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 添加/编辑用户弹窗 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[500px] border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <h2 className="text-lg font-bold text-[#E5E5E5]">{selectedUser ? '编辑用户' : '添加用户'}</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-2">用户名</label>
                  <input
                    type="text"
                    defaultValue={selectedUser?.username || ''}
                    placeholder="请输入用户名"
                    className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-2">姓名</label>
                  <input
                    type="text"
                    defaultValue={selectedUser?.name || ''}
                    placeholder="请输入姓名"
                    className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-2">手机号</label>
                  <input
                    type="tel"
                    defaultValue={selectedUser?.phone || ''}
                    placeholder="请输入手机号"
                    className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-2">角色</label>
                  <select className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]">
                    <option value="">请选择角色</option>
                    {mockRoles.filter(r => !r.isSuperAdmin).map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                >
                  取消
                </button>
                <button className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors">
                  确定
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 角色权限弹窗 */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowRoleModal(false)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[600px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <h2 className="text-lg font-bold text-[#E5E5E5]">{selectedRole ? '编辑角色' : '添加角色'}</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-2">角色名称</label>
                  <input
                    type="text"
                    defaultValue={selectedRole?.name || ''}
                    placeholder="请输入角色名称"
                    className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] text-sm mb-3">菜单权限</label>
                  <div className="space-y-3">
                    {menuPermissions.map((menu) => (
                      <div key={menu.id} className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[#E5E5E5] font-medium">{menu.name}</span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-[#0078D4]" />
                            <span className="text-[#6C6C6C] text-sm">全选</span>
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {menu.actions.map((action) => (
                            <label key={action} className="flex items-center gap-2 px-3 py-1.5 bg-[#1E1E1E] rounded cursor-pointer hover:bg-[#2D2D2D]">
                              <input type="checkbox" className="w-3 h-3 accent-[#0078D4]" defaultChecked />
                              <span className="text-[#A0A0A0] text-sm">
                                {action === 'view' && '查看'}
                                {action === 'add' && '新增'}
                                {action === 'edit' && '编辑'}
                                {action === 'delete' && '删除'}
                                {action === 'acknowledge' && '确认'}
                                {action === 'resolve' && '处理'}
                                {action === 'config' && '配置'}
                                {action === 'assign' && '分配'}
                                {action === 'approve' && '审批'}
                                {action === 'manage' && '管理'}
                                {action === 'export' && '导出'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                >
                  取消
                </button>
                <button className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors">
                  确定保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
