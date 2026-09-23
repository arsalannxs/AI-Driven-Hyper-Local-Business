import React, { useState } from 'react';
import {
  MapPin,
  TrendingUp,
  ShieldAlert,
  Users,
  Target,
  FileText,
  DollarSign,
  Sparkles,
  Printer,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  Store,
  Layers,
  Award,
  ChevronRight,
} from 'lucide-react';
import { FeasibilityReport, LanguageCode, LocationInput } from '../types';
import { voiceService } from '../services/voice';

interface FeasibilityReportModuleProps {
  location: LocationInput;
  onChangeLocation: (loc: LocationInput) => void;
  availableMargin: number;
  onChangeMargin: (margin: number) => void;
  category: string;
  onChangeCategory: (cat: string) => void;
  report: FeasibilityReport | null;
  onGenerateReport: () => void;
  isLoading: boolean;
  language: LanguageCode;
  isOnline: boolean;
}

export const FeasibilityReportModule: React.FC<FeasibilityReportModuleProps> = ({
  location,
  onChangeLocation,
  availableMargin,
  onChangeMargin,
  category,
  onChangeCategory,
  report,
  onGenerateReport,
  isLoading,
  language,
  isOnline,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'market' | 'swot' | 'threats' | 'competitors' | 'pricing'>('all');

  const categories = [
    { id: 'dairy', label: 'Dairy & Cattle Farm', icon: '🥛', desc: 'Milk production, chilling & dairy products' },
    { id: 'retail', label: 'Rural Retail & Kirana', icon: '🛒', desc: 'Grocery, FMCG, farm inputs & daily provisions' },
    { id: 'textiles', label: 'Textiles & Handloom', icon: '🧵', desc: 'Weaving, rural apparel, garments & tailoring' },
    { id: 'foodtech', label: 'Food Processing / Agri', icon: '🌾', desc: 'Flour milling, oil expeller, spices & packaging' },
    { id: 'poultry', label: 'Poultry & Livestock', icon: '🍗', desc: 'Desi broilers, layers, egg grading & feed' },
    { id: 'workshop', label: 'Rural Repair Workshop', icon: '🛠️', desc: 'Tractor, pump set, solar & implement servicing' },
  ];

  const quickMargins = [
    { label: '₹14,000 (Micro)', value: 14000 },
    { label: '₹50,000', value: 50000 },
    { label: '₹1,00,000 (Example)', value: 100000 },
    { label: '₹2,00,000', value: 200000 },
    { label: '₹5,00,000 (Max)', value: 500000 },
  ];

  const calculatedProjectCost = Math.round(availableMargin / 0.1);
  const calculatedLoan = Math.min(
    Math.round(calculatedProjectCost * 0.9),
    calculatedProjectCost <= 140000 ? 125000 : 4500000
  );

  const isMicroFinance = calculatedProjectCost <= 140000;

  const handleReadAloud = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    if (!report) return;

    const readText = language === 'hi'
      ? `व्यावसायिक व्यवहार्यता रिपोर्ट। ग्राम पंचायत ${report.location.village}, ब्लॉक ${report.location.block}। 
10 प्रतिशत मार्जिन पूंजी ₹${report.availableMargin}, कुल परियोजना लागत ₹${report.feasibleProjectCost}। 
बाज़ार पहुंच: ${report.marketReach.consumerBaseEstimate}।
${report.executiveSummary}`
      : `Hyper-Local Business Feasibility Report for ${report.categoryName} in ${report.location.village}, Block ${report.location.block}. 
Feasible Project Cost is ₹${report.feasibleProjectCost} based on your 10% available margin. 
Market Reach: ${report.marketReach.consumerBaseEstimate}. 
${report.executiveSummary}`;

    setIsSpeaking(true);
    voiceService.speak(
      readText,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  return (
    <div className="space-y-6">
      {/* Intro Header Card with MoSJE Context */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/60 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                Module 1 • MoSJE Problem ID 26091
              </span>
              <span className="text-xs text-slate-500 font-medium">
                State Channelizing Agencies (SCAs)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Hyper-Local Business Feasibility Study
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Eliminate anecdotal business decisions. Generate an institutional-grade, data-driven feasibility study covering 
              <strong className="text-slate-800"> market reach (5–10 km)</strong>, <strong className="text-slate-800">SWOT</strong>, 
              <strong className="text-slate-800"> competitor mapping</strong>, <strong className="text-slate-800">threats</strong>, and <strong className="text-slate-800">optimal pricing</strong> before applying for concessional credit.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {report && (
              <>
                <button
                  onClick={handleReadAloud}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isSpeaking
                      ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  title="Listen to feasibility report in chosen language"
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-700" /> : <Volume2 className="w-4 h-4 text-slate-700" />}
                  <span>{isSpeaking ? 'Stop Audio' : 'Voice Readout'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm"
                  title="Print official feasibility report"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Print Report</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Input Form: Geographic Location, Margin Capital, Business Category */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
          <Compass className="w-4 h-4 text-emerald-600" />
          <span>Enter Beneficiary Parameters</span>
        </h3>

        {/* 1. Geographic Location Inputs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            1. Geographic Location (Village / Gram Panchayat, Block, District, State)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block mb-1">Village / Gram Panchayat</span>
              <input
                type="text"
                id="input-village"
                value={location.village}
                onChange={e => onChangeLocation({ ...location, village: e.target.value })}
                placeholder="e.g. Pipariya Khurd"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium block mb-1">Block / Tehsil</span>
              <input
                type="text"
                id="input-block"
                value={location.block}
                onChange={e => onChangeLocation({ ...location, block: e.target.value })}
                placeholder="e.g. Sehore Rural"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium block mb-1">District</span>
              <input
                type="text"
                id="input-district"
                value={location.district}
                onChange={e => onChangeLocation({ ...location, district: e.target.value })}
                placeholder="e.g. Sehore"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium block mb-1">State</span>
              <input
                type="text"
                id="input-state"
                value={location.state}
                onChange={e => onChangeLocation({ ...location, state: e.target.value })}
                placeholder="e.g. Madhya Pradesh"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* 2. Available Margin Capital (10% equity) */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mb-2">
            <label className="text-xs font-bold text-slate-700">
              2. Available Margin Capital (Beneficiary's 10% Contribution)
            </label>
            <span className="text-xs text-slate-500">
              As per MoSJE guideline: Project Cost = Margin / 10%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold">₹</span>
              <input
                type="number"
                id="input-margin-capital"
                value={availableMargin}
                onChange={e => onChangeMargin(Math.max(0, Number(e.target.value)))}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-lg font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                placeholder="100000"
              />
            </div>

            {/* Quick selection chips */}
            <div className="md:col-span-7 flex flex-wrap gap-2">
              {quickMargins.map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChangeMargin(item.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    availableMargin === item.value
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Calculation Preview pill */}
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600">Total Feasible Project Cost:</span>
              <span className="font-bold font-mono text-slate-900 text-sm">
                ₹{calculatedProjectCost.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600">90% Concessional Loan Eligible:</span>
              <span className="font-bold font-mono text-emerald-700 text-sm">
                ₹{calculatedLoan.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                isMicroFinance
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}>
                {isMicroFinance ? 'Micro Finance (6.5% • 3 Yrs)' : 'Term Loan (8.0% • 7 Yrs)'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Proposed Business Category Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            3. Proposed Business Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {categories.map(cat => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  id={`cat-select-${cat.id}`}
                  onClick={() => onChangeCategory(cat.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-2xl mb-1.5">{cat.icon}</span>
                  <div>
                    <div className="font-bold text-xs text-slate-900 leading-tight">
                      {cat.label}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {cat.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI evaluates real demographic radius, consumer density, local threats & pricing</span>
          </div>

          <button
            type="button"
            id="generate-feasibility-btn"
            onClick={onGenerateReport}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Localized Feasibility Report...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Generate Feasibility Study</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Report Display */}
      {report && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Overview Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                  Verified Local Study • {report.generatedDate}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold mt-2 font-serif">
                  Feasibility Study: {report.categoryName} Enterprise
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                  Location: {report.location.village} (Block: {report.location.block}, Dist: {report.location.district}, {report.location.state})
                </p>
              </div>

              {/* Financial Snapshot */}
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
                <div className="text-right">
                  <span className="text-[10px] uppercase text-emerald-200 block">Project Cost</span>
                  <span className="text-lg font-bold font-mono">
                    ₹{report.feasibleProjectCost.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-left">
                  <span className="text-[10px] uppercase text-emerald-200 block">Concessional Loan</span>
                  <span className="text-lg font-bold font-mono text-emerald-300">
                    ₹{report.maxLoanAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mt-4 pt-4 border-t border-white/15 text-xs sm:text-sm text-emerald-50 leading-relaxed font-sans">
              <strong>Executive Summary:</strong> {report.executiveSummary}
            </div>
          </div>

          {/* Module 1: The 6 Analytical Sections Requested in Problem Statement 26091 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Market Reach (5-10 km radius) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-emerald-700 mb-2">
                  <Compass className="w-5 h-5" />
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-800">
                    1. Market Reach (5–10 km Radius)
                  </h4>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-3">
                  <span className="text-xs text-slate-500 font-medium block">Immediate Consumer Base:</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {report.marketReach.consumerBaseEstimate}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {report.marketReach.populationDemographics}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-700 mb-1.5">
                  Primary Distribution Channels:
                </div>
                <ul className="space-y-1.5">
                  {report.marketReach.primaryChannels.map((channel, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{channel}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Covers rural haats, village aggregations, and nearby town retail linkages.
              </div>
            </div>

            {/* 2. Opportunity Analysis */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-amber-700 mb-2">
                  <Target className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-800">
                    2. Opportunity Analysis
                  </h4>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 mb-3">
                  <span className="text-xs text-amber-800 font-bold block">Value-Addition Potential:</span>
                  <div className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {report.opportunityAnalysis.valueAdditionPotential}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-700 mb-1.5">
                  Unserved / Underserved Niches in this Block:
                </div>
                <ul className="space-y-1.5 mb-3">
                  {report.opportunityAnalysis.underservedNiches.map((niche, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="font-bold text-amber-600">✦</span>
                      <span>{niche}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-xs font-bold text-slate-700 mb-1.5">
                  High-Margin Segments:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.opportunityAnalysis.highMarginSegments.map((seg, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100/70 text-amber-900 border border-amber-200">
                      {seg}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Targeted at capturing local value before raw goods exit the block.
              </div>
            </div>

            {/* 3. General Business Analysis (SWOT) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm md:col-span-2">
              <div className="flex items-center space-x-2 text-slate-800 mb-3">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-sm uppercase tracking-wider text-slate-800">
                  3. General Business Analysis (SWOT) • Tailored to ₹{report.feasibleProjectCost.toLocaleString('en-IN')} Budget
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Strengths */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center space-x-1">
                    <span>💪 Strengths (ताकत)</span>
                  </div>
                  <ul className="space-y-1.5">
                    {report.swot.strengths.map((s, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start space-x-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                  <div className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center space-x-1">
                    <span>⚠️ Weaknesses (कमियां)</span>
                  </div>
                  <ul className="space-y-1.5">
                    {report.swot.weaknesses.map((w, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start space-x-1.5">
                        <span className="text-rose-600 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Opportunities */}
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                  <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center space-x-1">
                    <span>🚀 Opportunities (अवसर)</span>
                  </div>
                  <ul className="space-y-1.5">
                    {report.swot.opportunities.map((o, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start space-x-1.5">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Threats */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center space-x-1">
                    <span>🛡️ Threats (जोखिम)</span>
                  </div>
                  <ul className="space-y-1.5">
                    {report.swot.threats.map((t, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start space-x-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. Threats Identification & Mitigation */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-rose-700 mb-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-800">
                    4. Threats Identification & Local Risks
                  </h4>
                </div>

                {/* Single Buyer Dependency */}
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 mb-3 text-xs">
                  <span className="font-bold text-rose-900 block">Single Buyer / Middleman Risk:</span>
                  <div className="text-slate-700 mt-1">{report.threatsIdentification.singleBuyerDependency}</div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="text-xs font-bold text-slate-700">Supply Chain Bottlenecks:</div>
                  <ul className="space-y-1">
                    {report.threatsIdentification.supplyChainBottlenecks.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">Actionable Risk Mitigation Strategies:</div>
                  <ul className="space-y-1">
                    {report.threatsIdentification.mitigationStrategies.map((mit, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start space-x-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{mit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Proactive risk mitigation secures the required debt servicing cushion.
              </div>
            </div>

            {/* 5. Competitor Mapping & 6. Product Market Value */}
            <div className="space-y-6">
              {/* Competitor Mapping */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-indigo-700 mb-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-800">
                    5. Competitor Mapping in Block
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium block">Estimated Density</span>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {report.competitorMapping.estimatedCompetitorDensity}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium block">Approx Units in 5km</span>
                    <div className="text-lg font-bold font-mono text-indigo-600 mt-0.5">
                      ~{report.competitorMapping.competitorsCountEstimate} Competitors
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs text-slate-700">
                  <span className="font-bold text-indigo-900 block mb-0.5">Competitive Advantage Strategy:</span>
                  {report.competitorMapping.competitiveAdvantageAdvice}
                </div>
              </div>

              {/* Product Market Value & Pricing */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-emerald-700 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-800">
                    6. Product Market Value & Pricing
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                    <span className="text-emerald-800 font-semibold block">Benchmark Price:</span>
                    <div className="font-bold font-mono text-emerald-900 text-sm mt-0.5">
                      {report.productMarketValue.benchmarkSellingPrice}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium block">Break-Even Timeline:</span>
                    <div className="font-bold text-slate-900 text-xs mt-0.5">
                      {report.productMarketValue.breakEvenTimeline}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div>
                    <span className="font-bold text-slate-800">Optimal Pricing Strategy: </span>
                    <span className="text-slate-700">{report.productMarketValue.optimalPricingStrategy}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Regional Purchasing Power: </span>
                    <span className="text-slate-700">{report.productMarketValue.regionalPurchasingPowerEstimate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
