export type TradeType = 'dairy' | 'farming' | 'kirana' | 'handloom' | 'poultry' | 'workshop';

export type LanguageCode = 'hi' | 'en' | 'bn' | 'te' | 'mr' | 'ta' | 'es' | 'sw';

export interface Enterprise {
  id: string;
  name: string;
  ownerName: string;
  tradeType: TradeType;
  village: string;
  district: string;
  state: string;
  preferredLanguage: LanguageCode;
  monthlyRevenueEstimate: number;
  monthlyExpenseEstimate: number;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  enterpriseId: string;
  date: string;
  type: 'cash_in' | 'cash_out' | 'credit_given' | 'credit_received';
  category: string;
  amount: number;
  description: string;
  partyName?: string;
  status: 'completed' | 'pending';
  syncStatus: 'synced' | 'local';
  createdAt: string;
}

export interface LoanRecord {
  id: string;
  enterpriseId: string;
  lenderName: string;
  lenderType: 'moneylender' | 'shg' | 'mfi' | 'commercial_bank' | 'cooperative' | 'family';
  principalAmount: number;
  remainingAmount: number;
  interestRateAnnual: number;
  tenureMonths: number;
  monthlyEmi: number;
  startDate: string;
  purpose: string;
  riskRating: 'critical' | 'moderate' | 'healthy';
}

export interface MarketRate {
  id: string;
  category: 'crop' | 'dairy' | 'poultry' | 'craft' | 'input';
  item: string;
  regionalMandi: string;
  unit: string;
  wholesaleRate: number;
  retailRate: number;
  trend: 'up' | 'down' | 'stable';
  weeklyChangePercent: number;
  updatedDate: string;
  advisoryTip: string;
}

export interface GovScheme {
  id: string;
  code: string;
  name: string;
  category: string;
  targetGroup: string;
  maxFunding: string;
  subsidyRate: string;
  interestRate: string;
  collateralFree: boolean;
  keyEligibility: string[];
  requiredDocs: string[];
  applicationChannel: string;
  officialPortal: string;
}

export interface AdvisoryMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  keyActionSteps?: string[];
  riskAlert?: string;
  isAudioPlaying?: boolean;
}

export interface LoanDossier {
  dscr: number;
  repaymentCapacityMonthly: number;
  recommendedScheme: string;
  schemeCode: string;
  interestSavingsVsMoneylenderAnnual: number;
  structuredDossierSummary: string;
  dossierChecklist: string[];
}
