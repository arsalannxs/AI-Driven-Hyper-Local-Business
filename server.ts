import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db.js';
import {
  generateHyperLocalAdvisory,
  structureLoanDossier,
  parseVoiceTransaction,
  generateFeasibilityReport,
} from './server/gemini.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Rural Micro-Enterprise Advisory Server',
  });
});

// 2. Enterprise endpoints
app.get('/api/enterprises', (req, res) => {
  const list = db.getEnterprises();
  res.json(list);
});

app.get('/api/enterprises/:id', (req, res) => {
  const enterprise = db.getEnterprise(req.params.id);
  if (!enterprise) {
    return res.status(404).json({ error: 'Enterprise not found' });
  }
  res.json(enterprise);
});

app.post('/api/enterprises', (req, res) => {
  const payload = req.body;
  if (!payload.name || !payload.tradeType) {
    return res.status(400).json({ error: 'Name and trade type are required' });
  }
  const id = payload.id || `ent_${Date.now()}`;
  const enterprise = db.saveEnterprise({
    ...payload,
    id,
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  res.json(enterprise);
});

// 3. Ledger endpoints
app.get('/api/ledger', (req, res) => {
  const enterpriseId = (req.query.enterpriseId as string) || 'ent_default_01';
  const entries = db.getLedger(enterpriseId);
  res.json(entries);
});

app.post('/api/ledger', (req, res) => {
  const payload = req.body;
  if (!payload.amount || !payload.type) {
    return res.status(400).json({ error: 'Amount and type are required' });
  }
  const entry = db.addLedgerEntry({
    id: payload.id || `led_${Date.now()}`,
    enterpriseId: payload.enterpriseId || 'ent_default_01',
    date: payload.date || new Date().toISOString().split('T')[0],
    type: payload.type,
    category: payload.category || 'General',
    amount: Number(payload.amount),
    description: payload.description || '',
    partyName: payload.partyName || '',
    status: payload.status || 'completed',
    syncStatus: 'synced',
    createdAt: payload.createdAt || new Date().toISOString(),
  });
  res.json(entry);
});

app.delete('/api/ledger/:id', (req, res) => {
  const success = db.deleteLedgerEntry(req.params.id);
  res.json({ success });
});

// 4. Loan & Debt endpoints
app.get('/api/loans', (req, res) => {
  const enterpriseId = (req.query.enterpriseId as string) || 'ent_default_01';
  const loans = db.getLoans(enterpriseId);
  res.json(loans);
});

app.post('/api/loans', (req, res) => {
  const payload = req.body;
  if (!payload.lenderName || !payload.principalAmount) {
    return res.status(400).json({ error: 'Lender name and principal amount are required' });
  }
  const loan = db.saveLoan({
    id: payload.id || `loan_${Date.now()}`,
    enterpriseId: payload.enterpriseId || 'ent_default_01',
    lenderName: payload.lenderName,
    lenderType: payload.lenderType || 'moneylender',
    principalAmount: Number(payload.principalAmount),
    remainingAmount: Number(payload.remainingAmount || payload.principalAmount),
    interestRateAnnual: Number(payload.interestRateAnnual || 24),
    tenureMonths: Number(payload.tenureMonths || 12),
    monthlyEmi: Number(payload.monthlyEmi || 0),
    startDate: payload.startDate || new Date().toISOString().split('T')[0],
    purpose: payload.purpose || '',
    riskRating: payload.interestRateAnnual >= 30 ? 'critical' : payload.interestRateAnnual >= 15 ? 'moderate' : 'healthy',
  });
  res.json(loan);
});

app.delete('/api/loans/:id', (req, res) => {
  const success = db.deleteLoan(req.params.id);
  res.json({ success });
});

// 5. Market Rates & Schemes
app.get('/api/market-rates', (req, res) => {
  const category = req.query.category as string | undefined;
  const rates = db.getMarketRates(category);
  res.json(rates);
});

app.get('/api/schemes', (req, res) => {
  const schemes = db.getSchemes();
  res.json(schemes);
});

// 6. Offline-First Batch Sync
app.post('/api/sync', (req, res) => {
  const { enterprise, newLedgerEntries, newLoans } = req.body;
  const result = db.batchSync({ enterprise, newLedgerEntries, newLoans });
  res.json({
    success: true,
    ...result,
  });
});

// 7. AI Advisory Endpoints
app.post('/api/advisory/chat', async (req, res) => {
  try {
    const { query, enterpriseId, language } = req.body;
    const enterprise = db.getEnterprise(enterpriseId || 'ent_default_01') || {
      id: 'temp',
      name: 'Rural Micro Enterprise',
      ownerName: 'Rural Entrepreneur',
      tradeType: 'dairy' as const,
      village: 'Village Center',
      district: 'Rural District',
      state: 'State',
      preferredLanguage: language || 'en',
      monthlyRevenueEstimate: 40000,
      monthlyExpenseEstimate: 25000,
      createdAt: '',
      updatedAt: '',
    };

    const loans = db.getLoans(enterprise.id);
    const ledger = db.getLedger(enterprise.id);

    const totalInflow = ledger
      .filter(l => l.type === 'cash_in')
      .reduce((sum, l) => sum + l.amount, 0);
    const totalOutflow = ledger
      .filter(l => l.type === 'cash_out')
      .reduce((sum, l) => sum + l.amount, 0);
    const pendingCreditGiven = ledger
      .filter(l => l.type === 'credit_given' && l.status === 'pending')
      .reduce((sum, l) => sum + l.amount, 0);

    const context = {
      tradeType: enterprise.tradeType,
      village: enterprise.village,
      district: enterprise.district,
      monthlyRevenue: enterprise.monthlyRevenueEstimate,
      monthlyExpense: enterprise.monthlyExpenseEstimate,
      currentLoans: loans.map(l => ({
        lender: l.lenderName,
        lenderType: l.lenderType,
        amount: l.remainingAmount,
        interestRate: l.interestRateAnnual,
        monthlyEmi: l.monthlyEmi,
      })),
      recentLedgerSummary: {
        totalInflow,
        totalOutflow,
        pendingCreditGiven,
      },
    };

    const advisory = await generateHyperLocalAdvisory(
      query || 'How can I maximize my profit this month and cut input costs?',
      context,
      language || enterprise.preferredLanguage || 'en'
    );

    db.logAdvisory({
      enterpriseId: enterprise.id,
      query: query || '',
      response: advisory.text,
      language: language || 'en',
    });

    res.json(advisory);
  } catch (err: any) {
    console.error('Error in advisory chat:', err);
    res.status(500).json({ error: err.message || 'Advisory generation failed' });
  }
});

app.post('/api/advisory/structure-loan', async (req, res) => {
  try {
    const { loanRequirement, enterpriseId, language } = req.body;
    const enterprise = db.getEnterprise(enterpriseId || 'ent_default_01') || {
      id: 'temp',
      name: 'Rural Micro Enterprise',
      ownerName: 'Rural Entrepreneur',
      tradeType: 'dairy' as const,
      village: 'Village Center',
      district: 'Rural District',
      state: 'State',
      preferredLanguage: language || 'en',
      monthlyRevenueEstimate: 40000,
      monthlyExpenseEstimate: 25000,
      createdAt: '',
      updatedAt: '',
    };

    const loans = db.getLoans(enterprise.id);
    const ledger = db.getLedger(enterprise.id);

    const totalInflow = ledger
      .filter(l => l.type === 'cash_in')
      .reduce((sum, l) => sum + l.amount, 0);
    const totalOutflow = ledger
      .filter(l => l.type === 'cash_out')
      .reduce((sum, l) => sum + l.amount, 0);
    const pendingCreditGiven = ledger
      .filter(l => l.type === 'credit_given' && l.status === 'pending')
      .reduce((sum, l) => sum + l.amount, 0);

    const context = {
      tradeType: enterprise.tradeType,
      village: enterprise.village,
      district: enterprise.district,
      monthlyRevenue: enterprise.monthlyRevenueEstimate,
      monthlyExpense: enterprise.monthlyExpenseEstimate,
      currentLoans: loans.map(l => ({
        lender: l.lenderName,
        lenderType: l.lenderType,
        amount: l.remainingAmount,
        interestRate: l.interestRateAnnual,
        monthlyEmi: l.monthlyEmi,
      })),
      recentLedgerSummary: {
        totalInflow,
        totalOutflow,
        pendingCreditGiven,
      },
    };

    const dossier = await structureLoanDossier(
      loanRequirement || { amountNeeded: 50000, purpose: 'Working capital expansion', targetTenureMonths: 24 },
      context,
      language || enterprise.preferredLanguage || 'en'
    );

    res.json(dossier);
  } catch (err: any) {
    console.error('Error in structuring loan dossier:', err);
    res.status(500).json({ error: err.message || 'Loan structuring failed' });
  }
});

app.post('/api/advisory/voice-parse', (req, res) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: 'Transcript string is required' });
  }
  const parsed = parseVoiceTransaction(transcript);
  res.json(parsed);
});

// 8. Module 1: Hyper-Local Business Feasibility Report (MoSJE / SCA)
app.post('/api/feasibility-report', async (req, res) => {
  try {
    const { location, category, availableMargin, language } = req.body;
    const defaultLocation = {
      village: 'Pipariya Khurd',
      block: 'Sehore Rural',
      district: 'Sehore',
      state: 'Madhya Pradesh',
    };

    const report = await generateFeasibilityReport(
      location || defaultLocation,
      category || 'dairy',
      Number(availableMargin) || 100000,
      language || 'en'
    );

    res.json(report);
  } catch (err: any) {
    console.error('Error generating feasibility report:', err);
    res.status(500).json({ error: err.message || 'Feasibility study failed' });
  }
});

// 9. Module 2: Smart Financial Calculator & Scheme Router
app.post('/api/financial-calculator', (req, res) => {
  try {
    const { availableMargin } = req.body;
    const margin = Math.max(1000, Number(availableMargin) || 100000);
    const totalProjectCost = Math.round(margin / 0.1);
    const isMicroFinance = totalProjectCost <= 140000;
    const selectedScheme = isMicroFinance ? 'micro_finance' : 'term_loan';
    const schemeName = isMicroFinance
      ? 'Micro Finance Scheme (MoSJE / SCA Concessional Credit)'
      : 'Term Loan Scheme (MoSJE / SCA Concessional Credit)';
    const interestRatePerAnnum = isMicroFinance ? 6.5 : 8.0;
    const tenureYears = isMicroFinance ? 3 : 7;
    const tenureMonths = isMicroFinance ? 36 : 84;
    const moratoriumMonths = isMicroFinance ? 3 : 6;
    const loanCap = isMicroFinance ? 125000 : 4500000;
    const maxLoanAmount = Math.min(totalProjectCost * 0.9, loanCap);

    res.json({
      availableMargin: margin,
      totalProjectCost,
      maxLoanAmount,
      marginPercentage: 10,
      loanPercentage: 90,
      selectedScheme,
      schemeName,
      interestRatePerAnnum,
      tenureYears,
      tenureMonths,
      moratoriumMonths,
      activeRepaymentMonths: tenureMonths - moratoriumMonths,
    });
  } catch (err: any) {
    res.status(400).json({ error: 'Calculator calculation error' });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rural Advisory Server running on http://localhost:${PORT}`);
  });
}

startServer();
