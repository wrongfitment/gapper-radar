// api/gappers.js

const ALPACA_KEY = process.env.ALPACA_KEY;
const ALPACA_SECRET = process.env.ALPACA_SECRET;

const STOCK_UNIVERSE = [
  { ticker: 'NVDA', sector: 'Semiconductors' }, { ticker: 'TSLA', sector: 'Automotive' },
  { ticker: 'AMD', sector: 'Semiconductors' }, { ticker: 'AAPL', sector: 'Technology' },
  { ticker: 'MSFT', sector: 'Technology' }, { ticker: 'META', sector: 'Communication' },
  { ticker: 'AMZN', sector: 'Consumer Discretionary' }, { ticker: 'GOOGL', sector: 'Communication' },
  { ticker: 'PLTR', sector: 'Software' }, { ticker: 'NFLX', sector: 'Communication' },
  { ticker: 'GME', sector: 'Retail' }, { ticker: 'AMC', sector: 'Entertainment' },
  { ticker: 'SOFI', sector: 'Financials' }, { ticker: 'COIN', sector: 'Financials' },
  { ticker: 'MRNA', sector: 'Biotechnology' }, { ticker: 'BNTX', sector: 'Biotechnology' },
  { ticker: 'JPM', sector: 'Financials' }, { ticker: 'GS', sector: 'Financials' },
  { ticker: 'XOM', sector: 'Energy' }, { ticker: 'OXY', sector: 'Energy' },
  { ticker: 'WMT', sector: 'Consumer Staples' }, { ticker: 'RIVN', sector: 'Automotive' },
  { ticker: 'LCID', sector: 'Automotive' }, { ticker: 'SPCE', sector: 'Aerospace' },
  { ticker: 'PLUG', sector: 'Energy' }, { ticker: 'FCEL', sector: 'Energy' },
  { ticker: 'MARA', sector: 'Financials' }, { ticker: 'RIOT', sector: 'Financials' },
  { ticker: 'MSTR', sector: 'Software' }, { ticker: 'SNAP', sector: 'Communication' },
  { ticker: 'SQ', sector: 'Financials' }, { ticker: 'BABA', sector: 'E-Commerce' },
  { ticker: 'NIO', sector: 'Automotive' }, { ticker: 'SHOP', sector: 'E-Commerce' },
  { ticker: 'PYPL', sector: 'Financials' }, { ticker: 'DKNG', sector: 'Entertainment' },
  { ticker: 'RBLX', sector: 'Entertainment' }, { ticker: 'U', sector: 'Software' },
  { ticker: 'ENPH', sector: 'Energy' }, { ticker: 'MU', sector: 'Semiconductors' },
  { ticker: 'ZM', sector: 'Software' }, { ticker: 'TWLO', sector: 'Software' },
  { ticker: 'NET', sector: 'Software' }, { ticker: 'CRWD', sector: 'Software' },
  { ticker: 'AVGO', sector: 'Semiconductors' }, { ticker: 'QCOM', sector: 'Semiconductors' },
  { ticker: 'INTC', sector: 'Semiconductors' }, { ticker: 'TSM', sector: 'Semiconductors' },
  { ticker: 'ASML', sector: 'Semiconductors' }, { ticker: 'ADBE', sector: 'Software' },
  { ticker: 'CRM', sector: 'Software' }, { ticker: 'UBER', sector: 'Transportation' },
  { ticker: 'LYFT', sector: 'Transportation' }, { ticker: 'PINS', sector: 'Communication' },
  { ticker: 'ABNB', sector: 'Consumer Discretionary' }, { ticker: 'DASH', sector: 'Consumer Discretionary' },
  { ticker: 'AFRM', sector: 'Financials' }, { ticker: 'HOOD', sector: 'Financials' }
];

let cachedData = { timestamp: 0, data: [] };

export default async function handler(req, res) {
  const now = Date.now();
  const thirtyMins = 30 * 60 * 1000;

  if (now - cachedData.timestamp < thirtyMins && cachedData.data.length > 0) {
    return res.status(200).json({ data: cachedData.data, nextScan: cachedData.timestamp + thirtyMins });
  }

  if (!ALPACA_KEY || !ALPACA_SECRET) {
    return res.status(500).json({ error: 'Missing Alpaca API keys in Vercel Environment Variables.' });
  }

  try {
    const tickers = STOCK_UNIVERSE.map(s => s.ticker);
    const symbolsParam = tickers.join(',');
    
    const url = `https://data.alpaca.markets/v2/stocks/snapshots?symbols=${symbolsParam}`;
    const response = await fetch(url, {
      headers: { 'APCA-API-KEY-ID': ALPACA_KEY, 'APCA-API-SECRET-KEY': ALPACA_SECRET }
    });

    if (!response.ok) throw new Error('Alpaca API request failed');
    const data = await response.json();

    let validGappers = [];

    for (const ticker in data) {
      const snap = data[ticker];
      if (!snap.dailyBar || !snap.prevDailyBar) continue;
      
      const currentPrice = snap.dailyBar.c;
      const prevClose = snap.prevDailyBar.c;
      const openPrice = snap.dailyBar.o;
      const high = snap.dailyBar.h;
      const low = snap.dailyBar.l;
      const volume = snap.dailyBar.v;
      
      if (!prevClose || prevClose === 0 || !currentPrice) continue;
      
      const gapPercent = ((currentPrice - prevClose) / prevClose) * 100;
      const stockInfo = STOCK_UNIVERSE.find(s => s.ticker === ticker);
      
      if (Math.abs(gapPercent) > 1.0 && volume > 50000 && currentPrice > 1) {
        
        // Gap Continuation Score Algorithm (0-95)
        let score = 50; 
        score += Math.min(Math.abs(gapPercent) * 1.5, 15); 
        if (volume > 500000) score += 10;
        if (volume > 2000000) score += 10; 
        if (currentPrice > openPrice && gapPercent > 0) score += 10; 
        if (currentPrice < openPrice && gapPercent < 0) score += 10; 
        score = Math.min(score, 95); 
        
        validGappers.push({
          ticker: ticker,
          name: ticker + ' Inc.',
          sector: stockInfo ? stockInfo.sector : 'Equity',
          prevClose: prevClose,
          openPrice: openPrice,
          currentPrice: currentPrice,
          high: high,
          low: low,
          volume: volume,
          gapPercent: gapPercent,
          isUp: gapPercent > 0,
          gapScore: Math.round(score)
        });
      }
    }

    validGappers.sort((a, b) => Math.abs(b.gapPercent) - Math.abs(a.gapPercent));

    if (validGappers.length === 0) throw new Error('No stocks met the scanner criteria.');

    cachedData = { timestamp: now, data: validGappers };

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=59');
    res.status(200).json({ data: validGappers, nextScan: now + thirtyMins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
