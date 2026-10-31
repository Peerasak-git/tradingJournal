'use client';

import { parseOrderSlipText, ParsedSlipData } from './orderSlipParser';

export async function runClientOcr(
  imageSource: string | File,
  onProgress?: (progressPct: number) => void
): Promise<ParsedSlipData> {
  // Dynamically import tesseract.js only in client-side browser
  const TesseractModule: any = await import('tesseract.js');
  const Tesseract = TesseractModule.default || TesseractModule;

  // Set up 12-second safety timeout so the UI NEVER hangs!
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('การอ่านรูปภาพใช้เวลานานเกินไป กรุณากดปุ่ม "ให้ AI อ่านข้อความ" หรือเลือกรูปที่ชัดเจนขึ้น'));
    }, 12000);
  });

  try {
    const ocrPromise = Tesseract.recognize(imageSource, 'eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text' && onProgress && typeof m.progress === 'number') {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const res: any = await Promise.race([ocrPromise, timeoutPromise]);
    clearTimeout(timer);

    const text = res?.data?.text || '';
    if (!text || text.trim().length === 0) {
      throw new Error('ไม่สามารถอ่านข้อความจากรูปภาพได้ กรุณาใช้ปุ่ม "ให้ AI อ่านข้อความ" แทน');
    }

    return parseOrderSlipText(text);
  } finally {
    clearTimeout(timer);
  }
}
