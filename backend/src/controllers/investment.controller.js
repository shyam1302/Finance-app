import { query } from '../config/db.js';
import { getLivePrice } from '../services/pricing.service.js';

export const getInvestments = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    
    let totalInvested = 0; 
    let currentValue = 0;
    
    const holdings = result.rows.map(inv => {
      const q = Number(inv.quantity);
      const bp = Number(inv.buy_price);
      const cp = Number(inv.current_price) || bp;
      
      const invested = bp * q;
      const liveCurrent = Number(inv.current_value) || (q * cp);
      
      totalInvested += invested;
      currentValue += liveCurrent;
      
      const pnl = liveCurrent - invested;
      const pnl_percent = invested > 0 ? (pnl / invested) * 100 : 0;
      
      return {
        ...inv,
        amount_invested: invested,
        live_value: liveCurrent,
        pnl,
        pnl_percent
      };
    });

    let maxLastUpdated = null;
    if (result.rows.length > 0) {
      const dates = result.rows.map(r => new Date(r.last_updated).getTime()).filter(x => !isNaN(x));
      if (dates.length > 0) maxLastUpdated = new Date(Math.max(...dates)).toISOString();
    }

    res.json({ 
      success: true, 
      data: { 
        holdings, 
        summary: { 
          totalInvested, 
          currentValue, 
          totalPnl: currentValue - totalInvested,
          pnlPercent: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
          lastUpdated: maxLastUpdated
        } 
      } 
    });
  } catch (err) { next(err); }
};

export const addInvestment = async (req, res, next) => {
  try {
    const { asset_type, symbol, name, quantity, buy_price, current_price: inputCurrentPrice, buy_date, notes } = req.body;
    
    const VALID_ASSET_TYPES = ['stock', 'mutual_fund', 'crypto', 'fd', 'gold', 'real_estate', 'other'];
    const safeAssetType = VALID_ASSET_TYPES.includes(asset_type?.toLowerCase()) ? asset_type.toLowerCase() : 'other';

    const q = Number(quantity) > 0 ? Number(quantity) : 1;
    const bp = Number(buy_price) >= 0 ? Number(buy_price) : 0;
    
    let current_price = bp;
    if (inputCurrentPrice !== undefined && inputCurrentPrice !== '' && !isNaN(Number(inputCurrentPrice))) {
      current_price = Number(inputCurrentPrice);
    } else if (symbol) {
      const live = await getLivePrice(safeAssetType, symbol, bp);
      if (live) current_price = Number(live);
    }

    const current_value = q * current_price;
    const date = buy_date || new Date().toISOString().split('T')[0];

    const result = await query(
      `INSERT INTO investments (user_id, asset_type, symbol, name, quantity, buy_price, buy_date, current_price, current_value, notes, last_updated) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *`,
      [req.user.id, safeAssetType, symbol || '', name || `${safeAssetType.toUpperCase()} Node`, q, bp, date, current_price, current_value, notes || '']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

export const refreshPrices = async (req, res, next) => {
  try {
    const result = await query("SELECT id, asset_type, symbol, buy_price, current_price, quantity FROM investments WHERE user_id = $1", [req.user.id]);
    let updatedCount = 0;
    
    for (const inv of result.rows) {
      const q = Number(inv.quantity) || 1;
      let live = null;
      if (inv.symbol && ['stock', 'mutual_fund', 'crypto'].includes(inv.asset_type)) {
        live = await getLivePrice(inv.asset_type, inv.symbol, inv.current_price || inv.buy_price);
      }
      if (live !== null && !isNaN(Number(live))) {
        await query(
          "UPDATE investments SET current_price = $1, current_value = $2, last_updated = NOW() WHERE id = $3",
          [Number(live), q * Number(live), inv.id]
        );
        updatedCount++;
      }
    }

    await query("UPDATE investments SET last_updated = NOW() WHERE user_id = $1", [req.user.id]);

    res.json({ success: true, message: `Successfully refreshed ${updatedCount} investments`, updatedCount });
  } catch (err) { next(err); }
};

export const updateInvestment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { asset_type, symbol, name, quantity, buy_price, current_price: inputCurrentPrice, buy_date, notes } = req.body;
    
    const VALID_ASSET_TYPES = ['stock', 'mutual_fund', 'crypto', 'fd', 'gold', 'real_estate', 'other'];
    const safeAssetType = VALID_ASSET_TYPES.includes(asset_type?.toLowerCase()) ? asset_type.toLowerCase() : 'other';

    const q = Number(quantity) > 0 ? Number(quantity) : 1;
    const bp = Number(buy_price) >= 0 ? Number(buy_price) : 0;
    
    let cp = bp;
    if (inputCurrentPrice !== undefined && inputCurrentPrice !== '' && !isNaN(Number(inputCurrentPrice))) {
      cp = Number(inputCurrentPrice);
    } else {
      // Keep existing current_price if available
      const existing = await query('SELECT current_price FROM investments WHERE id = $1 AND user_id = $2', [id, req.user.id]);
      if (existing.rows.length > 0 && existing.rows[0].current_price !== null) {
        cp = Number(existing.rows[0].current_price);
      }
    }

    const cv = q * cp;
    const date = buy_date || new Date().toISOString().split('T')[0];

    const result = await query(
      `UPDATE investments 
       SET asset_type = $1, symbol = $2, name = $3, quantity = $4, buy_price = $5, current_price = $6, current_value = $7, buy_date = $8, notes = $9, last_updated = NOW()
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [safeAssetType, symbol || '', name || 'Investment', q, bp, cp, cv, date, notes || '', id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

export const deleteInvestment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM investments WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};
