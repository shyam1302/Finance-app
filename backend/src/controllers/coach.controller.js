import { query } from '../config/db.js';

export const getGamificationStats = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(amount) as total 
       FROM transactions WHERE user_id = $1 AND type = 'expense' 
       GROUP BY month ORDER BY month DESC LIMIT 12`, [req.user.id]
    );

    let streak = 0;
    for (const r of result.rows) {
      if (Number(r.total) < 50000) streak++;
      else break;
    }

    res.json({ success: true, data: { currentStreak: streak, badge: streak > 3 ? 'Gold Saver' : 'Starter' } });
  } catch(err) { next(err); }
};

// NEW - Chat History Load Karo
export const getChatHistory = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT role, message, created_at 
       FROM chat_messages 
       WHERE user_id = $1 
       ORDER BY created_at ASC 
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch(err) { next(err); }
};

export const getCoachAdvice = async (req, res, next) => {
  try {
    const { message } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, error: 'Gemini Key Not Configured' });

    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const [txRes, goalsRes, summaryRes, budgetsRes] = await Promise.all([
        query('SELECT category, amount, type, date FROM transactions WHERE user_id = $1 ORDER BY date DESC LIMIT 10', [req.user.id]),
        query("SELECT name, target_amount, saved_amount FROM goals WHERE user_id = $1 AND status = 'active'", [req.user.id]),
        query(`SELECT type, SUM(amount) as total FROM transactions WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2 GROUP BY type`, [req.user.id, currentMonth]),
        query('SELECT category, monthly_limit FROM budgets WHERE user_id = $1', [req.user.id])
    ]);

    let income = 0; let expense = 0;
    summaryRes.rows.forEach(r => { 
      if (r.type === 'income') income = Number(r.total); 
      if (r.type === 'expense') expense = Number(r.total); 
    });

    const contextData = {
       currency: "INR (Indian Rupees, ₹)",
       month: currentMonth,
       summary: { 
         income_inr: income, 
         expense_inr: expense, 
         savings_inr: income - expense 
       },
       recentTransactions: txRes.rows,
       activeGoals: goalsRes.rows,
       monthlyBudgets: budgetsRes.rows
    };

    const financialContext = JSON.stringify(contextData, null, 2);
    
    const systemPrompt = `You are a specialized AI financial coach for the 'Personal Wealth OS' app in India. Keep answers concise (under 150 words). Be highly pragmatic, encouraging, and expert in personal finance.

MANDATORY CURRENCY INSTRUCTION:
- The user's financial currency is strictly INDIAN RUPEES (INR / ₹).
- ALL monetary figures, income, expenses, savings, goals, and recommendations MUST ALWAYS use the Indian Rupee symbol '₹' (e.g., ₹1,149, ₹50,000, ₹1.5 Lakhs, ₹2 Crores).
- NEVER use the Dollar sign ($) or USD under any circumstance.

STRICT INSTRUCTION: You must ONLY answer questions related to finance, wealth management, investing, taxes (like Section 80C, capital gains), and economics.

CURRENT USER'S FINANCIAL REALITY (ALL FIGURES ARE IN INDIAN RUPEES ₹):
${financialContext}

Analyze the user's financial reality provided in JSON to answer their query intelligently with proper Rupee (₹) symbol.`;

    const userPrompt = `SYSTEM INSTRUCTION: ${systemPrompt}\n\nUSER MESSAGE: ${message || "Analyze my finances and give me one quick tip."}`;

    // USER MESSAGE SAVE KARO
    await query(
      `INSERT INTO chat_messages (user_id, role, message) VALUES ($1, $2, $3)`,
      [req.user.id, 'user', message]
    );

    const candidateModels = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite'];
    let aiReply = '';
    let callSuccess = false;

    for (const model of candidateModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             contents: [{ parts: [{ text: userPrompt }] }],
             generationConfig: { maxOutputTokens: 2048 }
           })
        });

        const data = await response.json();
        if (!data.error && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiReply = data.candidates[0].content.parts[0].text;
          callSuccess = true;
          break;
        } else if (data.error) {
          console.warn(`[Gemini Coach] Model ${model} error:`, data.error.message || data.error);
        }
      } catch (callErr) {
        console.warn(`[Gemini Coach] Request error for ${model}:`, callErr.message);
      }
    }

    if (!callSuccess) {
      const lowerMsg = (message || "").toLowerCase();
      if (lowerMsg.includes('80c') || lowerMsg.includes('tax')) {
        aiReply = "Under section 80C, you can claim up to ₹1.5 Lakhs in deductions. Leverage ELSS for capital appreciation combined with tax benefits, alongside PPF for stable, tax-free accumulation.";
      } else if (lowerMsg.includes('trip') || lowerMsg.includes('travel') || lowerMsg.includes('vacation') || lowerMsg.includes('europe')) {
        aiReply = "To see if you are on track for your trip, review your target goal amount and current savings in the Goals tab. Consistently allocating a portion of your monthly surplus to a dedicated liquid fund will keep you on schedule.";
      } else if (lowerMsg.includes('spending') || lowerMsg.includes('budget')) {
        aiReply = "Ensure your discretionary expenses remain below 30% of your total income. This preserves your savings rate and accelerates your journey to financial autonomy.";
      } else {
        aiReply = "I am currently experiencing higher than normal network traffic, but my primary advice is: maintain a 3-6 month emergency fund, track monthly expenses, and invest systematically in INR.";
      }
    } else {
      // Sanitize any stray dollar signs to Rupee symbol
      aiReply = aiReply.replace(/\$(\d)/g, '₹$1');
    }

    // AI REPLY SAVE KARO
    await query(
      `INSERT INTO chat_messages (user_id, role, message) VALUES ($1, $2, $3)`,
      [req.user.id, 'assistant', aiReply]
    );

    res.json({ success: true, data: aiReply });
  } catch (err) { next(err); }
};