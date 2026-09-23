import React, { useState } from 'react';
import {
  Calculator,
  Calendar,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Clock,
  Printer,
  FileCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Percent,
  Sparkles,
  ArrowRight,
  Info,
  Building,
} from 'lucide-react';
import { FinancialStructuringResult, LanguageCode } from '../types';
import { calculateFinancialRoadmap } from '../services/financialStructuring';

interface SmartSchemeCalculatorModuleProps {
  availableMargin: number;
  onChangeMargin: (margin: number) => void;
  language: LanguageCode;
}

export const SmartSchemeCalculatorModule: React.FC<SmartSchemeCalculatorModuleProps> = ({
  availableMargin,
  onChangeMargin,
  language,
}) => {
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [activeFrequency, setActiveFrequency] = useState<'quarterly' | 'monthly'>('quarterly');

  const roadmap: FinancialStructuringResult = calculateFinancialRoadmap(availableMargin);

  const quickPresets = [
    { label: '₹14,000 (Micro Tier)', value: 14000, desc: 'Project Cost ₹1.40 Lakh' },
    { label: '₹50,000', value: 50000, desc: 'Project Cost ₹5.00 Lakh' },
    { label: '₹1,00,000 (PDF Example)', value: 100000, desc: 'Project Cost ₹10.00 Lakh' },
    { label: '₹2,50,000', value: 250000, desc: 'Project Cost ₹25.00 Lakh' },
    { label: '₹5,00,000 (Term Tier Max)', value: 500000, desc: 'Project Cost ₹50.00 Lakh' },
  ];

  const isMicro = roadmap.selectedScheme === 'micro_finance';

  return (
    <div className="space-y-6">
      {/* Module 2 Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-50/60 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                Module 2 • Smart Financial Engine
              </span>
              <span className="text-xs text-slate-500 font-medium">
                MoSJE Concessional Credit Router
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Smart Financial Calculator & Scheme Router
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Eliminate borrowing confusion. Enter your available margin capital (10%) to instantly determine your 
              <strong className="text-slate-800"> maximum loan eligibility (90%)</strong>, 
              <strong className="text-slate-800"> auto-selected MoSJE scheme</strong>, and 
              <strong className="text-slate-800"> quarterly repayment schedule with grace moratorium</strong>.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm shrink-0"
            title="Print repayment roadmap"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Financial Roadmap</span>
          </button>
        </div>
      </div>

      {/* Interactive Capital Input & Presets */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <label className="text-sm font-bold text-slate-800 block">
              Available Margin Capital (Beneficiary's 10% Contribution)
            </label>
            <span className="text-xs text-slate-500">
              The remaining 90% is financed at concessional rates by State Channelizing Agencies (SCAs).
            </span>
          </div>

          <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Formula: Project Cost = Margin Capital ÷ 10%
          </div>
        </div>

        {/* Input box and slider */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 relative">
            <span className="absolute left-4 top-3 text-slate-400 font-bold text-xl">₹</span>
            <input
              type="number"
              id="calculator-margin-input"
              value={availableMargin}
              onChange={e => onChangeMargin(Math.max(1000, Number(e.target.value)))}
              step="5000"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 text-xl font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              placeholder="100000"
            />
          </div>

          <div className="md:col-span-7 flex flex-wrap gap-2">
            {quickPresets.map(preset => (
              <button
                key={preset.value}
                type="button"
                id={`preset-margin-${preset.value}`}
                onClick={() => onChangeMargin(preset.value)}
                className={`px-3 py-2 rounded-xl text-left border transition-all ${
                  availableMargin === preset.value
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold leading-tight">{preset.label}</div>
                <div className={`text-[10px] ${availableMargin === preset.value ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {preset.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Capital Split Bar (10% vs 90%) */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-amber-800">
              Beneficiary Margin: 10% (₹{roadmap.availableMargin.toLocaleString('en-IN')})
            </span>
            <span className="text-emerald-800">
              Concessional SCA Loan: 90% (₹{roadmap.maxLoanAmount.toLocaleString('en-IN')})
            </span>
          </div>
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200">
            <div className="w-[10%] bg-amber-500 transition-all duration-300" title="10% Beneficiary Margin" />
            <div className="w-[90%] bg-emerald-600 transition-all duration-300" title="90% Concessional SCA Loan" />
          </div>
        </div>
      </div>

      {/* Auto-Selected Scheme Router Banner */}
      <div className={`rounded-2xl p-6 border shadow-sm transition-all ${
        isMicro
          ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/40 border-amber-300'
          : 'bg-gradient-to-r from-indigo-50 via-white to-indigo-50/40 border-indigo-300'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isMicro ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white'
              }`}>
                Auto-Selected by Scheme Router ({isMicro ? 'Logic A' : 'Logic B'})
              </span>
              <span className="text-xs font-semibold text-slate-600">
                Channelized by State Channelizing Agencies (SCAs)
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
              {roadmap.schemeName}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              {isMicro
                ? 'Project cost is ≤ ₹1.40 Lakh. Automatically routed to the Micro Finance Scheme with a subsidized 6.5% interest rate, 3-year repayment horizon, and 3-month moratorium grace.'
                : 'Project cost is > ₹1.40 Lakh and ≤ ₹50.00 Lakh. Automatically routed to the Term Loan Scheme with an 8.0% interest rate, 7-year repayment horizon, and 6-month moratorium grace.'}
            </p>
          </div>

          <div className="flex items-center space-x-4 self-stretch sm:self-auto justify-between sm:justify-start bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Concessional Rate</span>
              <span className="text-2xl font-bold font-mono text-emerald-700">
                {roadmap.interestRatePerAnnum}%
              </span>
              <span className="text-[10px] text-slate-500 block">per annum</span>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Grace Moratorium</span>
              <span className="text-2xl font-bold font-mono text-indigo-700">
                {roadmap.moratoriumMonths}
              </span>
              <span className="text-[10px] text-slate-500 block">months zero principal</span>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Tenure</span>
              <span className="text-2xl font-bold font-mono text-slate-800">
                {roadmap.tenureYears}
              </span>
              <span className="text-[10px] text-slate-500 block">years ({roadmap.tenureMonths} mos)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Financial Structuring Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Project Cost */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Feasible Project Cost
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ₹{roadmap.totalProjectCost.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              100% Capital Requirement (Margin ÷ 10%)
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Beneficiary 10%:</span>
            <strong className="text-slate-800 font-mono">₹{roadmap.availableMargin.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Max Loan Amount */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex flex-col justify-between bg-emerald-50/20">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Maximum Loan Eligibility
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
              ₹{roadmap.maxLoanAmount.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-emerald-700 mt-1 block">
              90% Concessional Credit from SCA
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800">
            <span>Interest Subvention:</span>
            <strong>{roadmap.interestRatePerAnnum}% p.a. Fixed</strong>
          </div>
        </div>

        {/* Repayment Post Moratorium */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {activeFrequency === 'quarterly' ? 'Quarterly Installment' : 'Monthly EMI'}
              </span>
              <button
                onClick={() => setActiveFrequency(f => (f === 'quarterly' ? 'monthly' : 'quarterly'))}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline"
              >
                Switch to {activeFrequency === 'quarterly' ? 'Monthly' : 'Quarterly'}
              </button>
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">
              ₹{activeFrequency === 'quarterly'
                ? roadmap.quarterlyRepaymentPostMoratorium.toLocaleString('en-IN')
                : roadmap.monthlyEmiPostMoratorium.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              Post-{roadmap.moratoriumMonths}-month moratorium grace
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Active Repayment:</span>
            <strong className="text-slate-800">{roadmap.activeRepaymentMonths} months</strong>
          </div>
        </div>

        {/* Moneylender Savings */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex flex-col justify-between bg-amber-50/20">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
              Informal Debt Drain Saved
            </span>
            <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
              ₹{roadmap.savingsVsInformalLender.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-amber-700 mt-1 block">
              Saved vs 36% moneylender interest
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-800">
            <span>Capital Retained:</span>
            <strong>In Beneficiary Household</strong>
          </div>
        </div>
      </div>

      {/* Operational Costs & Working Capital Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
          <Building className="w-4 h-4 text-emerald-600" />
          <span>Capital Allocation: Operational Costs & Working Capital</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">
              Fixed Asset & Equipment Investment (60%)
            </span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">
              ₹{Math.round(roadmap.totalProjectCost * 0.6).toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-500">
              Machinery, cattle shed, tools, storage fixtures
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">
              Working Capital Allocation (25%)
            </span>
            <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
              ₹{roadmap.workingCapitalRequirement.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-500">
              Raw materials, feed/seeds, packaging, initial stock
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">
              Operational Reserve & Contingency (15%)
            </span>
            <div className="text-lg font-bold font-mono text-indigo-700 mt-1">
              ₹{roadmap.operationalCostEstimate.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-500">
              Transport, utilities, emergency liquidity cushion
            </span>
          </div>
        </div>
      </div>

      {/* EMI & Moratorium Generator: Detailed Quarterly Repayment Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                EMI & Moratorium Generator: Amortization Schedule
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Includes {roadmap.moratoriumMonths}-month moratorium grace period where principal repayment is suspended.
            </p>
          </div>

          <button
            id="toggle-schedule-btn"
            onClick={() => setShowFullSchedule(!showFullSchedule)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
          >
            <span>{showFullSchedule ? 'Collapse Schedule' : 'View Full Schedule'}</span>
            {showFullSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Phase</th>
                <th className="py-3 px-4 text-right">Principal (₹)</th>
                <th className="py-3 px-4 text-right">Interest (₹)</th>
                <th className="py-3 px-4 text-right">Quarterly Installment (₹)</th>
                <th className="py-3 px-4 text-right">Closing Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(showFullSchedule ? roadmap.schedule : roadmap.schedule.slice(0, 6)).map(item => {
                const isMoratorium = item.phase === 'moratorium';
                return (
                  <tr
                    key={item.period}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isMoratorium ? 'bg-amber-50/40 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {item.periodLabel}
                    </td>
                    <td className="py-3 px-4">
                      {isMoratorium ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Moratorium Grace
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active Amortization
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {isMoratorium ? '₹0' : `₹${item.principal.toLocaleString('en-IN')}`}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₹{item.interest.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                      ₹{item.totalInstallment.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 font-semibold">
                      ₹{item.balance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!showFullSchedule && roadmap.schedule.length > 6 && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => setShowFullSchedule(true)}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Showing first 6 quarters. Click here to see all {roadmap.schedule.length} quarters →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
