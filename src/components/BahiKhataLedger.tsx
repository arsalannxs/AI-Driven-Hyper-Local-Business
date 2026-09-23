import React, { useState } from 'react';
import {
  Plus,
  Mic,
  MicOff,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Trash2,
  DollarSign,
  AlertCircle,
  Volume2,
  Sparkles,
  Calendar,
  X,
  CreditCard,
} from 'lucide-react';
import { LedgerEntry, LanguageCode } from '../types';
import { UI_TEXT } from '../services/i18n';
import { voiceService } from '../services/voice';

interface BahiKhataLedgerProps {
  entries: LedgerEntry[];
  onAddEntry: (entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'syncStatus'>) => void;
  onDeleteEntry: (id: string) => void;
  onMarkCreditSettled: (id: string) => void;
  language: LanguageCode;
  isOnline: boolean;
}

export const BahiKhataLedger: React.FC<BahiKhataLedgerProps> = ({
  entries,
  onAddEntry,
  onDeleteEntry,
  onMarkCreditSettled,
  language,
  isOnline,
}) => {
  const t = UI_TEXT[language] || UI_TEXT.en;

  const [modalOpen, setModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState('');

  const [formData, setFormData] = useState({
    type: 'cash_in' as 'cash_in' | 'cash_out' | 'credit_given',
    category: 'Daily Sales',
    amount: '',
    description: '',
    partyName: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Calculate metrics
  const totalInflow = entries
    .filter(e => e.type === 'cash_in')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = entries
    .filter(e => e.type === 'cash_out')
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingCustomerCredit = entries
    .filter(e => e.type === 'credit_given' && e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  const netMargin = totalInflow - totalExpense;

  // Voice transaction parsing
  const startVoiceInput = () => {
    setIsListening(true);
    setVoiceFeedback(language === 'hi' ? 'सुन रहा हूँ... कृपया लेन-देन बोलें' : 'Listening... Please speak your transaction');

    voiceService.startListening(
      language,
      (transcript, isFinal) => {
        setVoiceTranscript(transcript);
        if (isFinal) {
          setIsListening(false);
          parseSpokenTransaction(transcript);
        }
      },
      error => {
        setIsListening(false);
        setVoiceFeedback(error);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const stopVoiceInput = () => {
    voiceService.stopListening();
    setIsListening(false);
  };

  const parseSpokenTransaction = async (text: string) => {
    setVoiceFeedback(language === 'hi' ? 'विवरण पहचाना जा रहा है...' : 'Processing transaction details...');
    try {
      if (isOnline) {
        const res = await fetch('/api/advisory/voice-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: text }),
        });
        if (res.ok) {
          const parsed = await res.json();
          setFormData(prev => ({
            ...prev,
            type: parsed.type || prev.type,
            amount: parsed.amount ? String(parsed.amount) : prev.amount,
            category: parsed.category || prev.category,
            partyName: parsed.partyName || prev.partyName,
            description: parsed.description || text,
          }));
          setVoiceFeedback(language === 'hi' ? 'पहचाना गया: राशि एवं विवरण भर दिया गया है।' : 'Extracted: Amount & details filled.');
          return;
        }
      }
      fallbackLocalRegexParse(text);
    } catch {
      fallbackLocalRegexParse(text);
    }
  };

  const fallbackLocalRegexParse = (text: string) => {
    const amountMatch = text.match(/(\d+[\d,]*)/);
    const amount = amountMatch ? amountMatch[1].replace(/,/g, '') : '';

    let type: 'cash_in' | 'cash_out' | 'credit_given' = 'cash_in';
    const lower = text.toLowerCase();
    if (lower.includes('खर्च') || lower.includes('खरीदा') || lower.includes('diya') || lower.includes('expense') || lower.includes('paid')) {
      type = 'cash_out';
    } else if (lower.includes('उधार') || lower.includes('udhaar') || lower.includes('credit')) {
      type = 'credit_given';
    }

    setFormData(prev => ({
      ...prev,
      amount: amount || prev.amount,
      type,
      description: text,
    }));
    setVoiceFeedback(language === 'hi' ? 'स्थानीय विश्लेषण द्वारा विवरण भरा गया।' : 'Filled via offline voice matcher.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return;

    onAddEntry({
      enterpriseId: 'ent_default_01',
      date: formData.date,
      type: formData.type,
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description || `${formData.category} entry`,
      partyName: formData.partyName,
      status: formData.type === 'credit_given' ? 'pending' : 'completed',
    });

    setFormData({
      type: 'cash_in',
      category: 'Daily Sales',
      amount: '',
      description: '',
      partyName: '',
      date: new Date().toISOString().split('T')[0],
    });

    setModalOpen(false);
    setVoiceTranscript('');
    setVoiceFeedback('');
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash In */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              {t.totalInflow}
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
              ₹{totalInflow.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500">Recorded cash sales</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Cash Out */}
        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
              {t.totalExpense}
            </span>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
              ₹{totalExpense.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500">Raw materials & expenses</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Net Margin */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              {t.netDailyMargin}
            </span>
            <div className={`text-2xl font-bold font-mono mt-1 ${netMargin >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
              ₹{netMargin.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500">Inflow minus outflow</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-indigo-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Customer Udhaar (Credit) */}
        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
              {t.pendingCredit}
            </span>
            <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
              ₹{pendingCustomerCredit.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500">Uncollected customer credit</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Bar & Transaction Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              {t.bahiKhataTitle}
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {entries.length} entries
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              id="open-ledger-modal-btn"
              onClick={() => setModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addTransaction}</span>
            </button>
          </div>
        </div>

        {/* Entries Table */}
        {entries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <p className="text-xs sm:text-sm">No transactions recorded yet in your digital ledger.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition-colors"
            >
              Record First Entry by Voice or Text
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category & Party</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map(entry => {
                  const isCashIn = entry.type === 'cash_in';
                  const isExpense = entry.type === 'cash_out';
                  const isCredit = entry.type === 'credit_given';

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {entry.date}
                      </td>

                      <td className="py-3 px-4">
                        {isCashIn && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>{t.cashIn}</span>
                          </span>
                        )}
                        {isExpense && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>{t.cashOut}</span>
                          </span>
                        )}
                        {isCredit && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>{t.creditGiven}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{entry.category}</div>
                        {entry.partyName && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            Party: {entry.partyName}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {entry.description}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            isCashIn
                              ? 'text-emerald-700'
                              : isExpense
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          }
                        >
                          {isCashIn ? '+' : isExpense ? '-' : ''}₹
                          {entry.amount.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {entry.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Settled
                          </span>
                        ) : (
                          <button
                            id={`settle-credit-btn-${entry.id}`}
                            onClick={() => onMarkCreditSettled(entry.id)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-emerald-100 hover:text-emerald-900 hover:border-emerald-300 transition-colors"
                            title="Click to mark customer credit as collected"
                          >
                            Pending (Mark Received)
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          id={`delete-entry-btn-${entry.id}`}
                          onClick={() => onDeleteEntry(entry.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete entry"
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

      {/* Add Transaction Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  {t.addTransaction}
                </h3>
              </div>
              <button
                id="close-add-tx-modal-btn"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Voice Input Section in Modal */}
            <div className="p-5 border-b border-slate-100 bg-emerald-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Voice Auto-Fill (बोलकर दर्ज करें)</span>
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">Multi-lingual AI</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="modal-voice-record-btn"
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                  className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/20'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                  title="Click to speak transaction"
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <div className="flex-1 text-xs">
                  <div className="font-medium text-slate-800">
                    {voiceTranscript || (language === 'hi' ? 'उदा: "रमेश को 500 रुपये का दूध उधार दिया" या "2000 रुपये का गेहूं बिका"' : 'e.g., "Sold 2000 rupees of milk" or "Bought cattle feed 800"')}
                  </div>
                  {voiceFeedback && (
                    <div className="text-[11px] text-emerald-700 mt-0.5 font-semibold">
                      {voiceFeedback}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Transaction Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'cash_in' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      formData.type === 'cash_in'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    + {t.cashIn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'cash_out' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      formData.type === 'cash_out'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    - {t.cashOut}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'credit_given' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      formData.type === 'credit_given'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⏱ {t.creditGiven}
                  </button>
                </div>
              </div>

              {/* Amount and Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      id="tx-amount-input"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="1500"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    id="tx-category-input"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Daily Milk Sales"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Party Name & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer / Trader Name
                  </label>
                  <input
                    type="text"
                    id="tx-party-input"
                    value={formData.partyName}
                    onChange={e => setFormData({ ...formData, partyName: e.target.value })}
                    placeholder="Optional (e.g. Ramesh)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="tx-date-input"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Description
                </label>
                <input
                  type="text"
                  id="tx-desc-input"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 30L evening milk delivery"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-transaction-btn"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
