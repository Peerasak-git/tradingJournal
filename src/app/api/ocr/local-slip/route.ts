import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import { parseOrderSlipText } from '@/lib/orderSlipParser';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'MISSING_IMAGE', message: 'กรุณาอัปโหลดรูปภาพ' },
        { status: 400 }
      );
    }

    // Convert base64 to Buffer
    let cleanBase64 = imageBase64;
    const match = imageBase64.match(/^data:[a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+;base64,(.+)$/);
    if (match) {
      cleanBase64 = match[1];
    }

    const buffer = Buffer.from(cleanBase64, 'base64');

    // Run Tesseract OCR in Node
    const {
      data: { text },
    } = await Tesseract.recognize(buffer, 'eng');

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_TEXT_FOUND',
          message: 'ระบบ OCR ไม่พบข้อความในรูปภาพ กรุณาตรวจสอบความคมชัดของรูปภาพ',
        },
        { status: 422 }
      );
    }

    const parsedData = parseOrderSlipText(text);

    return NextResponse.json({
      success: true,
      data: parsedData,
      rawText: text,
    });
  } catch (error: any) {
    console.error('Local OCR error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'OCR_ERROR',
        message: error.message || 'เกิดข้อผิดพลาดในการอ่านข้อความด้วย OCR',
      },
      { status: 500 }
    );
  }
}
