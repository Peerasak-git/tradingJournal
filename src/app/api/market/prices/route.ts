import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// In-memory cache to prevent upstream rate-limits
let cachedPrices: Record<string, number> = {};
let lastFetchTime = 0;
const CACHE_TTL_MS = 2500; // 2.5 seconds

export async function GET() {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL_MS && Object.keys(cachedPrices).length > 0) {
    return NextResponse.json({
      success: true,
      prices: cachedPrices,
      cached: true,
      updatedAt: new Date(lastFetchTime).toISOString(),
    });
  }

  const prices: Record<string, number> = { ...cachedPrices };

  // Fetch Gold (XAUUSD) & Silver (XAGUSD) from gold-api.com (Real spot metals)
  const fetchMetals = async () => {
    try {
      const [goldRes, silverRes] = await Promise.allSettled([
        fetch('https://api.gold-api.com/price/XAU', { next: { revalidate: 0 }, signal: AbortSignal.timeout(3000) }),
        fetch('https://api.gold-api.com/price/XAG', { next: { revalidate: 0 }, signal: AbortSignal.timeout(3000) }),
      ]);

      if (goldRes.status === 'fulfilled' && goldRes.value.ok) {
        const data = await goldRes.value.json();
        if (typeof data?.price === 'number') {
          prices['XAUUSD'] = data.price;
          prices['GOLD'] = data.price;
        }
      }

      if (silverRes.status === 'fulfilled' && silverRes.value.ok) {
        const data = await silverRes.value.json();
        if (typeof data?.price === 'number') {
          prices['XAGUSD'] = data.price;
          prices['SILVER'] = data.price;
        }
      }
    } catch (err) {
      console.warn('Metals fetch error:', err);
    }
  };

  // Fetch Crypto (BTC, ETH, and PAXG fallback) from Binance
  const fetchCrypto = async () => {
    try {
      const res = await fetch(
        'https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22PAXGUSDT%22%5D',
        { next: { revalidate: 0 }, signal: AbortSignal.timeout(3000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach((item: { symbol: string; price: string }) => {
            const p = parseFloat(item.price);
            if (!isNaN(p)) {
              prices[item.symbol] = p;
              if (item.symbol === 'BTCUSDT') prices['BTCUSD'] = p;
              if (item.symbol === 'ETHUSDT') prices['ETHUSD'] = p;
              if (item.symbol === 'PAXGUSDT') prices['PAXG'] = p;
            }
          });
        }
      }
    } catch (err) {
      console.warn('Binance crypto fetch error:', err);
    }
  };

  // Fetch Forex (EURUSD, GBPUSD) from frankfurter API
  const fetchForex = async () => {
    try {
      const [eurRes, gbpRes] = await Promise.allSettled([
        fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD', { signal: AbortSignal.timeout(3000) }),
        fetch('https://api.frankfurter.dev/v1/latest?base=GBP&symbols=USD', { signal: AbortSignal.timeout(3000) }),
      ]);

      if (eurRes.status === 'fulfilled' && eurRes.value.ok) {
        const data = await eurRes.value.json();
        if (data?.rates?.USD) {
          prices['EURUSD'] = data.rates.USD;
        }
      }

      if (gbpRes.status === 'fulfilled' && gbpRes.value.ok) {
        const data = await gbpRes.value.json();
        if (data?.rates?.USD) {
          prices['GBPUSD'] = data.rates.USD;
        }
      }
    } catch (err) {
      console.warn('Forex fetch error:', err);
    }
  };

  await Promise.allSettled([fetchMetals(), fetchCrypto(), fetchForex()]);

  // Fallback: If XAUUSD could not be fetched from gold-api, use PAXG as last resort
  if (!prices['XAUUSD'] && prices['PAXGUSDT']) {
    prices['XAUUSD'] = prices['PAXGUSDT'];
    prices['GOLD'] = prices['PAXGUSDT'];
  }

  // Update memory cache if we got prices
  if (Object.keys(prices).length > 0) {
    cachedPrices = prices;
    lastFetchTime = Date.now();
  }

  return NextResponse.json({
    success: true,
    prices,
    updatedAt: new Date(lastFetchTime || Date.now()).toISOString(),
  });
}
