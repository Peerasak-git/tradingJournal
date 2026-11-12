'use client';

import { parseOrderSlipText, ParsedSlipData } from './orderSlipParser';

export async function fileOrBlobToBase64(source: File | Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(source);
  });
}

export async function runClientOcr(
  imageSource: string | File | Blob,
  onProgress?: (progressPct: number) => void
): Promise<ParsedSlipData> {
  // 1. Ensure imageSource is converted to a clean Base64 Data URL
  let base64Image: string;
  if (typeof imageSource !== 'string') {
    base64Image = await fileOrBlobToBase64(imageSource);
  } else {
    base64Image = imageSource.trim();
    if (!base64Image.startsWith('data:image') && !base64Image.startsWith('http') && !base64Image.startsWith('blob:')) {
      base64Image = `data:image/jpeg;base64,${base64Image}`;
    }
  }

  // Dynamically import tesseract.js only in client-side browser
  const TesseractModule: any = await import('tesseract.js');
  const Tesseract = TesseractModule.default || TesseractModule;

  // Set up 15-second safety timeout so the UI NEVER hangs!
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('การอ่านรูปภาพใช้เวลานานเกินไป กรุณากดปุ่ม "ให้ AI อ่านข้อความ" หรือเลือกรูปที่ชัดเจนขึ้น'));
    }, 15000);
  });

  try {
    const ocrPromise = Tesseract.recognize(base64Image, 'eng', {
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
