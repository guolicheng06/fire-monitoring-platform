/**
 * 生成二维码 API
 */

import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') || '';
    const size = parseInt(searchParams.get('size') || '200', 10);
    const margin = parseInt(searchParams.get('margin') || '2', 10);

    if (!text) {
      return NextResponse.json(
        { success: false, message: '缺少 text 参数' },
        { status: 400 }
      );
    }

    // 生成二维码
    const qrCodeDataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: margin,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    return NextResponse.json({
      success: true,
      data: qrCodeDataUrl,
    });
  } catch (error) {
    console.error('生成二维码失败:', error);
    return NextResponse.json(
      { success: false, message: '生成二维码失败' },
      { status: 500 }
    );
  }
}
