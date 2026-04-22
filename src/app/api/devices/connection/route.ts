/**
 * 设备连接配置 API
 * 用于管理设备的 Modbus TCP、瑶安 YA-K300 和海湾 GST 连接配置
 * 支持瑶安云平台连接
 */

import { NextResponse } from 'next/server';
import { deviceOps } from '@/lib/db-operations';

// 获取所有设备的连接配置
export async function GET() {
  try {
    const devices = await deviceOps.getAll();
    
    // 返回设备的连接配置信息
    const deviceConfigs = devices.map(device => {
      const metadata = device.metadata as Record<string, unknown> | undefined;
      return {
        id: device.id,
        device_code: device.device_code,
        device_name: device.device_name,
        device_type: device.device_type,
        status: device.status,
        connectionType: metadata?.connectionType || 'mock',
        modbusConfig: metadata?.modbusConfig || null,
        yak300Config: metadata?.yak300Config || null,
        yak300RtuConfig: metadata?.yak300RtuConfig || null,
        yak3004GConfig: metadata?.yak3004GConfig || null,
        yak300CloudConfig: metadata?.yak300CloudConfig || null,
        gstConfig: metadata?.gstConfig || null,
        alarmThreshold: metadata?.alarmThreshold || null,
        is_active: device.is_active,
        model: metadata?.model || null,
      };
    });
    
    return NextResponse.json(deviceConfigs);
  } catch (error) {
    console.error('Failed to fetch device configs:', error);
    return NextResponse.json({ error: 'Failed to fetch device configs' }, { status: 500 });
  }
}

// 更新设备连接配置
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { deviceId, connectionType, modbusConfig, yak300Config, yak300RtuConfig, yak3004GConfig, yak300CloudConfig, gstConfig, alarmThreshold, is_active, device_type, model } = body;
    
    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }
    
    // 获取现有设备
    const device = await deviceOps.getById(deviceId);
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }
    
    // 更新元数据
    const metadata = (device.metadata as Record<string, unknown>) || {};
    
    if (connectionType !== undefined) {
      metadata.connectionType = connectionType;
    }
    
    if (modbusConfig !== undefined) {
      metadata.modbusConfig = modbusConfig;
    }
    
    if (yak300Config !== undefined) {
      metadata.yak300Config = yak300Config;
    }

    if (yak300RtuConfig !== undefined) {
      metadata.yak300RtuConfig = yak300RtuConfig;
    }

    if (yak3004GConfig !== undefined) {
      metadata.yak3004GConfig = yak3004GConfig;
    }

    if (yak300CloudConfig !== undefined) {
      metadata.yak300CloudConfig = yak300CloudConfig;
    }

    if (gstConfig !== undefined) {
      metadata.gstConfig = gstConfig;
    }
    
    if (alarmThreshold !== undefined) {
      metadata.alarmThreshold = alarmThreshold;
    }

    if (model !== undefined) {
      metadata.model = model;
    }

    if (device_type !== undefined) {
      metadata.deviceType = device_type;
    }
    
    // 更新设备
    const updatedDevice = await deviceOps.update(deviceId, {
      device_name: body.device_name,
      device_code: body.device_code,
      device_type: body.device_type,
      metadata,
      is_active: is_active !== undefined ? is_active : device.is_active,
    });
    
    return NextResponse.json(updatedDevice);
  } catch (error) {
    console.error('Failed to update device config:', error);
    return NextResponse.json({ error: 'Failed to update device config' }, { status: 500 });
  }
}
