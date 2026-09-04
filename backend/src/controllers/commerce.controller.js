import Razorpay from 'razorpay';
import { query } from '../config/db.js';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Real product search karo
const searchProducts = async (searchQuery, budget) => {
    const serperKey = process.env.SERPER_API_KEY;

    const response = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: `${searchQuery} buy online india under ${budget}`,
            gl: 'in',
            hl: 'en',
            num: 6
        })
    });

    const data = await response.json();
    return data.shopping || [];
};

export const getProducts = async (req, res) => {
    res.json({ success: true, data: [] });
};

export const chatWithAgent = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        const result = await query(`
            SELECT 
                COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expenses
            FROM transactions 
            WHERE user_id = $1
        `, [userId]);

        const { income, expenses } = result.rows[0];
        const savings = income - expenses;


        // Real products search karo
        let searchResults = [];
        try {
            searchResults = await searchProducts(message, savings);
        } catch (err) {
            console.error("Serper Error:", err);
        }

        const apiKey = process.env.GEMINI_API_KEY;

        const productsContext = searchResults.length > 0
            ? searchResults.slice(0, 6).map((p, i) =>
                `${i + 1}. ${p.title} - ${p.price} (${p.source})`
            ).join('\n')
            : "No products found";

        const prompt = `
You are an AI Commerce Agent for Wealth OS.

User Financial Data:
- Current Savings: Rs.${savings}

Real Products Found Online:
${productsContext}

User Message: "${message}"

Rules:
1. Show products as numbered list with prices
2. Check if user can afford each product
3. Suggest best value for money
4. NEVER ask user to type READY_TO_PAY
5. User will click BUY button on product cards
6. Just say "Click BUY button on right side!"
7. Reply in the SAME language 
8. Keep under 150 words
`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 600 }
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            console.error("Gemini Error:", data.error.message);
            return res.json({
                success: true,
                data: "Sorry, AI temporarily unavailable. Please try again!",
                savings: Number(savings),
                products: searchResults.slice(0, 6)
            });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
            || "Kuch samajh nahi aaya, dobara poochho!";

        res.json({
            success: true,
            data: reply,
            savings: Number(savings),
            products: searchResults.slice(0, 6)
        });

    } catch (err) {
        console.error("Commerce Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export const createOrder = async (req, res) => {
    try {
        const { items } = req.body;
        // items = [{name, price}, {name, price}...]

        const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

        const order = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            notes: {
                items: items.map(i => i.name).join(', ')
            }
        });

        res.json({
            success: true,
            order,
            items,
            totalAmount,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Har item ke liye transaction save karo
            for (const item of items) {
                await query(`
                    INSERT INTO transactions 
                    (user_id, amount, type, category, merchant, date, notes)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    req.user.id,
                    item.price,
                    'expense',
                    item.category || 'shopping',
                    item.name,
                    new Date().toISOString().split('T')[0],
                    `Purchased via AI Commerce Agent. Payment ID: ${razorpay_payment_id}`
                ]);
            }

            // Also record successful payment log if table exists
            try {
                const totalAmount = (items || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0);
                await query(`
                    INSERT INTO payment_logs 
                    (user_id, order_id, payment_id, amount, status, metadata)
                    VALUES ($1, $2, $3, $4, 'success', $5)
                `, [
                    req.user.id,
                    razorpay_order_id,
                    razorpay_payment_id,
                    totalAmount,
                    JSON.stringify({ items, verified_at: new Date().toISOString() })
                ]);
            } catch (logErr) {
                // Table might not exist or logging is non-blocking
                console.warn("Payment log write skipped:", logErr.message);
            }

            res.json({
                success: true,
                message: "Payment verified! All transactions saved!"
            });
        } else {
            console.error("Payment verification failed: Invalid signature for order", razorpay_order_id);
            try {
                await query(`
                    INSERT INTO payment_logs 
                    (user_id, order_id, payment_id, status, error_code, error_description, error_reason)
                    VALUES ($1, $2, $3, 'failed', 'SIGNATURE_VERIFICATION_FAILED', 'Invalid signature returned from gateway', 'signature_mismatch')
                `, [req.user.id, razorpay_order_id, razorpay_payment_id]);
            } catch (logErr) {
                console.warn("Payment log write skipped:", logErr.message);
            }

            res.status(400).json({
                success: false,
                error: "Invalid signature verification failed",
                details: {
                    reason: "signature_mismatch",
                    description: "The payment response signature could not be verified by the server."
                }
            });
        }
    } catch (err) {
        console.error("Payment verification error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export const recordPaymentFailure = async (req, res) => {
    try {
        const {
            order_id,
            payment_id,
            amount,
            error_code,
            error_description,
            error_source,
            error_step,
            error_reason,
            metadata,
            items
        } = req.body;

        console.warn(`[Payment Failure] User ${req.user.id}: Order ${order_id || 'N/A'}, Payment ${payment_id || 'N/A'}, Reason: ${error_reason || error_description || 'Unknown'}`);

        let logged = false;
        try {
            await query(`
                INSERT INTO payment_logs 
                (user_id, order_id, payment_id, amount, status, error_code, error_description, error_source, error_step, error_reason, metadata)
                VALUES ($1, $2, $3, $4, 'failed', $5, $6, $7, $8, $9, $10)
            `, [
                req.user.id,
                order_id || null,
                payment_id || null,
                amount ? Number(amount) : null,
                error_code || 'PAYMENT_FAILED',
                error_description || 'Payment could not be completed',
                error_source || 'unknown',
                error_step || 'unknown',
                error_reason || 'unknown',
                JSON.stringify({
                    metadata: metadata || {},
                    items: items || [],
                    timestamp: new Date().toISOString()
                })
            ]);
            logged = true;
        } catch (dbErr) {
            console.warn("Could not insert into payment_logs table (table might need init):", dbErr.message);
        }

        res.json({
            success: true,
            message: "Payment failure recorded successfully",
            recorded: logged,
            failureDetails: {
                order_id,
                payment_id,
                error_code,
                error_description,
                error_source,
                error_step,
                error_reason
            }
        });
    } catch (err) {
        console.error("Record Payment Failure Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};