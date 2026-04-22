/**
 * 任务记录 API
 * 获取任务的详细记录（操作历史）
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

// 获取任务记录列表
export async function GET(request: Request) {
  try {
    // 如果 Supabase 未配置，返回空数据
    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '数据库未配置，返回空数据'
      });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ success: false, message: '缺少任务ID' }, { status: 400 });
    }

    // 查询任务记录
    const { data: records, error } = await supabase
      .from('task_records')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('查询任务记录失败:', error);
      return NextResponse.json({ success: false, message: '查询失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: records || [],
    });
  } catch (error) {
    console.error('任务记录 API 错误:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
