'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Search, Plus, Shield, Check, UserCog, Users,
  Edit, Trash2, Eye, ChevronRight, ChevronDown, Filter
} from 'lucide-react';

// 菜单树数据
const menuTree = [
  {
    id: 'dashboard',
    name: '首页',
    icon: 'Home',
    children: [
      { id: 'dashboard:view', name: '查看首页', type: 'action' }
    ]
  },
  {
    id: 'region',
    name: '区域管理',
    icon: 'Building',
    children: [
      { id: 'merchants:view', name: '查看商户', type: 'action' },
      { id: 'merchants:add', name: '新增商户', type: 'action' },
      { id: 'merchants:edit', name: '编辑商户', type: 'action' },
      { id: 'merchants:delete', name: '删除商户', type: 'action' },
      { id: 'risk-level:view', name: '查看风险分级', type: 'action' },
    ]
  },
  {
    id: 'device',
    name: '设备管理',
    icon: 'Device',
    children: [
      { id: 'gas-device:view', name: '查看燃气设备', type: 'action' },
      { id: 'fire-device:view', name: '查看火灾报警', type: 'action' },
      { id: 'device-status:view', name: '查看设备监控', type: 'action' },
      { id: 'device:add', name: '新增设备', type: 'action' },
      { id: 'device:edit', name: '编辑设备', type: 'action' },
      { id: 'device:delete', name: '删除设备', type: 'action' },
      { id: 'device:config', name: '设备配置', type: 'action' },
    ]
  },
  {
    id: 'alarm',
    name: '报警管理',
    icon: 'Bell',
    children: [
      { id: 'alarm:view', name: '查看报警', type: 'action' },
      { id: 'alarm:acknowledge', name: '确认报警', type: 'action' },
      { id: 'alarm:resolve', name: '处理报警', type: 'action' },
    ]
  },
  {
    id: 'task',
    name: '任务管理',
    icon: 'Task',
    children: [
      { id: 'task:view', name: '查看任务', type: 'action' },
      { id: 'task:add', name: '创建任务', type: 'action' },
      { id: 'task:assign', name: '分配任务', type: 'action' },
      { id: 'task:approve', name: '审批任务', type: 'action' },
      { id: 'task:receive', name: '接收任务', type: 'action' },
    ]
  },
  {
    id: 'system',
    name: '系统管理',
    icon: 'Settings',
    children: [
      { id: 'user-manage:view', name: '用户管理', type: 'action' },
      { id: 'role-manage:view', name: '角色管理', type: 'action' },
      { id: 'permission-manage:view', name: '权限管理', type: 'action' },
      { id: 'system:manage', name: '系统管理', type: 'action' },
    ]
  },
  {
    id: 'ai',
    name: 'AI模块',
    icon: 'AI',
    children: [
      { id: 'ai-chat:view', name: 'AI对话', type: 'action' },
      { id: 'ai-risk:view', name: 'AI风险评估', type: 'action' },
    ]
  },
];

// 角色权限数据
const rolePermissions: Record<string, string[]> = {
  '超级管理员': menuTree.flatMap(m => m.children.map(c => c.id)),
  '施工员': ['dashboard:view', 'gas-device:view', 'fire-device:view', 'device-status:view', 'alarm:view', 'task:view', 'task:receive'],
  '物业管理员': ['dashboard:view', 'merchants:view', 'gas-device:view', 'fire-device:view', 'device-status:view', 'alarm:view', 'alarm:acknowledge', 'task:view'],
  '工程监理': ['dashboard:view', 'device:view', 'task:view', 'task:approve', 'ai-risk:view'],
  '设计人员': ['dashboard:view', 'merchants:view', 'device:view', 'ai-chat:view', 'ai-risk:view'],
  '商户': ['dashboard:view', 'merchants:view:own', 'device:view:own', 'alarm:view:own'],
};

export default function PermissionManagePage() {
  const [selectedRole, setSelectedRole] = useState<string>('施工员');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard', 'region', 'device']);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);

  // 初始化临时权限
  useState(() => {
    setTempPermissions(rolePermissions[selectedRole] || []);
  });

  // 切换菜单展开
  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // 切换权限
  const togglePermission = (permId: string) => {
    if (tempPermissions.includes(permId)) {
      setTempPermissions(tempPermissions.filter(p => p !== permId));
    } else {
      setTempPermissions([...tempPermissions, permId]);
    }
  };

  // 全选/取消菜单下的权限
  const toggleMenuAll = (menu: typeof menuTree[0]) => {
    const menuPerms = menu.children.map(c => c.id);
    const allSelected = menuPerms.every(p => tempPermissions.includes(p));
    if (allSelected) {
      setTempPermissions(tempPermissions.filter(p => !menuPerms.includes(p)));
    } else {
      const newPerms = [...new Set([...tempPermissions, ...menuPerms])];
      setTempPermissions(newPerms);
    }
  };

  const roles = Object.keys(rolePermissions);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E5E5E5]">权限管理</h1>
            <p className="text-[#A0A0A0] text-sm mt-1">配置各角色的菜单和操作权限</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* 左侧 - 角色列表 */}
          <div className="col-span-3">
            <div className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D] overflow-hidden">
              <div className="p-4 border-b border-[#2D2D2D]">
                <h3 className="text-[#E5E5E5] font-semibold">选择角色</h3>
              </div>
              <div className="divide-y divide-[#2D2D2D]">
                {roles.map((role) => (
                  <div
                    key={role}
                    className={cn(
                      'p-4 cursor-pointer transition-colors',
                      selectedRole === role
                        ? 'bg-[#0078D4]/10 border-l-2 border-[#0078D4]'
                        : 'hover:bg-[#2A2A2A] border-l-2 border-transparent'
                    )}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className={cn(
                        'w-4 h-4',
                        selectedRole === role ? 'text-[#0078D4]' : 'text-[#A0A0A0]'
                      )} />
                      <span className={cn(
                        'text-sm',
                        selectedRole === role ? 'text-[#E5E5E5] font-medium' : 'text-[#A0A0A0]'
                      )}>
                        {role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧 - 权限配置 */}
          <div className="col-span-9">
            <div className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D]">
              <div className="p-4 border-b border-[#2D2D2D] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#0078D4]" />
                  <h3 className="text-[#E5E5E5] font-semibold">{selectedRole} - 权限配置</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#A0A0A0] text-sm">
                    已选 {tempPermissions.length} 项权限
                  </span>
                </div>
              </div>

              {/* 菜单权限树 */}
              <div className="p-4 max-h-[600px] overflow-y-auto">
                <div className="space-y-2">
                  {menuTree.map((menu) => {
                    const isExpanded = expandedMenus.includes(menu.id);
                    const menuPerms = menu.children.map(c => c.id);
                    const selectedCount = menuPerms.filter(p => tempPermissions.includes(p)).length;
                    const isAllSelected = selectedCount === menuPerms.length;

                    return (
                      <div key={menu.id} className="border border-[#2D2D2D] rounded-lg overflow-hidden">
                        {/* 菜单头 */}
                        <div
                          className={cn(
                            'flex items-center gap-3 p-4 cursor-pointer transition-colors',
                            isExpanded ? 'bg-[#2A2A2A]' : 'hover:bg-[#222222]'
                          )}
                          onClick={() => toggleMenu(menu.id)}
                        >
                          <div className="flex-1 flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={() => toggleMenuAll(menu)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 accent-[#0078D4]"
                            />
                            <span className="text-[#E5E5E5] font-medium">{menu.name}</span>
                            <span className="text-[#6C6C6C] text-xs">
                              ({selectedCount}/{menuPerms.length})
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#A0A0A0]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#A0A0A0]" />
                          )}
                        </div>

                        {/* 操作权限 */}
                        {isExpanded && (
                          <div className="p-4 pt-2 grid grid-cols-4 gap-2 bg-[#1E1E1E]">
                            {menu.children.map((child) => (
                              <label
                                key={child.id}
                                className={cn(
                                  'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
                                  tempPermissions.includes(child.id)
                                    ? 'bg-[#0078D4]/10 text-[#0078D4]'
                                    : 'hover:bg-[#2A2A2A]'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={tempPermissions.includes(child.id)}
                                  onChange={() => togglePermission(child.id)}
                                  className="w-3 h-3 accent-[#0078D4]"
                                />
                                <span className="text-xs">{child.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 保存按钮 */}
              <div className="p-4 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors">
                  重置
                </button>
                <button className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors">
                  保存配置
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
