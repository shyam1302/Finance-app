import { query } from '../config/db.js';

export const getTaxBreakdown = async (req, res, next) => {
  try {
    const fy = req.query.fy || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    
    const result = await query('SELECT * FROM tax_investments WHERE user_id = $1 AND financial_year = $2', [req.user.id, fy]);
    
    // Indian 80C Limit = 1,50,000 INR
    const total_80c_limit = 150000;
    
    let total_invested = 0;
    result.rows.forEach(r => total_invested += Number(r.amount));
    
    const remaining_80c = Math.max(0, total_80c_limit - total_invested);
    const progress_percentage = Math.min(100, (total_invested / total_80c_limit) * 100);

    res.json({ 
      success: true, 
      data: { 
        investments: result.rows,
        summary: { total_invested, remaining_80c, total_80c_limit, progress_percentage, financial_year: fy }
      } 
    });
  } catch (err) { next(err); }
};

export const addTaxInvestment = async (req, res, next) => {
  try {
    const { scheme, amount, financial_year } = req.body;
    const result = await query(
      `INSERT INTO tax_investments (user_id, scheme, amount, financial_year) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, scheme, amount, financial_year]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

export const updateTaxInvestment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scheme, amount, financial_year } = req.body;
    const result = await query(
      `UPDATE tax_investments 
       SET scheme=COALESCE($1, scheme), 
           amount=COALESCE($2, amount), 
           financial_year=COALESCE($3, financial_year)
       WHERE id=$4 AND user_id=$5 RETURNING *`,
      [scheme, amount, financial_year, id, req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

export const deleteTaxInvestment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM tax_investments WHERE id=$1 AND user_id=$2 RETURNING id', [id, req.user.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};
