/**
 * 设备管理器重新加载 API
 * 用于在保存设备后重新加载设备管理器中的设备列表
 */

import { NextResponse } from 'next/server';
import { deviceManager } from '@/lib/device-manager';

export async function POST() {
  try {
    // 停止现有的设备轮询
    deviceManager.stop();
    
    // 重新从数据库加载设备
    await deviceManager.loadDevicesFromDb();
    
    // 重新启动设备轮询
    deviceManager.start();
    
    return NextResponse.json({ success: true, message: '设备管理器已重新加载' });
  } catch (error) {
    console.error('[API] Failed to reload device manager:', error);
    return NextResponse.json({ success: false, message: '重新加载失败' }, { status: 500 });
  }
}
