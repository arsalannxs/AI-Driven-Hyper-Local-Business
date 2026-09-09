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
    setVoiceFeedback('Listening... Please speak your transaction');

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
    setVoiceFeedback('Processing transaction details...');
    try {
      let parsed = null;
      if (isOnline) {
        const res = await fetch('/api/advisory/voice-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: text }),
        });
        if (res.ok) {
          parsed = await res.json();
        }
      }

      if (!parsed) {
        // Local offline parser
        const lower = text.toLowerCase();
        const amtMatch = text.match(/\d+/);
        const amount = amtMatch ? amtMatch[0] : '200';
        let type: 'cash_in' | 'cash_out' | 'credit_given' = 'cash_in';
        if (
          lower.includes('spent') ||
          lower.includes('bought') ||
          lower.includes('paid') ||
          lower.includes('खर्च') ||
          lower.includes('खरीदा') ||
          lower.includes('लागत')
        ) {
          type = 'cash_out';
        } else if (
          lower.includes('credit') ||
          lower.includes('udhaar') ||
          lower.includes('उधार') ||
          lower.includes('बाकी')
        ) {
          type = 'credit_given';
        }

        parsed = {
          type,
          amount: Number(amount),
          category: type === 'cash_in' ? 'Voice Recorded Sale' : 'Voice Recorded Expense',
          description: text,
        };
      }

      setFormData(prev => ({
        ...prev,
        type: parsed.type,
        amount: String(parsed.amount),
        category: parsed.category || prev.category,
        description: parsed.description || text,
        partyName: parsed.partyName || prev.partyName,
      }));

      setModalOpen(true);
      setVoiceFeedback(`Parsed ₹${parsed.amount} for ${parsed.type}`);
    } catch {
      setVoiceFeedback('Could not auto-parse. Please enter manually.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return;

    onAddEntry({
      enterpriseId: 'current',
      date: formData.date,
      type: formData.type,
      category: formData.category || 'General',
      amount: Number(formData.amount),
      description: formData.description || 'Quick transaction entry',
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
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider block">
              {t.totalInflow}
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              ₹{totalInflow.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-stone-400">Recorded cash sales</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Cash Out */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-rose-400 uppercase tracking-wider block">
              {t.totalExpense}
            </span>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
              ₹{totalExpense.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-stone-400">Raw materials & expenses</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Net Margin */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-amber-600/30 text-stone-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider block">
              {t.netDailyMargin}
            </span>
            <div className={`text-2xl font-bold font-mono mt-1 ${netMargin >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              ₹{netMargin.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-stone-400">Inflow minus outflow</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Customer Udhaar (Credit) */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-amber-300 uppercase tracking-wider block">
              {t.pendingCredit}
            </span>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
              ₹{pendingCustomerCredit.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-stone-400">Customer udhaar to collect</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-950/40 border border-amber-700/40 text-amber-300 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Voice Assistant & Quick Actions Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              id="voice-bahi-khata-mic-btn"
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              className={`p-3.5 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/40'
                  : 'bg-amber-600 text-stone-950 hover:bg-amber-500'
              }`}
              title="Speak to add transaction"
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <div>
              <div className="text-sm font-bold flex items-center space-x-2">
                <span>{t.voiceAddTxn}</span>
                {isListening && (
                  <span className="text-xs font-medium text-rose-400 animate-pulse">
                    ● Recording Voice...
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">{t.exampleVoiceTxn}</p>
            </div>
          </div>

          <button
            id="manual-add-txn-btn"
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{t.addTransaction}</span>
          </button>
        </div>

        {/* Live Voice Transcript Banner */}
        {voiceTranscript && (
          <div className="mt-3 p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs flex items-center justify-between">
            <span className="text-stone-300 italic truncate max-w-lg">
              "{voiceTranscript}"
            </span>
            <span className="text-amber-400 font-semibold text-[11px] ml-2 shrink-0">
              {voiceFeedback || 'Voice Recognized'}
            </span>
          </div>
        )}
      </div>

      {/* Ledger Table / List */}
      <div className="rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-md overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-stone-200">
              Recent Transactions ({entries.length})
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            Offline entries sync automatically
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="p-10 text-center text-stone-400 text-sm">
            No entries recorded yet. Tap the microphone or click "+ Log Transaction" to record your daily cash flow.
          </div>
        ) : (
          <div className="divide-y divide-stone-800/80 overflow-x-auto">
            {entries.map(entry => {
              const isIncome = entry.type === 'cash_in';
              const isExpense = entry.type === 'cash_out';
              const isCredit = entry.type === 'credit_given';

              return (
                <div
                  key={entry.id}
                  className="p-4 hover:bg-stone-850/50 transition-colors flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  {/* Left: Type icon & Details */}
                  <div className="flex items-start space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : isExpense
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isExpense ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-stone-200 truncate">
                          {entry.category}
                        </span>
                        {entry.partyName && (
                          <span className="text-stone-400 text-xs px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 truncate max-w-[140px]">
                            {entry.partyName}
                          </span>
                        )}
                        {entry.syncStatus === 'local' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            Offline
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5 truncate max-w-md">
                        {entry.description}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {entry.date}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount and Actions */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`font-mono font-bold text-sm sm:text-base ${
                          isIncome
                            ? 'text-emerald-400'
                            : isExpense
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {isIncome ? '+' : isExpense ? '-' : ''}₹
                        {entry.amount.toLocaleString('en-IN')}
                      </div>
                      {isCredit && (
                        <div className="text-[11px]">
                          {entry.status === 'pending' ? (
                            <span className="text-amber-400 font-medium">
                              Pending Udhaar
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-medium">
                              Recovered
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {isCredit && entry.status === 'pending' && (
                      <button
                        id={`mark-settled-btn-${entry.id}`}
                        onClick={() => onMarkCreditSettled(entry.id)}
                        className="px-2.5 py-1 rounded-md bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-medium transition-colors"
                        title="Mark Udhaar collected / settled"
                      >
                        Paid
                      </button>
                    )}

                    <button
                      id={`delete-ledger-entry-${entry.id}`}
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-100">
                Log New Ledger Entry
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="entry-type-cash-in"
                  onClick={() => setFormData({ ...formData, type: 'cash_in' })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    formData.type === 'cash_in'
                      ? 'bg-emerald-600 text-stone-950 border-emerald-500'
                      : 'bg-stone-800 border-stone-700 text-stone-300'
                  }`}
                >
                  + Cash In
                </button>
                <button
                  type="button"
                  id="entry-type-cash-out"
                  onClick={() => setFormData({ ...formData, type: 'cash_out' })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    formData.type === 'cash_out'
                      ? 'bg-rose-600 text-stone-950 border-rose-500'
                      : 'bg-stone-800 border-stone-700 text-stone-300'
                  }`}
                >
                  - Cash Out
                </button>
                <button
                  type="button"
                  id="entry-type-credit-given"
                  onClick={() => setFormData({ ...formData, type: 'credit_given' })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    formData.type === 'credit_given'
                      ? 'bg-amber-600 text-stone-950 border-amber-500'
                      : 'bg-stone-800 border-stone-700 text-stone-300'
                  }`}
                >
                  Udhaar (Credit)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 text-base">₹</span>
                  <input
                    type="number"
                    required
                    id="ledger-amount-input"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-lg font-mono font-bold text-stone-100 focus:outline-none focus:border-amber-500"
                    placeholder="500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Category & Party Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    id="ledger-category-input"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Milk Sale, Feed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Customer / Party
                  </label>
                  <input
                    type="text"
                    id="ledger-party-input"
                    value={formData.partyName}
                    onChange={e => setFormData({ ...formData, partyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    placeholder="Optional Name"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Description / Note
                </label>
                <textarea
                  id="ledger-desc-input"
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  placeholder="Details of the sale or expense..."
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-700 text-xs text-stone-300 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-ledger-entry-btn"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
