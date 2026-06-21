// api/gappers.js

const FINNHUB_KEY = 'd8rinr1r01qnkitnd4r0d8rinr1r01qnkitnd4rg'; // <--- KEEP YOUR ACTUAL FINNHUB KEY HERE!

const STOCK_UNIVERSE = [
  { ticker: 'NVDA', name: 'NVIDIA Corp' }, { ticker: 'TSLA', name: 'Tesla Inc' },
  { ticker: 'AMD', name: 'Adv Micro Devices' }, { ticker: 'AAPL', name: 'Apple Inc' },
  { ticker: 'MSFT', name: 'Microsoft Corp' }, { ticker: 'META', name: 'Meta Platforms' },
  { ticker: 'AMZN', name: 'Amazon.com Inc' }, { ticker: 'GOOGL', name: 'Alphabet Inc' },
  { ticker: 'PLTR', name: 'Palantir Tech' }, { ticker: 'NFLX', name: 'Netflix Inc' },
  { ticker: 'GME', name: 'GameStop Corp' }, { ticker: 'AMC', name: 'AMC Entertainment' },
  { ticker: 'SOFI', name: 'SoFi Technologies' }, { ticker: 'COIN', name: 'Coinbase Global' },
  { ticker: 'MRNA', name: 'Moderna Inc' }, { ticker: 'BNTX', name: 'BioNTech SE' },
  { ticker: 'JPM', name: 'JPMorgan Chase' }, { ticker: 'GS', name: 'Goldman Sachs' },
  { ticker: 'XOM', name: 'Exxon Mobil' }, { ticker: 'OXY', name: 'Occidental Petroleum' },
  { ticker: 'WMT', name: 'Walmart Inc' }, { ticker: 'RIVN', name: 'Rivian Automotive' },
  { ticker: 'LCID', name: 'Lucid Group' }, { ticker: 'SPCE', name: 'Virgin Galactic' },
  { ticker: 'PLUG', name: 'Plug Power Inc' }, { ticker: 'FCEL', name: 'FuelCell Energy' },
  { ticker: 'MARA', name: 'Marathon Digital' }, { ticker: 'RIOT', name: 'Riot Platforms' },
  { ticker: 'MSTR', name: 'MicroStrategy' }, { ticker: 'SNAP', name: 'Snap Inc' },
  { ticker: 'SQ', name: 'Block Inc' }, { ticker: 'AAL', name: 'American Airlines' },
  { ticker: 'BABA', name: 'Alibaba Group' }, { ticker: 'BIDU', name: 'Baidu Inc' },
  { ticker: 'NIO', name: 'NIO Inc' }, { ticker: 'PDD', name: 'PDD Holdings' },
  { ticker: 'JD', name: 'JD.com Inc' }, { ticker: 'SHOP', name: 'Shopify Inc' },
  { ticker: 'PYPL', name: 'PayPal Holdings' }, { ticker: 'DKNG', name: 'DraftKings Inc' },
  { ticker: 'RBLX', name: 'Roblox Corp' }, { ticker: 'U', name: 'Unity Software' },
  { ticker: 'RUN', name: 'Sunrun Inc' }, { ticker: 'ENPH', name: 'Enphase Energy' },
  { ticker: 'MU', name: 'Micron Technology' }, { ticker: 'QCOM', name: 'Qualcomm Inc' },
  { ticker: 'AVGO', name: 'Broadcom Inc' }, { ticker: 'CRM', name: 'Salesforce Inc' },
  { ticker: 'ORCL', name: 'Oracle Corp' }, { ticker: 'ADBE', name: 'Adobe Inc' },
  { ticker: 'UBER', name: 'Uber Technologies' }, { ticker: 'LYFT', name: 'Lyft Inc' },
  { ticker: 'PINS', name: 'Pinterest Inc' }, { ticker: 'ZM', name: 'Zoom Video' },
  { ticker: 'DOCU', name: 'DocuSign Inc' }, { ticker: 'TWLO', name: 'Twilio Inc' },
  { ticker: 'NET', name: 'Cloudflare Inc' }, { ticker: 'CRWD', name: 'CrowdStrike Holdings' }
];

let cachedData = { timestamp: 0, data: [] };

// Helper to pause between batches so Finnhub doesn't rate-limit us
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
  const now = Date.now();
  const thirtyMins = 30 * 60 * 1000;

  if (now - cachedData.timestamp < thirtyMins && cachedData.data.length > 0) {
    return res.status(200).json({ 
      data: cachedData.data, 
      nextScan: cachedData.timestamp + thirtyMins,
      cached: true
    });
  }

  if (!FINNHUB_KEY || FINNHUB_KEY === 'YOUR_FINNHUB_KEY') {
    return res.status(500).json({ error: 'Missing Finnhub API key in api/gappers.js' });
  }

  try {
    const fetchStockData = async (stock) => {
      try {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${stock.ticker}&token=${FINNHUB_KEY}`);
        const q = await response.json();
        
        if (!q || q.c === 0 || q.c === null || !q.pc) return null;
        
        const currentPrice = q.c;
        const prevClose = q.pc;
        const gapPercent = ((currentPrice - prevClose) / prevClose) * 100;
        
        return {
          ticker: stock.ticker,
          name: stock.name, 
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
    const chunkSize = 10; // Fetch 10 at a time to avoid rate limits
    
    for (let i = 0; i < STOCK_UNIVERSE.length; i += chunkSize) {
      const chunk = STOCK_UNIVERSE.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk.map(fetchStockData));
      validGappers.push(...chunkResults.filter(Boolean));
      await sleep(1000); // Wait 1 second between batches
    }
    
    validGappers.sort((a, b) => Math.abs(b.gapPercent) - Math.abs(a.gapPercent));

    if (validGappers.length === 0) {
      throw new Error('Finnhub returned no data. Check your API key.');
    }

    cachedData = { timestamp: now, data: validGappers };

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=59');
    res.status(200).json({ 
      data: validGappers, 
      nextScan: now + thirtyMins,
      cached: false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
