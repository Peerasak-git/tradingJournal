export interface ParsedSlipData {
  engine: 'LOCAL_OCR' | 'AI_VISION';
  instrument: string;
  direction: 'LONG' | 'SHORT';
  lotSize: number;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  netPnL: number | null;
  grossPnL: number | null;
  commission: number;
  swap: number;
  currency: string;
  status: 'WIN' | 'LOSS' | 'BREAK_EVEN' | 'OPEN';
  entryDate: string;
  exitDate: string | null;
  ticket: string;
  plannedRR: number | null;
  actualRR: number | null;
  notes: string;
}

export function cleanNumber(str: any): number {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const cleaned = String(str).replace(/,/g, '').replace(/\s+/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function formatDateToIsoLocal(raw: string | null | undefined): string {
  if (!raw) return new Date().toISOString().slice(0, 16);
  // If already in YYYY-MM-DDTHH:mm format
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    return raw.slice(0, 16);
  }
  const d = new Date(raw);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 16);
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hr = String(d.getHours()).padStart(2, '0');
  const mn = String(d.getMinutes()).padStart(2, '0');
  return `${yr}-${mo}-${day}T${hr}:${mn}`;
}

export function parseOrderSlipText(text: string): ParsedSlipData {
  // 1. Instrument Detection
  const knownInstMatch = text.match(
    /\b(XAUUSD|EURUSD|GBPUSD|BTCUSD|ETHUSD|US30|NAS100|USDJPY|AUDUSD|USDCAD|USDCHF|NZDUSD|GOLD|XAGUSD|SPX500|GER30|GER40|UK100|WTICRUDE|BRENT)(?:\.[a-z0-9]+)?\b/i
  );
  let instrument = 'XAUUSD';
  if (knownInstMatch) {
    instrument = knownInstMatch[0]
      .toUpperCase()
      .replace(/\.(iux|raw|pro|ecn|std|m|c|stp|micro)$/i, '')
      .replace(/[/]/g, '');
    if (instrument === 'GOLD') instrument = 'XAUUSD';
  } else {
    // Look for generic currency pair e.g. AUDJPY, EURGBP
    const genericPair = text.match(/\b([A-Z]{6}(?:\.[a-z0-9]+)?)\b/i);
    if (genericPair) {
      const candidate = genericPair[1].toUpperCase();
      const blacklist = ['DETAIL', 'PROTEC', 'STATUS', 'ACTION', 'SERVER', 'TICKET', 'COMMEN', 'REASON'];
      if (!blacklist.some((b) => candidate.startsWith(b))) {
        instrument = candidate.replace(/\.(iux|raw|pro|ecn|std|m|c|stp|micro)$/i, '');
      }
    }
  }

  // 2. Direction & Lot Size
  // Matches e.g. "Sell 0.03 lots", "Buy 0.10 lots", "SELL 0.05", "BUY 1.00 Lot"
  const lotDirMatch = text.match(/(Sell|Short|Buy|Long)\s*([\d\.]+)\s*(?:lots?|lot)?/i);
  let direction: 'LONG' | 'SHORT' = 'LONG';
  let lotSize = 0.01;

  if (lotDirMatch) {
    const dirWord = lotDirMatch[1].toUpperCase();
    direction = dirWord.includes('SELL') || dirWord.includes('SHORT') ? 'SHORT' : 'LONG';
    lotSize = cleanNumber(lotDirMatch[2]) || 0.01;
  } else {
    // Fallback: check isolated words
    if (/\b(?:sell|short|ขาย)\b/i.test(text)) direction = 'SHORT';
    const standaloneLot = text.match(/\b([\d\.]+)\s*lots?\b/i) || text.match(/(?:lot|lots|volume|ขนาด)\s*[:\s]*([\d\.]+)/i);
    if (standaloneLot) lotSize = cleanNumber(standaloneLot[1]) || 0.01;
  }

  // 3. Prices
  const openPriceMatch =
    text.match(/(?:Open\s*price|Entry\s*price|Open|Entry|ราคาเปิด|ราคาเข้า)[\s\:\=]*([\d,]+(?:\.\d+)?)/i);
  const closePriceMatch =
    text.match(/(?:Close\s*price|Exit\s*price|Close|Exit|ราคาปิด|ราคาออก)[\s\:\=]*([\d,]+(?:\.\d+)?)/i);
  const slMatch = text.match(/(?:Stop\s*Loss|S\/?L|จุดตัดขาดทุน)[\s\:\=]*([\d,]+(?:\.\d+)?)/i);
  const tpMatch = text.match(/(?:Take\s*Profit|T\/?P|จุดทำกำไร)[\s\:\=]*([\d,]+(?:\.\d+)?)/i);

  const entryPrice = openPriceMatch ? cleanNumber(openPriceMatch[1]) : 0;
  const exitPrice = closePriceMatch ? cleanNumber(closePriceMatch[1]) : 0;
  const stopLoss = slMatch ? cleanNumber(slMatch[1]) : 0;
  const takeProfit = tpMatch ? cleanNumber(tpMatch[1]) : 0;

  // 4. Financials (Net P/L, Gross P/L, Commission, Swap)
  const netPnlMatch =
    text.match(/(?:Net\s*P\/?L|Net\s*profit|กำไรสุทธิ)[\s\:\=]*([+-]?\s*[\d,]+(?:\.\d+)?)/i) ||
    text.match(/([+-]\s*[\d,]+(?:\.\d+)?)\s*USD/i);
  const grossPnlMatch = text.match(/(?:Gross\s*P\/?L|Gross\s*profit)[\s\:\=]*([+-]?\s*[\d,]+(?:\.\d+)?)/i);
  const commMatch = text.match(/(?:Commission|คอมมิชชั่น)[\s\:\=]*([+-]?\s*[\d,]+(?:\.\d+)?)/i);
  const swapMatch = text.match(/(?:Swap|สวอป)[\s\:\=]*([+-]?\s*[\d,]+(?:\.\d+)?)/i);

  let netPnL: number | null = netPnlMatch ? cleanNumber(netPnlMatch[1]) : null;
  const grossPnL: number | null = grossPnlMatch ? cleanNumber(grossPnlMatch[1]) : netPnL;
  const commission = commMatch ? cleanNumber(commMatch[1]) : 0;
  const swap = swapMatch ? cleanNumber(swapMatch[1]) : 0;

  // If exit price and entry price exist, but netPnL was not found, calculate it
  if (netPnL === null && exitPrice > 0 && entryPrice > 0) {
    const diff = direction === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice;
    let multiplier = 100; // Gold default
    if (instrument.includes('EUR') || instrument.includes('GBP') || instrument.includes('USD')) multiplier = 100000;
    netPnL = parseFloat((diff * lotSize * multiplier - (commission + swap)).toFixed(2));
  }

  // 5. Position ID / Ticket
  const ticketMatch =
    text.match(/(?:Position\s*ID|Ticket|Order\s*ID|รหัสคำสั่ง)[\s\:\#\=]*(\d+)/i) ||
    text.match(/\#(\d{5,10})/);
  const ticket = ticketMatch ? ticketMatch[1] : '';

  // 6. Dates
  const openTimeMatch = text.match(
    /(?:Open\s*Time|เวลาเปิด)[\s\:\=]*([A-Za-z]{3}\s+\d{1,2},?\s+\d{4},?\s+\d{1,2}:\d{2}(?::\d{2})?|\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/i
  );
  const closeTimeMatch = text.match(
    /(?:Close\s*Time|เวลาปิด)[\s\:\=]*([A-Za-z]{3}\s+\d{1,2},?\s+\d{4},?\s+\d{1,2}:\d{2}(?::\d{2})?|\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/i
  );

  const entryDate = formatDateToIsoLocal(openTimeMatch ? openTimeMatch[1] : null);
  const exitDate = closePriceMatch || exitPrice > 0
    ? formatDateToIsoLocal(closeTimeMatch ? closeTimeMatch[1] : null)
    : null;

  // 7. Status Resolution
  let status: 'WIN' | 'LOSS' | 'BREAK_EVEN' | 'OPEN' = 'OPEN';
  if (exitPrice > 0 || (netPnL !== null && (closeTimeMatch || text.includes('Close price')))) {
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

  // 8. R:R Calculations
  const risk = direction === 'LONG' ? entryPrice - stopLoss : stopLoss - entryPrice;
  const plannedReward = direction === 'LONG' ? takeProfit - entryPrice : entryPrice - takeProfit;
  const plannedRR = risk > 0 && plannedReward > 0 ? parseFloat((plannedReward / risk).toFixed(2)) : null;

  const actualReward = exitPrice > 0 ? (direction === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice) : 0;
  const actualRR = risk > 0 && actualReward > 0 ? parseFloat((actualReward / risk).toFixed(2)) : null;

  const notes = ticket ? `Position #${ticket} | Local OCR (No AI)` : 'Auto-imported via Local OCR (No AI)';

  return {
    engine: 'LOCAL_OCR',
    instrument,
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
    currency: 'USD',
    status,
    entryDate,
    exitDate,
    ticket,
    plannedRR,
    actualRR,
    notes,
  };
}
