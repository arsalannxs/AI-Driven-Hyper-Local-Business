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
  const [isEditing, setIsEditing] = useState(false);

  const trades: TradeType[] = [
    'dairy',
    'farming',
    'kirana',
    'handloom',
    'poultry',
    'workshop',
  ];

  const tradeIcons: Record<TradeType, string> = {
    dairy: '🥛',
    farming: '🌾',
    kirana: '🛒',
    handloom: '🧵',
    poultry: '🍗',
    workshop: '🛠️',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEnterprise(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-920">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Rural Enterprise Profile & Location
              </h2>
              <p className="text-xs text-stone-400">
                Hyper-local context for tailored business & financial advisory
              </p>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Profiles Selector */}
        <div className="px-6 py-3 bg-stone-850/60 border-b border-stone-800 flex items-center justify-between">
          <div className="text-xs text-stone-400">Switch profile:</div>
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            {allEnterprises.map(ent => (
              <button
                key={ent.id}
                id={`switch-ent-btn-${ent.id}`}
                onClick={() => {
                  onSelectEnterprise(ent);
                  setFormData({ ...ent });
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                  ent.id === enterprise.id
                    ? 'bg-amber-600 text-stone-950 border-amber-500 font-bold'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
                }`}
              >
                <span>{tradeIcons[ent.tradeType]}</span>
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
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Enterprise / Shop Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  id="ent-name-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Kisan Dairy Farm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Owner / Entrepreneur Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  id="ent-owner-input"
                  value={formData.ownerName}
                  onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Rameshwar Yadav"
                />
              </div>
            </div>
          </div>

          {/* Trade Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Select Rural Micro Trade / Sector
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {trades.map(trade => {
                const label = TRADE_LABELS[language]?.[trade] || TRADE_LABELS.en[trade];
                const isSelected = formData.tradeType === trade;
                return (
                  <button
                    key={trade}
                    type="button"
                    id={`trade-select-${trade}`}
                    onClick={() => setFormData({ ...formData, tradeType: trade })}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                        : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-750'
                    }`}
                  >
                    <span className="text-xl mb-1">{tradeIcons[trade]}</span>
                    <span className="text-xs font-semibold line-clamp-2 leading-tight">
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
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Village (ग्राम)
              </label>
              <input
                type="text"
                required
                id="ent-village-input"
                value={formData.village}
                onChange={e => setFormData({ ...formData, village: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="Village name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                District (ज़िला)
              </label>
              <input
                type="text"
                required
                id="ent-district-input"
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="District name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                State (राज्य)
              </label>
              <input
                type="text"
                required
                id="ent-state-input"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="State name"
              />
            </div>
          </div>

          {/* Monthly Financial Estimates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Estimated Monthly Sales / Inflow (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 text-sm">₹</span>
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
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  placeholder="40000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Estimated Monthly Costs / Outflow (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 text-sm">₹</span>
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
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  placeholder="24000"
                />
              </div>
            </div>
          </div>

          {/* Net Margin indicator */}
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/30 flex items-center justify-between text-xs">
            <span className="text-amber-200">
              Estimated Monthly Operating Surplus:
            </span>
            <span className="font-bold text-sm text-amber-400">
              ₹
              {Math.max(
                0,
                formData.monthlyRevenueEstimate - formData.monthlyExpenseEstimate
              ).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stone-700 text-xs font-medium text-stone-300 hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-enterprise-profile-btn"
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition-colors shadow-md flex items-center space-x-1.5"
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
