// api/gappers.js

const ALPACA_KEY = process.env.ALPACA_KEY;
const ALPACA_SECRET = process.env.ALPACA_SECRET;

// YOUR CATALYST CLASSIFIER LOGIC
function classifyEarningsCatalyst({ epsActual, epsEstimate, revenueActual, revenueEstimate, guidanceDirection, gapPercent }) {
  const tags = [];
  const epsBeat = epsActual != null && epsEstimate != null ? epsActual - epsEstimate : null;
  const revBeat = revenueActual != null && revenueEstimate != null ? revenueActual - revenueEstimate : null;

  if (epsBeat != null) {
    if (epsBeat > 0) tags.push({ tag: 'Earnings Beat', polarity: 'bullish' });
    else if (epsBeat < 0) tags.push({ tag: 'Earnings Miss', polarity: 'bearish' });
  }
  if (revBeat != null) {
    if (revBeat > 0) tags.push({ tag: 'Revenue Beat', polarity: 'bullish' });
    else if (revBeat < 0) tags.push({ tag: 'Revenue Miss', polarity: 'bearish' });
  }
  if (guidanceDirection === 'raised') tags.push({ tag: 'Guidance Raised', polarity: 'bullish' });
  else if (guidanceDirection === 'lowered') tags.push({ tag: 'Guidance Cut', polarity: 'bearish' });

  const gapIsDown = gapPercent < 0;
  const agreesWithGap = (t) => (gapIsDown && t.polarity === 'bearish') || (!gapIsDown && t.polarity === 'bullish');

  tags.sort((a, b) => Number(agreesWithGap(b)) - Number(agreesWithGap(a)));

  const primary = tags.find(agreesWithGap) ?? tags[0] ?? null;
  const secondary = tags.find((t) => t !== primary) ?? null;

  return [primary, secondary].filter(Boolean).map((t) => t.tag);
}

// Mock earnings data generator to simulate the pipeline feeding your classifier
function getMockEarningsData(gapPercent) {
  const isUp = gapPercent > 0;
  // 20% chance of a mixed signal (like the ACN scenario)
  const isMixed = Math.random() > 0.8; 
  
  if (isUp) {
    if (isMixed) return { epsActual: 1.1, epsEstimate: 1.0, revenueActual: 9.9, revenueEstimate: 10.0, guidanceDirection: 'raised' };
    return { epsActual: 1.1, epsEstimate: 1.0, revenueActual: 10.1, revenueEstimate: 10.0, guidanceDirection: 'raised' };
  } else {
    if (isMixed) return { epsActual: 1.1, epsEstimate: 1.0, revenueActual: 9.9, revenueEstimate: 10.0, guidanceDirection: 'lowered' };
    return { epsActual: 0.9, epsEstimate: 1.0, revenueActual: 9.9, revenueEstimate: 10.0, guidanceDirection: 'lowered' };
  }
}

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
  { ticker: 'VLO', sector: 'Energy' }, { ticker: 'SEDG', sector: 'Energy
