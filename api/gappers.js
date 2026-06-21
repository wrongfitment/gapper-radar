// api/gappers.js

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
    // Yahoo Finance endpoints for top gainers and losers (requires no API key)
    const yahooUrl = (type) => `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&lang=en-US&region=US&scrIds=${type}&count=15&corsDomain=finance.yahoo.com`;
    
    const [gainersRes, losersRes] = await Promise.all([
      fetch(yahooUrl('day_gainers'), { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch(yahooUrl('day_losers'), { headers: { 'User-Agent': 'Mozilla/5.0' } })
    ]);

    if (!gainersRes.ok || !losersRes.ok) throw new Error('Yahoo Finance request failed');

    const gainersData = await gainersRes.json();
    const losersData = await losersRes.json();

    // 2. Helper to format Yahoo quotes to match our frontend
    const formatYahoo = (quote, isUp) => {
      if (!quote || !quote.symbol) return null;
      
      const currentPrice = quote.regularMarketPrice;
      const prevClose = quote.regularMarketPreviousClose;
      
      // Calculate true gap/move percentage
      const gapPercent = prevClose ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
      
      return {
        ticker: quote.symbol,
        name: quote.shortName || quote.longName || 'N/A', 
        sector: quote.industry || 'Equity',
        prevClose: prevClose,
        openPrice: quote.regularMarketOpen || prevClose,
        currentPrice: currentPrice,
        high: quote.regularMarketDayHigh || currentPrice,
        low: quote.regularMarketDayLow || currentPrice,
        volume: quote.regularMarketVolume || 0,
        gapPercent: gapPercent,
        isUp: isUp,
        news: isUp ? 'Gap up on market open' : 'Gap down on market open',
      };
    };

    // 3. Extract and format the top 12 gainers and 12 losers
    const gQuotes = gainersData?.finance?.result?.[0]?.quotes || [];
    const lQuotes = losersData?.finance?.result?.[0]?.quotes || [];

    const combined = [
      ...gQuotes.slice(0, 12).map(q => formatYahoo(q, true)),
      ...lQuotes.slice(0, 12).map(q => formatYahoo(q, false))
    ].filter(Boolean);

    if (combined.length === 0) throw new Error('No valid quotes returned');

    // 4. Save to cache
    cachedData = { timestamp: now, data: combined };

    res.status(200).json({ 
      data: combined, 
      nextScan: now + thirtyMins,
      cached: false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch market data: ' + error.message });
  }
}
