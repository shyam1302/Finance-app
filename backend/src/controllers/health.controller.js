import { query } from '../config/db.js';

export const getHealthScore = async (req, res, next) => {
  try {
    // Component 1: Savings Rate (Income vs Expense) -> Max 25 points
    // Component 2: Budget Adherence -> Max 25 points 
    // Simplified algorithm for hackathon demo
    const d = new Date();
    const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    // Get income vs expense
    const tx = await query(
      `SELECT type, SUM(amount) as total FROM transactions 
       WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2 GROUP BY type`,
      [req.user.id, currentMonth]
    );

    let income = 0; let expense = 0;
    tx.rows.forEach(r => {
      if (r.type === 'income') income = Number(r.total);
      if (r.type === 'expense') expense = Number(r.total);
    });

    let score = 50; // Base score
    
    if (income > 0) {
      const savingsRate = ((income - expense) / income) * 100;
      if (savingsRate > 20) score += 25;
      else if (savingsRate > 10) score += 15;
      else if (savingsRate > 0) score += 5;
      else score -= 10;
    }

    // Checking budgets
    const budgets = await query('SELECT * FROM budgets WHERE user_id = $1 AND month = $2', [req.user.id, currentMonth]);
    if (budgets.rows.length > 0) {
      score += 10; // Bonus for setting budgets
    }

    score = Math.max(0, Math.min(100, score)); // Clamp 0-100

    res.json({ success: true, data: { score, breakdown: { savingsRateScore: score - 50, budgetScore: budgets.rows.length > 0 ? 10 : 0 } } });
  } catch (err) {
    next(err);
  }
};
