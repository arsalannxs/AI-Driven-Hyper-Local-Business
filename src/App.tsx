import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Building,
  TrendingUp,
  Landmark,
  Calculator,
  Compass,
  Wifi,
  WifiOff,
  RefreshCw,
  Info,
  Layers,
} from 'lucide-react';
import {
  Enterprise,
  LedgerEntry,
  LoanRecord,
  MarketRate,
  GovScheme,
  AdvisoryMessage,
  LanguageCode,
  FeasibilityReport,
  LocationInput,
} from './types';
import { Header } from './components/Header';
import { EnterpriseProfileModal } from './components/EnterpriseProfileModal';
import { FeasibilityReportModule } from './components/FeasibilityReportModule';
import { SmartSchemeCalculatorModule } from './components/SmartSchemeCalculatorModule';
import { AdvisoryAssistant } from './components/AdvisoryAssistant';
import { BahiKhataLedger } from './components/BahiKhataLedger';
import { DebtRestructuring } from './components/DebtRestructuring';
import { MarketRates } from './components/MarketRates';
import { SchemeNavigator } from './components/SchemeNavigator';
import { offlineStorage } from './services/offlineStorage';
import { UI_TEXT } from './services/i18n';
import { voiceService } from './services/voice';

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('hi');
  const [activeTab, setActiveTab] = useState<
    'feasibility' | 'calculator' | 'advisor' | 'ledger' | 'loans' | 'mandi' | 'schemes'
  >('feasibility');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(offlineStorage.isOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [voiceAutoRead, setVoiceAutoRead] = useState<boolean>(false);

  // Core Enterprise State
  const [currentEnterprise, setCurrentEnterprise] = useState<Enterprise>({
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [allEnterprises, setAllEnterprises] = useState<Enterprise[]>([currentEnterprise]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [marketRates, setMarketRates] = useState<MarketRate[]>([]);
  const [schemes, setSchemes] = useState<GovScheme[]>([]);
  const [advisoryMessages, setAdvisoryMessages] = useState<AdvisoryMessage[]>([]);
  const [isAdvisoryLoading, setIsAdvisoryLoading] = useState<boolean>(false);

  // Module 1 & 2 Specific States (Problem Statement 26091)
  const [locationInput, setLocationInput] = useState<LocationInput>({
    village: 'Pipariya Khurd',
    block: 'Sehore Rural',
    district: 'Sehore',
    state: 'Madhya Pradesh',
  });
  const [availableMarginCapital, setAvailableMarginCapital] = useState<number>(100000);
  const [selectedCategory, setSelectedCategory] = useState<string>('dairy');
  const [feasibilityReport, setFeasibilityReport] = useState<FeasibilityReport | null>(null);
  const [isFeasibilityLoading, setIsFeasibilityLoading] = useState<boolean>(false);

  const t = UI_TEXT[selectedLanguage] || UI_TEXT.en;

  // Initialize network listeners & load cached/online data
  useEffect(() => {
    const unsubscribe = offlineStorage.subscribe((online, count) => {
      setIsOnline(online);
      setPendingSyncCount(count);
    });

    loadInitialData();

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync location with current enterprise
  useEffect(() => {
    setLocationInput({
      village: currentEnterprise.village || 'Pipariya Khurd',
      block: 'Sehore Rural',
      district: currentEnterprise.district || 'Sehore',
      state: currentEnterprise.state || 'Madhya Pradesh',
    });
    setSelectedCategory(currentEnterprise.tradeType || 'dairy');
  }, [currentEnterprise.id]);

  // Update language when enterprise changes
  useEffect(() => {
    if (currentEnterprise.preferredLanguage) {
      setSelectedLanguage(currentEnterprise.preferredLanguage);
    }
  }, [currentEnterprise.id]);

  const loadInitialData = async () => {
    // 1. Try local cache first
    const cachedEnterprises = offlineStorage.getEnterprises();
    if (cachedEnterprises.length > 0) {
      setAllEnterprises(cachedEnterprises);
      const activeId = offlineStorage.getActiveEnterpriseId();
      const found = cachedEnterprises.find(e => e.id === activeId) || cachedEnterprises[0];
      setCurrentEnterprise(found);
    }

    const entId = currentEnterprise.id;
    const cachedLedger = offlineStorage.getLedger(entId);
    if (cachedLedger.length > 0) setLedgerEntries(cachedLedger);

    const cachedLoans = offlineStorage.getLoans(entId);
    if (cachedLoans.length > 0) setLoans(cachedLoans);

    const cachedRates = offlineStorage.getCachedMarketRates();
    if (cachedRates.length > 0) setMarketRates(cachedRates);

    const cachedSchemes = offlineStorage.getCachedSchemes();
    if (cachedSchemes.length > 0) setSchemes(cachedSchemes);

    const cachedMsgs = offlineStorage.getAdvisoryMessages(entId);
    if (cachedMsgs.length > 0) setAdvisoryMessages(cachedMsgs);

    // 2. Fetch fresh data from server and cache
    if (offlineStorage.isOnline()) {
      try {
        const [entRes, ledgerRes, loanRes, ratesRes, schemesRes] = await Promise.all([
          fetch('/api/enterprises').then(r => (r.ok ? r.json() : [])),
          fetch(`/api/ledger?enterpriseId=${entId}`).then(r => (r.ok ? r.json() : [])),
          fetch(`/api/loans?enterpriseId=${entId}`).then(r => (r.ok ? r.json() : [])),
          fetch('/api/market-rates').then(r => (r.ok ? r.json() : [])),
          fetch('/api/schemes').then(r => (r.ok ? r.json() : [])),
        ]);

        if (entRes && entRes.length > 0) {
          setAllEnterprises(entRes);
          offlineStorage.saveEnterprisesLocally(entRes);
          const current = entRes.find((e: Enterprise) => e.id === entId) || entRes[0];
          setCurrentEnterprise(current);
        }

        if (ledgerRes) {
          setLedgerEntries(ledgerRes);
          offlineStorage.saveLedgerLocally(ledgerRes);
        }

        if (loanRes) {
          setLoans(loanRes);
          offlineStorage.saveLoansLocally(loanRes);
        }

        if (ratesRes) {
          setMarketRates(ratesRes);
          offlineStorage.cacheMarketRates(ratesRes);
        }

        if (schemesRes) {
          setSchemes(schemesRes);
          offlineStorage.cacheSchemes(schemesRes);
        }
      } catch (err) {
        console.warn('Initial server fetch failed, running on offline cache:', err);
      }
    }

    // Generate initial feasibility report for instant preview
    handleGenerateFeasibilityReport(
      {
        village: 'Pipariya Khurd',
        block: 'Sehore Rural',
        district: 'Sehore',
        state: 'Madhya Pradesh',
      },
      'dairy',
      100000
    );
  };

  // Generate Feasibility Report (Module 1)
  const handleGenerateFeasibilityReport = async (
    loc = locationInput,
    cat = selectedCategory,
    margin = availableMarginCapital
  ) => {
    setIsFeasibilityLoading(true);
    try {
      if (offlineStorage.isOnline()) {
        const res = await fetch('/api/feasibility-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: loc,
            category: cat,
            availableMargin: margin,
            language: selectedLanguage,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setFeasibilityReport(data);
          setIsFeasibilityLoading(false);
          return;
        }
      }

      // Offline deterministic fallback report
      const feasibleProjectCost = Math.round(margin / 0.1);
      const isMicro = feasibleProjectCost <= 140000;
      const maxLoan = Math.min(Math.round(feasibleProjectCost * 0.9), isMicro ? 125000 : 4500000);
      const isHi = selectedLanguage === 'hi';

      const offlineReport: FeasibilityReport = {
        id: `feas_${Date.now()}`,
        location: loc,
        category: cat,
        categoryName: cat.toUpperCase(),
        availableMargin: margin,
        feasibleProjectCost,
        maxLoanAmount: maxLoan,
        marketReach: {
          consumerBaseEstimate: isHi
            ? `ग्राम पंचायत ${loc.village} व ब्लॉक ${loc.block} के 5-10 किमी दायरे में 16,000-22,000 उपभोक्ता`
            : `Approx. 16,000 - 22,000 consumers across 8 Gram Panchayats within 5-10 km radius of ${loc.village}`,
          radiusKm: 10,
          primaryChannels: isHi
            ? [
                `स्थानीय ब्लॉक साप्ताहिक हाट (${loc.block})`,
                'प्रत्यक्ष ग्राम बिक्री व स्वयं सहायता समूह (SHG) नेटवर्क',
                'कस्बा खुदरा किराना व दुग्ध संग्रहण नेटवर्क',
                'सहकारी उत्पाद केंद्र',
              ]
            : [
                `Weekly Block Haat Bazaar (${loc.block})`,
                'Direct Farm-gate & Village SHG Network',
                'Sub-district Town Retail Outlets',
                'Cooperative Linkage Center',
              ],
          populationDemographics: isHi
            ? '3,200+ ग्रामीण परिवार जिनकी प्राथमिक आजीविका कृषि एवं मजदूरी है।'
            : '3,200+ rural households with weekly cash cycles based on agriculture.',
        },
        opportunityAnalysis: {
          underservedNiches: isHi
            ? [
                'स्थानीय स्तर पर ताजा व शुद्ध उत्पाद की निरंतर मांग',
                'कस्बे जाने के बजाय गांव में ही तैयार व सुलभ सेवाएं',
                'किफायती छोटी पैकेजिंग',
              ]
            : [
                'High demand for fresh, adulteration-free local production',
                'Value-added processing avoiding transport to sub-district',
                'Affordable micro-packaging suited for daily cash flow',
              ],
          highMarginSegments: isHi
            ? ['प्रीमियम गुणवत्ता प्रत्यक्ष बिक्री', 'त्योहारी व शादी सीजन में विशेष आपूर्ति', 'उपोत्पाद पुनर्चक्रण']
            : ['Direct consumer supply with zero middleman loss', 'Seasonal wedding & festival surge sales', 'Value-added byproduct processing'],
          valueAdditionPotential: isHi
            ? 'कच्चे माल को सीधे बेचने के बजाय प्राथमिक ग्रेडिंग या पैकेजिंग से 20% से 35% अतिरिक्त मार्जिन अर्जित किया जा सकता है।'
            : 'Primary grading and packaging captures an additional 20% to 35% profit margin vs selling raw.',
        },
        swot: {
          strengths: isHi
            ? [
                `10% मार्जिन पूंजी (₹${margin.toLocaleString('en-IN')}) के आधार पर 90% रियायती ऋण पात्रता`,
                'स्थानीय ग्रामीणों के साथ मजबूत सामाजिक विश्वास व संबंध',
                'न्यूनतम किराया व पारिवारिक श्रम सहायता',
                'त्वरित परिचालन अनुकूलन क्षमता',
              ]
            : [
                `Optimal 10% equity commitment (₹${margin.toLocaleString('en-IN')}) yielding 90% concessional credit eligibility`,
                'Deep social trust and community goodwill across the Gram Panchayat',
                'Negligible commercial rent overhead by operating within native village premises',
                'Agile operational flexibility with family workforce participation',
              ],
          weaknesses: isHi
            ? [
                'शुरुआती 3-6 महीने में सीमित कार्यशील पूंजी',
                'डिजिटल लेखांकन का सीमित पूर्व अनुभव',
                'शीतगृह (कोल्ड स्टोरेज) का अभाव',
                'कच्चे माल की कीमतों में मौसमी उतार-चढ़ाव',
              ]
            : [
                'Initial working capital constraints during first two cycles',
                'Limited historical exposure to formalized double-entry bookkeeping',
                'Absence of cold storage or mechanized tools',
                'Vulnerability to raw material price volatility',
              ],
          opportunities: isHi
            ? [
                'MoSJE / SCA रियायती ऋण योजना (कम ब्याज दर व मोरेटोरियम अवधि)',
                '5 किमी दायरे में समान संगठित सेवा का न होना',
                'UPI व डिजिटल भुगतान का बढ़ता उपयोग',
                'SHG फेडरेशन से आपूर्ति समझौता',
              ]
            : [
                'Access to MoSJE/SCA Concessional Credit with low interest & grace moratorium',
                'No mechanized competitor within immediate 5 km radius',
                'Rapidly growing UPI adoption among rural consumers',
                'Direct partnership with block SHG federations',
              ],
          threats: isHi
            ? [
                'अनियंत्रित ग्राहक उधारी (Udhaar) से नकदी का फंसना',
                'मानसून में कच्चा माल आपूर्ति में बाधा',
                'बाहरी बड़े शहरों के ब्रांडेड उत्पादों से प्रतिस्पर्धा',
                'बिजली आपूर्ति में व्यवधान',
              ]
            : [
                'Excessive customer credit (Udhaar) stalling liquid working capital',
                'Monsoon road disruptions causing logistical delays',
                'Synthetic substitutes from industrial hubs',
                'Unscheduled power outages affecting daily processing',
              ],
        },
        threatsIdentification: {
          supplyChainBottlenecks: isHi
            ? [
                'बारिश में सड़क खराब होने से माल ढुलाई में विलंब',
                'कच्चे माल हेतु कस्बे के व्यापारियों पर निर्भरता',
                'पैकिंग सामग्री की समय पर आपूर्ति में कमी',
              ]
            : [
                'Monsoon access road disruptions causing logistical delays',
                'Intermediary dependency for critical input commodities',
                'Delayed availability of food-grade packaging materials',
              ],
          seasonalFluctuations: isHi
            ? [
                'गर्मी में उत्पादन में 15-20% की कमी',
                'फसल कटाई के समय नकदी की प्रचुरता, बुवाई में तंगी',
                'शादी सीजन में मांग में 2 गुना उछाल',
              ]
            : [
                'Summer heat stress creating output contraction',
                'Post-harvest liquidity surges contrasting with lean sowing periods',
                'High demand peaks during regional festival and wedding seasons',
              ],
          singleBuyerDependency: isHi
            ? 'किसी एक आढ़ती पर निर्भर न रहें। कम से कम 3 अलग-अलग बिक्री माध्यम रखें।'
            : 'Relying on a single middleman compresses margins. Diversify across direct retail, weekly haat, and institutions.',
          mitigationStrategies: isHi
            ? [
                'उधार बिक्री पर सख्त 15-दिन की सीमा रखें और 70% नकद लेन-देन रखें।',
                '30-दिन का कच्चा माल बफर स्टॉक रखें।',
                'मोरेटोरियम अवधि (3-6 माह) का उपयोग करके नकदी आरक्षित निधि बनाएं।',
                'पड़ोसी उद्यमियों के साथ साझा परिवहन अपनाएं।',
              ]
            : [
                'Enforce a strict 15-day ceiling on customer credit and maintain 70%+ cash/UPI sales.',
                'Maintain a 30-day raw material buffer stock to cushion against price spikes.',
                'Leverage the loan moratorium window (3-6 months) to build cash reserves.',
                'Form pooled transport syndicates with neighboring micro-entrepreneurs.',
              ],
        },
        competitorMapping: {
          estimatedCompetitorDensity: isHi
            ? 'मध्यम: 5 किमी दायरे में 2 से 4 असंगठित इकाइयां'
            : 'Low to Moderate: 2-4 unorganized informal units within 5 km radius',
          competitorsCountEstimate: 3,
          competitiveAdvantageAdvice: isHi
            ? 'पूर्ण शुद्धता, सटीक इलेक्ट्रॉनिक तौल, और डिजिटल बिलिंग से 90% ग्राहक निष्ठा हासिल करें।'
            : 'Differentiate via consistent freshness, verified electronic weighing, and courteous service.',
        },
        productMarketValue: {
          optimalPricingStrategy: isHi
            ? 'लागत-प्लस-25% रणनीति: कस्बे के भाव से 4-5% कम रखें ताकि ग्रामीण तुरंत आकर्षित हों।'
            : 'Cost-Plus-25% Margin Strategy: Benchmark price 4-6% below town retail to incentivize village retention.',
          benchmarkSellingPrice: isHi ? '₹48 - ₹65 प्रति मानक इकाई' : '₹48 - ₹65 per standard unit',
          regionalPurchasingPowerEstimate: isHi
            ? 'मध्यम-ग्रामीण: छोटे पैक में दैनिक नकद भुगतान प्राथमिकता'
            : 'Moderate-Rural: High frequency, low ticket-size purchases with preference for tangible quality.',
          breakEvenTimeline: isHi ? 'मोरेटोरियम समाप्त होने के बाद 4 से 6 महीने' : '4 to 6 months post-moratorium phase',
        },
        executiveSummary: isHi
          ? `ग्राम पंचायत ${loc.village} में ₹${feasibleProjectCost.toLocaleString('en-IN')} की यह परियोजना पूर्णतः व्यावहारिक है। 10% मार्जिन पूंजी (₹${margin.toLocaleString('en-IN')}) और MoSJE 90% रियायती ऋण के संयोजन से यह इकाई प्रथम वर्ष में ही सकारात्मक नकदी प्रवाह उत्पन्न कर सकती है।`
          : `The proposed enterprise in ${loc.village} (Block: ${loc.block}) demonstrates robust commercial viability at a project cost of ₹${feasibleProjectCost.toLocaleString('en-IN')}. Combining the entrepreneur's 10% margin capital with 90% MoSJE concessional credit establishes a low-risk, bankable model with healthy debt service coverage.`,
        generatedDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      };

      setFeasibilityReport(offlineReport);
    } catch (err) {
      console.warn('Feasibility report generation failed:', err);
    } finally {
      setIsFeasibilityLoading(false);
    }
  };

  // Manual Offline Sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    await offlineStorage.syncPendingItems();
    setIsSyncing(false);
  };

  // Enterprise Selection & Save
  const handleSelectEnterprise = (ent: Enterprise) => {
    setCurrentEnterprise(ent);
    offlineStorage.setActiveEnterpriseId(ent.id);
  };

  const handleSaveEnterprise = async (ent: Enterprise) => {
    setCurrentEnterprise(ent);
    const updatedList = allEnterprises.map(e => (e.id === ent.id ? ent : e));
    setAllEnterprises(updatedList);
    offlineStorage.saveEnterprisesLocally(updatedList);

    if (offlineStorage.isOnline()) {
      try {
        await fetch('/api/enterprises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ent),
        });
      } catch {
        offlineStorage.queueSyncItem({
          type: 'enterprise',
          action: 'update',
          payload: ent,
        });
      }
    } else {
      offlineStorage.queueSyncItem({
        type: 'enterprise',
        action: 'update',
        payload: ent,
      });
    }
  };

  // Ledger Actions
  const handleAddLedgerEntry = async (
    entryData: Omit<LedgerEntry, 'id' | 'createdAt' | 'syncStatus'>
  ) => {
    const newEntry: LedgerEntry = {
      ...entryData,
      id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      syncStatus: offlineStorage.isOnline() ? 'synced' : 'local',
    };

    const updated = [newEntry, ...ledgerEntries];
    setLedgerEntries(updated);
    offlineStorage.saveLedgerLocally(updated);

    if (offlineStorage.isOnline()) {
      try {
        const res = await fetch('/api/ledger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEntry),
        });
        if (!res.ok) throw new Error('Network save failed');
      } catch {
        offlineStorage.queueSyncItem({
          type: 'ledger',
          action: 'create',
          payload: newEntry,
        });
      }
    } else {
      offlineStorage.queueSyncItem({
        type: 'ledger',
        action: 'create',
        payload: newEntry,
      });
    }
  };

  const handleDeleteLedgerEntry = async (id: string) => {
    const updated = ledgerEntries.filter(e => e.id !== id);
    setLedgerEntries(updated);
    offlineStorage.saveLedgerLocally(updated);

    if (offlineStorage.isOnline()) {
      try {
        await fetch(`/api/ledger/${id}`, { method: 'DELETE' });
      } catch {
        offlineStorage.queueSyncItem({
          type: 'ledger',
          action: 'delete',
          payload: { id },
        });
      }
    } else {
      offlineStorage.queueSyncItem({
        type: 'ledger',
        action: 'delete',
        payload: { id },
      });
    }
  };

  const handleMarkCreditSettled = async (id: string) => {
    const updated = ledgerEntries.map(e =>
      e.id === id ? { ...e, status: 'completed' as const } : e
    );
    setLedgerEntries(updated);
    offlineStorage.saveLedgerLocally(updated);

    const target = updated.find(e => e.id === id);
    if (target) {
      if (offlineStorage.isOnline()) {
        try {
          await fetch('/api/ledger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(target),
          });
        } catch {
          offlineStorage.queueSyncItem({
            type: 'ledger',
            action: 'update',
            payload: target,
          });
        }
      } else {
        offlineStorage.queueSyncItem({
          type: 'ledger',
          action: 'update',
          payload: target,
        });
      }
    }
  };

  // Loans Actions
  const handleAddLoan = async (loanData: Omit<LoanRecord, 'id'>) => {
    const newLoan: LoanRecord = {
      ...loanData,
      id: `loan_${Date.now()}`,
    };

    const updated = [newLoan, ...loans];
    setLoans(updated);
    offlineStorage.saveLoansLocally(updated);

    if (offlineStorage.isOnline()) {
      try {
        await fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLoan),
        });
      } catch {
        offlineStorage.queueSyncItem({
          type: 'loan',
          action: 'create',
          payload: newLoan,
        });
      }
    } else {
      offlineStorage.queueSyncItem({
        type: 'loan',
        action: 'create',
        payload: newLoan,
      });
    }
  };

  const handleDeleteLoan = async (id: string) => {
    const updated = loans.filter(l => l.id !== id);
    setLoans(updated);
    offlineStorage.saveLoansLocally(updated);

    if (offlineStorage.isOnline()) {
      try {
        await fetch(`/api/loans/${id}`, { method: 'DELETE' });
      } catch {
        offlineStorage.queueSyncItem({
          type: 'loan',
          action: 'delete',
          payload: { id },
        });
      }
    } else {
      offlineStorage.queueSyncItem({
        type: 'loan',
        action: 'delete',
        payload: { id },
      });
    }
  };

  // AI Advisory Query
  const handleSendAdvisoryQuery = async (queryText: string) => {
    const userMsg: AdvisoryMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...advisoryMessages, userMsg];
    setAdvisoryMessages(newMessages);
    offlineStorage.saveAdvisoryMessages(currentEnterprise.id, newMessages);

    setIsAdvisoryLoading(true);

    try {
      let adviceData = null;

      if (offlineStorage.isOnline()) {
        const response = await fetch('/api/advisory/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: queryText,
            enterpriseId: currentEnterprise.id,
            language: selectedLanguage,
          }),
        });

        if (response.ok) {
          adviceData = await response.json();
        }
      }

      if (!adviceData) {
        const isHi = selectedLanguage === 'hi';
        const trade = currentEnterprise.tradeType;

        let fallbackText = isHi
          ? `[ऑफ़लाइन व्यापार सलाह - ${currentEnterprise.village}]
आपकी ${trade} इकाई के लिए सलाह:
1. 10% मार्जिन पूंजी के साथ MoSJE रियायती ऋण (6.5% - 8.0%) के लिए आवेदन करें।
2. दैनिक खर्च को नियंत्रित रखें और कच्चा माल सीधे थोक मंडी या सहकारी समिति से खरीदें। 
3. साहूकार के उच्च ब्याज वाले कर्ज़ को बैंक या रियायती ऋण में बदलने का प्रयास करें।`
          : `[Offline Advisory - ${currentEnterprise.village}]
Advice for your ${trade} unit:
1. Leverage your 10% margin capital to access 90% MoSJE concessional credit (6.5% - 8.0% p.a.).
2. Keep daily operating costs strictly recorded. Source inputs directly through village cooperatives.
3. Prepare your Bank Appraisal Dossier to refinance high-interest moneylender debt.`;

        let steps = isHi
          ? [
              'दैनिक हिसाब बही-खाता में तुरंत दर्ज करें।',
              'मोसजे रियायती ऋण योजना (माइक्रो / टर्म लोन) में आवेदन करें।',
              'साहूकार को दिया जाने वाला ब्याज कम करने के लिए बैंक शाखा में संपर्क करें।',
            ]
          : [
              'Log daily cash sales and expenses in your offline Bahi-Khata ledger.',
              'Apply for MoSJE concessional credit (Micro Finance or Term Loan).',
              'Prepare your 1-Page Bank Appraisal Dossier to refinance moneylender debt.',
            ];

        adviceData = {
          text: fallbackText,
          keyActionSteps: steps,
        };
      }

      const botMsg: AdvisoryMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: adviceData.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        keyActionSteps: adviceData.keyActionSteps,
        riskAlert: adviceData.riskAlert,
      };

      const updatedMsgs = [...newMessages, botMsg];
      setAdvisoryMessages(updatedMsgs);
      offlineStorage.saveAdvisoryMessages(currentEnterprise.id, updatedMsgs);
    } catch (err) {
      console.warn('Advisory query error:', err);
    } finally {
      setIsAdvisoryLoading(false);
    }
  };

  // Main Navigation Tabs
  const navTabs = [
    {
      id: 'feasibility' as const,
      label: 'Feasibility Study',
      icon: Compass,
      tag: 'Module 1',
    },
    {
      id: 'calculator' as const,
      label: 'Scheme Calculator',
      icon: Calculator,
      tag: 'Module 2',
    },
    {
      id: 'advisor' as const,
      label: t.tabAdvisor,
      icon: Sparkles,
      tag: 'AI Voice',
    },
    {
      id: 'ledger' as const,
      label: t.tabLedger,
      icon: BookOpen,
      count: ledgerEntries.length,
    },
    {
      id: 'loans' as const,
      label: t.tabLoanDossier,
      icon: Building,
      alert: loans.some(l => l.interestRateAnnual >= 24),
    },
    {
      id: 'mandi' as const,
      label: t.tabMandiRates,
      icon: TrendingUp,
    },
    {
      id: 'schemes' as const,
      label: t.tabGovSchemes,
      icon: Landmark,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentEnterprise={currentEnterprise}
        onOpenProfile={() => setProfileModalOpen(true)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={lang => setSelectedLanguage(lang)}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
        voiceAutoRead={voiceAutoRead}
        onToggleVoiceAutoRead={() => setVoiceAutoRead(!voiceAutoRead)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <nav
          aria-label="Main Navigation"
          className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none"
        >
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-700'}`} />
                <span>{tab.label}</span>

                {tab.tag && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isActive ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.tag}
                  </span>
                )}

                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-emerald-900 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}

                {tab.alert && (
                  <span
                    className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"
                    title="High interest debt detected"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Tab Content Panels */}
        {activeTab === 'feasibility' && (
          <FeasibilityReportModule
            location={locationInput}
            onChangeLocation={setLocationInput}
            availableMargin={availableMarginCapital}
            onChangeMargin={setAvailableMarginCapital}
            category={selectedCategory}
            onChangeCategory={setSelectedCategory}
            report={feasibilityReport}
            onGenerateReport={() =>
              handleGenerateFeasibilityReport(locationInput, selectedCategory, availableMarginCapital)
            }
            isLoading={isFeasibilityLoading}
            language={selectedLanguage}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'calculator' && (
          <SmartSchemeCalculatorModule
            availableMargin={availableMarginCapital}
            onChangeMargin={setAvailableMarginCapital}
            language={selectedLanguage}
          />
        )}

        {activeTab === 'advisor' && (
          <AdvisoryAssistant
            enterprise={currentEnterprise}
            messages={advisoryMessages}
            onSendMessage={handleSendAdvisoryQuery}
            isLoading={isAdvisoryLoading}
            language={selectedLanguage}
            isOnline={isOnline}
            voiceAutoRead={voiceAutoRead}
          />
        )}

        {activeTab === 'ledger' && (
          <BahiKhataLedger
            entries={ledgerEntries}
            onAddEntry={handleAddLedgerEntry}
            onDeleteEntry={handleDeleteLedgerEntry}
            onMarkCreditSettled={handleMarkCreditSettled}
            language={selectedLanguage}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'loans' && (
          <DebtRestructuring
            enterprise={currentEnterprise}
            loans={loans}
            onAddLoan={handleAddLoan}
            onDeleteLoan={handleDeleteLoan}
            language={selectedLanguage}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'mandi' && (
          <MarketRates rates={marketRates} language={selectedLanguage} />
        )}

        {activeTab === 'schemes' && (
          <SchemeNavigator
            schemes={schemes}
            enterprise={currentEnterprise}
            language={selectedLanguage}
          />
        )}
      </main>

      {/* Enterprise Profile Modal */}
      {profileModalOpen && (
        <EnterpriseProfileModal
          enterprise={currentEnterprise}
          allEnterprises={allEnterprises}
          onSelectEnterprise={handleSelectEnterprise}
          onSaveEnterprise={handleSaveEnterprise}
          onClose={() => setProfileModalOpen(false)}
          language={selectedLanguage}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">GramSathi MoSJE Portal</span>
            <span>•</span>
            <span>State Channelizing Agencies (SCAs) & CAs Concessional Credit</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>Problem Statement ID: 26091</span>
            <span>•</span>
            <span>Offline-First PWA</span>
            <span>•</span>
            <span>10% Margin / 90% Concessional Credit</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
