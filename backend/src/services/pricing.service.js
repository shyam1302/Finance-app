import axios from 'axios';

export const getMFPrice = async (schemeCode) => {
  try {
    const { data } = await axios.get(`https://api.mfapi.in/mf/${schemeCode}`, { timeout: 4000 });
    if (data.data && data.data.length > 0) {
      return parseFloat(data.data[0].nav);
    }
    return null;
  } catch { 
    return null; 
  }
};

export const getCryptoPrice = async (coinId) => {
  try {
    const cleanId = coinId.toLowerCase().trim();
    const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cleanId}&vs_currencies=inr`, { timeout: 4000 });
    return data[cleanId]?.inr || null;
  } catch { 
    return null; 
  }
};

export const getStockPrice = async (symbol) => {
  try {
    if (!symbol) return null;
    const cleanSym = symbol.toUpperCase().trim();
    const candidates = cleanSym.includes('.') ? [cleanSym] : [`${cleanSym}.NS`, cleanSym, `${cleanSym}.BO`];
    
    for (const sym of candidates) {
      try {
        const { data } = await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`,
          { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 4000 }
        );
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price && !isNaN(price)) {
          return Number(price);
        }
      } catch {
        // try next candidate
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const getLivePrice = async (type, symbol, currentPrice = null) => {
  if (!symbol) return currentPrice ? Number(currentPrice) : null;
  
  // 1. Mutual Funds: Live AMFI NAV
  if (type === 'mutual_fund') {
    const live = await getMFPrice(symbol);
    if (live !== null) return live;
  }
  
  // 2. Crypto: Real CoinGecko live price in INR
  if (type === 'crypto') {
    const live = await getCryptoPrice(symbol);
    if (live !== null) return live;
  }

  // 3. Stocks: Real Yahoo Finance (NSE / BSE / Global) live price
  if (type === 'stock') {
    const live = await getStockPrice(symbol);
    if (live !== null) return live;
  }
  
  // Fallback to user's specified price if live lookup unavailable
  return currentPrice ? Number(currentPrice) : null;
};
