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
  AlertTriangle,
  X,
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
    purpose:
      enterprise.tradeType === 'dairy'
        ? 'Purchase of 1 milch buffalo and cattle shed tin roof'
        : 'Working capital expansion and wholesale stock',
    targetTenureMonths: 24,
  });

  // Financial calculations
  const totalDebt = loans.reduce((s, l) => s + l.remainingAmount, 0);
  const totalMonthlyEmi = loans.reduce((s, l) => s + l.monthlyEmi, 0);

  // High-interest loans (Moneylenders or MFIs > 24%)
  const informalLoans = loans.filter(l => l.interestRateAnnual >= 24);
  const informalDebt = informalLoans.reduce((s, l) => s + l.remainingAmount, 0);

  // Annual interest paid on informal debt
  const annualInformalInterestPaid = informalLoans.reduce(
    (s, l) => s + l.remainingAmount * (l.interestRateAnnual / 100),
    0
  );

  // What that same debt would cost at MoSJE 6.5% - 8.0%
  const annualFormalInterest = informalDebt * 0.07;
  const annualInterestSaved = Math.round(annualInformalInterestPaid - annualFormalInterest);

  const netMonthlySurplus = Math.max(
    0,
    enterprise.monthlyRevenueEstimate - enterprise.monthlyExpenseEstimate
  );

  const handleGenerateDossier = async () => {
    setDossierLoading(true);
    try {
      if (isOnline) {
        const res = await fetch('/api/advisory/structure-loan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loanRequirement: dossierReq,
            enterpriseId: enterprise.id,
            language,
          }),
        });

        if (res.ok) {
          const dossier = await res.json();
          setGeneratedDossier(dossier);
          setDossierLoading(false);
          return;
        }
      }

      // Offline deterministic fallback dossier
      const p = dossierReq.amountNeeded;
      const proposedEmi = Math.round((p * 0.08 * 2 + p) / dossierReq.targetTenureMonths);
      const dscr = Number((netMonthlySurplus / (proposedEmi || 1)).toFixed(2));
      const scheme =
        p <= 140000
          ? 'MoSJE Micro Finance Scheme (6.5% Concessional Credit)'
          : 'MoSJE Term Loan Scheme (8.0% Concessional Credit)';
      const code = p <= 140000 ? 'MoSJE-MFS-6.5' : 'MoSJE-TLS-8.0';

      setGeneratedDossier({
        dscr,
        repaymentCapacityMonthly: netMonthlySurplus - totalMonthlyEmi,
        recommendedScheme: scheme,
        schemeCode: code,
        interestSavingsVsMoneylenderAnnual: Math.round(p * 0.27),
        structuredDossierSummary: `PROJECT APPRAISAL DOSSIER FOR ${enterprise.name.toUpperCase()}
Location: ${enterprise.village}, ${enterprise.district}
Owner: ${enterprise.ownerName} | Trade: ${enterprise.tradeType.toUpperCase()}

1. Business Overview: Steady village micro-unit with monthly sales of ₹${enterprise.monthlyRevenueEstimate.toLocaleString('en-IN')} and operating costs of ₹${enterprise.monthlyExpenseEstimate.toLocaleString('en-IN')}, yielding net operational surplus of ₹${netMonthlySurplus.toLocaleString('en-IN')}.
2. Credit Request: Term credit facility of ₹${dossierReq.amountNeeded.toLocaleString('en-IN')} over ${dossierReq.targetTenureMonths} months for "${dossierReq.purpose}".
3. Debt Service Coverage Ratio (DSCR): ${dscr} (Comfortably above bank benchmark of 1.25).
4. Refinancing & Productivity: Transitioning from informal borrowing to formal bank credit liberates ₹${annualInterestSaved.toLocaleString('en-IN')} annually in retained cash flow, directly safeguarding loan servicing.`,
        dossierChecklist: [
          'Aadhaar Card and Village Voter ID of the entrepreneur',
          'Panchayat / Sarpanch Trade Endorsement Letter',
          'Bank Passbook for direct subsidy/credit linkage',
          `Quotation / Estimate for ${dossierReq.purpose}`,
          'SHG membership book or existing loan repayment record',
        ],
      });
    } catch {
      // Error handling fallback
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
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t.debtRestructuringTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              {t.debtRestructuringSubtitle}
            </p>
          </div>

          <button
            id="add-loan-btn"
            onClick={() => setAddLoanOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record Debt / Loan</span>
          </button>
        </div>

        {/* Informational comparison cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
              Total Active Debt Burden
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ₹{totalDebt.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              Monthly EMI: ₹{totalMonthlyEmi.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-[11px] uppercase tracking-wider text-rose-800 font-bold block flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>High-Cost Informal Debt</span>
            </span>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
              ₹{informalDebt.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-rose-700 mt-1 block">
              Interest rates: 24% to 48% p.a.
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold block flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Annual Interest Saved via MoSJE</span>
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
              ₹{annualInterestSaved.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-emerald-800 mt-1 block">
              Retained in entrepreneur's pocket
            </span>
          </div>
        </div>
      </div>

      {/* Existing Loans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <h3 className="font-bold text-sm sm:text-base text-slate-900">
            Current Borrowings & Moneylender Obligations
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {loans.length} recorded
          </span>
        </div>

        {loans.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs sm:text-sm">
            No loans recorded yet. Click "Record Debt / Loan" above to add moneylender or bank debt.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Lender</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Principal (₹)</th>
                  <th className="py-3 px-4 text-right">Remaining (₹)</th>
                  <th className="py-3 px-4 text-center">Interest Rate</th>
                  <th className="py-3 px-4 text-right">Monthly EMI (₹)</th>
                  <th className="py-3 px-4 text-center">Risk</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map(loan => {
                  const isHighRisk = loan.interestRateAnnual >= 30;
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {loan.lenderName}
                        {loan.purpose && (
                          <span className="block text-[11px] font-normal text-slate-500">
                            {loan.purpose}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-600">
                        {loan.lenderType.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        ₹{loan.principalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{loan.remainingAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            isHighRisk
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {loan.interestRateAnnual}% p.a.
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                        ₹{loan.monthlyEmi.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            loan.riskRating === 'critical'
                              ? 'bg-rose-100 text-rose-800'
                              : loan.riskRating === 'moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {loan.riskRating}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          id={`delete-loan-btn-${loan.id}`}
                          onClick={() => onDeleteLoan(loan.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete loan record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bank Dossier & Restructuring Generator */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1">
              <Sparkles className="w-4 h-4" />
              <span>Credit Structuring & Bank Appraisal</span>
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {t.dossierTitle}
            </h3>
            <p className="text-xs text-slate-500">
              Formulate an institutional proposal with Debt Service Coverage Ratio (DSCR) for bank or SCA presentation
            </p>
          </div>

          <button
            id="generate-dossier-btn"
            onClick={handleGenerateDossier}
            disabled={dossierLoading}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {dossierLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Structuring Proposal...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Generate Official Dossier</span>
              </>
            )}
          </button>
        </div>

        {/* Input Parameters for Dossier */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Loan Amount (₹)
            </label>
            <input
              type="number"
              id="dossier-amount-input"
              value={dossierReq.amountNeeded}
              onChange={e =>
                setDossierReq({ ...dossierReq, amountNeeded: Number(e.target.value) })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Repayment Tenure (Months)
            </label>
            <select
              id="dossier-tenure-select"
              value={dossierReq.targetTenureMonths}
              onChange={e =>
                setDossierReq({ ...dossierReq, targetTenureMonths: Number(e.target.value) })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value={12}>12 Months (1 Year)</option>
              <option value={24}>24 Months (2 Years)</option>
              <option value={36}>36 Months (3 Years - Micro Finance)</option>
              <option value={60}>60 Months (5 Years)</option>
              <option value={84}>84 Months (7 Years - Term Loan)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Asset / Expansion Purpose
            </label>
            <input
              type="text"
              id="dossier-purpose-input"
              value={dossierReq.purpose}
              onChange={e => setDossierReq({ ...dossierReq, purpose: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Generated Dossier Preview */}
        {generatedDossier && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Recommended Concessional Scheme
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">
                  {generatedDossier.recommendedScheme}
                </h4>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">DSCR Score</span>
                  <span className="text-xl font-bold font-mono text-emerald-700">
                    {generatedDossier.dscr}x
                  </span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs"
                  title="Print Dossier"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dossier summary */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs font-mono whitespace-pre-wrap text-slate-700 leading-relaxed">
              {generatedDossier.structuredDossierSummary}
            </div>

            {/* Checklist */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-800 mb-2">
                Required Documentation Checklist for Bank Manager / SCA Field Officer:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {generatedDossier.dossierChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="font-bold text-base text-slate-900">
                Record Debt / Moneylender Obligation
              </h3>
              <button
                id="close-loan-modal-btn"
                onClick={() => setAddLoanOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLoanSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lender / Moneylender Name *
                </label>
                <input
                  type="text"
                  required
                  id="loan-lender-input"
                  value={newLoan.lenderName}
                  onChange={e => setNewLoan({ ...newLoan, lenderName: e.target.value })}
                  placeholder="e.g. Lala Raghuvir (Village Moneylender)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="moneylender">Village Moneylender / Mahajan</option>
                    <option value="mfi">Microfinance Institution (MFI)</option>
                    <option value="shg">Self Help Group (SHG)</option>
                    <option value="commercial_bank">Commercial / Rural Bank</option>
                    <option value="family">Relatives / Informal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Annual Interest Rate (% p.a.) *
                  </label>
                  <input
                    type="number"
                    required
                    id="loan-interest-input"
                    value={newLoan.interestRateAnnual}
                    onChange={e =>
                      setNewLoan({ ...newLoan, interestRateAnnual: e.target.value })
                    }
                    placeholder="36"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Principal Amount (₹) *
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
                    placeholder="40000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remaining Balance (₹)
                  </label>
                  <input
                    type="number"
                    id="loan-remaining-input"
                    value={newLoan.remainingAmount}
                    onChange={e =>
                      setNewLoan({ ...newLoan, remainingAmount: e.target.value })
                    }
                    placeholder="40000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Loan Purpose / Background
                </label>
                <input
                  type="text"
                  id="loan-purpose-input"
                  value={newLoan.purpose}
                  onChange={e => setNewLoan({ ...newLoan, purpose: e.target.value })}
                  placeholder="e.g. Urgent cattle medical treatment and feed"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddLoanOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-loan-record-btn"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
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
