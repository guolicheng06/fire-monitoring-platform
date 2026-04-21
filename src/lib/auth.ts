/**
 * 用户认证和权限管理数据库操作
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// 角色权限定义
export const ROLE_PERMISSIONS = {
  admin: {
    roleCode: 'admin',
    roleName: '管理员',
    description: '系统管理员，拥有所有权限',
    permissions: [
      'dashboard:view',
      'devices:view', 'devices:add', 'devices:edit', 'devices:delete',
      'alarms:view', 'alarms:acknowledge', 'alarms:resolve',
      'merchants:view', 'merchants:add', 'merchants:edit', 'merchants:delete',
      'tasks:view', 'tasks:add', 'tasks:edit', 'tasks:assign',
      'users:view', 'users:add', 'users:edit', 'users:delete',
      'settings:view', 'settings:edit',
      'reports:view', 'reports:export',
      'ai:use', 'ai:risk',
    ],
  },
  property_manager: {
    roleCode: 'property_manager',
    roleName: '物业管理员',
    description: '物业管理负责人',
    permissions: [
      'dashboard:view',
      'devices:view', 'devices:add', 'devices:edit',
      'alarms:view', 'alarms:acknowledge', 'alarms:resolve',
      'merchants:view', 'merchants:edit',
      'tasks:view', 'tasks:add', 'tasks:edit',
      'reports:view', 'reports:export',
      'ai:use',
    ],
  },
  technician: {
    roleCode: 'technician',
    roleName: '施工员',
    description: '设备维护技术人员',
    permissions: [
      'dashboard:view',
      'devices:view', 'devices:edit',
      'alarms:view', 'alarms:acknowledge',
      'merchants:view',
      'tasks:view', 'tasks:edit',
      'ai:use',
    ],
  },
  owner: {
    roleCode: 'owner',
    roleName: '业主',
    description: '商户业主',
    permissions: [
      'dashboard:view',
      'devices:view',
      'alarms:view',
      'merchants:view',
      'ai:use',
    ],
  },
  viewer: {
    roleCode: 'viewer',
    roleName: '访客',
    description: '只读访客',
    permissions: [
      'dashboard:view',
      'devices:view',
      'alarms:view',
      'merchants:view',
    ],
  },
};

// 角色类型
export type RoleCode = keyof typeof ROLE_PERMISSIONS;

// 用户信息
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  realName: string | null;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

// 用户完整信息（包含角色）
export interface UserWithRoles extends UserInfo {
  roles: Array<{
    roleId: string;
    roleCode: string;
    roleName: string;
    permissions: string[];
    customerId: string | null;
  }>;
}

// 简单的密码哈希（生产环境应使用bcrypt）
function simpleHash(password: string): string {
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) + hash) ^ password.charCodeAt(i);
  }
  // 使用更安全的转换方式
  const hexHash = (hash >>> 0).toString(16).padStart(8, '0');
  return 'hash_' + hexHash;
}

// 验证密码
function verifyPassword(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

/**
 * 用户认证操作
 */
export const authOps = {
  /**
   * 登录
   */
  async login(username: string, password: string): Promise<{
    success: boolean;
    user?: UserWithRoles;
    token?: string;
    message: string;
  }> {
    const client = getSupabaseClient();

    // 查找用户
    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (userError) {
      return { success: false, message: '查询用户失败' };
    }

    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }

    // 验证密码
    if (!user.password_hash || !verifyPassword(password, user.password_hash)) {
      return { success: false, message: '用户名或密码错误' };
    }

    // 检查用户状态
    if (!user.is_active) {
      return { success: false, message: '账号已被禁用' };
    }

    // 更新最后登录时间
    await client
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // 获取用户角色
    const { data: userRoles, error: rolesError } = await client
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', user.id);

    if (rolesError) {
      return { success: false, message: '获取用户角色失败' };
    }

    // 构建用户信息
    const userWithRoles: UserWithRoles = {
      id: user.id,
      username: user.username,
      email: user.email,
      realName: user.real_name,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.is_active,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      roles: userRoles?.map((ur: Record<string, unknown>) => {
        const role = ur.roles as Record<string, unknown>;
        return {
          roleId: ur.role_id as string,
          roleCode: role.role_code as string,
          roleName: role.role_name as string,
          permissions: (role.permissions as string[]) || [],
          customerId: ur.customer_id as string | null,
        };
      }) || [],
    };

    // 生成简单的 token（实际应使用 JWT）
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      username: user.username,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24小时过期
    })).toString('base64');

    return {
      success: true,
      user: userWithRoles,
      token,
      message: '登录成功',
    };
  },

  /**
   * 注册用户
   */
  async register(
    username: string,
    email: string,
    password: string,
    realName?: string,
    phone?: string
  ): Promise<{
    success: boolean;
    user?: UserInfo;
    message: string;
  }> {
    const client = getSupabaseClient();

    // 检查用户名是否存在
    const { data: existingUser, error: existingError } = await client
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingError) {
      return { success: false, message: '检查用户名失败' };
    }

    if (existingUser) {
      return { success: false, message: '用户名已存在' };
    }

    // 检查邮箱是否存在
    const { data: existingEmail, error: emailError } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (emailError) {
      return { success: false, message: '检查邮箱失败' };
    }

    if (existingEmail) {
      return { success: false, message: '邮箱已被注册' };
    }

    // 创建用户
    const passwordHash = simpleHash(password);
    const { data: newUser, error: insertError } = await client
      .from('users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        real_name: realName || null,
        phone: phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, message: '创建用户失败' };
    }

    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        realName: newUser.real_name,
        phone: newUser.phone,
        avatar: newUser.avatar,
        isActive: newUser.is_active,
        lastLoginAt: newUser.last_login_at,
        createdAt: newUser.created_at,
      },
      message: '注册成功',
    };
  },

  /**
   * 根据ID获取用户
   */
  async getUserById(userId: string): Promise<UserWithRoles | null> {
    const client = getSupabaseClient();

    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user) {
      return null;
    }

    // 获取用户角色
    const { data: userRoles } = await client
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', userId);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      realName: user.real_name,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.is_active,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      roles: userRoles?.map((ur: Record<string, unknown>) => {
        const role = ur.roles as Record<string, unknown>;
        return {
          roleId: ur.role_id as string,
          roleCode: role.role_code as string,
          roleName: role.role_name as string,
          permissions: (role.permissions as string[]) || [],
          customerId: ur.customer_id as string | null,
        };
      }) || [],
    };
  },

  /**
   * 验证 Token
   */
  verifyToken(token: string): { userId: string; username: string; exp: number } | null {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      if (decoded.exp < Date.now()) {
        return null; // Token 过期
      }
      return decoded;
    } catch {
      return null;
    }
  },
};

/**
 * 角色管理操作
 */
export const roleOps = {
  /**
   * 初始化默认角色
   */
  async initDefaultRoles(): Promise<void> {
    const client = getSupabaseClient();

    for (const role of Object.values(ROLE_PERMISSIONS)) {
      const { error } = await client
        .from('roles')
        .upsert(
          {
            role_code: role.roleCode,
            role_name: role.roleName,
            description: role.description,
            permissions: role.permissions,
          },
          { onConflict: 'role_code' }
        );

      if (error) {
        console.error(`初始化角色 ${role.roleCode} 失败:`, error);
      }
    }
  },

  /**
   * 获取所有角色
   */
  async getAllRoles(): Promise<Array<{
    id: string;
    roleCode: string;
    roleName: string;
    description: string | null;
    permissions: string[];
  }>> {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('roles')
      .select('*')
      .order('created_at');

    if (error) {
      throw new Error(`获取角色列表失败: ${error.message}`);
    }

    return (data || []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      roleCode: r.role_code as string,
      roleName: r.role_name as string,
      description: r.description as string | null,
      permissions: (r.permissions as string[]) || [],
    }));
  },

  /**
   * 给用户分配角色
   */
  async assignRole(userId: string, roleCode: string, customerId?: string): Promise<boolean> {
    const client = getSupabaseClient();

    // 查找角色ID
    const { data: role, error: roleError } = await client
      .from('roles')
      .select('id')
      .eq('role_code', roleCode)
      .single();

    if (roleError || !role) {
      return false;
    }

    // 分配角色
    const { error: assignError } = await client
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: role.id,
        customer_id: customerId || null,
      });

    return !assignError;
  },

  /**
   * 移除用户角色
   */
  async removeRole(userId: string, roleId: string): Promise<boolean> {
    const client = getSupabaseClient();

    const { error } = await client
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    return !error;
  },
};

/**
 * 用户管理操作
 */
export const userManagementOps = {
  /**
   * 获取所有用户
   */
  async getAllUsers(): Promise<UserWithRoles[]> {
    const client = getSupabaseClient();

    const { data: users, error } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`获取用户列表失败: ${error.message}`);
    }

    // 获取所有用户的角色
    const userIds = (users || []).map((u: Record<string, unknown>) => u.id as string);
    
    const { data: allUserRoles } = await client
      .from('user_roles')
      .select('*, roles(*)')
      .in('user_id', userIds);

    const userRolesMap = new Map<string, UserWithRoles['roles']>();
    (allUserRoles || []).forEach((ur: Record<string, unknown>) => {
      const role = ur.roles as Record<string, unknown>;
      const userId = ur.user_id as string;
      if (!userRolesMap.has(userId)) {
        userRolesMap.set(userId, []);
      }
      userRolesMap.get(userId)!.push({
        roleId: ur.role_id as string,
        roleCode: role.role_code as string,
        roleName: role.role_name as string,
        permissions: (role.permissions as string[]) || [],
        customerId: ur.customer_id as string | null,
      });
    });

    return (users || []).map((u: Record<string, unknown>) => ({
      id: u.id as string,
      username: u.username as string,
      email: u.email as string,
      realName: u.real_name as string | null,
      phone: u.phone as string | null,
      avatar: u.avatar as string | null,
      isActive: u.is_active as boolean,
      lastLoginAt: u.last_login_at as string | null,
      createdAt: u.created_at as string,
      roles: userRolesMap.get(u.id as string) || [],
    }));
  },

  /**
   * 创建用户
   */
  async createUser(
    username: string,
    email: string,
    password: string,
    realName?: string,
    phone?: string,
    isActive: boolean = true
  ): Promise<{ success: boolean; user?: UserInfo; message: string }> {
    return authOps.register(username, email, password, realName, phone);
  },

  /**
   * 更新用户
   */
  async updateUser(
    userId: string,
    updates: {
      realName?: string;
      phone?: string;
      isActive?: boolean;
    }
  ): Promise<boolean> {
    const client = getSupabaseClient();

    const updateData: Record<string, unknown> = {};
    if (updates.realName !== undefined) updateData.real_name = updates.realName;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { error } = await client
      .from('users')
      .update(updateData)
      .eq('id', userId);

    return !error;
  },

  /**
   * 删除用户
   */
  async deleteUser(userId: string): Promise<boolean> {
    const client = getSupabaseClient();

    // 先删除用户角色
    await client.from('user_roles').delete().eq('user_id', userId);

    // 删除用户
    const { error } = await client.from('users').delete().eq('id', userId);

    return !error;
  },

  /**
   * 重置密码
   */
  async resetPassword(userId: string, newPassword: string): Promise<boolean> {
    const client = getSupabaseClient();

    const passwordHash = simpleHash(newPassword);
    const { error } = await client
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId);

    return !error;
  },
};

/**
 * 从请求中获取当前用户信息（通过 Cookie）
 */
export async function getCurrentUserFromRequest(request: Request): Promise<UserWithRoles | null> {
  const client = getSupabaseClient();
  
  // 从 Cookie 获取 token
  const cookies = request.headers.get('cookie') || '';
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  
  if (!tokenMatch) {
    return null;
  }

  try {
    // 从 Cookie 获取 token（处理 URL 编码）
    const cookies = request.headers.get('cookie') || '';
    const tokenMatch = cookies.match(/auth_token=([^;]+)/);
    
    if (!tokenMatch) {
      return null;
    }

    // URL 解码后 base64 解码
    const encodedToken = tokenMatch[1];
    const decodedToken = decodeURIComponent(encodedToken);
    const tokenData = JSON.parse(Buffer.from(decodedToken, 'base64').toString());
    
    if (!tokenData.userId || !tokenData.exp || tokenData.exp < Date.now()) {
      return null;
    }

    // 获取用户信息
    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('id', tokenData.userId)
      .maybeSingle();

    if (userError || !user) {
      return null;
    }

    // 获取用户角色
    const { data: userRoles } = await client
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', user.id);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      realName: user.real_name,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.is_active,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      roles: userRoles?.map((ur: Record<string, unknown>) => {
        const role = ur.roles as Record<string, unknown>;
        return {
          roleId: ur.role_id as string,
          roleCode: role.role_code as string,
          roleName: role.role_name as string,
          permissions: (role.permissions as string[]) || [],
          customerId: ur.customer_id as string | null,
        };
      }) || [],
    };
  } catch {
    return null;
  }
}

/**
 * 判断用户是否为管理员（admin 或 property_manager）
 */
export function isAdmin(user: UserWithRoles | null): boolean {
  if (!user) return false;
  return user.roles.some(r => r.roleCode === 'admin' || r.roleCode === 'property_manager');
}

/**
 * 获取用户关联的商户ID列表
 * 业主只能看到自己关联的商户，管理员可以看到所有
 */
export function getUserCustomerIds(user: UserWithRoles | null): string[] | null {
  if (!user) return null;
  
  // 管理员可以看到所有商户
  if (isAdmin(user)) {
    return null; // null 表示不限制
  }

  // 非管理员只能看到自己关联的商户
  const customerIds = user.roles
    .map(r => r.customerId)
    .filter((id): id is string => id !== null);

  return customerIds.length > 0 ? customerIds : [];
}
