import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Building,
  TrendingUp,
  Landmark,
  Wifi,
  WifiOff,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  Enterprise,
  LedgerEntry,
  LoanRecord,
  MarketRate,
  GovScheme,
  AdvisoryMessage,
  LanguageCode,
} from './types';
import { Header } from './components/Header';
import { EnterpriseProfileModal } from './components/EnterpriseProfileModal';
import { BahiKhataLedger } from './components/BahiKhataLedger';
import { AdvisoryAssistant } from './components/AdvisoryAssistant';
import { DebtRestructuring } from './components/DebtRestructuring';
import { MarketRates } from './components/MarketRates';
import { SchemeNavigator } from './components/SchemeNavigator';
import { offlineStorage } from './services/offlineStorage';
import { UI_TEXT } from './services/i18n';
import { voiceService } from './services/voice';

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('hi');
  const [activeTab, setActiveTab] = useState<'advisor' | 'ledger' | 'loans' | 'mandi' | 'schemes'>('advisor');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(offlineStorage.isOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [voiceAutoRead, setVoiceAutoRead] = useState<boolean>(false);

  // Core Data State
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

    // 2. If online, fetch fresh data from server and cache
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
        console.warn('Initial server fetch failed, using local offline store:', err);
      }
    }
  };

  // Manual Sync trigger
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await offlineStorage.syncPendingItems();
      if (res.success) {
        // Refresh data
        await loadInitialData();
      }
    } catch (e) {
      console.warn('Manual sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Enterprise switching & saving
  const handleSelectEnterprise = (ent: Enterprise) => {
    setCurrentEnterprise(ent);
    offlineStorage.setActiveEnterpriseId(ent.id);

    // Load enterprise's data
    const entLedger = offlineStorage.getLedger(ent.id);
    setLedgerEntries(entLedger);
    const entLoans = offlineStorage.getLoans(ent.id);
    setLoans(entLoans);
    const entMsgs = offlineStorage.getAdvisoryMessages(ent.id);
    setAdvisoryMessages(entMsgs);
  };

  const handleSaveEnterprise = async (updated: Enterprise) => {
    setCurrentEnterprise(updated);
    offlineStorage.saveEnterprise(updated);

    const updatedList = allEnterprises.map(e => (e.id === updated.id ? updated : e));
    setAllEnterprises(updatedList);

    if (isOnline) {
      try {
        await fetch('/api/enterprises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      } catch (e) {
        console.warn('Enterprise save sync deferred to offline queue:', e);
      }
    }
  };

  // Add ledger entry
  const handleAddLedgerEntry = async (
    entryData: Omit<LedgerEntry, 'id' | 'createdAt' | 'syncStatus'>
  ) => {
    const newEntry: LedgerEntry = {
      ...entryData,
      id: `led_${Date.now()}`,
      enterpriseId: currentEnterprise.id,
      syncStatus: isOnline ? 'synced' : 'local',
      createdAt: new Date().toISOString(),
    };

    // Save to offline-first engine
    offlineStorage.addLedgerEntry(newEntry);
    setLedgerEntries(prev => [newEntry, ...prev]);

    if (isOnline) {
      try {
        await fetch('/api/ledger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEntry),
        });
      } catch {
        // Automatically queued by offlineStorage
      }
    }
  };

  const handleDeleteLedgerEntry = async (id: string) => {
    offlineStorage.deleteLedgerEntry(id);
    setLedgerEntries(prev => prev.filter(l => l.id !== id));

    if (isOnline) {
      try {
        await fetch(`/api/ledger/${id}`, { method: 'DELETE' });
      } catch {
        // Queued
      }
    }
  };

  const handleMarkCreditSettled = async (id: string) => {
    const updated = ledgerEntries.map(entry =>
      entry.id === id ? { ...entry, status: 'completed' as const } : entry
    );
    setLedgerEntries(updated);
    offlineStorage.saveLedgerLocally(updated);

    // Also record cash in for this recovered credit
    const target = ledgerEntries.find(l => l.id === id);
    if (target) {
      handleAddLedgerEntry({
        enterpriseId: currentEnterprise.id,
        date: new Date().toISOString().split('T')[0],
        type: 'cash_in',
        category: 'Udhaar (Credit) Recovered',
        amount: target.amount,
        description: `Recovered credit from ${target.partyName || 'Customer'}`,
        partyName: target.partyName,
        status: 'completed',
      });
    }
  };

  // Add loan
  const handleAddLoan = async (loanData: Omit<LoanRecord, 'id'>) => {
    const newLoan: LoanRecord = {
      ...loanData,
      id: `loan_${Date.now()}`,
      enterpriseId: currentEnterprise.id,
    };

    offlineStorage.addLoan(newLoan);
    setLoans(prev => [...prev, newLoan]);

    if (isOnline) {
      try {
        await fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLoan),
        });
      } catch {
        // Queued
      }
    }
  };

  const handleDeleteLoan = async (id: string) => {
    offlineStorage.deleteLoan(id);
    setLoans(prev => prev.filter(l => l.id !== id));

    if (isOnline) {
      try {
        await fetch(`/api/loans/${id}`, { method: 'DELETE' });
      } catch {
        // Queued
      }
    }
  };

  // Advisory Chat handler
  const handleSendAdvisory = async (query: string) => {
    const userMsg: AdvisoryMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...advisoryMessages, userMsg];
    setAdvisoryMessages(newMessages);
    offlineStorage.saveAdvisoryMessages(currentEnterprise.id, newMessages);

    setIsAdvisoryLoading(true);

    try {
      let adviceData = null;

      if (isOnline) {
        const res = await fetch('/api/advisory/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            enterpriseId: currentEnterprise.id,
            language: selectedLanguage,
          }),
        });

        if (res.ok) {
          adviceData = await res.json();
        }
      }

      if (!adviceData) {
        // Offline rule engine fallback advice
        const isHi = selectedLanguage === 'hi';
        const trade = currentEnterprise.tradeType;

        let fallbackText = isHi
          ? `[ऑफ़लाइन व्यापार सलाह - ${currentEnterprise.village}]
आपकी ${trade} इकाई के लिए सलाह:
दैनिक खर्च को नियंत्रित रखें और कच्चा माल सीधे थोक मंडी या सहकारी समिति से खरीदें। 
साहूकार के उच्च ब्याज वाले कर्ज़ को स्वयं सहायता समूह (SHG) या बैंक में बदलने का प्रयास करें।`
          : `[Offline Advisory - ${currentEnterprise.village}]
Advice for your ${trade} unit:
Keep daily operating costs strictly recorded. Source inputs directly through village cooperatives or wholesale mandis. Focus on refinancing high-interest moneylender debt into bank or SHG facilities.`;

        let steps = isHi
          ? [
              'दैनिक हिसाब बही-खाता में तुरंत दर्ज करें।',
              'सहकारी समिति से रियायती दर पर कच्चा माल लें।',
              'साहूकार को दिया जाने वाला ब्याज कम करने के लिए बैंक शाखा में संपर्क करें।',
            ]
          : [
              'Log daily cash sales and expenses in your offline Bahi-Khata ledger.',
              'Source inputs via local cooperative societies to bypass retail markups.',
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

  const navTabs = [
    {
      id: 'advisor' as const,
      label: t.tabAdvisor,
      icon: Sparkles,
      tag: 'AI',
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
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
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
          className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto pb-2 border-b border-stone-800 scrollbar-none"
        >
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? 'bg-amber-600 text-stone-950 border-amber-500 shadow-md font-bold'
                    : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-850 hover:text-stone-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-amber-400'}`} />
                <span>{tab.label}</span>

                {tab.tag && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isActive ? 'bg-stone-950 text-amber-300' : 'bg-stone-800 text-amber-400'
                    }`}
                  >
                    {tab.tag}
                  </span>
                )}

                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-stone-950 text-stone-200' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}

                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="High interest loan alert" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Tab Views */}
        <div>
          {activeTab === 'advisor' && (
            <AdvisoryAssistant
              enterprise={currentEnterprise}
              messages={advisoryMessages}
              onSendMessage={handleSendAdvisory}
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
        </div>
      </main>

      {/* Enterprise Location & Profile Modal */}
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
      <footer className="border-t border-stone-800 py-4 text-center text-xs text-stone-400 bg-stone-900/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span>🌾 GramSathi Rural Advisory</span>
            <span>•</span>
            <span className="text-amber-400">Offline-First Engine</span>
            <span>•</span>
            <span>8 Multilingual Voice Dialects</span>
          </div>
          <div className="text-stone-400 text-[11px]">
            Empowering village micro-entrepreneurs, dairy farmers & rural artisans with institutional financial structures
          </div>
        </div>
      </footer>
    </div>
  );
}
