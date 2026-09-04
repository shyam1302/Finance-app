CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')),
  category VARCHAR(50),
  merchant VARCHAR(100),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  monthly_limit DECIMAL(12,2) NOT NULL,
  month VARCHAR(7) NOT NULL, -- e.g. '2025-03'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) CHECK (asset_type IN ('stock','mutual_fund','crypto','fd','gold','real_estate','other')),
  symbol VARCHAR(50),
  name VARCHAR(150) NOT NULL,
  quantity DECIMAL(18,6),
  buy_price DECIMAL(14,4),
  buy_date DATE,
  current_price DECIMAL(14,4),
  current_value DECIMAL(14,2),
  last_updated TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50), 
  target_amount DECIMAL(14,2) NOT NULL,
  saved_amount DECIMAL(14,2) DEFAULT 0,
  monthly_sip DECIMAL(12,2),
  target_date DATE,
  status VARCHAR(20) DEFAULT 'active', 
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER CHECK (score BETWEEN 5 AND 25),
  profile_type VARCHAR(20) CHECK (profile_type IN ('conservative','moderate','aggressive')),
  questionnaire_answers JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_assets DECIMAL(16,2),
  total_liabilities DECIMAL(16,2),
  net_worth DECIMAL(16,2),
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lender_name VARCHAR(100),
  principal DECIMAL(14,2),
  outstanding DECIMAL(14,2),
  interest_rate DECIMAL(5,2),
  emi_amount DECIMAL(12,2),
  tenure_months INTEGER,
  start_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency VARCHAR(20) CHECK (frequency IN ('monthly','quarterly','yearly')),
  next_due DATE,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scheme VARCHAR(50) CHECK (scheme IN ('ELSS','PPF','LIC','NPS','NSC','SCSS','other')),
  amount DECIMAL(12,2),
  financial_year VARCHAR(9),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

