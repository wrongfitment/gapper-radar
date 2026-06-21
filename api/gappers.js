// api/gappers.js

export default async function handler(req, res) {
  try {
    // Yahoo Finance endpoints for top 100 gainers and losers (requires no API key)
    const yahooUrl = (type) => `https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&lang=en-US&region=US&scrIds=${type}&count=100&corsDomain=finance.yahoo.com`;
    
    // We MUST use a browser User-Agent so Yahoo allows the request from the server
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' };

    const [gainersRes, losersRes] = await Promise.all([
      fetch(yahooUrl('day_gainers'), { headers }),
      fetch(yahooUrl('day_losers'), { headers })
    ]);

    if (!gainersRes.ok || !losersRes.ok) throw new Error('Yahoo Finance request failed');

    const gainersData = await gainersRes.json();
    const losersData = await losersRes.json();

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

    // Cache the result on Vercel for 30 minutes so we don't spam Yahoo
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=59');
    res.status(200).json({ data: combined });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
