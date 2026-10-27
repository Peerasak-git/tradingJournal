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

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_API_KEY',
          message: 'กรุณาระบุ Gemini API Key (ฟรี) เพื่อใช้งานระบบ AI Vision'
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
You are an expert financial market analyst specializing in TradingView charts.
The user uploaded a screenshot of a TradingView chart with an order or a "Long Position" / "Short Position" tool.

Examine the chart carefully and extract:
1. "instrument": Symbol / pair name in uppercase (e.g. "XAUUSD", "BTCUSDT", "EURUSD", "US30", "NAS100", etc.). Look at the watermark text in the background, top-left chart header, or on the axis labels.
2. "direction": Either "LONG" (Buy) or "SHORT" (Sell).
   - If the target zone (often green/blue) is ABOVE the entry line, and stop zone is BELOW -> "LONG"
   - If the target zone is BELOW the entry line, and stop zone is ABOVE -> "SHORT"
3. "entryPrice": Exact price number of entry (usually the middle line separating profit and loss zones, or grey badge on the right price axis).
4. "stopLoss": Exact stop loss price number (outer boundary of the stop loss zone, or red/grey badge on the right price axis).
5. "takeProfit": Exact take profit target price number (outer boundary of the profit zone, or blue/green badge on the right price axis).
6. "timeframe": Timeframe string if visible (e.g. "1m", "5m", "15m", "1h", "4h", "D").
7. "riskRewardRatio": Number for Risk/Reward ratio if printed on the tool box (e.g. 3.76).
8. "notes": Brief 1-sentence note of what was detected.

Return ONLY a valid JSON object matching this schema:
{
  "instrument": "XAUUSD",
  "direction": "LONG",
  "entryPrice": 4006.519,
  "stopLoss": 4003.331,
  "takeProfit": 4018.634,
  "timeframe": "1m",
  "riskRewardRatio": 3.76,
  "notes": "Long setup on XAUUSD"
}
`;

    // Try models in cascade: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
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
              responseMimeType: 'application/json'
            }
          })
        });

        if (res.ok) {
          geminiResponse = await res.json();
          break;
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = errData?.error?.message || `Model ${model} returned status ${res.status}`;
          // If invalid API key, don't try other models
          if (res.status === 400 && lastError.toLowerCase().includes('api_key_invalid')) {
            return NextResponse.json(
              { success: false, error: 'INVALID_API_KEY', message: 'Gemini API Key ไม่ถูกต้อง โปรดตรวจสอบอีกครั้ง' },
              { status: 400 }
            );
          }
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

    // Sanitize and coerce numbers
    const result = {
      instrument: typeof parsedData.instrument === 'string' ? parsedData.instrument.replace(/[/]/g, '').toUpperCase().trim() : '',
      direction: parsedData.direction === 'SHORT' ? 'SHORT' : 'LONG',
      entryPrice: typeof parsedData.entryPrice === 'number' ? parsedData.entryPrice : parseFloat(parsedData.entryPrice) || 0,
      stopLoss: typeof parsedData.stopLoss === 'number' ? parsedData.stopLoss : parseFloat(parsedData.stopLoss) || 0,
      takeProfit: typeof parsedData.takeProfit === 'number' ? parsedData.takeProfit : parseFloat(parsedData.takeProfit) || 0,
      timeframe: parsedData.timeframe || '',
      riskRewardRatio: typeof parsedData.riskRewardRatio === 'number' ? parsedData.riskRewardRatio : parseFloat(parsedData.riskRewardRatio) || 0,
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
