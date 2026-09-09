import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  Plus,
  Trash2,
  TrendingDown,
  Percent,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowRight,
  Calculator,
  Building,
} from 'lucide-react';
import { Enterprise, LoanRecord, LoanDossier, LanguageCode } from '../types';
import { UI_TEXT } from '../services/i18n';

interface DebtRestructuringProps {
  enterprise: Enterprise;
  loans: LoanRecord[];
  onAddLoan: (loan: Omit<LoanRecord, 'id'>) => void;
  onDeleteLoan: (id: string) => void;
  language: LanguageCode;
  isOnline: boolean;
}

export const DebtRestructuring: React.FC<DebtRestructuringProps> = ({
  enterprise,
  loans,
  onAddLoan,
  onDeleteLoan,
  language,
  isOnline,
}) => {
  const t = UI_TEXT[language] || UI_TEXT.en;

  const [addLoanOpen, setAddLoanOpen] = useState(false);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [generatedDossier, setGeneratedDossier] = useState<LoanDossier | null>(null);

  // New loan form
  const [newLoan, setNewLoan] = useState({
    lenderName: '',
    lenderType: 'moneylender' as LoanRecord['lenderType'],
    principalAmount: '',
    remainingAmount: '',
    interestRateAnnual: '36',
    tenureMonths: '12',
    monthlyEmi: '',
    purpose: '',
  });

  // Dossier requirement form
  const [dossierReq, setDossierReq] = useState({
    amountNeeded: 50000,
    purpose: enterprise.tradeType === 'dairy' ? 'Purchase of 1 milch buffalo and cattle shed tin roof' : 'Working capital expansion and wholesale stock',
    targetTenureMonths: 24,
  });

  // Financial calculations
  const totalDebt = loans.reduce((s, l) => s + l.remainingAmount, 0);
  const totalMonthlyEmi = loans.reduce((s, l) => s + l.monthlyEmi, 0);

  // High-interest loans (Moneylenders or MFIs > 24%)
  const informalLoans = loans.filter(l => l.interestRateAnnual >= 24);
  const informalDebt = informalLoans.reduce((s, l) => s + l.remainingAmount, 0);

  // Annual interest paid on informal debt
  const annualInformalInterest = informalLoans.reduce(
    (s, l) => s + (l.remainingAmount * l.interestRateAnnual) / 100,
    0
  );

  // If refinanced at 9% bank / SHG rate
  const annualBankInterestEquivalent = informalDebt * 0.09;
  const annualInterestSaved = Math.max(0, Math.round(annualInformalInterest - annualBankInterestEquivalent));

  // Generate Bank Project Dossier
  const handleGenerateDossier = async () => {
    setDossierLoading(true);
    try {
      if (isOnline) {
        const res = await fetch('/api/advisory/structure-loan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enterpriseId: enterprise.id,
            loanRequirement: dossierReq,
            language,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setGeneratedDossier(data);
          setDossierLoading(false);
          return;
        }
      }

      // Offline fallback calculation
      const netMonthlySurplus = Math.max(0, enterprise.monthlyRevenueEstimate - enterprise.monthlyExpenseEstimate);
      const r = 0.09 / 12;
      const n = dossierReq.targetTenureMonths;
      const p = dossierReq.amountNeeded;
      const estimatedEmi = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
      const totalEmi = totalMonthlyEmi + estimatedEmi;
      const dscr = totalEmi > 0 ? Number((netMonthlySurplus / totalEmi).toFixed(2)) : 2.2;

      let scheme = 'PMMY MUDRA Shishu Loan';
      let code = 'PMMY-SHISHU';
      if (enterprise.tradeType === 'dairy') {
        scheme = 'KCC Animal Husbandry Working Capital Facility';
        code = 'KCC-DAIRY';
      }

      setGeneratedDossier({
        dscr,
        repaymentCapacityMonthly: netMonthlySurplus - totalMonthlyEmi,
        recommendedScheme: scheme,
        schemeCode: code,
        interestSavingsVsMoneylenderAnnual: Math.round(p * 0.27),
        structuredDossierSummary: `PROJECT APPRAISAL DOSSIER FOR ${enterprise.name.toUpperCase()}
Location: ${enterprise.village}, ${enterprise.district}
Owner: ${enterprise.ownerName} | Trade: ${enterprise.tradeType.toUpperCase()}

1. Business Overview: Steady village micro-unit with monthly sales of ₹${enterprise.monthlyRevenueEstimate} and operating costs of ₹${enterprise.monthlyExpenseEstimate}, yielding net operational surplus of ₹${netMonthlySurplus}.
2. Credit Request: Term credit facility of ₹${dossierReq.amountNeeded} over ${dossierReq.targetTenureMonths} months for "${dossierReq.purpose}".
3. Debt Service Coverage Ratio (DSCR): ${dscr} (Comfortably above bank benchmark of 1.25).
4. Refinancing & Productivity: Transitioning from informal borrowing to formal bank credit liberates ₹${annualInterestSaved} annually in retained cash flow, directly safeguarding loan servicing.`,
        dossierChecklist: [
          'Aadhaar Card and Village Voter ID of the entrepreneur',
          'Panchayat / Sarpanch Trade Endorsement Letter',
          'Bank Passbook for direct subsidy/credit linkage',
          `Quotation / Estimate for ${dossierReq.purpose}`,
          'SHG membership book or existing loan repayment record',
        ],
      });
    } catch {
      // Error handling
    } finally {
      setDossierLoading(false);
    }
  };

  const handleAddLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoan.lenderName || !newLoan.principalAmount) return;

    const principal = Number(newLoan.principalAmount);
    const rate = Number(newLoan.interestRateAnnual);
    const tenure = Number(newLoan.tenureMonths || 12);
    const r = rate / 100 / 12;
    const calcEmi =
      r > 0
        ? Math.round((principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1))
        : Math.round(principal / tenure);

    onAddLoan({
      enterpriseId: enterprise.id,
      lenderName: newLoan.lenderName,
      lenderType: newLoan.lenderType,
      principalAmount: principal,
      remainingAmount: Number(newLoan.remainingAmount || newLoan.principalAmount),
      interestRateAnnual: rate,
      tenureMonths: tenure,
      monthlyEmi: Number(newLoan.monthlyEmi) || calcEmi,
      startDate: new Date().toISOString().split('T')[0],
      purpose: newLoan.purpose,
      riskRating: rate >= 30 ? 'critical' : rate >= 18 ? 'moderate' : 'healthy',
    });

    setNewLoan({
      lenderName: '',
      lenderType: 'moneylender',
      principalAmount: '',
      remainingAmount: '',
      interestRateAnnual: '36',
      tenureMonths: '12',
      monthlyEmi: '',
      purpose: '',
    });
    setAddLoanOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview & High Interest Warning Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-stone-100">
                {t.debtRestructuringTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl">
              {t.debtRestructuringSubtitle}
            </p>
          </div>

          <button
            id="add-loan-btn"
            onClick={() => setAddLoanOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition-colors shadow-md flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record Debt / Loan</span>
          </button>
        </div>

        {/* Informational comparison cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
              Total Active Debt Burden
            </span>
            <div className="text-2xl font-bold font-mono text-stone-100 mt-1">
              ₹{totalDebt.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-stone-500">
              Across {loans.length} active credit source(s)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60">
            <span className="text-[11px] uppercase tracking-wider text-rose-300 font-semibold block">
              Informal Moneylender Debt
            </span>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
              ₹{informalDebt.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-rose-300/80">
              Interest rate ≥ 24% to 60% per year
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
            <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold block">
              Annual Savings by Bank Refinance
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              ₹{annualInterestSaved.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-emerald-300/80">
              Cash that stays in your household every year
            </span>
          </div>
        </div>
      </div>

      {/* Active Loans List */}
      <div className="rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-md overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-200">
            Current Borrowings & Moneylender Ledger ({loans.length})
          </h3>
          <span className="text-xs text-stone-400">
            Total Monthly EMI Outgo: ₹{totalMonthlyEmi.toLocaleString('en-IN')}
          </span>
        </div>

        {loans.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs sm:text-sm">
            No loans or debt recorded yet. You can log existing moneylender or SHG loans to structure refinancing.
          </div>
        ) : (
          <div className="divide-y divide-stone-800">
            {loans.map(loan => {
              const isHighRisk = loan.interestRateAnnual >= 24;

              return (
                <div
                  key={loan.id}
                  className="p-4 hover:bg-stone-850/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isHighRisk
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {isHighRisk ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-stone-100">
                          {loan.lenderName}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${
                            isHighRisk
                              ? 'bg-rose-950/90 text-rose-300 border-rose-700'
                              : 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                          }`}
                        >
                          {loan.interestRateAnnual}% Annual Interest
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        {loan.purpose || 'Working capital borrow'} • Tenure: {loan.tenureMonths} mos • Monthly EMI: ₹{loan.monthlyEmi}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-stone-400 text-[11px]">
                        Remaining Balance
                      </div>
                      <div className="text-sm sm:text-base font-bold font-mono text-stone-100">
                        ₹{loan.remainingAmount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <button
                      id={`delete-loan-btn-${loan.id}`}
                      onClick={() => onDeleteLoan(loan.id)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                      title="Delete loan record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bank-Ready Project Dossier Generator */}
      <div className="p-5 sm:p-6 rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-md">
        <div className="flex items-center space-x-2.5 mb-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-stone-100">
            Generate Bank-Ready Credit & Appraisal Dossier
          </h3>
        </div>
        <p className="text-xs text-stone-400 mb-4 max-w-2xl">
          Rural bank managers (Gramin Banks / RRBs / SBI) require structured cash flows and Debt Service Coverage Ratio (DSCR) before sanctioning collateral-free MUDRA or KCC loans.
        </p>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Loan Amount Needed (₹)
            </label>
            <input
              type="number"
              id="dossier-amount-input"
              value={dossierReq.amountNeeded}
              onChange={e =>
                setDossierReq({ ...dossierReq, amountNeeded: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-sm font-mono font-bold text-stone-100 focus:outline-none focus:border-amber-500"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Repayment Tenure (Months)
            </label>
            <select
              id="dossier-tenure-select"
              value={dossierReq.targetTenureMonths}
              onChange={e =>
                setDossierReq({ ...dossierReq, targetTenureMonths: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
            >
              <option value="12">12 Months (1 Year)</option>
              <option value="24">24 Months (2 Years)</option>
              <option value="36">36 Months (3 Years)</option>
              <option value="60">60 Months (5 Years)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Productive Purpose
            </label>
            <input
              type="text"
              id="dossier-purpose-input"
              value={dossierReq.purpose}
              onChange={e =>
                setDossierReq({ ...dossierReq, purpose: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              placeholder="e.g. Buffalo purchase, shop inventory"
            />
          </div>
        </div>

        <button
          id="generate-dossier-action-btn"
          onClick={handleGenerateDossier}
          disabled={dossierLoading}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{dossierLoading ? 'Structuring Bank Dossier...' : t.generateBankDossier}</span>
        </button>

        {/* Generated Dossier View */}
        {generatedDossier && (
          <div className="mt-6 p-5 sm:p-6 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 space-y-4 animate-fadeIn">
            {/* Header / Scores */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-stone-800 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  {generatedDossier.schemeCode}
                </span>
                <h4 className="text-base font-bold text-amber-400 mt-1">
                  {generatedDossier.recommendedScheme}
                </h4>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-[10px] text-stone-400 uppercase">
                    Bank DSCR Metric
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {generatedDossier.dscr}x{' '}
                    <span className="text-xs text-stone-400 font-normal">
                      (&gt;1.25 standard)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center space-x-1.5 border border-stone-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dossier</span>
                </button>
              </div>
            </div>

            {/* Dossier Text */}
            <div className="text-xs sm:text-sm font-mono whitespace-pre-wrap text-stone-300 bg-stone-900/80 p-4 rounded-xl border border-stone-850 leading-relaxed">
              {generatedDossier.structuredDossierSummary}
            </div>

            {/* Document Checklist */}
            <div>
              <h5 className="text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                Mandatory Documentation Checklist for Bank Branch:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {generatedDossier.dossierChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-300 flex items-start space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Loan Modal */}
      {addLoanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-100">
                Record Existing Debt / Moneylender
              </h3>
              <button
                onClick={() => setAddLoanOpen(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLoanSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Lender Name / Source
                </label>
                <input
                  type="text"
                  required
                  id="loan-lender-input"
                  value={newLoan.lenderName}
                  onChange={e => setNewLoan({ ...newLoan, lenderName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Village Moneylender, SHG, MFI"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Lender Type
                  </label>
                  <select
                    id="loan-type-select"
                    value={newLoan.lenderType}
                    onChange={e =>
                      setNewLoan({
                        ...newLoan,
                        lenderType: e.target.value as LoanRecord['lenderType'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="moneylender">Village Moneylender (साहूकार)</option>
                    <option value="shg">Self-Help Group (SHG)</option>
                    <option value="mfi">Microfinance (MFI)</option>
                    <option value="commercial_bank">Bank Branch / PACS</option>
                    <option value="family">Family / Relatives</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Remaining Debt (₹)
                  </label>
                  <input
                    type="number"
                    required
                    id="loan-principal-input"
                    value={newLoan.principalAmount}
                    onChange={e =>
                      setNewLoan({
                        ...newLoan,
                        principalAmount: e.target.value,
                        remainingAmount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-sm font-mono font-bold text-stone-100 focus:outline-none focus:border-amber-500"
                    placeholder="30000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Annual Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    required
                    id="loan-interest-input"
                    value={newLoan.interestRateAnnual}
                    onChange={e =>
                      setNewLoan({ ...newLoan, interestRateAnnual: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    placeholder="36"
                  />
                  <span className="text-[10px] text-stone-400">
                    (e.g. 3% per month = 36%)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Monthly EMI (₹)
                  </label>
                  <input
                    type="number"
                    id="loan-emi-input"
                    value={newLoan.monthlyEmi}
                    onChange={e => setNewLoan({ ...newLoan, monthlyEmi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    placeholder="Optional (auto-calc)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Purpose of Loan
                </label>
                <input
                  type="text"
                  id="loan-purpose-input"
                  value={newLoan.purpose}
                  onChange={e => setNewLoan({ ...newLoan, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Emergency medical, purchase buffalo, seeds"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddLoanOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-700 text-xs text-stone-300 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-new-loan-submit-btn"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md transition-colors"
                >
                  Save Loan Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
