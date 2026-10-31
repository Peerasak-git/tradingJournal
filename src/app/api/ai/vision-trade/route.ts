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
You are an expert AI trading assistant specializing in financial trade slip OCR and TradingView chart analysis.

Carefully examine the user's uploaded image. It will belong to ONE of two types:

TYPE 1: BROKER ORDER DETAILS / POSITION TICKET / TRADING SLIP
(Screenshots from mobile or desktop apps such as IUX, Exness, MetaTrader MT4/MT5, cTrader, Binance, Bitget, Bybit, TradingView Order Details, etc.)
Key indicators: "Position Details", "Order Details", "Position Information", "Protection", "Time (Server)", "P/L Breakdown", "Transaction Details", "Sell 0.03 lots", "Buy 0.10 lots", "Gross P/L", "Net P/L".

For TYPE 1, extract:
1. "instrument": The trading asset/pair (e.g., "XAUUSD.iux" -> "XAUUSD", "EURUSD.raw" -> "EURUSD", "BTCUSD", "GBPUSD", "US30", "NAS100"). Strip broker suffixes like ".iux", ".raw", ".m", ".pro", ".ecn", etc.
2. "direction": "LONG" (if Buy / Long) or "SHORT" (if Sell / Short).
3. "lotSize": Number of lots / contract size as a float (e.g., "Sell 0.03 lots" -> 0.03).
4. "entryPrice": Open price (e.g., "Open price 3,895.47" -> 3895.47).
5. "exitPrice": Close price if closed (e.g., "Close price 3,889.56" -> 3889.56). If order is still open or running, set to null.
6. "stopLoss": Stop Loss price if specified (e.g., "Stop Loss 3,900.37" -> 3900.37). If none, 0 or null.
7. "takeProfit": Take Profit price if specified (e.g., "Take Profit 3,885.41" -> 3885.41). If none, 0 or null.
8. "netPnL": Net profit/loss amount in USD/currency as a float (e.g., "+17.73 USD" -> 17.73, "-25.00 USD" -> -25.00). If not closed, set null.
9. "grossPnL": Gross profit/loss amount as a float (e.g., 17.73).
10. "commission": Commission fee (e.g., 0.00).
11. "swap": Swap / rollover fee (e.g., 0.00).
12. "currency": "USD" or whatever currency is shown.
13. "status":
    - "WIN" if closed with netPnL > 0
    - "LOSS" if closed with netPnL < 0
    - "BREAK_EVEN" if closed with netPnL == 0
    - "OPEN" if order is still running / not closed yet
14. "entryDate": Open Time as ISO-8601 string "YYYY-MM-DDTHH:mm:ss" (e.g., "Oct 30, 2026, 16:45:44" -> "2026-10-30T16:45:44").
15. "exitDate": Close Time as ISO-8601 string "YYYY-MM-DDTHH:mm:ss" if closed (e.g., "Oct 30, 2026, 17:10:44" -> "2026-10-30T17:10:44"). If open, null.
16. "ticket": Position ID / Order ID / Ticket number (e.g., "1845218").
17. "notes": Brief summary notes, e.g. "Position #1845218 | Close Reason: Close by user | Gross: +17.73 USD".

---

TYPE 2: TRADINGVIEW CHART WITH POSITION TOOL
(A screenshot of a candlestick chart with a Long or Short Position drawing tool with green/blue target zone and red/grey stop zone).
Extract:
1. "instrument": From top-left or watermark (e.g., "XAUUSD").
2. "direction": "LONG" (target zone on top) or "SHORT" (target zone on bottom).
3. "entryPrice": From horizontal line separating zones.
4. "stopLoss": Boundary of stop zone.
5. "takeProfit": Boundary of profit zone.
6. "lotSize": 0.01 (or default).
7. "status": "OPEN"
8. "timeframe": e.g. "1m", "5m", "15m", "1h".

CRITICAL INSTRUCTIONS:
- All numbers must be clean floating point numbers without commas (e.g. 3895.47, NOT "3,895.47").
- Return strictly a valid JSON object matching the schema below.

JSON Schema:
{
  "imageType": "ORDER_SLIP" | "TRADINGVIEW_CHART",
  "instrument": "XAUUSD",
  "direction": "SHORT",
  "lotSize": 0.03,
  "entryPrice": 3895.47,
  "exitPrice": 3889.56,
  "stopLoss": 3900.37,
  "takeProfit": 3885.41,
  "netPnL": 17.73,
  "grossPnL": 17.73,
  "commission": 0.0,
  "swap": 0.0,
  "currency": "USD",
  "status": "WIN",
  "entryDate": "2026-10-30T16:45:44",
  "exitDate": "2026-10-30T17:10:44",
  "ticket": "1845218",
  "timeframe": "",
  "riskRewardRatio": 2.05,
  "notes": "Position #1845218 | Close Reason: Close by user | Gross: +17.73 USD"
}
`;

    // Try models in cascade
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
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(cleanedText);
    } catch {
      return NextResponse.json(
        { success: false, error: 'PARSE_ERROR', message: 'ไม่สามารถแปลงผลลัพธ์จาก AI เป็น JSON ได้' },
        { status: 422 }
      );
    }

    const cleanNumber = (val: any): number => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      const str = String(val).replace(/,/g, '').trim();
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    const parseToIsoDateTime = (val: any): string | null => {
      if (!val) return null;
      const str = String(val).trim();
      // Match ISO 8601 YYYY-MM-DDTHH:mm
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
        return str.slice(0, 16);
      }
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      return null;
    };

    const imageType = parsedData.imageType === 'TRADINGVIEW_CHART' ? 'TRADINGVIEW_CHART' : 'ORDER_SLIP';
    let direction: 'LONG' | 'SHORT' = String(parsedData.direction).toUpperCase().includes('SHORT') || String(parsedData.direction).toUpperCase().includes('SELL') ? 'SHORT' : 'LONG';
    let entryPrice = cleanNumber(parsedData.entryPrice);
    let exitPrice = parsedData.exitPrice !== null && parsedData.exitPrice !== undefined ? cleanNumber(parsedData.exitPrice) : 0;
    let stopLoss = cleanNumber(parsedData.stopLoss);
    let takeProfit = cleanNumber(parsedData.takeProfit);
    let lotSize = Math.max(0.01, cleanNumber(parsedData.lotSize) || 0.01);

    // Only apply geometric sort for TradingView Charts where badges might be misordered
    if (imageType === 'TRADINGVIEW_CHART') {
      const validPrices = [entryPrice, stopLoss, takeProfit].filter(p => p > 0);
      if (validPrices.length === 3) {
        const sorted = [...validPrices].sort((a, b) => a - b);
        if (direction === 'LONG') {
          stopLoss = sorted[0];
          entryPrice = sorted[1];
          takeProfit = sorted[2];
        } else {
          takeProfit = sorted[0];
          entryPrice = sorted[1];
          stopLoss = sorted[2];
        }
      }
    }

    // Clean instrument (strip .iux, .raw, .pro, etc.)
    let rawInst = typeof parsedData.instrument === 'string' ? parsedData.instrument : '';
    let cleanInstrument = rawInst
      .replace(/\.(iux|raw|pro|ecn|std|m|c|stp|micro)$/i, '')
      .replace(/[/]/g, '')
      .toUpperCase()
      .trim();

    // Default to XAUUSD if looks like Gold
    if (cleanInstrument.includes('GOLD') || cleanInstrument.includes('XAU')) {
      cleanInstrument = 'XAUUSD';
    }

    // Net PnL & Financials
    const netPnL = parsedData.netPnL !== undefined && parsedData.netPnL !== null ? cleanNumber(parsedData.netPnL) : (exitPrice > 0 ? 0 : null);
    const grossPnL = parsedData.grossPnL !== undefined && parsedData.grossPnL !== null ? cleanNumber(parsedData.grossPnL) : netPnL;
    const commission = cleanNumber(parsedData.commission);
    const swap = cleanNumber(parsedData.swap);
    const currency = parsedData.currency || 'USD';

    // Status resolution
    let status: 'WIN' | 'LOSS' | 'BREAK_EVEN' | 'OPEN' = 'OPEN';
    if (parsedData.status && ['WIN', 'LOSS', 'BREAK_EVEN', 'OPEN'].includes(parsedData.status)) {
      status = parsedData.status;
    } else if (exitPrice > 0 || netPnL !== null) {
      if (netPnL !== null) {
        if (netPnL > 0) status = 'WIN';
        else if (netPnL < 0) status = 'LOSS';
        else status = 'BREAK_EVEN';
      } else {
        const isLong = direction === 'LONG';
        const diff = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
        if (diff > 0) status = 'WIN';
        else if (diff < 0) status = 'LOSS';
        else status = 'BREAK_EVEN';
      }
    }

    // RR calculations
    const risk = direction === 'LONG' ? entryPrice - stopLoss : stopLoss - entryPrice;
    const plannedReward = direction === 'LONG' ? takeProfit - entryPrice : entryPrice - takeProfit;
    const plannedRR = risk > 0 && plannedReward > 0 ? parseFloat((plannedReward / risk).toFixed(2)) : null;

    const actualReward = exitPrice > 0 ? (direction === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice) : 0;
    const actualRR = risk > 0 && actualReward > 0 ? parseFloat((actualReward / risk).toFixed(2)) : null;

    const entryDate = parseToIsoDateTime(parsedData.entryDate) || new Date().toISOString().slice(0, 16);
    const exitDate = parseToIsoDateTime(parsedData.exitDate) || (status !== 'OPEN' ? entryDate : null);

    const result = {
      imageType,
      instrument: cleanInstrument || 'XAUUSD',
      direction,
      lotSize,
      entryPrice,
      exitPrice: exitPrice > 0 ? exitPrice : null,
      stopLoss: stopLoss > 0 ? stopLoss : null,
      takeProfit: takeProfit > 0 ? takeProfit : null,
      netPnL,
      grossPnL,
      commission,
      swap,
      currency,
      status,
      entryDate,
      exitDate,
      ticket: parsedData.ticket ? String(parsedData.ticket) : '',
      timeframe: parsedData.timeframe || '',
      plannedRR,
      actualRR,
      notes: parsedData.notes || (parsedData.ticket ? `Order Ticket #${parsedData.ticket}` : '')
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
