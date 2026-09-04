import { query } from '../config/db.js';

export const getGoals = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

export const createGoal = async (req, res, next) => {
  try {
    const { name, category, target_amount, monthly_sip, target_date } = req.body;
    const result = await query(
      `INSERT INTO goals (user_id, name, category, target_amount, monthly_sip, target_date) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, name, category, target_amount, monthly_sip, target_date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

export const updateGoal = async (req, res, next) => {
  try {
     const { id } = req.params;
     const { name, target_amount, monthly_sip, target_date, category, status } = req.body;
     const result = await query(
       `UPDATE goals 
        SET name=COALESCE($1, name), 
            target_amount=COALESCE($2, target_amount), 
            monthly_sip=COALESCE($3, monthly_sip), 
            target_date=COALESCE($4, target_date),
            category=COALESCE($5, category),
            status=COALESCE($6, status)
        WHERE id=$7 AND user_id=$8 RETURNING *`,
       [name, target_amount, monthly_sip, target_date, category, status, id, req.user.id]
     );
     res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

export const contributeToGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const result = await query(
      'UPDATE goals SET saved_amount = saved_amount + $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [amount, id, req.user.id]
    );
    if(result.rows.length === 0) return res.status(404).json({success: false, error: 'Goal not found'});
    
    // Check if achieved
    if (Number(result.rows[0].saved_amount) >= Number(result.rows[0].target_amount)) {
      await query("UPDATE goals SET status = 'achieved' WHERE id = $1", [id]);
      result.rows[0].status = 'achieved';
    }
    
    // Auto-record a transaction as well? Not explicitly requested but logical. Let's omit for simplicity.
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM goals WHERE id=$1 AND user_id=$2 RETURNING id', [id, req.user.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};
