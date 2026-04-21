/**
 * 任务状态更新 API
 * 更新任务状态（开始处理、完成任务、取消等）
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

// 更新任务状态
export async function PUT(request: Request) {
  try {
    // 如果 Supabase 未配置，返回错误
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        message: '数据库未配置，无法更新任务' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { 
      taskId, 
      action,           // 操作类型: start, complete, cancel, assign
      operatorId, 
      operatorName, 
      operatorRole,
      content,          // 操作备注
      result,           // 完成结果（完成任务时使用）
    } = body;

    if (!taskId || !action) {
      return NextResponse.json({ success: false, message: '缺少必要参数' }, { status: 400 });
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

    const typedTask = task as { status: string; assignee_id?: string; assignee_name?: string; id: string; };
    
    let newStatus = typedTask.status;
    let recordAction = action;
    let recordContent = content || '';

    // 根据操作类型确定新状态
    switch (action) {
      case 'start':
        if (typedTask.status !== 'pending' && typedTask.status !== 'received') {
          return NextResponse.json({ success: false, message: '任务当前状态无法开始处理' }, { status: 400 });
        }
        newStatus = 'processing';
        recordContent = content || '开始处理任务';
        break;

      case 'complete':
        if (typedTask.status !== 'processing') {
          return NextResponse.json({ success: false, message: '任务当前状态无法完成' }, { status: 400 });
        }
        newStatus = 'completed';
        recordContent = content || `完成任务，结果：${result || '正常完成'}`;
        break;

      case 'cancel':
        if (typedTask.status === 'completed' || typedTask.status === 'cancelled') {
          return NextResponse.json({ success: false, message: '任务已完成或已取消，无法取消' }, { status: 400 });
        }
        newStatus = 'cancelled';
        recordContent = content || '取消了任务';
        break;

      case 'assign':
        if (body.assigneeId) {
          const { data: assignee } = await supabase
            .from('users')
            .select('name')
            .eq('id', body.assigneeId)
            .single();
          
          const typedAssignee = assignee as { name?: string } | null;
          recordContent = `将任务分配给 ${typedAssignee?.name || '未知'}`;
        }
        break;

      default:
        return NextResponse.json({ success: false, message: '不支持的操作类型' }, { status: 400 });
    }

    // 更新任务
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // 如果是分配操作，添加执行人信息
    if (action === 'assign' && body.assigneeId) {
      (updateData as Record<string, unknown>).assignee_id = body.assigneeId;
      (updateData as Record<string, unknown>).assignee_name = body.assigneeName;
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update(updateData as any)
      .eq('id', taskId);

    if (updateError) {
      console.error('更新任务状态失败:', updateError);
      return NextResponse.json({ success: false, message: '更新失败' }, { status: 500 });
    }

    // 记录操作
    await supabase
      .from('task_records')
      .insert({
        task_id: taskId,
        action: recordAction,
        operator_id: operatorId,
        operator_name: operatorName,
        operator_role: operatorRole || 'user',
        content: recordContent,
        old_status: typedTask.status,
        new_status: newStatus,
      });

    return NextResponse.json({ 
      success: true, 
      message: getActionMessage(action),
      taskId,
      oldStatus: typedTask.status,
      newStatus,
    });
  } catch (error) {
    console.error('更新任务状态 API 错误:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

// 获取操作提示
function getActionMessage(action: string): string {
  const messages: Record<string, string> = {
    start: '任务已开始处理',
    complete: '任务已完成',
    cancel: '任务已取消',
    assign: '任务已分配',
  };
  return messages[action] || '操作成功';
}
