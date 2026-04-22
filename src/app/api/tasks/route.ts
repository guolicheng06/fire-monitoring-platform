/**
 * 任务列表 API
 * 获取任务列表，支持分页和筛选
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 检查 Supabase 是否配置
const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

let supabase: ReturnType<typeof createClient> | null = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// 获取任务列表
export async function GET(request: Request) {
  try {
    // 如果 Supabase 未配置，返回空数据
    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        message: '数据库未配置，返回空数据'
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');      // 状态筛选
    const priority = searchParams.get('priority'); // 优先级筛选
    const assigneeId = searchParams.get('assigneeId'); // 执行人筛选
    const customerId = searchParams.get('customerId'); // 商户筛选
    const search = searchParams.get('search');      // 搜索关键词
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 构建查询
    let query = supabase
      .from('tasks')
      .select(`
        *,
        customer:customers(id, name),
        device:devices(id, device_name, device_code)
      `, { count: 'exact' });

    // 应用筛选条件
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }
    if (assigneeId) {
      query = query.eq('assignee_id', assigneeId);
    }
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // 按创建时间倒序
    query = query.order('created_at', { ascending: false });

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: tasks, error, count } = await query;

    if (error) {
      console.error('查询任务失败:', error);
      return NextResponse.json({ success: false, message: '查询失败', error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: tasks,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('任务列表 API 错误:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

// 创建任务
export async function POST(request: Request) {
  try {
    // 如果 Supabase 未配置，返回错误
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        message: '数据库未配置，无法创建任务' 
      }, { status: 500 });
    }

    const body = await request.json();
    const {
      title,
      description,
      location,
      priority = 'medium',
      assigneeId,
      assigneeName,
      creatorId,
      creatorName,
      deadline,
      customerId,
      deviceId,
    } = body;

    // 生成任务编号
    const { data: lastTask } = await supabase
      .from('tasks')
      .select('task_code')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let taskNumber = 1;
    const typedLastTask = lastTask as { task_code?: string } | null;
    if (typedLastTask?.task_code) {
      const lastNumber = parseInt(typedLastTask.task_code.replace('TASK-', ''));
      taskNumber = lastNumber + 1;
    }
    const taskCode = `TASK-${taskNumber.toString().padStart(4, '0')}`;

    // 创建任务
    const insertData = {
      task_code: taskCode,
      title,
      description,
      location,
      priority,
      status: assigneeId ? 'pending' : 'pending',
      assignee_id: assigneeId,
      assignee_name: assigneeName,
      creator_id: creatorId,
      creator_name: creatorName,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      customer_id: customerId,
      device_id: deviceId,
    };
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(insertData as any)
      .select()
      .single();

    if (taskError) {
      console.error('创建任务失败:', taskError);
      return NextResponse.json({ success: false, message: '创建失败', error: taskError.message }, { status: 500 });
    }

    const typedTask = task as { id: string; task_code: string; } | null;
    if (!typedTask) {
      return NextResponse.json({ success: false, message: '创建任务失败' }, { status: 500 });
    }

    // 记录创建操作
    await supabase
      .from('task_records')
      .insert({
        task_id: typedTask.id,
        action: 'created',
        operator_id: creatorId,
        operator_name: creatorName,
        operator_role: 'creator',
        content: `创建了任务`,
        new_status: 'pending',
      } as any);

    return NextResponse.json({ success: true, data: typedTask });
  } catch (error) {
    console.error('创建任务 API 错误:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
