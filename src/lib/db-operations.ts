import { getSupabaseClient } from '@/storage/database/supabase-client';

// 商户类型定义
export interface Customer {
  id: string;
  name: string;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
  district?: string;
  risk_level: 'low' | 'medium' | 'high';
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

// 设备类型定义
export interface Device {
  id: string;
  device_code: string;
  device_type: 'fire_alarm' | 'gas_detector' | 'temperature_detector' | 'smoke_detector' | 'yak300_gas' | 'yak300_rtu' | 'yak300_4g';
  device_name: string;
  customer_id: string;
  location?: string;
  install_date?: string;
  last_maintenance_date?: string;
  status: 'online' | 'offline' | 'fault';
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

// 报警记录类型定义
export interface AlarmRecord {
  id: string;
  device_id: string;
  customer_id: string;
  alarm_type: string;
  alarm_level: 'info' | 'warning' | 'danger' | 'critical';
  alarm_message?: string;
  alarm_value?: string;
  location?: string;
  status: 'pending' | 'acknowledged' | 'resolved' | 'closed';
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution?: string;
  created_at: string;
  updated_at?: string;
}

// 维护记录类型定义
export interface MaintenanceRecord {
  id: string;
  device_id: string;
  maintenance_type: 'routine' | 'repair' | 'inspection';
  description?: string;
  technician?: string;
  result: 'completed' | 'pending' | 'failed';
  created_at: string;
  updated_at?: string;
}

// 商户操作
export const customerOps = {
  // 获取所有商户
  async getAll(): Promise<Customer[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`获取商户列表失败: ${error.message}`);
    return data as Customer[];
  },

  // 根据ID获取商户
  async getById(id: string): Promise<Customer | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`获取商户详情失败: ${error.message}`);
    return data as Customer | null;
  },

  // 创建商户
  async create(customer: Partial<Customer>): Promise<Customer> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customers')
      .insert(customer)
      .select()
      .single();
    if (error) throw new Error(`创建商户失败: ${error.message}`);
    return data as Customer;
  },

  // 更新商户
  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`更新商户失败: ${error.message}`);
    return data as Customer;
  },

  // 获取商户统计
  async getStats(): Promise<{ total: number; byDistrict: Record<string, number>; byRiskLevel: Record<string, number> }> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('customers').select('*');
    if (error) throw new Error(`获取商户统计失败: ${error.message}`);
    
    const total = data.length;
    const byDistrict: Record<string, number> = {};
    const byRiskLevel: Record<string, number> = {};
    
    for (const c of data) {
      byDistrict[c.district || 'unknown'] = (byDistrict[c.district || 'unknown'] || 0) + 1;
      byRiskLevel[c.risk_level] = (byRiskLevel[c.risk_level] || 0) + 1;
    }
    
    return { total, byDistrict, byRiskLevel };
  },
};

// 设备操作
export const deviceOps = {
  // 获取所有设备（可选：按商户ID过滤）
  async getAll(customerIds?: string[]): Promise<Device[]> {
    const client = getSupabaseClient();
    
    let query = client
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    // 如果指定了商户ID列表，只返回这些商户的设备
    if (customerIds && customerIds.length > 0) {
      query = query.in('customer_id', customerIds);
    }

    const { data, error } = await query;
    if (error) throw new Error(`获取设备列表失败: ${error.message}`);
    return data as Device[];
  },

  // 根据ID获取设备
  async getById(id: string): Promise<Device | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('devices')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`获取设备详情失败: ${error.message}`);
    return data as Device | null;
  },

  // 根据商户ID获取设备
  async getByCustomer(customerId: string): Promise<Device[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('devices')
      .select('*')
      .eq('customer_id', customerId);
    if (error) throw new Error(`获取设备列表失败: ${error.message}`);
    return data as Device[];
  },

  // 根据设备编码获取设备
  async getByCode(deviceCode: string): Promise<Device | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('devices')
      .select('*')
      .eq('device_code', deviceCode)
      .maybeSingle();
    if (error) throw new Error(`获取设备详情失败: ${error.message}`);
    return data as Device | null;
  },

  // 创建设备
  async create(device: Partial<Device>): Promise<Device> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('devices')
      .insert(device)
      .select()
      .single();
    if (error) throw new Error(`创建设备失败: ${error.message}`);
    return data as Device;
  },

  // 更新设备
  async update(id: string, updates: Partial<Device>): Promise<Device> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('devices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`更新设备失败: ${error.message}`);
    return data as Device;
  },

  // 更新设备状态
  async updateStatus(id: string, status: 'online' | 'offline' | 'fault'): Promise<Device> {
    return this.update(id, { status });
  },

  // 获取设备统计
  async getStats(): Promise<{ total: number; online: number; offline: number; fault: number; byType: Record<string, number> }> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('devices').select('*');
    if (error) throw new Error(`获取设备统计失败: ${error.message}`);
    
    const total = data.length;
    const online = data.filter((d: Device) => d.status === 'online').length;
    const offline = data.filter((d: Device) => d.status === 'offline').length;
    const fault = data.filter((d: Device) => d.status === 'fault').length;
    const byType: Record<string, number> = {};
    
    for (const d of data) {
      byType[d.device_type] = (byType[d.device_type] || 0) + 1;
    }
    
    return { total, online, offline, fault, byType };
  },
};

// 报警记录操作
export const alarmOps = {
  // 获取所有报警记录（可选：按商户ID过滤）
  async getAll(limit = 100, customerIds?: string[]): Promise<AlarmRecord[]> {
    const client = getSupabaseClient();
    
    let query = client
      .from('alarm_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // 如果指定了商户ID列表，只返回这些商户的报警
    if (customerIds && customerIds.length > 0) {
      query = query.in('customer_id', customerIds);
    }

    const { data, error } = await query;
    if (error) throw new Error(`获取报警记录失败: ${error.message}`);
    return data as AlarmRecord[];
  },

  // 获取待处理报警
  async getPending(): Promise<AlarmRecord[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('alarm_records')
      .select('*')
      .in('status', ['pending', 'acknowledged'])
      .order('created_at', { ascending: false });
    if (error) throw new Error(`获取待处理报警失败: ${error.message}`);
    return data as AlarmRecord[];
  },

  // 根据设备ID获取报警记录
  async getByDevice(deviceId: string): Promise<AlarmRecord[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('alarm_records')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`获取报警记录失败: ${error.message}`);
    return data as AlarmRecord[];
  },

  // 创建报警记录
  async create(alarm: Partial<AlarmRecord>): Promise<AlarmRecord> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('alarm_records')
      .insert(alarm)
      .select()
      .single();
    if (error) throw new Error(`创建报警记录失败: ${error.message}`);
    return data as AlarmRecord;
  },

  // 确认报警
  async acknowledge(id: string, acknowledgedBy: string): Promise<AlarmRecord> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('alarm_records')
      .update({
        status: 'acknowledged',
        acknowledged_by: acknowledgedBy,
        acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`确认报警失败: ${error.message}`);
    return data as AlarmRecord;
  },

  // 处理报警
  async resolve(id: string, resolvedBy: string, resolution: string): Promise<AlarmRecord> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('alarm_records')
      .update({
        status: 'resolved',
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        resolution,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`处理报警失败: ${error.message}`);
    return data as AlarmRecord;
  },

  // 获取报警统计
  async getStats(): Promise<{ 
    total: number; 
    pending: number; 
    byLevel: Record<string, number>; 
    byType: Record<string, number>;
    todayCount: number;
  }> {
    const client = getSupabaseClient();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await client.from('alarm_records').select('*');
    if (error) throw new Error(`获取报警统计失败: ${error.message}`);
    
    const total = data.length;
    const pending = data.filter((a: AlarmRecord) => a.status === 'pending').length;
    const byLevel: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let todayCount = 0;
    
    for (const a of data) {
      byLevel[a.alarm_level] = (byLevel[a.alarm_level] || 0) + 1;
      byType[a.alarm_type] = (byType[a.alarm_type] || 0) + 1;
      if (new Date(a.created_at) >= today) {
        todayCount++;
      }
    }
    
    return { total, pending, byLevel, byType, todayCount };
  },
};

// 维护记录操作
export const maintenanceOps = {
  // 获取所有维护记录
  async getAll(limit = 100): Promise<MaintenanceRecord[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('maintenance_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`获取维护记录失败: ${error.message}`);
    return data as MaintenanceRecord[];
  },

  // 根据设备ID获取维护记录
  async getByDevice(deviceId: string): Promise<MaintenanceRecord[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('maintenance_records')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`获取维护记录失败: ${error.message}`);
    return data as MaintenanceRecord[];
  },

  // 创建维护记录
  async create(record: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('maintenance_records')
      .insert(record)
      .select()
      .single();
    if (error) throw new Error(`创建维护记录失败: ${error.message}`);
    return data as MaintenanceRecord;
  },
};
