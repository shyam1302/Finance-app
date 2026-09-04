import { query } from '../config/db.js';

export const analyzeTransactionImpact = async (userId, transaction) => {
  if (transaction.type !== 'expense') return null;

  try {
    const d = new Date(transaction.date);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    // 1. Check if this transaction causes overspending in its category
    const budgetResp = await query('SELECT monthly_limit FROM budgets WHERE user_id = $1 AND category = $2 AND month = $3', [userId, transaction.category, month]);
    if (budgetResp.rows.length === 0) return null; // No budget for this category

    const limit = Number(budgetResp.rows[0].monthly_limit);

    const expensesResp = await query(
      `SELECT SUM(amount) as total_spent 
       FROM transactions 
       WHERE user_id = $1 AND type = 'expense' AND category = $2 AND TO_CHAR(date, 'YYYY-MM') = $3`,
      [userId, transaction.category, month]
    );
    const spent = Number(expensesResp.rows[0]?.total_spent || 0);

    // If this transaction causes or exacerbates an overspend
    if (spent > limit) {
      const overspendAmount = spent - limit;

      // 2. Find their most pressing active goal
      const goalsResp = await query(
        `SELECT id, name, target_amount, saved_amount, monthly_sip 
         FROM goals 
         WHERE user_id = $1 AND status = 'active' 
         ORDER BY created_at ASC LIMIT 1`, 
        [userId]
      );

      if (goalsResp.rows.length > 0) {
        const goal = goalsResp.rows[0];
        const sip = Number(goal.monthly_sip) || 5000; // fallback sip
        
        // Delay calculator: How many days of SIP does this overspend represent?
        const dailySavingsRate = sip / 30;
        const delayedDays = Math.ceil(overspendAmount / dailySavingsRate);

        return {
          type: 'warning',
          title: 'Goal Impact Alert',
          message: `This overspending of ₹${overspendAmount.toLocaleString()} in ${transaction.category} could delay your goal "${goal.name}" by approx ${delayedDays} days.`
        };
      }
    }
  } catch(e) {
    console.error("Goal Engine Error:", e);
  }
  return null;
};
