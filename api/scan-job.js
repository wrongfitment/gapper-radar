// api/scan-job.js
import { kv } from '@vercel/kv';

const FINNHUB_KEY = process.env.FINNHUB_KEY;

// 55 highly volatile, high-volume stocks
const STOCK_UNIVERSE = [
  'NVDA', 'TSLA', 'AMD', 'AAPL', 'MSFT', 'META', 'AMZN', 'GOOGL', 'PLTR', 'NFLX',
  'GME', 'AMC', 'SOFI', 'COIN', 'MRNA', 'BNTX', 'JPM', 'GS', 'XOM', 'OXY',
  'WMT', 'RIVN', 'LCID', 'SPCE', 'PLUG', 'FCEL', 'MARA', 'RIOT', 'MSTR', 'SNAP',
  'SQ', 'BABA', 'NIO', 'SHOP', 'PYPL', 'DKNG', 'RBLX', 'U', 'ENPH', 'MU',
  'ZM', 'DOCU', 'TWLO', 'NET', 'CRWD', 'OKTA', 'MDB', 'DDOG', 'SNOW', 'ROKU',
  'BIDU', 'JD', 'RUN', 'AVGO', 'QCOM'
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (!FINNHUB_KEY) {
    return res.status(500).json({ error: 'Missing FINNHUB_KEY in Vercel Environment Variables.' });
  }

  try {
    const fetchStockData = async (ticker) => {
      try {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
        const q = await response.json();
        
        if (!q || q.c === 0 || q.c === null || !q.pc) return null;
        
        const currentPrice = q.c;
        const prevClose = q.pc;
        const gapPercent = ((currentPrice - prevClose) / prevClose) * 100;
        
        return {
          ticker: ticker,
          name: ticker + ' Inc.',
          sector: 'Equity',
          prevClose: prevClose,
          openPrice: q.o,
          currentPrice: currentPrice,
          high: q.h,
          low: q.l,
          volume: q.v || 0,
          gapPercent: gapPercent,
          isUp: gapPercent > 0,
        };
      } catch (e) { return null; }
    };

    let validGappers = [];
    const chunkSize = 15; // Fetch 15 at a time to respect Finnhub's 60/min limit
    
    for (let i = 0; i < STOCK_UNIVERSE.length; i += chunkSize) {
      const chunk = STOCK_UNIVERSE.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk.map(fetchStockData));
      validGappers.push(...chunkResults.filter(Boolean));
      await sleep(1000); // Wait 1 second between batches
    }

    // Filter for stocks that actually moved > 0.5%
    validGappers = validGappers.filter(q => Math.abs(q.gapPercent) > 0.5);
    
    // Sort by biggest absolute gap
    validGappers.sort((a, b) => Math.abs(b.gapPercent) - Math.abs(a.gapPercent));

    // Narrow down to Top 30
    const top30 = validGappers.slice(0, 30);

    // Save to Vercel KV Database
    await kv.set('gappers_data', JSON.stringify(top30));

    res.status(200).json({ success: true, count: top30.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
