// api/gappers.js

const FINNHUB_KEY = process.env.FINNHUB_KEY;

// A curated list of high-volume, volatile stocks to scan for gaps
const STOCK_UNIVERSE = [
  'NVDA', 'TSLA', 'AMD', 'AAPL', 'MSFT', 'META', 'AMZN', 'GOOGL', 'PLTR', 'NFLX',
  'GME', 'AMC', 'SOFI', 'COIN', 'MRNA', 'BNTX', 'JPM', 'GS', 'XOM', 'OXY',
  'WMT', 'RIVN', 'LCID', 'SPCE', 'NKLA', 'PLUG', 'FCEL', 'MARA', 'RIOT', 'MSTR'
];

let cachedData = { timestamp: 0, data: [] };

export default async function handler(req, res) {
  const now = Date.now();
  const thirtyMins = 30 * 60 * 1000;

  // 1. Return fresh cache if we have it
  if (now - cachedData.timestamp < thirtyMins && cachedData.data.length > 0) {
    return res.status(200).json({ 
      data: cachedData.data, 
      nextScan: cachedData.timestamp + thirtyMins,
      cached: true
    });
  }

  try {
    // 2. Fetch real-time quotes for all 30 stocks at once
    // This uses 30 API calls, safely under Finnhub's 60 calls/minute limit
    const quotes = await Promise.all(
      STOCK_UNIVERSE.map(async (ticker) => {
        try {
          const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
          if (!response.ok) return null;
          const q = await response.json();
          
          if (!q || q.c === 0 || q.c === null) return null;
          
          const currentPrice = q.c;
          const prevClose = q.pc;
          if (!prevClose || prevClose === 0) return null;
          
          const gapPercent = ((currentPrice - prevClose) / prevClose) * 100;
          
          return {
            ticker,
            name: ticker + ' Inc.', 
            sector: 'Equity',
            prevClose: prevClose,
            openPrice: q.o,
            currentPrice: currentPrice,
            high: q.h,
            low: q.l,
            volume: Math.abs(q.d) * 100000, // Estimated volume proxy
            gapPercent: gapPercent,
            isUp: gapPercent > 0,
          };
        } catch (e) {
          return null;
        }
      })
    );

    // 3. Filter out nulls and only keep stocks that actually gapped > 2% or < -2%
    const validGappers = quotes.filter(q => q !== null && Math.abs(q.gapPercent) > 2.0);
    
    // Sort by biggest absolute gap first
    validGappers.sort((a, b) => Math.abs(b.gapPercent) - Math.abs(a.gapPercent));

    // Limit to top 18
    const finalGappers = validGappers.slice(0, 18);

    if (finalGappers.length === 0) {
      throw new Error('No significant gaps found in the current universe.');
    }

    // 4. Save to cache
    cachedData = { timestamp: now, data: finalGappers };

    res.status(200).json({ 
      data: finalGappers, 
      nextScan: now + thirtyMins,
      cached: false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch market data: ' + error.message });
  }
}
