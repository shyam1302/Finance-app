import { query } from '../config/db.js';

export const getLoans = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM loans WHERE user_id = $1 ORDER BY start_date DESC', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

export const addLoan = async (req, res, next) => {
  try {
    const { lender_name, principal, outstanding, interest_rate, emi_amount, tenure_months, start_date } = req.body;
    const result = await query(
      `INSERT INTO loans (user_id, lender_name, principal, outstanding, interest_rate, emi_amount, tenure_months, start_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, lender_name, principal, outstanding || principal, interest_rate, emi_amount, tenure_months, start_date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

export const updateLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lender_name, principal, outstanding, interest_rate, emi_amount, tenure_months, start_date } = req.body;
    const result = await query(
      `UPDATE loans 
       SET lender_name=COALESCE($1, lender_name), 
           principal=COALESCE($2, principal), 
           outstanding=COALESCE($3, outstanding), 
           interest_rate=COALESCE($4, interest_rate), 
           emi_amount=COALESCE($5, emi_amount), 
           tenure_months=COALESCE($6, tenure_months), 
           start_date=COALESCE($7, start_date)
       WHERE id=$8 AND user_id=$9 RETURNING *`,
      [lender_name, principal, outstanding, interest_rate, emi_amount, tenure_months, start_date, id, req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

export const deleteLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM loans WHERE id=$1 AND user_id=$2 RETURNING id', [id, req.user.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};
