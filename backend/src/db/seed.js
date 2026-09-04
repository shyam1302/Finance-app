import { query } from '../config/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const seedDB = async () => {
  try {
    console.log("Starting DB Seed Process...");
    
    // 1. Create Demo User
    const hash = await bcrypt.hash('password123', 10);
    const userRes = await query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      ['Demo User', 'demo@wealth.os', hash]
    );
    const userId = userRes.rows[0].id;
    console.log(`Demo user created: ${userId}`);

    // Clean existing data for this user to ensure idempotency
    await query('DELETE FROM transactions WHERE user_id=$1', [userId]);
    await query('DELETE FROM budgets WHERE user_id=$1', [userId]);
    await query('DELETE FROM investments WHERE user_id=$1', [userId]);
    await query('DELETE FROM goals WHERE user_id=$1', [userId]);
    await query('DELETE FROM loans WHERE user_id=$1', [userId]);

    // 2. Insert Transactions
    const d = new Date();
    const curMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    console.log("Generating 70+ demo transactions...");
    const txValues = [];
    const txParams = [userId];
    let paramIdx = 2;

    const merchants = [
      { m: 'Swiggy', c: 'Food', min: 200, max: 1500 },
      { m: 'Zomato', c: 'Food', min: 300, max: 2000 },
      { m: 'Uber', c: 'Travel', min: 150, max: 800 },
      { m: 'Ola', c: 'Travel', min: 100, max: 600 },
      { m: 'Amazon', c: 'Shopping', min: 500, max: 15000 },
      { m: 'Myntra', c: 'Shopping', min: 1000, max: 8000 },
      { m: 'Apollo Pharmacy', c: 'Health', min: 200, max: 3000 },
      { m: 'Netflix', c: 'Entertainment', min: 649, max: 649 },
      { m: 'PVR Cinemas', c: 'Entertainment', min: 800, max: 2500 },
      { m: 'Jio', c: 'Utilities', min: 299, max: 999 },
      { m: 'Bescom', c: 'Utilities', min: 800, max: 3500 }
    ];

    // Core transactions for CURRENT MONTH strictly defined to guarantee budget demo states
    txValues.push(`($1, $${paramIdx++}, 'income', 'Salary', 'Tech Corp', date_trunc('month', CURRENT_DATE) + interval '1 day', 'Monthly Salary')`);
    txParams.push(350000);
    
    txValues.push(`($1, $${paramIdx++}, 'expense', 'Housing', 'Landlord', date_trunc('month', CURRENT_DATE) + interval '2 days', 'Rent')`);
    txParams.push(40000);
    txValues.push(`($1, $${paramIdx++}, 'expense', 'Food', 'Swiggy', date_trunc('month', CURRENT_DATE) + interval '3 days', 'Groceries')`);
    txParams.push(5000);
    txValues.push(`($1, $${paramIdx++}, 'expense', 'Travel', 'Uber', date_trunc('month', CURRENT_DATE) + interval '4 days', 'Cab')`);
    txParams.push(2000);
    txValues.push(`($1, $${paramIdx++}, 'expense', 'Shopping', 'Amazon', date_trunc('month', CURRENT_DATE) + interval '5 days', 'New Monitor')`);
    txParams.push(12000);
    txValues.push(`($1, $${paramIdx++}, 'expense', 'Entertainment', 'Netflix', date_trunc('month', CURRENT_DATE) + interval '6 days', 'Subscription')`);
    txParams.push(1500);
    txValues.push(`($1, $${paramIdx++}, 'expense', 'Health', 'Apollo', date_trunc('month', CURRENT_DATE) + interval '7 days', 'Checkup')`);
    txParams.push(800);
    txValues.push(`($1, $${paramIdx++}, 'expense', 'Utilities', 'Bescom', date_trunc('month', CURRENT_DATE) + interval '8 days', 'Electricity Bill')`);
    txParams.push(2200);

    // Generate 75 random transactions strictly outside of the current month (30-180 days ago)
    for(let i=0; i<75; i++) {
        const template = merchants[Math.floor(Math.random() * merchants.length)];
        const amount = Math.floor(Math.random() * (template.max - template.min + 1)) + template.min;
        const daysAgo = Math.floor(Math.random() * 150) + 30;
        
        txValues.push(`($1, $${paramIdx++}, 'expense', $${paramIdx++}, $${paramIdx++}, CURRENT_DATE - ${daysAgo}, 'Generated')`);
        txParams.push(amount, template.c, template.m);
    }

    await query(
      `INSERT INTO transactions (user_id, amount, type, category, merchant, date, notes) VALUES ${txValues.join(', ')}`,
      txParams
    );
    console.log("Transactions seeded.");

    // 3. Insert Budgets
    await query(
      `INSERT INTO budgets (user_id, category, monthly_limit, month) VALUES 
      ($1, 'Food', 8000, $2),
      ($1, 'Housing', 40000, $2),
      ($1, 'Travel', 5000, $2),
      ($1, 'Shopping', 10000, $2),
      ($1, 'Entertainment', 3000, $2),
      ($1, 'Health', 4000, $2),
      ($1, 'Utilities', 2500, $2),
      ($1, 'Education', 5000, $2)`,
      [userId, curMonth]
    );
    console.log("Budgets seeded.");

    // 4. Insert Investments
    await query(
      `INSERT INTO investments (user_id, asset_type, symbol, name, quantity, buy_price, current_price, current_value, buy_date, last_updated) VALUES 
      ($1, 'stock', 'RELIANCE', 'Reliance Industries', 50, 2400, 2900, 145000, CURRENT_DATE - 100, NOW() - interval '1 hour'),
      ($1, 'stock', 'TCS', 'Tata Consultancy Services', 20, 3200, 3850, 77000, CURRENT_DATE - 200, NOW() - interval '1 hour'),
      ($1, 'mutual_fund', '118989', 'HDFC Flexi Cap Fund', 500, 45, 52, 26000, CURRENT_DATE - 300, NOW() - interval '1 hour'),
      ($1, 'mutual_fund', '120503', 'Parag Parikh Flexi Cap', 150, 60.5, 71.2, 10680, CURRENT_DATE - 150, NOW() - interval '1 hour'),
      ($1, 'crypto', 'bitcoin', 'Bitcoin', 0.05, 4500000, 5200000, 260000, CURRENT_DATE - 400, NOW() - interval '1 hour'),
      ($1, 'crypto', 'ethereum', 'Ethereum', 0.5, 180000, 210000, 105000, CURRENT_DATE - 90, NOW() - interval '1 hour'),
      ($1, 'fd', NULL, 'SBI Fixed Deposit 7.1%', 1, 100000, 100000, 100000, CURRENT_DATE - 50, NOW() - interval '1 hour'),
      ($1, 'gold', 'GOLD_BEES', 'Gold ETF', 10, 5200, 5800, 58000, CURRENT_DATE - 60, NOW() - interval '1 hour')`,
      [userId]
    );
    console.log("Investments seeded.");

    // 5. Insert Goals
    await query(
      `INSERT INTO goals (user_id, name, category, target_amount, saved_amount, monthly_sip, target_date) VALUES 
      ($1, 'Europe Trip', 'Travel', 300000, 120000, 15000, '2026-12-01'),
      ($1, 'Emergency Fund', 'Savings', 500000, 450000, 10000, '2026-06-01'),
      ($1, 'New Laptop', 'Gadget', 120000, 108000, 6000, '2026-04-01'),
      ($1, 'House Down Payment', 'House', 2000000, 300000, 25000, '2029-12-01'),
      ($1, 'Retirement Fund', 'Retirement', 20000000, 500000, 8000, '2045-01-01')`,
      [userId]
    );
    console.log("Goals seeded.");

    // 6. Insert Loans & Subscriptions & Tax
    await query(
      `INSERT INTO loans (user_id, lender_name, principal, outstanding, interest_rate, emi_amount, tenure_months, start_date) VALUES 
      ($1, 'HDFC Bank Auto Loan', 800000, 650000, 8.5, 17500, 60, '2022-01-01'),
      ($1, 'SBI Home Loan', 5000000, 3800000, 8.75, 42000, 240, '2019-04-01'),
      ($1, 'ICICI Personal Loan', 300000, 120000, 14, 9500, 36, '2023-06-01')`,
      [userId]
    );
    
    await query(
      `INSERT INTO subscriptions (user_id, name, amount, frequency, next_due, category) VALUES 
      ($1, 'Netflix', 649, 'monthly', CURRENT_DATE + 10, 'Streaming'),
      ($1, 'Spotify', 119, 'monthly', CURRENT_DATE + 5, 'Streaming'),
      ($1, 'Amazon Prime', 1499, 'yearly', CURRENT_DATE + 80, 'Streaming'),
      ($1, 'Gym Membership', 2000, 'monthly', CURRENT_DATE + 3, 'Fitness'),
      ($1, 'Jio Postpaid', 999, 'monthly', CURRENT_DATE + 1, 'Utility'),
      ($1, 'Google One', 130, 'monthly', CURRENT_DATE + 18, 'Software'),
      ($1, 'Zerodha Kite', 0, 'yearly', CURRENT_DATE + 300, 'Other'),
      ($1, 'HDFC Life Insurance', 12000, 'yearly', CURRENT_DATE + 120, 'Insurance')`,
      [userId]
    );

    await query(
      `INSERT INTO tax_investments (user_id, scheme, amount, financial_year) VALUES 
      ($1, 'ELSS', 50000, '2025-26'),
      ($1, 'PPF', 30000, '2025-26'),
      ($1, 'LIC', 15000, '2025-26')`,
      [userId]
    );
    // Add net worth snapshot
    await query(
      `INSERT INTO net_worth_snapshots (user_id, total_assets, total_liabilities, net_worth, snapshot_date) VALUES 
      ($1, 1500000, 650000, 850000, CURRENT_DATE - 30),
      ($1, 1600000, 630000, 970000, CURRENT_DATE)`,
      [userId]
    );

    console.log("✅ Seed complete! Login with [ demo@wealth.os / password123 ]");
    process.exit(0);
  } catch(e) {
    console.error("Seed failed", e);
    process.exit(1);
  }
};

seedDB();
