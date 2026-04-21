/**
 * 任务接收 API
 * 施工员接收任务，记录操作
 */

import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 检查 Supabase 是否配置
const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

let supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// 获取当前登录用户信息（通过 Authorization header）
async function getCurrentUser(authHeader: string | null) {
  if (!supabase || !authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  // 简化验证：直接查询用户
  const { data: user } = await supabase
    .from('users')
    .select('id, name, role')
    .eq('id', token)
    .single();
  
  return user;
}

// 接收任务
export async function POST(request: Request) {
  try {
    // 如果 Supabase 未配置，返回错误
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        message: '数据库未配置，无法接收任务' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { taskId, operatorId, operatorName, operatorRole } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, message: '缺少任务ID' }, { status: 400 });
    }

    // 获取任务信息
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ success: false, message: '任务不存在' }, { status: 404 });
    }

    const currentTask = task as { status: string; assignee_id?: string; assignee_name?: string; };
    
    // 检查任务状态
    if (currentTask.status !== 'pending') {
      return NextResponse.json({ 
        success: false, 
        message: `任务当前状态为【${getStatusText(currentTask.status)}】，无法接收`, 
        currentStatus: currentTask.status 
      }, { status: 400 });
    }

    // 检查是否已被其他人接收
    if (currentTask.assignee_id && currentTask.assignee_id !== operatorId) {
      return NextResponse.json({ 
        success: false, 
        message: `该任务已被【${currentTask.assignee_name}】接收`, 
        assignee: currentTask.assignee_name 
      }, { status: 400 });
    }

    const oldStatus = currentTask.status;
    const newStatus = 'processing'; // 接收后直接进入处理中

    // 更新任务状态
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', taskId);

    if (updateError) {
      console.error('更新任务状态失败:', updateError);
      return NextResponse.json({ success: false, message: '接收失败' }, { status: 500 });
    }

    // 记录操作到 task_records
    const { error: recordError } = await supabase
      .from('task_records')
      .insert({
        task_id: taskId,
        action: 'received',
        operator_id: operatorId,
        operator_name: operatorName,
        operator_role: operatorRole || 'installer',
        content: `接收了任务，开始处理`,
        old_status: oldStatus,
        new_status: newStatus,
      });

    if (recordError) {
      console.error('记录操作失败:', recordError);
      // 不影响主流程，仅记录错误
    }

    return NextResponse.json({ 
      success: true, 
      message: '任务已接收',
      taskId,
      oldStatus,
      newStatus,
    });
  } catch (error) {
    console.error('接收任务 API 错误:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

// 获取状态文本
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待接收',
    received: '已接收',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return statusMap[status] || status;
}
