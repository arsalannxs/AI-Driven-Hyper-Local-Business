import fs from 'fs';
import path from 'path';

export interface Enterprise {
  id: string;
  name: string;
  ownerName: string;
  tradeType: 'dairy' | 'farming' | 'kirana' | 'handloom' | 'poultry' | 'workshop';
  village: string;
  district: string;
  state: string;
  preferredLanguage: string;
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

export interface DatabaseSchema {
  enterprises: Enterprise[];
  ledgerEntries: LedgerEntry[];
  loans: LoanRecord[];
  marketRates: MarketRate[];
  schemes: GovScheme[];
  advisoryHistory: Array<{
    id: string;
    enterpriseId: string;
    query: string;
    response: string;
    language: string;
    createdAt: string;
  }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'rural_advisor_db.json');

const INITIAL_ENTERPRISES: Enterprise[] = [
  {
    id: 'ent_default_01',
    name: 'Kishan Dairy & Cattle Farm',
    ownerName: 'Rameshwar Yadav',
    tradeType: 'dairy',
    village: 'Pipariya Khurd',
    district: 'Sehore',
    state: 'Madhya Pradesh',
    preferredLanguage: 'hi',
    monthlyRevenueEstimate: 42000,
    monthlyExpenseEstimate: 24000,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ent_default_02',
    name: 'Maa Durga Kirana Store',
    ownerName: 'Sunita Devi',
    tradeType: 'kirana',
    village: 'Chandpur',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    preferredLanguage: 'hi',
    monthlyRevenueEstimate: 58000,
    monthlyExpenseEstimate: 41000,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_LEDGER: LedgerEntry[] = [
  {
    id: 'led_001',
    enterpriseId: 'ent_default_01',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    type: 'cash_in',
    category: 'Milk Collection Center Sale',
    amount: 1450,
    description: '38 Liters buffalo milk sold at chilling center (fat 6.8)',
    partyName: 'Amul Village Chilling Center',
    status: 'completed',
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'led_002',
    enterpriseId: 'ent_default_01',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    type: 'cash_out',
    category: 'Cattle Feed (Khali/Choker)',
    amount: 850,
    description: '1 Bag mustard oil cake (sarson khali) for lactating cow',
    partyName: 'Gupta Feed Agency',
    status: 'completed',
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'led_003',
    enterpriseId: 'ent_default_01',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    type: 'cash_in',
    category: 'Ghee Sale',
    amount: 1200,
    description: '2 kg pure desi cow ghee sold to weekly market visitors',
    partyName: 'Direct Cash Customer',
    status: 'completed',
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'led_004',
    enterpriseId: 'ent_default_01',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    type: 'credit_given',
    category: 'Customer Udhaar (Credit)',
    amount: 600,
    description: 'Monthly loose milk supplied to Primary School Teacher',
    partyName: 'Master Ji (School)',
    status: 'pending',
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const INITIAL_LOANS: LoanRecord[] = [
  {
    id: 'loan_001',
    enterpriseId: 'ent_default_01',
    lenderName: 'Village Mahajan (Local Moneylender)',
    lenderType: 'moneylender',
    principalAmount: 40000,
    remainingAmount: 34000,
    interestRateAnnual: 48, // 4% per month = 48% APR (typical predatory informal loan)
    tenureMonths: 12,
    monthlyEmi: 4300,
    startDate: '2026-01-15',
    purpose: 'Emergency purchase of second-hand milch buffalo after monsoon',
    riskRating: 'critical',
  },
  {
    id: 'loan_002',
    enterpriseId: 'ent_default_01',
    lenderName: 'Gramin Sakhi Self Help Group (SHG)',
    lenderType: 'shg',
    principalAmount: 25000,
    remainingAmount: 16000,
    interestRateAnnual: 10,
    tenureMonths: 18,
    monthlyEmi: 1500,
    startDate: '2025-08-10',
    purpose: 'Cattle shed roof tin repair and water tub installation',
    riskRating: 'healthy',
  },
];

const INITIAL_MARKET_RATES: MarketRate[] = [
  {
    id: 'mr_01',
    category: 'dairy',
    item: 'Raw Buffalo Milk (6.5% Fat)',
    regionalMandi: 'District Cooperative Dairy Union',
    unit: 'Liter',
    wholesaleRate: 46.5,
    retailRate: 62.0,
    trend: 'up',
    weeklyChangePercent: 3.5,
    updatedDate: 'Today',
    advisoryTip: 'Chilling center price increased due to festival demand. Test SNF ratio before batch delivery.',
  },
  {
    id: 'mr_02',
    category: 'crop',
    item: 'Mustard Seeds (Sarson)',
    regionalMandi: 'Krishi Upaj Mandi Sehore',
    unit: 'Quintal (100kg)',
    wholesaleRate: 5450,
    retailRate: 6100,
    trend: 'stable',
    weeklyChangePercent: 0.8,
    updatedDate: 'Today',
    advisoryTip: 'Moisture content under 8% fetches Rs 150/qtl bonus. Sun-dry for 2 days before bringing to mandi.',
  },
  {
    id: 'mr_03',
    category: 'crop',
    item: 'Desi Wheat (Sharbati Grade-A)',
    regionalMandi: 'Bhopal APMC Mandi',
    unit: 'Quintal (100kg)',
    wholesaleRate: 2850,
    retailRate: 3400,
    trend: 'up',
    weeklyChangePercent: 2.2,
    updatedDate: 'Today',
    advisoryTip: 'Government MSP procurement active. Carry Khasra/Aadhaar card to village society for direct MSP deposit.',
  },
  {
    id: 'mr_04',
    category: 'input',
    item: 'Balanced Cattle Feed Pellets (Sudha Gold)',
    regionalMandi: 'District Agro Input Depot',
    unit: '50kg Bag',
    wholesaleRate: 1420,
    retailRate: 1550,
    trend: 'down',
    weeklyChangePercent: -1.5,
    updatedDate: 'Today',
    advisoryTip: 'Block cooperative society offers Rs 90/bag subsidy for registered milk pouring farmers.',
  },
  {
    id: 'mr_05',
    category: 'crop',
    item: 'Red Onion (Nasik Hybrid)',
    regionalMandi: 'Regional Sub-Mandi',
    unit: 'Kilogram',
    wholesaleRate: 18.0,
    retailRate: 32.0,
    trend: 'down',
    weeklyChangePercent: -8.0,
    updatedDate: 'Today',
    advisoryTip: 'Fresh harvest arrival glut. Store in ventilated bamboo racks if you have dry storage; do not panic sell.',
  },
];

const INITIAL_SCHEMES: GovScheme[] = [
  {
    id: 'sch_mudra_shishu',
    code: 'PMMY-SHISHU',
    name: 'Pradhan Mantri MUDRA Yojana (Shishu)',
    category: 'Micro-Enterprise Working Capital & Asset Creation',
    targetGroup: 'Rural artisans, fruit/veg vendors, shopkeepers, service repairers',
    maxFunding: '₹50,000',
    subsidyRate: 'Interest subvention 2% under special credit drive',
    interestRate: '8.5% - 10.0% p.a. (Bank Base Rate)',
    collateralFree: true,
    keyEligibility: [
      'No collateral or third-party guarantee needed',
      'Existing or new small business activity',
      'Clean credit history with local cooperative or bank branch',
    ],
    requiredDocs: [
      'Aadhaar & Voter ID',
      'Passport size photo (2 copies)',
      'Proof of business place / Sarpanch certificate',
      'Quotation of machinery/goods to be bought',
    ],
    applicationChannel: 'Udyamimitra portal or any Public Sector / Regional Rural Bank (RRB) branch',
    officialPortal: 'https://www.mudra.org.in',
  },
  {
    id: 'sch_kcc_dairy',
    code: 'KCC-ANIMAL-HUSBANDRY',
    name: 'Kisan Credit Card for Dairy & Animal Husbandry',
    category: 'Working Capital for Milk Producers',
    targetGroup: 'Small/marginal farmers with 1-10 milch cattle, goat/poultry rearers',
    maxFunding: '₹2,00,000 (collateral free up to ₹1.6 Lakh)',
    subsidyRate: '3% prompt repayment incentive brings effective interest to 4%',
    interestRate: '7.0% base (4.0% with prompt repayment)',
    collateralFree: true,
    keyEligibility: [
      'Must own or lease minimum 1 milch cow/buffalo or 10 sheep/goats',
      'Covers recurring feed, veterinary medicines, electricity expenses',
    ],
    requiredDocs: [
      'Aadhaar Card and Land Record (or Animal Tagging Certificate from Vet)',
      'Dairy cooperative pourer passbook (last 3 months)',
      'Bank savings account passbook',
    ],
    applicationChannel: 'Local Bank Branch, Village Primary Agricultural Society (PACS)',
    officialPortal: 'https://pmkisan.gov.in',
  },
  {
    id: 'sch_svanidhi',
    code: 'PM-SVANIDHI',
    name: 'PM Street Vendor & Micro-Trader AtmaNirbhar Nidhi',
    category: 'Urban/Peri-Rural Micro Credit',
    targetGroup: 'Street vendors, mobile hawkers, tea/food stall operators',
    maxFunding: '₹10,000 (1st Tranche), ₹20,000 (2nd), ₹50,000 (3rd)',
    subsidyRate: '7% interest subsidy credited directly to bank account quarterly',
    interestRate: '9.0% (effective ~2% after subsidy)',
    collateralFree: true,
    keyEligibility: [
      'Engaged in vending/micro retail trade prior to application',
      'Cashback of up to ₹1,200 per year on digital UPI transactions',
    ],
    requiredDocs: [
      'Aadhaar-linked Mobile Number',
      'Vending Certificate / Recommendation Letter from local Panchayat / Municipality',
      'Bank Account details',
    ],
    applicationChannel: 'Common Service Centre (CSC) or PMSVANidhi Portal',
    officialPortal: 'https://pmsvanidhi.mohua.gov.in',
  },
  {
    id: 'sch_nrlm_shg',
    code: 'DAY-NRLM',
    name: 'Deendayal Antyodaya Yojana - National Rural Livelihoods Mission',
    category: 'Women Self-Help Group Bank Linkage',
    targetGroup: 'Women micro-entrepreneurs in rural SHGs',
    maxFunding: 'Up to ₹20,00,000 per SHG group (Internal lending: ₹50k - ₹1.5L per member)',
    subsidyRate: 'Interest subvention reduces interest to 7% (and 4% for prompt repayment in priority districts)',
    interestRate: '7.0% p.a.',
    collateralFree: true,
    keyEligibility: [
      'Active membership in registered SHG adhering to Panchasutras (regular meetings, savings, inter-loaning, repayment, record-keeping)',
      'Minimum 6 months active group vintage',
    ],
    requiredDocs: [
      'SHG Resolution letter signed by President/Secretary',
      'SHG Minutes register and savings ledger',
      'Member KYC documents',
    ],
    applicationChannel: 'Village Organization (VO), Block Mission Management Unit (BMMU)',
    officialPortal: 'https://aajeevika.gov.in',
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read existing DB file, creating initial dataset:', e);
    }

    const initialData: DatabaseSchema = {
      enterprises: INITIAL_ENTERPRISES,
      ledgerEntries: INITIAL_LEDGER,
      loans: INITIAL_LOANS,
      marketRates: INITIAL_MARKET_RATES,
      schemes: INITIAL_SCHEMES,
      advisoryHistory: [],
    };

    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Enterprise operations
  getEnterprises(): Enterprise[] {
    return this.data.enterprises;
  }

  getEnterprise(id: string): Enterprise | undefined {
    return this.data.enterprises.find(e => e.id === id);
  }

  saveEnterprise(enterprise: Enterprise): Enterprise {
    const idx = this.data.enterprises.findIndex(e => e.id === enterprise.id);
    if (idx >= 0) {
      this.data.enterprises[idx] = { ...enterprise, updatedAt: new Date().toISOString() };
    } else {
      this.data.enterprises.push(enterprise);
    }
    this.saveData(this.data);
    return enterprise;
  }

  // Ledger operations
  getLedger(enterpriseId: string): LedgerEntry[] {
    return this.data.ledgerEntries
      .filter(l => l.enterpriseId === enterpriseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addLedgerEntry(entry: LedgerEntry): LedgerEntry {
    this.data.ledgerEntries.unshift(entry);
    this.saveData(this.data);
    return entry;
  }

  deleteLedgerEntry(id: string): boolean {
    const beforeLen = this.data.ledgerEntries.length;
    this.data.ledgerEntries = this.data.ledgerEntries.filter(l => l.id !== id);
    if (this.data.ledgerEntries.length !== beforeLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // Loans
  getLoans(enterpriseId: string): LoanRecord[] {
    return this.data.loans.filter(l => l.enterpriseId === enterpriseId);
  }

  saveLoan(loan: LoanRecord): LoanRecord {
    const idx = this.data.loans.findIndex(l => l.id === loan.id);
    if (idx >= 0) {
      this.data.loans[idx] = loan;
    } else {
      this.data.loans.push(loan);
    }
    this.saveData(this.data);
    return loan;
  }

  deleteLoan(id: string): boolean {
    const beforeLen = this.data.loans.length;
    this.data.loans = this.data.loans.filter(l => l.id !== id);
    if (this.data.loans.length !== beforeLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // Market Rates & Schemes
  getMarketRates(category?: string): MarketRate[] {
    if (category) {
      return this.data.marketRates.filter(r => r.category === category);
    }
    return this.data.marketRates;
  }

  getSchemes(): GovScheme[] {
    return this.data.schemes;
  }

  // Batch Sync for Offline Client Operations
  batchSync(payload: {
    enterprise?: Enterprise;
    newLedgerEntries?: LedgerEntry[];
    newLoans?: LoanRecord[];
  }): { syncedCount: number; timestamp: string } {
    let count = 0;

    if (payload.enterprise) {
      this.saveEnterprise(payload.enterprise);
      count++;
    }

    if (payload.newLedgerEntries && Array.isArray(payload.newLedgerEntries)) {
      for (const entry of payload.newLedgerEntries) {
        const existingIdx = this.data.ledgerEntries.findIndex(e => e.id === entry.id);
        if (existingIdx >= 0) {
          this.data.ledgerEntries[existingIdx] = { ...entry, syncStatus: 'synced' };
        } else {
          this.data.ledgerEntries.unshift({ ...entry, syncStatus: 'synced' });
        }
        count++;
      }
    }

    if (payload.newLoans && Array.isArray(payload.newLoans)) {
      for (const loan of payload.newLoans) {
        const existingIdx = this.data.loans.findIndex(l => l.id === loan.id);
        if (existingIdx >= 0) {
          this.data.loans[existingIdx] = loan;
        } else {
          this.data.loans.push(loan);
        }
        count++;
      }
    }

    this.saveData(this.data);
    return {
      syncedCount: count,
      timestamp: new Date().toISOString(),
    };
  }

  logAdvisory(record: {
    enterpriseId: string;
    query: string;
    response: string;
    language: string;
  }) {
    this.data.advisoryHistory.unshift({
      id: `adv_${Date.now()}`,
      ...record,
      createdAt: new Date().toISOString(),
    });
    this.saveData(this.data);
  }
}

export const db = new Database();
