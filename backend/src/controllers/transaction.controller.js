import { query } from '../config/db.js';
import { categorizeTransaction } from '../services/categorization.service.js';
import { analyzeTransactionImpact } from '../services/goalEngine.service.js';

export const getTransactions = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, minAmount, maxAmount, page = 1, limit = 20 } = req.query;
    
    let sql = 'SELECT * FROM transactions WHERE user_id = $1';
    let countSql = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = $1';
    const params = [req.user.id];
    let paramCount = 1;

    if (type) {
      paramCount++;
      sql += ` AND type = $${paramCount}`;
      countSql += ` AND type = $${paramCount}`;
      params.push(type);
    }
    if (category) {
      paramCount++;
      sql += ` AND category = ANY($${paramCount}::text[])`;
      countSql += ` AND category = ANY($${paramCount}::text[])`;
      params.push(category.split(','));
    }
    if (startDate) {
      paramCount++;
      sql += ` AND date >= $${paramCount}`;
      countSql += ` AND date >= $${paramCount}`;
      params.push(startDate);
    }
    if (endDate) {
      paramCount++;
      sql += ` AND date <= $${paramCount}`;
      countSql += ` AND date <= $${paramCount}`;
      params.push(endDate);
    }
    if (minAmount) {
      paramCount++;
      sql += ` AND amount >= $${paramCount}`;
      countSql += ` AND amount >= $${paramCount}`;
      params.push(Number(minAmount));
    }
    if (maxAmount) {
      paramCount++;
      sql += ` AND amount <= $${paramCount}`;
      countSql += ` AND amount <= $${paramCount}`;
      params.push(Number(maxAmount));
    }

    // Process pagination
    const offset = (page - 1) * limit;
    sql += ` ORDER BY date DESC, created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].total, 10);
    
    const result = await query(sql, [...params, limit, offset]);
    
    res.json({ 
      success: true, 
      data: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    let { amount, type, category, merchant, date, notes } = req.body;
    
    if (!category && type === 'expense') {
      category = categorizeTransaction(merchant);
    } else if (!category) {
      category = 'Other';
    }

    const result = await query(
      `INSERT INTO transactions (user_id, amount, type, category, merchant, date, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, amount, type, category, merchant, date, notes]
    );

    const transaction = result.rows[0];
    let nudge = null;
    if (type === 'expense') {
      nudge = await analyzeTransactionImpact(req.user.id, transaction);
    }

    res.status(201).json({ success: true, data: transaction, nudge });
  } catch (err) {
    next(err);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const setClause = [];
    const params = [id, req.user.id];
    let paramCount = 2;

    for (const [key, value] of Object.entries(updates)) {
      paramCount++;
      setClause.push(`${key} = $${paramCount}`);
      params.push(value);
    }

    const sql = `UPDATE transactions SET ${setClause.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`;
    
    const result = await query(sql, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction not found or unauthorized' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction not found or unauthorized' });
    }

    res.json({ success: true, data: { id: result.rows[0].id } });
  } catch (err) {
    next(err);
  }
};

export const importTransactions = async (req, res, next) => {
  try {
    const transactions = req.body.transactions;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ success: false, error: 'Valid payload array required.' });
    }

    let inserted = 0;
    let skipped = 0;

    for (const tx of transactions) {
      try {
        let { date, amount, type, category, merchant, notes } = tx;
        
        const numAmount = Math.abs(parseFloat(amount));
        if (!merchant || isNaN(numAmount) || numAmount <= 0) {
          skipped++;
          continue;
        }

        // Normalize date to YYYY-MM-DD
        let validDate = null;
        if (date) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(String(date).trim())) {
            validDate = String(date).trim();
          } else {
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
              validDate = d.toISOString().split('T')[0];
            }
          }
        }
        if (!validDate) {
          validDate = new Date().toISOString().split('T')[0];
        }

        const normalizedType = String(type || '').toLowerCase().includes('income') ? 'income' : 'expense';
        const cleanMerchant = String(merchant).trim();
        
        if (!category && normalizedType === 'expense') {
          category = categorizeTransaction(cleanMerchant);
        } else if (!category) {
          category = normalizedType === 'income' ? 'Salary' : 'Other';
        }

        await query(
          `INSERT INTO transactions (user_id, amount, type, category, merchant, date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [req.user.id, numAmount, normalizedType, category, cleanMerchant, validDate, notes ? String(notes).trim() : null]
        );
        inserted++;
      } catch (err) {
        console.error('Error inserting transaction row:', err);
        skipped++;
      }
    }

    res.status(201).json({ success: true, inserted, skipped });
  } catch (err) {
    next(err);
  }
};
