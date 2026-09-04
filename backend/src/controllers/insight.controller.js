import { query } from '../config/db.js';

export const getAlerts = async (req, res, next) => {
  try {
    const alerts = [];
    const d = new Date();
    const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    // Budget overspending check
    const budgetsResp = await query('SELECT * FROM budgets WHERE user_id = $1 AND month = $2', [req.user.id, currentMonth]);
    const expensesResp = await query(
      `SELECT category, SUM(amount) as total_spent 
       FROM transactions 
       WHERE user_id = $1 AND type = 'expense' AND TO_CHAR(date, 'YYYY-MM') = $2
       GROUP BY category`,
      [req.user.id, currentMonth]
    );

    const expenseMap = {};
    expensesResp.rows.forEach(r => expenseMap[r.category] = Number(r.total_spent));

    budgetsResp.rows.forEach(b => {
      const spent = expenseMap[b.category] || 0;
      const limit = Number(b.monthly_limit);
      if (spent >= limit) {
        alerts.push({ 
          id: `budget_exceeded_${b.category}`,
          type: 'warning', 
          title: 'Budget Exceeded', 
          message: `You have exceeded your ${b.category} budget by ₹${(spent - limit).toLocaleString()}.` 
        });
      } else if (spent >= limit * 0.8) {
        alerts.push({ 
          id: `budget_near_${b.category}`,
          type: 'info', 
          title: 'Nearing Budget Limit', 
          message: `You have used ${((spent/limit)*100).toFixed(0)}% of your ${b.category} budget.` 
        });
      }
    });

    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
};
