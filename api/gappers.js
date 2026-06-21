// api/gappers.js

export default async function handler(req, res) {
  try {
    const yahooUrl = (type) => `https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&lang=en-US&region=US&scrIds=${type}&count=100&corsDomain=finance.yahoo.com`;
    
    // Helper function to race 3 proxies at once so Yahoo never blocks Vercel
    const fetchYahoo = async (type) => {
      const url = yahooUrl(type);
      const proxies = [
        `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
      ];
      
      const promises = proxies.map(async (p) => {
        const r = await fetch(p);
        if (!r.ok) throw new Error('Proxy failed');
        try { return await r.json(); } catch (e) { throw new Error('Invalid JSON'); }
      });

      // Whichever proxy responds first with valid JSON wins
      return await Promise.any(promises);
    };

    const [gainersData, losersData] = await Promise.all([
      fetchYahoo('day_gainers'),
      fetchYahoo('day_losers')
    ]);

    const formatYahoo = (quote, isUp) => {
      if (!quote || !quote.symbol) return null;
      const currentPrice = quote.regularMarketPrice;
      const prevClose = quote.regularMarketPreviousClose;
      if (!prevClose || prevClose === 0) return null;
      const gapPercent = ((currentPrice - prevClose) / prevClose) * 100;
      
      return {
        ticker: quote.symbol,
        name: quote.shortName || quote.longName || 'N/A', 
        sector: 'Equity',
        prevClose: prevClose,
        openPrice: quote.regularMarketOpen || prevClose,
        currentPrice: currentPrice,
        high: quote.regularMarketDayHigh || currentPrice,
        low: quote.regularMarketDayLow || currentPrice,
        volume: quote.regularMarketVolume || 0,
        gapPercent: gapPercent,
        isUp: isUp,
      };
    };

    const gQuotes = gainersData?.finance?.result?.[0]?.quotes || [];
    const lQuotes = losersData?.finance?.result?.[0]?.quotes || [];

    let combined = [
      ...gQuotes.slice(0, 100).map(q => formatYahoo(q, true)),
      ...lQuotes.slice(0, 100).map(q => formatYahoo(q, false))
    ].filter(Boolean);

    // Filter out obscure penny stocks (require price > $1 and volume > 100k)
    combined = combined.filter(s => s.currentPrice > 1 && s.volume > 100000);
    combined.sort((a, b) => Math.abs(b.gapPercent) - Math.abs(a.gapPercent));

    if (combined.length === 0) throw new Error('No significant gaps found right now.');

    // Cache the result on Vercel for 30 minutes
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=59');
    res.status(200).json({ data: combined });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
