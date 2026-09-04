import { query } from '../config/db.js';

export const getBudgets = async (req, res, next) => {
  try {
    const { month } = req.query; // e.g. '2025-03'
    if (!month) return res.status(400).json({ success: false, error: 'Month parameter required in YYYY-MM format' });

    const result = await query('SELECT * FROM budgets WHERE user_id = $1 AND month = $2', [req.user.id, month]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

export const setBudget = async (req, res, next) => {
  try {
    const { category, monthly_limit, month } = req.body;
    
    // Check if budget already exists for that month and category
    const existing = await query('SELECT id FROM budgets WHERE user_id = $1 AND category = $2 AND month = $3', [req.user.id, category, month]);

    let result;
    if (existing.rows.length > 0) {
      result = await query(
        'UPDATE budgets SET monthly_limit = $1 WHERE id = $2 RETURNING *',
        [monthly_limit, existing.rows[0].id]
      );
    } else {
      result = await query(
        'INSERT INTO budgets (user_id, category, monthly_limit, month) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.user.id, category, monthly_limit, month]
      );
    }

    res.status(existing.rows.length > 0 ? 200 : 201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

export const getBudgetAlerts = async (req, res, next) => {
  try {
    let { month } = req.query;
    if (!month) {
      const d = new Date();
      month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    // Get all budgets for current month
    const budgetsResp = await query('SELECT * FROM budgets WHERE user_id = $1 AND month = $2', [req.user.id, month]);
    const budgets = budgetsResp.rows;

    if (budgets.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get all expenses for current month grouped by category
    const expensesResp = await query(
      `SELECT category, SUM(amount) as total_spent 
       FROM transactions 
       WHERE user_id = $1 AND type = 'expense' AND TO_CHAR(date, 'YYYY-MM') = $2
       GROUP BY category`,
      [req.user.id, month]
    );

    const expenseMap = {};
    expensesResp.rows.forEach(r => expenseMap[r.category] = Number(r.total_spent));

    const alerts = [];
    budgets.forEach(b => {
      const spent = expenseMap[b.category] || 0;
      const limit = Number(b.monthly_limit);
      const percentage = (spent / limit) * 100;

      let status = 'good';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      alerts.push({ id: b.id, category: b.category, status, percentage, spent, limit, month: b.month });
    });

    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Budget not found or unauthorized' });
    }

    res.json({ success: true, data: { id: result.rows[0].id } });
  } catch (err) {
    next(err);
  }
};
