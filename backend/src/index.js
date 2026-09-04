import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimiter } from './middleware/rateLimiter.js';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import insightRoutes from './routes/insight.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import healthRoutes from './routes/health.routes.js';
import networthRoutes from './routes/networth.routes.js';
import investmentRoutes from './routes/investment.routes.js';
import riskRoutes from './routes/risk.routes.js';
import goalRoutes from './routes/goal.routes.js';
import loanRoutes from './routes/loan.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import taxRoutes from './routes/tax.routes.js';
import coachRoutes from './routes/coach.routes.js';
import commerceRoutes from './routes/commerce.routes.js';
import { errorHandler } from './middleware/error.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(rateLimiter(150)); // Global API Rate Limit

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/health-score', healthRoutes);
app.use('/api/networth', networthRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/commerce', commerceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling - must be after all routes
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
