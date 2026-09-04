import { query } from '../config/db.js';

export const getNetWorth = async (req, res, next) => {
  try {
    const invResp = await query('SELECT SUM(current_value) as total_investments FROM investments WHERE user_id = $1', [req.user.id]);
    const total_investments = Number(invResp.rows[0].total_investments || 0);

    const loanResp = await query('SELECT SUM(outstanding) as total_loans FROM loans WHERE user_id = $1', [req.user.id]);
    const total_loans = Number(loanResp.rows[0].total_loans || 0);

    const txResp = await query('SELECT type, SUM(amount) as total FROM transactions WHERE user_id = $1 GROUP BY type', [req.user.id]);
    let cash = 0;
    txResp.rows.forEach(r => {
      if(r.type === 'income') cash += Number(r.total);
      if(r.type === 'expense') cash -= Number(r.total);
    });

    const total_assets = total_investments + cash;
    const total_liabilities = total_loans;
    const net_worth = total_investments + cash - total_loans;

    res.json({ success: true, data: { total_assets, total_liabilities, net_worth, cash, total_investments, total_loans } });
  } catch (err) {
    next(err);
  }
};

export const getNetWorthHistory = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM net_worth_snapshots WHERE user_id = $1 ORDER BY snapshot_date ASC', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

export const createSnapshot = async (req, res, next) => {
  try {
    const { total_assets, total_liabilities, net_worth, snapshot_date } = req.body;
    const date = snapshot_date || new Date().toISOString().split('T')[0];

    const result = await query(
      `INSERT INTO net_worth_snapshots (user_id, total_assets, total_liabilities, net_worth, snapshot_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, total_assets, total_liabilities, net_worth, date]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
