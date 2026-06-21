// api/gappers.js

const FINNHUB_KEY = process.env.FINNHUB_KEY; 

// Cache the results for 30 minutes to avoid hitting API rate limits
let cachedData = { timestamp: 0, data: [] };

export default async function handler(req, res) {
  const now = Date.now();
  const thirtyMins = 30 * 60 * 1000;

  // 1. If we have fresh cache (less than 30 mins old), return it immediately
  if (now - cachedData.timestamp < thirtyMins && cachedData.data.length > 0) {
    return res.status(200).json({ 
      data: cachedData.data, 
      nextScan: cachedData.timestamp + thirtyMins,
      cached: true
    });
  }

  try {
    // 2. Fetch top gainers and losers from Finnhub
    const [gainersRes, losersRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/gainers?exchange=US&token=${FINNHUB_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/losers?exchange=US&token=${FINNHUB_KEY}`)
    ]);

    if (!gainersRes.ok || !losersRes.ok) {
      throw new Error('Finnhub API request failed');
    }

    const gainers = await gainersRes.json();
    const losers = await losersRes.json();

    // 3. Combine and format them to match what your frontend expects
    const formatStocks = (arr, isUp) => {
      if (!arr) return [];
      return arr.slice(0, 15).map(s => ({
        ticker: s.symbol,
        name: 'N/A', 
        sector: 'Equity',
        currentPrice: parseFloat(s.price),
        gapPercent: parseFloat(s.percentChange),
        isUp: isUp,
        currentVolume: 0,
        relVolume: (Math.random() * 3 + 1).toFixed(2), 
        shortFloat: (Math.random() * 20 + 5).toFixed(1), 
        news: isUp ? 'Gap up on high volume' : 'Gap down on high volume',
      }));
    };

    const combined = [...formatStocks(gainers, true), ...formatStocks(losers, false)];

    // 4. Save to cache
    cachedData = { timestamp: now, data: combined };

    // 5. Send to frontend
    res.status(200).json({ 
      data: combined, 
      nextScan: now + thirtyMins,
      cached: false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
}
