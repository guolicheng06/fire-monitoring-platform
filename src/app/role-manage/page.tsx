'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Search, Plus, Shield, Users, Edit, Trash2, Eye, Key,
  Check, X, AlertCircle, UserCog
} from 'lucide-react';

// 角色数据
const mockRoles = [
  { id: 1, name: '超级管理员', isSuperAdmin: true, userCount: 1, description: '拥有系统所有权限', permissions: ['*'], createdAt: '2024-01-01' },
  { id: 2, name: '施工员', isSuperAdmin: false, userCount: 5, description: '负责设备安装和维护', permissions: ['dashboard:view', 'device:view', 'device:add', 'task:view', 'task:receive'], createdAt: '2024-02-15' },
  { id: 3, name: '物业管理员', isSuperAdmin: false, userCount: 3, description: '负责日常巡检和监控', permissions: ['dashboard:view', 'device:view', 'alarm:view', 'alarm:acknowledge', 'maintenance:view'], createdAt: '2024-03-10' },
  { id: 4, name: '工程监理', isSuperAdmin: false, userCount: 2, description: '监督施工质量和进度', permissions: ['dashboard:view', 'device:view', 'task:view', 'task:approve', 'report:view'], createdAt: '2024-04-20' },
  { id: 5, name: '设计人员', isSuperAdmin: false, userCount: 4, description: '负责消防系统设计', permissions: ['dashboard:view', 'data:view', 'data:export', 'blueprint:view'], createdAt: '2024-05-15' },
  { id: 6, name: '商户', isSuperAdmin: false, userCount: 74, description: '查看本店设备状态', permissions: ['dashboard:view', 'device:view:own', 'alarm:view:own'], createdAt: '2024-06-01' },
];

// 菜单权限
const menuPermissions = [
  { id: 'dashboard', name: '首页', actions: ['view'] },
  { id: 'merchants', name: '商户管理', actions: ['view', 'add', 'edit', 'delete'] },
  { id: 'device', name: '设备管理', actions: ['view', 'add', 'edit', 'delete', 'config'] },
  { id: 'alarm', name: '报警管理', actions: ['view', 'acknowledge', 'resolve'] },
  { id: 'task', name: '任务管理', actions: ['view', 'add', 'assign', 'approve'] },
  { id: 'report', name: '报表管理', actions: ['view', 'export'] },
  { id: 'system', name: '系统管理', actions: ['view', 'manage'] },
];

export default function RoleManagePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<typeof mockRoles[0] | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  // 过滤角色
  const filteredRoles = mockRoles.filter(role =>
    role.name.includes(searchTerm)
  );

  // 打开角色详情
  const handleViewRole = (role: typeof mockRoles[0]) => {
    setSelectedRole(role);
    setEditPermissions(role.permissions);
  };

  // 切换权限
  const togglePermission = (perm: string) => {
    if (editPermissions.includes(perm)) {
      setEditPermissions(editPermissions.filter(p => p !== perm));
    } else {
      setEditPermissions([...editPermissions, perm]);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E5E5E5]">角色管理</h1>
            <p className="text-[#A0A0A0] text-sm mt-1">管理系统角色和权限配置</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowRoleModal(true); setSelectedRole(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加角色
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0078D4]/10">
                <Shield className="w-5 h-5 text-[#0078D4]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">角色总数</p>
                <p className="text-2xl font-bold text-[#E5E5E5]">{mockRoles.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#9C27B0]/10">
                <Shield className="w-5 h-5 text-[#9C27B0]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">超级管理员</p>
                <p className="text-2xl font-bold text-[#9C27B0]">1</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0078D4]/10">
                <Users className="w-5 h-5 text-[#0078D4]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">普通角色</p>
                <p className="text-2xl font-bold text-[#0078D4]">{mockRoles.length - 1}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#4CAF50]/10">
                <Users className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">用户总数</p>
                <p className="text-2xl font-bold text-[#4CAF50]">{mockRoles.reduce((sum, r) => sum + r.userCount, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索 */}
        <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C6C6C]" />
            <input
              type="text"
              placeholder="搜索角色名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
            />
          </div>
        </div>

        {/* 角色列表 */}
        <div className="grid grid-cols-3 gap-4">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="bg-[#1E1E1E] rounded-lg p-5 border border-[#2D2D2D] hover:border-[#0078D4]/50 transition-all cursor-pointer"
              onClick={() => handleViewRole(role)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-3 rounded-lg',
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

              <p className="text-[#A0A0A0] text-sm mb-4">{role.description}</p>

              {/* 权限预览 */}
              <div className="flex flex-wrap gap-1 mb-4">
                {role.permissions.slice(0, 5).map((perm, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-[#2D2D2D] text-[#A0A0A0] text-xs rounded">
                    {perm}
                  </span>
                ))}
                {role.permissions.length > 5 && (
                  <span className="px-2 py-0.5 text-[#6C6C6C] text-xs">
                    +{role.permissions.length - 5}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#2D2D2D]">
                <span className="text-[#6C6C6C] text-xs">创建于 {role.createdAt}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedRole(role); setShowRoleModal(true); }}
                    className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!role.isSuperAdmin && (
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#D32F2F] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 角色详情弹窗 */}
        {selectedRole && !showRoleModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedRole(null)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[600px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-3 rounded-lg',
                    selectedRole.isSuperAdmin ? 'bg-[#9C27B0]/10' : 'bg-[#0078D4]/10'
                  )}>
                    <Shield className={cn(
                      'w-6 h-6',
                      selectedRole.isSuperAdmin ? 'text-[#9C27B0]' : 'text-[#0078D4]'
                    )} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#E5E5E5]">{selectedRole.name}</h2>
                    <p className="text-[#6C6C6C] text-sm">{selectedRole.description}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-[#E5E5E5] font-semibold mb-4">权限配置</h3>
                <div className="space-y-4">
                  {menuPermissions.map((menu) => (
                    <div key={menu.id} className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[#E5E5E5] font-medium">{menu.name}</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRole.permissions.includes(`${menu.id}:*`) || menu.actions.every(a => selectedRole.permissions.includes(`${menu.id}:${a}`))}
                            onChange={() => {}}
                            className="w-4 h-4 accent-[#0078D4]"
                          />
                          <span className="text-[#6C6C6C] text-sm">全选</span>
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {menu.actions.map((action) => (
                          <label key={action} className="flex items-center gap-2 px-3 py-1.5 bg-[#1E1E1E] rounded cursor-pointer hover:bg-[#2D2D2D]">
                            <input
                              type="checkbox"
                              checked={selectedRole.permissions.includes(`${menu.id}:${action}`)}
                              className="w-3 h-3 accent-[#0078D4]"
                            />
                            <span className="text-[#A0A0A0] text-sm">
                              {action === 'view' && '查看'}
                              {action === 'add' && '新增'}
                              {action === 'edit' && '编辑'}
                              {action === 'delete' && '删除'}
                              {action === 'config' && '配置'}
                              {action === 'acknowledge' && '确认'}
                              {action === 'resolve' && '处理'}
                              {action === 'assign' && '分配'}
                              {action === 'approve' && '审批'}
                              {action === 'manage' && '管理'}
                              {action === 'export' && '导出'}
                              {action === 'view:own' && '查看(本店)'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                >
                  关闭
                </button>
                <button className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors">
                  编辑权限
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 添加/编辑角色弹窗 */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowRoleModal(false)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[500px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
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
                  <label className="block text-[#A0A0A0] text-sm mb-2">角色描述</label>
                  <textarea
                    rows={3}
                    defaultValue={selectedRole?.description || ''}
                    placeholder="请输入角色描述"
                    className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4] resize-none"
                  />
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
