import { query } from '../config/db.js';

export const submitQuestionnaire = async (req, res, next) => {
  try {
    const { answers } = req.body; 
    const score = answers.reduce((a, b) => a + b, 0);
    
    let profile_type = 'moderate';
    if (score <= 10) profile_type = 'conservative';
    else if (score >= 18) profile_type = 'aggressive';

    const result = await query(
      `INSERT INTO risk_profile (user_id, score, profile_type, questionnaire_answers) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, score, profile_type, JSON.stringify(answers)]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

export const getProfile = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM risk_profile WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    res.json({ success: true, data: result.rows[0] || null });
  } catch(err) { next(err); }
};
