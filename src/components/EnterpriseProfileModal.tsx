import React, { useState } from 'react';
import { X, Store, MapPin, DollarSign, Check, User, Sparkles } from 'lucide-react';
import { Enterprise, LanguageCode, TradeType } from '../types';
import { TRADE_LABELS } from '../services/i18n';

interface EnterpriseProfileModalProps {
  enterprise: Enterprise;
  allEnterprises: Enterprise[];
  onSelectEnterprise: (ent: Enterprise) => void;
  onSaveEnterprise: (ent: Enterprise) => void;
  onClose: () => void;
  language: LanguageCode;
}

export const EnterpriseProfileModal: React.FC<EnterpriseProfileModalProps> = ({
  enterprise,
  allEnterprises,
  onSelectEnterprise,
  onSaveEnterprise,
  onClose,
  language,
}) => {
  const [formData, setFormData] = useState<Enterprise>({ ...enterprise });

  const trades: TradeType[] = [
    'dairy',
    'retail',
    'textiles',
    'foodtech',
    'farming',
    'kirana',
    'handloom',
    'poultry',
    'workshop',
  ];

  const tradeIcons: Record<string, string> = {
    dairy: '🥛',
    retail: '🛒',
    textiles: '🧵',
    foodtech: '🌾',
    farming: '🌱',
    kirana: '🏪',
    handloom: '🎨',
    poultry: '🍗',
    workshop: '🛠️',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEnterprise(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Store className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Rural Enterprise & Location Profile
              </h2>
              <p className="text-xs text-slate-500">
                Hyper-local context for MoSJE concessional credit & feasibility analysis
              </p>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Profiles Selector */}
        <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Switch Profile:</span>
          <div className="flex items-center space-x-2 py-0.5">
            {allEnterprises.map(ent => (
              <button
                key={ent.id}
                id={`switch-ent-btn-${ent.id}`}
                onClick={() => {
                  onSelectEnterprise(ent);
                  setFormData({ ...ent });
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                  ent.id === enterprise.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{tradeIcons[ent.tradeType] || '🌾'}</span>
                <span>{ent.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Business Name & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enterprise / Unit Name
              </label>
              <input
                type="text"
                required
                id="ent-name-input"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                placeholder="e.g. Kisan Dairy Farm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Owner / Entrepreneur Name
              </label>
              <input
                type="text"
                required
                id="ent-owner-input"
                value={formData.ownerName}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                placeholder="e.g. Rameshwar Yadav"
              />
            </div>
          </div>

          {/* Trade Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Sector / Trade
            </label>
            <div className="grid grid-cols-3 gap-2">
              {trades.map(trade => {
                const label = TRADE_LABELS[language]?.[trade] || TRADE_LABELS.en[trade] || trade.toUpperCase();
                const isSelected = formData.tradeType === trade;
                return (
                  <button
                    key={trade}
                    type="button"
                    id={`trade-select-${trade}`}
                    onClick={() => setFormData({ ...formData, tradeType: trade })}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-900 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl mb-1">{tradeIcons[trade] || '🌾'}</span>
                    <span className="text-xs font-bold line-clamp-1 leading-tight capitalize">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location: Village, District, State */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Village / Gram Panchayat
              </label>
              <input
                type="text"
                required
                id="ent-village-input"
                value={formData.village}
                onChange={e => setFormData({ ...formData, village: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                placeholder="Village name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                District (ज़िला)
              </label>
              <input
                type="text"
                required
                id="ent-district-input"
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                placeholder="District name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State (राज्य)
              </label>
              <input
                type="text"
                required
                id="ent-state-input"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                placeholder="State name"
              />
            </div>
          </div>

          {/* Monthly Financial Estimates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estimated Monthly Sales / Inflow (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
                <input
                  type="number"
                  required
                  id="ent-revenue-input"
                  value={formData.monthlyRevenueEstimate}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      monthlyRevenueEstimate: Number(e.target.value),
                    })
                  }
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  placeholder="40000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estimated Monthly Costs / Outflow (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
                <input
                  type="number"
                  required
                  id="ent-expense-input"
                  value={formData.monthlyExpenseEstimate}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      monthlyExpenseEstimate: Number(e.target.value),
                    })
                  }
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  placeholder="24000"
                />
              </div>
            </div>
          </div>

          {/* Net Margin indicator */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <span className="text-emerald-800 font-semibold">
              Estimated Monthly Operational Surplus:
            </span>
            <span className="font-bold text-sm text-emerald-900 font-mono">
              ₹
              {Math.max(
                0,
                formData.monthlyRevenueEstimate - formData.monthlyExpenseEstimate
              ).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-enterprise-profile-btn"
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Update Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
