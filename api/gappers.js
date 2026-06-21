// api/gappers.js

export default async function handler(req, res) {
  try {
    const tvUrl = 'https://scanner.tradingview.com/america/scan';
    
    // We must mimic a real browser exactly, or TradingView will reject the Vercel server request
    const headers = {
      'Content-Type': 'application/json',
      'Origin': 'https://www.tradingview.com',
      'Referer': 'https://www.tradingview.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    };
    
    // Payload to ask TradingView for the top 150 gainers and 150 losers
    const basePayload = {
      "filter": [
        {"left": "type", "operation": "in_range", "right": ["stock", "fund"]},
        {"left": "subtype", "operation": "in_range", "right": ["common", "preferred", "american_depositary_receipt", "unit", "foreign_shares"]}
      ],
      "symbols": {"query": {"types": []}, "tickers": []},
      "columns": ["name", "description", "close", "open", "high", "low", "change", "change_abs", "volume"],
      "options": {"lang": "en", "active_symbols": "any"},
      "range": [0, 150]
    };
    
    const gainersPayload = { ...basePayload, "sort": {"sortBy": "change", "sortMode": "desc"}, "filter": [...basePayload.filter, {"left": "change", "operation": "greater", "right": 0}] };
    const losersPayload = { ...basePayload, "sort": {"sortBy": "change", "sortMode": "asc"}, "filter": [...basePayload.filter, {"left": "change", "operation": "less", "right": 0}] };
    
    const [gainersRes, losersRes] = await Promise.all([
      fetch(tvUrl, { method: 'POST', headers: headers, body: JSON.stringify(gainersPayload) }),
      fetch(tvUrl, { method: 'POST', headers: headers, body: JSON.stringify(losersPayload) })
    ]);

    if (!gainersRes.ok || !losersRes.ok) throw new Error('TradingView scanner request failed');

    const gainersData = await gainersRes.json();
    const losersData = await losersRes.json();

    const formatTV = (data, isUp) => {
      if (!data || !data.symbols) return [];
      return data.symbols.map(s => {
        const d = s.d;
        const fullSymbol = s.s;
        // TradingView returns "NASDAQ:NVDA", we just want "NVDA" for display
        const displayTicker = fullSymbol.includes(':') ? fullSymbol.split(':')[1] : fullSymbol;
        
        return {
          ticker: displayTicker,
          name: d[1],
          currentPrice: d[2],
          openPrice: d[3],
          high: d[4],
          low: d[5],
          gapPercent: d[6],
          change: d[7],
          volume: d[8] || 0,
          isUp: isUp,
          prevClose: d[2] - d[7]
        };
      });
    };

    let combined = [...formatTV(gainersData, true), ...formatTV(losersData, false)];
    
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
