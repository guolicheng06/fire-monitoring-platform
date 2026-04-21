'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Search, Plus, Users, Edit, Trash2, Eye, Shield, UserCog,
  ChevronRight, Check, X, MoreVertical, Mail, Phone, Building,
  Calendar, MapPin, ToggleLeft, ToggleRight, Download
} from 'lucide-react';

// 用户数据
const mockUsers = [
  { id: 1, username: 'admin', name: '张明', phone: '13800138000', email: 'admin@example.com', role: '超级管理员', merchant: '—', status: 'active', lastLogin: '2026-04-10 15:30', avatar: null },
  { id: 2, username: 'engineer1', name: '李伟', phone: '13900139000', email: 'liwei@example.com', role: '施工员', merchant: '—', status: 'active', lastLogin: '2026-04-10 10:15', avatar: null },
  { id: 3, username: 'engineer2', name: '王强', phone: '13700137000', email: 'wangqiang@example.com', role: '施工员', merchant: '—', status: 'active', lastLogin: '2026-04-09 18:00', avatar: null },
  { id: 4, username: 'property1', name: '赵敏', phone: '13600136000', email: 'zhaomin@example.com', role: '物业管理员', merchant: '—', status: 'active', lastLogin: '2026-04-10 09:00', avatar: null },
  { id: 5, username: 'supervisor1', name: '刘洋', phone: '13500135000', email: 'liuyang@example.com', role: '工程监理', merchant: '—', status: 'active', lastLogin: '2026-04-08 14:20', avatar: null },
  { id: 6, username: 'designer1', name: '陈静', phone: '13400134000', email: 'chenjing@example.com', role: '设计人员', merchant: '—', status: 'active', lastLogin: '2026-04-10 11:45', avatar: null },
  { id: 7, username: 'merchant001', name: '孙华', phone: '13300133000', email: 'sunhua@example.com', role: '商户', merchant: '串串香火锅', status: 'active', lastLogin: '2026-04-10 08:30', avatar: null },
  { id: 8, username: 'merchant002', name: '周莉', phone: '13200132000', email: 'zhouli@example.com', role: '商户', merchant: '重庆火锅', status: 'active', lastLogin: '2026-04-09 20:15', avatar: null },
  { id: 9, username: 'merchant003', name: '吴涛', phone: '13100131000', email: 'wutao@example.com', role: '商户', merchant: '烧烤专门店', status: 'inactive', lastLogin: '2026-04-05 10:00', avatar: null },
  { id: 10, username: 'engineer3', name: '郑浩', phone: '13000130000', email: 'zhenghao@example.com', role: '施工员', merchant: '—', status: 'active', lastLogin: '2026-04-10 14:00', avatar: null },
];

// 角色列表
const roles = ['全部', '超级管理员', '施工员', '物业管理员', '工程监理', '设计人员', '商户'];

export default function AdminInfoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('全部');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 过滤数据
  const filteredUsers = mockUsers.filter(user => {
    const matchSearch = user.name.includes(searchTerm) || user.username.includes(searchTerm) || user.phone.includes(searchTerm);
    const matchRole = filterRole === '全部' || user.role === filterRole;
    const matchStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  // 分页
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 统计
  const stats = {
    total: mockUsers.length,
    active: mockUsers.filter(u => u.status === 'active').length,
    inactive: mockUsers.filter(u => u.status === 'inactive').length,
    admin: mockUsers.filter(u => u.role === '超级管理员').length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E5E5E5]">管理员信息</h1>
            <p className="text-[#A0A0A0] text-sm mt-1">管理系统用户账号和基本信息</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors">
              <Download className="w-4 h-4" />
              导出数据
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors">
              <Plus className="w-4 h-4" />
              添加用户
            </button>
          </div>
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
                <p className="text-2xl font-bold text-[#E5E5E5]">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#4CAF50]/10">
                <UserCog className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">活跃用户</p>
                <p className="text-2xl font-bold text-[#4CAF50]">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#6C6C6C]/10">
                <Users className="w-5 h-5 text-[#6C6C6C]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">停用用户</p>
                <p className="text-2xl font-bold text-[#6C6C6C]">{stats.inactive}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#9C27B0]/10">
                <Shield className="w-5 h-5 text-[#9C27B0]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">管理员</p>
                <p className="text-2xl font-bold text-[#9C27B0]">{stats.admin}</p>
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
                  placeholder="搜索姓名、用户名、手机号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#A0A0A0] text-sm">角色:</span>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#A0A0A0] text-sm">状态:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                <option value="all">全部状态</option>
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </div>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#222222]">
              <tr>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">用户信息</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">角色</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">所属商户</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">联系方式</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">状态</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">最后登录</th>
                <th className="px-4 py-3 text-left text-[#A0A0A0] text-xs font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2D2D]">
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#2A2A2A] cursor-pointer transition-colors"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0078D4]/20 flex items-center justify-center">
                        <span className="text-[#0078D4] font-medium text-sm">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-[#E5E5E5] text-sm font-medium">{user.name}</p>
                        <p className="text-[#6C6C6C] text-xs">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className={cn(
                        'w-4 h-4',
                        user.role === '超级管理员' ? 'text-[#9C27B0]' : 'text-[#0078D4]'
                      )} />
                      <span className={cn(
                        'text-sm',
                        user.role === '超级管理员' ? 'text-[#9C27B0]' : 'text-[#E5E5E5]'
                      )}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[#A0A0A0] text-sm">{user.merchant}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-[#E5E5E5] text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#6C6C6C]" />
                        {user.phone}
                      </p>
                      <p className="text-[#6C6C6C] text-xs flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      user.status === 'active'
                        ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
                        : 'bg-[#6C6C6C]/10 text-[#6C6C6C]'
                    )}>
                      {user.status === 'active' ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[#6C6C6C] text-sm">{user.lastLogin}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.role !== '超级管理员' && (
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

          {/* 分页 */}
          <div className="px-4 py-3 border-t border-[#2D2D2D] flex items-center justify-between">
            <span className="text-[#6C6C6C] text-sm">
              共 {filteredUsers.length} 条记录
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#222222] border border-[#3A3A3A] rounded text-[#E5E5E5] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2A2A2A] transition-colors"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-[#E5E5E5] text-sm">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-[#222222] border border-[#3A3A3A] rounded text-[#E5E5E5] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2A2A2A] transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        </div>

        {/* 用户详情弹窗 */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[500px] max-h-[80vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#0078D4]/20 flex items-center justify-center">
                    <span className="text-[#0078D4] font-bold text-xl">
                      {selectedUser.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[#E5E5E5]">{selectedUser.name}</h2>
                    <p className="text-[#6C6C6C] text-sm">@{selectedUser.username}</p>
                  </div>
                  <span className={cn(
                    'px-3 py-1 rounded text-sm font-medium',
                    selectedUser.status === 'active'
                      ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
                      : 'bg-[#6C6C6C]/10 text-[#6C6C6C]'
                  )}>
                    {selectedUser.status === 'active' ? '启用' : '停用'}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                    <p className="text-[#6C6C6C] text-xs mb-1">角色</p>
                    <div className="flex items-center gap-2">
                      <Shield className={cn(
                        'w-4 h-4',
                        selectedUser.role === '超级管理员' ? 'text-[#9C27B0]' : 'text-[#0078D4]'
                      )} />
                      <span className="text-[#E5E5E5] text-sm">{selectedUser.role}</span>
                    </div>
                  </div>
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                    <p className="text-[#6C6C6C] text-xs mb-1">所属商户</p>
                    <p className="text-[#E5E5E5] text-sm">{selectedUser.merchant}</p>
                  </div>
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                    <p className="text-[#6C6C6C] text-xs mb-1">手机号码</p>
                    <p className="text-[#E5E5E5] text-sm">{selectedUser.phone}</p>
                  </div>
                  <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                    <p className="text-[#6C6C6C] text-xs mb-1">邮箱</p>
                    <p className="text-[#E5E5E5] text-sm">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                  <p className="text-[#6C6C6C] text-xs mb-1">账号状态</p>
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-sm',
                      selectedUser.status === 'active' ? 'text-[#4CAF50]' : 'text-[#6C6C6C]'
                    )}>
                      {selectedUser.status === 'active' ? '已启用' : '已停用'}
                    </span>
                    <button className={cn(
                      'p-2 rounded-lg transition-colors',
                      selectedUser.status === 'active'
                        ? 'bg-[#D32F2F]/10 text-[#D32F2F] hover:bg-[#D32F2F]/20'
                        : 'bg-[#4CAF50]/10 text-[#4CAF50] hover:bg-[#4CAF50]/20'
                    )}>
                      {selectedUser.status === 'active' ? '停用账号' : '启用账号'}
                    </button>
                  </div>
                </div>
                <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                  <p className="text-[#6C6C6C] text-xs mb-1">最后登录</p>
                  <p className="text-[#E5E5E5] text-sm">{selectedUser.lastLogin}</p>
                </div>
              </div>
              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                >
                  关闭
                </button>
                <button className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors">
                  编辑用户
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
