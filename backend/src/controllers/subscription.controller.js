import { query } from '../config/db.js';

export const getSubscriptions = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY next_due ASC', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

export const addSubscription = async (req, res, next) => {
  try {
    const { name, amount, frequency, next_due, category } = req.body;
    const result = await query(
      `INSERT INTO subscriptions (user_id, name, amount, frequency, next_due, category) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, name, amount, frequency, next_due, category]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, amount, frequency, next_due, category } = req.body;
    const result = await query(
      `UPDATE subscriptions 
       SET name=COALESCE($1, name), 
           amount=COALESCE($2, amount), 
           frequency=COALESCE($3, frequency), 
           next_due=COALESCE($4, next_due), 
           category=COALESCE($5, category)
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [name, amount, frequency, next_due, category, id, req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

export const deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM subscriptions WHERE id=$1 AND user_id=$2 RETURNING id', [id, req.user.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};
