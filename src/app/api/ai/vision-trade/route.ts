import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, apiKey: clientApiKey } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'MISSING_IMAGE', message: 'กรุณาอัปโหลดรูปภาพ' },
        { status: 400 }
      );
    }

    const rawKey = clientApiKey || process.env.GEMINI_API_KEY || '';
    const apiKey = String(rawKey).trim().replace(/^["']|["']$/g, '');
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_API_KEY',
          message: 'ยังไม่ได้ระบุ Gemini API Key กรุณาใส่ Key เพื่อใช้งาน'
        },
        { status: 401 }
      );
    }

    // Extract mime type and pure base64 data
    let mimeType = 'image/png';
    let cleanBase64 = imageBase64;

    const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      cleanBase64 = match[2];
    }

    const promptText = `
You are an expert TradingView chart analyst.
The user uploaded a screenshot of a TradingView chart containing a "Long Position" or "Short Position" drawing tool.

Examine the chart carefully and follow these strict visual instructions:

1. IDENTIFY THE POSITION TOOL:
   - A rectangular box split into TWO colored zones:
     a) Target / Profit zone: usually shaded light blue or green.
     b) Stop / Loss zone: usually shaded light grey or red.
   - The solid horizontal line dividing the two zones is the ENTRY LEVEL.

2. DETERMINE DIRECTION:
   - If the Target/Profit zone (blue/green) is on TOP, and Stop zone (grey/red) is on BOTTOM:
     -> direction = "LONG"
   - If the Target/Profit zone (blue/green) is on BOTTOM, and Stop zone (grey/red) is on TOP:
     -> direction = "SHORT"

3. READ THE 3 PRICE BADGES ON THE RIGHT VERTICAL PRICE AXIS:
   TradingView draws specific badge labels on the right vertical price scale corresponding to the position tool:
   - For a "LONG" position:
     * "takeProfit": The badge aligned with the TOP boundary of the blue/green target box. (HIGHEST of the 3 numbers).
     * "entryPrice": The badge aligned with the horizontal dividing line between target and stop zones. (MIDDLE of the 3 numbers).
     * "stopLoss": The badge aligned with the BOTTOM boundary of the grey/red stop box. (LOWEST of the 3 numbers).
   - For a "SHORT" position:
     * "stopLoss": The badge aligned with the TOP boundary of the stop box. (HIGHEST of the 3 numbers).
     * "entryPrice": The badge aligned with the horizontal dividing line. (MIDDLE of the 3 numbers).
     * "takeProfit": The badge aligned with the BOTTOM boundary of the target box. (LOWEST of the 3 numbers).

4. ⚠️ CRITICAL BADGES TO IGNORE (DO NOT USE THESE!):
   - DO NOT use the black badge that has a countdown timer (e.g. "00:14", "00:49", etc.). That is the CURRENT LIVE MARKET PRICE.
   - DO NOT use any badge connected to a dashed mouse crosshair with a (+) plus icon (e.g. at the bottom of the screen).
   - DO NOT use the regular grey price scale grid marks (e.g. 4020.000, 4018.000, 4016.000, etc.).

5. IDENTIFY INSTRUMENT & TIMEFRAME:
   - Check the top-left text (e.g. "XAUUSD · 1 · OANDA" -> instrument="XAUUSD", timeframe="1m")
   - Or the large faint watermark in the center of the chart (e.g. "XAUUSD, 1" -> instrument="XAUUSD", timeframe="1m")
   - Common symbols: XAUUSD, BTCUSDT, EURUSD, GBPUSD, USDJPY, US30, NAS100, ETHUSDT, etc.

IMPORTANT: Prices in the JSON output must be pure floating point numbers without commas (e.g. 4010.302, NOT "4,010.302").

Return ONLY a valid JSON object matching this schema:
{
  "instrument": "XAUUSD",
  "direction": "LONG",
  "entryPrice": 4010.302,
  "stopLoss": 4007.114,
  "takeProfit": 4017.628,
  "timeframe": "1m",
  "notes": "Long setup on XAUUSD"
}
`;

    // Try models in cascade: gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError: any = null;
    let geminiResponse: any = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inlineData: {
                      mimeType,
                      data: cleanBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          })
        });

        if (res.ok) {
          geminiResponse = await res.json();
          break;
        } else {
          const errData = await res.json().catch(() => ({}));
          const rawErrMsg = errData?.error?.message || `Model ${model} returned status ${res.status}`;
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
                message: 'Gemini API Key ไม่ถูกต้อง หรือถูกปิดการใช้งาน กรุณาตรวจสอบ Key ใน Google AI Studio'
              },
              { status: 400 }
            );
          }

          if (res.status === 403) {
            return NextResponse.json(
              {
                success: false,
                error: 'PERMISSION_DENIED',
                message: `ไม่มีสิทธิ์เรียกใช้งาน Gemini API (403 Forbidden): ${rawErrMsg}`
              },
              { status: 403 }
            );
          }

          if (res.status === 429) {
            return NextResponse.json(
              {
                success: false,
                error: 'QUOTA_EXCEEDED',
                message: 'โควตาใช้งาน Gemini API เต็มชั่วคราว กรุณารอ 1-2 นาทีแล้วลองใหม่อีกครั้ง'
              },
              { status: 429 }
            );
          }

          lastError = rawErrMsg;
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!geminiResponse) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI_FAILED',
          message: lastError || 'ไม่สามารถประมวลผลด้วย AI ได้ในขณะนี้ โปรดตรวจสอบ API Key หรือลองอีกครั้ง'
        },
        { status: 502 }
      );
    }

    const rawText = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return NextResponse.json(
        { success: false, error: 'NO_CONTENT', message: 'AI ไม่สามารถระบุข้อมูลจากรูปได้' },
        { status: 422 }
      );
    }

    const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    const cleanNumber = (val: any): number => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      const str = String(val).replace(/,/g, '').trim();
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    let direction: 'LONG' | 'SHORT' = parsedData.direction === 'SHORT' ? 'SHORT' : 'LONG';
    let entryPrice = cleanNumber(parsedData.entryPrice);
    let stopLoss = cleanNumber(parsedData.stopLoss);
    let takeProfit = cleanNumber(parsedData.takeProfit);

    // Geometric Sanity Check for TradingView Position Tools
    // In Long: TakeProfit > EntryPrice > StopLoss
    // In Short: StopLoss > EntryPrice > TakeProfit
    const validPrices = [entryPrice, stopLoss, takeProfit].filter(p => p > 0);
    if (validPrices.length === 3) {
      const sorted = [...validPrices].sort((a, b) => a - b);
      if (direction === 'LONG') {
        // [lowest = SL, middle = Entry, highest = TP]
        stopLoss = sorted[0];
        entryPrice = sorted[1];
        takeProfit = sorted[2];
      } else {
        // [lowest = TP, middle = Entry, highest = SL]
        takeProfit = sorted[0];
        entryPrice = sorted[1];
        stopLoss = sorted[2];
      }
    }

    const result = {
      instrument: typeof parsedData.instrument === 'string' ? parsedData.instrument.replace(/[/]/g, '').toUpperCase().trim() : '',
      direction,
      entryPrice,
      stopLoss,
      takeProfit,
      timeframe: parsedData.timeframe || '',
      riskRewardRatio: cleanNumber(parsedData.riskRewardRatio),
      notes: parsedData.notes || ''
    };

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Vision trade error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ'
      },
      { status: 500 }
    );
  }
}
