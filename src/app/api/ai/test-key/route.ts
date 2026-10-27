import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey: clientApiKey } = body;
    const rawKey = clientApiKey || process.env.GEMINI_API_KEY || '';
    const apiKey = String(rawKey).trim().replace(/^["']|["']$/g, '');

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'NO_API_KEY', message: 'กรุณากรอกหรือระบุ Gemini API Key' },
        { status: 400 }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'ping' }] }]
      })
    });

    if (res.ok) {
      return NextResponse.json({
        success: true,
        message: 'เชื่อมต่อ Gemini API สำเร็จ! Key ถูกต้องและพร้อมใช้งาน'
      });
    }

    const errData = await res.json().catch(() => ({}));
    const rawErrMsg = errData?.error?.message || `HTTP ${res.status}`;
    const reason = errData?.error?.details?.[0]?.reason || '';

    const isApiKeyInvalid = 
      res.status === 400 && (
        reason === 'API_KEY_INVALID' ||
        rawErrMsg.toLowerCase().includes('api key not valid') ||
        rawErrMsg.toLowerCase().includes('api_key_invalid') ||
        rawErrMsg.toLowerCase().includes('invalid api key')
      );

    if (isApiKeyInvalid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'INVALID_API_KEY', 
          message: 'API Key ไม่ถูกต้อง กรุณาคัดลอก Key จาก Google AI Studio อีกครั้ง' 
        },
        { status: 400 }
      );
    }

    if (res.status === 403) {
      return NextResponse.json(
        {
          success: false,
          error: 'PERMISSION_DENIED',
          message: `ไม่มีสิทธิ์เข้าถึง Gemini API (403): ${rawErrMsg}`
        },
        { status: 403 }
      );
    }

    if (res.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: 'QUOTA_EXCEEDED',
          message: 'โควตาใช้งานเต็มชั่วคราว กรุณารอ 1-2 นาทีแล้วลองใหม่'
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'API_ERROR', message: `ทดสอบไม่ผ่าน: ${rawErrMsg}` },
      { status: res.status || 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: err.message || 'ไม่สามารถทดสอบ API Key ได้' },
      { status: 500 }
    );
  }
}
