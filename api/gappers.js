// api/gappers.js

const ALPACA_KEY = process.env.ALPACA_KEY;
const ALPACA_SECRET = process.env.ALPACA_SECRET;

const STOCK_UNIVERSE = [
  { ticker: 'AAPL', sector: 'Technology' }, { ticker: 'MSFT', sector: 'Technology' }, { ticker: 'NVDA', sector: 'Semiconductors' },
  { ticker: 'AMZN', sector: 'Consumer' }, { ticker: 'GOOGL', sector: 'Communication' }, { ticker: 'GOOG', sector: 'Communication' },
  { ticker: 'META', sector: 'Communication' }, { ticker: 'TSLA', sector: 'Automotive' }, { ticker: 'AVGO', sector: 'Semiconductors' },
  { ticker: 'PEP', sector: 'Consumer Staples' }, { ticker: 'COST', sector: 'Consumer Staples' }, { ticker: 'CSCO', sector: 'Technology' },
  { ticker: 'ADBE', sector: 'Software' }, { ticker: 'NFLX', sector: 'Communication' }, { ticker: 'AMD', sector: 'Semiconductors' },
  { ticker: 'INTC', sector: 'Semiconductors' }, { ticker: 'QCOM', sector: 'Semiconductors' }, { ticker: 'TXN', sector: 'Semiconductors' },
  { ticker: 'AMGN', sector: 'Biotechnology' }, { ticker: 'HON', sector: 'Industrials' }, { ticker: 'V', sector: 'Financials' },
  { ticker: 'MA', sector: 'Financials' }, { ticker: 'UNH', sector: 'Healthcare' }, { ticker: 'JNJ', sector: 'Healthcare' },
  { ticker: 'JPM', sector: 'Financials' }, { ticker: 'PG', sector: 'Consumer Staples' }, { ticker: 'WMT', sector: 'Consumer Staples' },
  { ticker: 'HD', sector: 'Consumer' }, { ticker: 'CVX', sector: 'Energy' }, { ticker: 'MRK', sector: 'Healthcare' },
  { ticker: 'ABBV', sector: 'Healthcare' }, { ticker: 'KO', sector: 'Consumer Staples' }, { ticker: 'DIS', sector: 'Communication' },
  { ticker: 'BAC', sector: 'Financials' }, { ticker: 'XOM', sector: 'Energy' }, { ticker: 'PFE', sector: 'Healthcare' },
  { ticker: 'MO', sector: 'Consumer Staples' }, { ticker: 'CRM', sector: 'Software' }, { ticker: 'TMO', sector: 'Healthcare' },
  { ticker: 'COP', sector: 'Energy' }, { ticker: 'PLTR', sector: 'Software' }, { ticker: 'COIN', sector: 'Financials' },
  { ticker: 'SOFI', sector: 'Financials' }, { ticker: 'GME', sector: 'Retail' }, { ticker: 'AMC', sector: 'Entertainment' },
  { ticker: 'MRNA', sector: 'Biotechnology' }, { ticker: 'BNTX', sector: 'Biotechnology' }, { ticker: 'GS', sector: 'Financials' },
  { ticker: 'OXY', sector: 'Energy' }, { ticker: 'RIVN', sector: 'Automotive' }, { ticker: 'LCID', sector: 'Automotive' },
  { ticker: 'SPCE', sector: 'Aerospace' }, { ticker: 'PLUG', sector: 'Energy' }, { ticker: 'FCEL', sector: 'Energy' },
  { ticker: 'MARA', sector: 'Financials' }, { ticker: 'RIOT', sector: 'Financials' }, { ticker: 'MSTR', sector: 'Software' },
  { ticker: 'SNAP', sector: 'Communication' }, { ticker: 'SQ', sector: 'Financials' }, { ticker: 'BABA', sector: 'E-Commerce' },
  { ticker: 'NIO', sector: 'Automotive' }, { ticker: 'SHOP', sector: 'E-Commerce' }, { ticker: 'PYPL', sector: 'Financials' },
  { ticker: 'DKNG', sector: 'Entertainment' }, { ticker: 'RBLX', sector: 'Entertainment' }, { ticker: 'U', sector: 'Software' },
  { ticker: 'ENPH', sector: 'Energy' }, { ticker: 'MU', sector: 'Semiconductors' }, { ticker: 'ZM', sector: 'Software' },
  { ticker: 'TWLO', sector: 'Software' }, { ticker: 'NET', sector: 'Software' }, { ticker: 'CRWD', sector: 'Software' },
  { ticker: 'TSM', sector: 'Semiconductors' }, { ticker: 'ASML', sector: 'Semiconductors' }, { ticker: 'UBER', sector: 'Transportation' },
  { ticker: 'LYFT', sector: 'Transportation' }, { ticker: 'PINS', sector: 'Communication' }, { ticker: 'ABNB', sector: 'Consumer' },
  { ticker: 'DASH', sector: 'Consumer' }, { ticker: 'AFRM', sector: 'Financials' }, { ticker: 'HOOD', sector: 'Financials' },
  { ticker: 'ORCL', sector: 'Software' }, { ticker: 'SAP', sector: 'Software' }, { ticker: 'NOW', sector: 'Software' },
  { ticker: 'INTU', sector: 'Software' }, { ticker: 'WDAY', sector: 'Software' }, { ticker: 'IBM', sector: 'Technology' },
  { ticker: 'HPE', sector: 'Technology' }, { ticker: 'DELL', sector: 'Technology' }, { ticker: 'ACN', sector: 'Technology' },
  { ticker: 'CTSH', sector: 'Technology' }, { ticker: 'EBAY', sector: 'E-Commerce' }, { ticker: 'ETSY', sector: 'E-Commerce' },
  { ticker: 'MELI', sector: 'E-Commerce' }, { ticker: 'CPNG', sector: 'E-Commerce' }, { ticker: 'SE', sector: 'E-Commerce' },
  { ticker: 'STNE', sector: 'Financials' }, { ticker: 'W', sector: 'E-Commerce' }, { ticker: 'BIDU', sector: 'Communication' },
  { ticker: 'JD', sector: 'E-Commerce' }, { ticker: 'PDD', sector: 'E-Commerce' }, { ticker: 'NTES', sector: 'Communication' },
  { ticker: 'NXPI', sector: 'Semiconductors' }, { ticker: 'LRCX', sector: 'Semiconductors' }, { ticker: 'AMAT', sector: 'Semiconductors' },
  { ticker: 'MRVL', sector: 'Semiconductors' }, { ticker: 'ADI', sector: 'Semiconductors' }, { ticker: 'KLAC', sector: 'Semiconductors' },
  { ticker: 'SNPS', sector: 'Software' }, { ticker: 'CDNS', sector: 'Software' }, { ticker: 'FTNT', sector: 'Software' },
  { ticker: 'PANW', sector: 'Software' }, { ticker: 'ADSK', sector: 'Software' }, { ticker: 'TEAM', sector: 'Software' },
  { ticker: 'OKTA', sector: 'Software' }, { ticker: 'MDB', sector: 'Software' }, { ticker: 'DDOG', sector: 'Software' },
  { ticker: 'SNOW', sector: 'Software' }, { ticker: 'ROKU', sector: 'Communication' }, { ticker: 'F', sector: 'Automotive' },
  { ticker: 'GM', sector: 'Automotive' }, { ticker: 'XPEV', sector: 'Automotive' }, { ticker: 'LI', sector: 'Automotive' },
  { ticker: 'NKLA', sector: 'Automotive' }, { ticker: 'FSR', sector: 'Automotive' }, { ticker: 'GOEV', sector: 'Automotive' },
  { ticker: 'BA', sector: 'Aerospace' }, { ticker: 'LMT', sector: 'Aerospace' }, { ticker: 'RTX', sector: 'Aerospace' },
  { ticker: 'NOC', sector: 'Aerospace' }, { ticker: 'GD', sector: 'Aerospace' }, { ticker: 'SBUX', sector: 'Consumer' },
  { ticker: 'DPZ', sector: 'Consumer' }, { ticker: 'CMG', sector: 'Consumer' }, { ticker: 'YUM', sector: 'Consumer' },
  { ticker: 'MCD', sector: 'Consumer' }, { ticker: 'WEN', sector: 'Consumer' }, { ticker: 'JACK', sector: 'Consumer' },
  { ticker: 'WING', sector: 'Consumer' }, { ticker: 'TXRH', sector: 'Consumer' }, { ticker: 'CAKE', sector: 'Consumer' },
  { ticker: 'SHAK', sector: 'Consumer' }, { ticker: 'DENN', sector: 'Consumer' }, { ticker: 'BJRI', sector: 'Consumer' },
  { ticker: 'EAT', sector: 'Consumer' }, { ticker: 'DIN', sector: 'Consumer' }, { ticker: 'BLMN', sector: 'Consumer' },
  { ticker: 'DRI', sector: 'Consumer' }, { ticker: 'RRGB', sector: 'Consumer' }, { ticker: 'NDLS', sector: 'Consumer' },
  { ticker: 'QSR', sector: 'Consumer' }, { ticker: 'BBY', sector: 'Retail' }, { ticker: 'KSS', sector: 'Retail' },
  { ticker: 'M', sector: 'Retail' }, { ticker: 'JWN', sector: 'Retail' }, { ticker: 'ANF', sector: 'Retail' },
  { ticker: 'URBN', sector: 'Retail' }, { ticker: 'FL', sector: 'Retail' }, { ticker: 'NKE', sector: 'Retail' },
  { ticker: 'LULU', sector: 'Retail' }, { ticker: 'TPR', sector: 'Retail' }, { ticker: 'SHOO', sector: 'Retail' },
  { ticker: 'VRA', sector: 'Retail' }, { ticker: 'GES', sector: 'Retail' }, { ticker: 'LLY', sector: 'Healthcare' },
  { ticker: 'BMY', sector: 'Healthcare' }, { ticker: 'GILD', sector: 'Healthcare' }, { ticker: 'VRTX', sector: 'Healthcare' },
  { ticker: 'REGN', sector: 'Healthcare' }, { ticker: 'ALNY', sector: 'Healthcare' }, { ticker: 'BIIB', sector: 'Healthcare' },
  { ticker: 'NVAX', sector: 'Healthcare' }, { ticker: 'SLB', sector: 'Energy' }, { ticker: 'EOG', sector: 'Energy' },
  { ticker: 'PXD', sector: 'Energy' }, { ticker: 'MPC', sector: 'Energy' }, { ticker: 'PSX', sector: 'Energy' },
  { ticker: 'VLO', sector: 'Energy' }, { ticker: 'SEDG', sector: 'Energy' }, { ticker: 'RUN', sector: 'Energy' },
  { ticker: 'FSLR', sector: 'Energy' }, { ticker: 'BE', sector: 'Energy' }, { ticker: 'MS', sector: 'Financials' },
  { ticker: 'WFC', sector: 'Financials' }, { ticker: 'C', sector: 'Financials' }, { ticker: 'BLK', sector: 'Financials' },
  { ticker: 'SCHW', sector: 'Financials' }, { ticker: 'AXP', sector: 'Financials' }, { ticker: 'SPGI', sector: 'Financials' },
  { ticker: 'ICE', sector: 'Financials' }, { ticker: 'CME', sector: 'Financials' }, { ticker: 'MCO', sector: 'Financials' },
  { ticker: 'TGT', sector: 'Retail' }, { ticker: 'TJX', sector: 'Retail' }, { ticker: 'DG', sector: 'Retail' },
  { ticker: 'DLTR', sector: 'Retail' }, { ticker: 'ULTA', sector: 'Retail' }, { ticker: 'LHX', sector: 'Aerospace' }
];

let cachedData = { timestamp: 0, data: [] };

export default async function handler(req, res) {
  const now = Date.now();
  const thirtyMins = 30 * 60 * 1000;

  if (now - cachedData.timestamp < thirtyMins && cachedData.data.length > 0) {
    return res.status(200).json({ 
      data: cachedData.data, 
      nextScan: cachedData.timestamp + thirtyMins,
      lastUpdated: cachedData.timestamp
    });
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
        
        // REFINED GAP SCORE ALGORITHM (Max 100)
        let score = 25; // Base
        score += Math.min(Math.abs(gapPercent) * 2, 40); // Gap size up to 40 pts
        score += Math.min(volume / 100000, 20); // Volume up to 20 pts
        if (currentPrice > openPrice && gapPercent > 0) score += 15; // Holding gains
        else if (currentPrice < openPrice && gapPercent < 0) score += 15; // Holding losses
        score = Math.min(score, 100); 
        
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

    validGappers.sort((a, b) => b.gapScore - a.gapScore);
    
    // STRICTLY ENFORCE TOP 50
    const top50 = validGappers.slice(0, 50);

    if (top50.length === 0) throw new Error('No stocks met the scanner criteria.');

    cachedData = { timestamp: now, data: top50 };

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=59');
    res.status(200).json({ 
      data: top50, 
      nextScan: now + thirtyMins,
      lastUpdated: now 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
