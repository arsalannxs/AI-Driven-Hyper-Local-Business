import { FinancialStructuringResult, AmortizationScheduleItem } from '../types';

/**
 * MoSJE (Ministry of Social Justice and Empowerment)
 * Problem Statement ID: 26091
 * Concessional Credit Calculator for SCAs (State Channelizing Agencies) & CAs
 */
export function calculateFinancialRoadmap(availableMarginInput: number): FinancialStructuringResult {
  // Ensure valid positive margin (default to 1,00,000 as per PDF example if zero)
  const availableMargin = Math.max(1000, availableMarginInput || 100000);

  // 1. Total feasible Project Cost = Available Margin / 10%
  const totalProjectCost = Math.round(availableMargin / 0.1);

  // 2. Scheme Auto-Selection Logic:
  // Logic A: If Project Cost <= 1.40 Lakh -> Micro Finance Scheme (6.5%, 3-year tenure, 3-month moratorium)
  // Logic B: If Project Cost > 1.40 Lakh and <= 50.00 Lakh -> Term Loan Scheme (8%, 7-year tenure, 6-month moratorium)
  const isMicroFinance = totalProjectCost <= 140000;

  const selectedScheme: 'micro_finance' | 'term_loan' = isMicroFinance ? 'micro_finance' : 'term_loan';
  const schemeName = isMicroFinance
    ? 'Micro Finance Scheme (MoSJE / SCA Concessional Credit)'
    : 'Term Loan Scheme (MoSJE / SCA Concessional Credit)';
  const schemeAuthority = 'State Channelizing Agencies (SCAs) & CAs';

  // Interest and Tenure parameters
  const interestRatePerAnnum = isMicroFinance ? 6.5 : 8.0;
  const tenureYears = isMicroFinance ? 3 : 7;
  const tenureMonths = isMicroFinance ? 36 : 84;
  const moratoriumMonths = isMicroFinance ? 3 : 6;
  const activeRepaymentMonths = tenureMonths - moratoriumMonths;

  // Maximum loan amount: 90% of Project Cost (capped as per guidelines: max 1.25L for Micro Finance, max 45L for Term Loan)
  const theoreticalLoan = totalProjectCost * 0.9;
  const loanCap = isMicroFinance ? 125000 : 4500000;
  const maxLoanAmount = Math.min(theoreticalLoan, loanCap);

  // Amortization calculation for active repayment period
  const monthlyRate = (interestRatePerAnnum / 100) / 12;
  const quarterlyRate = (interestRatePerAnnum / 100) / 4;

  // EMI during active repayment phase
  const monthlyEmiPostMoratorium = Math.round(
    (maxLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, activeRepaymentMonths)) /
    (Math.pow(1 + monthlyRate, activeRepaymentMonths) - 1)
  );

  const activeQuarters = Math.round(activeRepaymentMonths / 3);
  const quarterlyRepaymentPostMoratorium = Math.round(
    (maxLoanAmount * quarterlyRate * Math.pow(1 + quarterlyRate, activeQuarters)) /
    (Math.pow(1 + quarterlyRate, activeQuarters) - 1)
  );

  // Build quarterly amortization schedule factoring in moratorium
  const schedule: AmortizationScheduleItem[] = [];
  let remainingBalance = maxLoanAmount;
  const totalQuarters = Math.round(tenureMonths / 3);
  const moratoriumQuarters = Math.round(moratoriumMonths / 3);

  let cumulativeInterest = 0;

  for (let q = 1; q <= totalQuarters; q++) {
    const isMoratorium = q <= moratoriumQuarters;
    const periodLabel = `Quarter ${q} (Mo ${((q - 1) * 3) + 1} - ${q * 3})`;

    if (isMoratorium) {
      // During moratorium: Zero principal repayment. Concessional interest only (often deferred or minimal)
      const qInterest = Math.round(remainingBalance * quarterlyRate);
      cumulativeInterest += qInterest;
      schedule.push({
        period: q,
        periodLabel: `${periodLabel} • [MORATORIUM GRACE]`,
        phase: 'moratorium',
        principal: 0,
        interest: qInterest,
        totalInstallment: qInterest,
        balance: remainingBalance,
      });
    } else {
      const qInterest = Math.round(remainingBalance * quarterlyRate);
      const qPrincipal = Math.min(remainingBalance, quarterlyRepaymentPostMoratorium - qInterest);
      remainingBalance = Math.max(0, remainingBalance - qPrincipal);
      cumulativeInterest += qInterest;

      schedule.push({
        period: q,
        periodLabel,
        phase: 'repayment',
        principal: qPrincipal,
        interest: qInterest,
        totalInstallment: qPrincipal + qInterest,
        balance: remainingBalance,
      });
    }
  }

  const totalRepayment = maxLoanAmount + cumulativeInterest;

  // Working capital requirement (~25% of project cost) & operational costs
  const workingCapitalRequirement = Math.round(totalProjectCost * 0.25);
  const operationalCostEstimate = Math.round(totalProjectCost * 0.15);

  // Compare with informal moneylender debt at 36% p.a.
  const informalInterestRate = 0.36;
  const informalAnnualInterest = maxLoanAmount * informalInterestRate;
  const concessionalAnnualInterest = maxLoanAmount * (interestRatePerAnnum / 100);
  const savingsVsInformalLender = Math.round((informalAnnualInterest - concessionalAnnualInterest) * tenureYears);

  return {
    availableMargin,
    totalProjectCost,
    maxLoanAmount,
    marginPercentage: 10,
    loanPercentage: 90,
    selectedScheme,
    schemeName,
    schemeAuthority,
    interestRatePerAnnum,
    tenureYears,
    tenureMonths,
    moratoriumMonths,
    activeRepaymentMonths,
    monthlyEmiPostMoratorium,
    quarterlyRepaymentPostMoratorium,
    totalRepayment,
    totalInterest: cumulativeInterest,
    workingCapitalRequirement,
    operationalCostEstimate,
    schedule,
    savingsVsInformalLender,
  };
}
