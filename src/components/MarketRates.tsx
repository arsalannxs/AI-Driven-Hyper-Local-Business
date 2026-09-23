import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  MapPin,
  Calendar,
  Filter,
  Info,
  Layers,
} from 'lucide-react';
import { MarketRate, LanguageCode } from '../types';

interface MarketRatesProps {
  rates: MarketRate[];
  language: LanguageCode;
}

export const MarketRates: React.FC<MarketRatesProps> = ({ rates, language }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Commodities' },
    { id: 'dairy', label: 'Dairy & Milk' },
    { id: 'crop', label: 'Crops & Grains' },
    { id: 'input', label: 'Feeds & Inputs' },
  ];

  const filteredRates =
    selectedCategory === 'all'
      ? rates
      : rates.filter(r => r.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span className="text-xl">🌾</span>
              <span>Hyper-Local Mandi & Wholesale Rates</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Compare regional wholesale rates vs retail spreads in nearby mandis to negotiate higher prices and reduce input costs.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                id={`filter-mandi-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Commodities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRates.map(rate => {
          const spread = rate.retailRate - rate.wholesaleRate;
          const spreadPercent = Math.round((spread / rate.wholesaleRate) * 100);

          return (
            <div
              key={rate.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-600">
                      {rate.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5 group-hover:text-emerald-800 transition-colors">
                      {rate.item}
                    </h3>
                  </div>

                  {/* Trend pill */}
                  <div
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      rate.trend === 'up'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rate.trend === 'down'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {rate.trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                    {rate.trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                    {rate.trend === 'stable' && <Minus className="w-3.5 h-3.5" />}
                    <span>{rate.weeklyChangePercent > 0 ? `+${rate.weeklyChangePercent}%` : `${rate.weeklyChangePercent}%`}</span>
                  </div>
                </div>

                {/* Mandi location */}
                <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{rate.regionalMandi}</span>
                </div>

                {/* Rates comparison */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Wholesale / Mandi
                    </span>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      ₹{rate.wholesaleRate}
                      <span className="text-xs font-normal text-slate-500">/{rate.unit}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Local Retail Rate
                    </span>
                    <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                      ₹{rate.retailRate}
                      <span className="text-xs font-normal text-slate-500">/{rate.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Spread */}
                <div className="mt-2 flex items-center justify-between text-xs text-slate-600 px-1">
                  <span>Retail Markup Spread:</span>
                  <span className="font-bold text-emerald-800">
                    +₹{spread}/{rate.unit} ({spreadPercent}%)
                  </span>
                </div>

                {/* Advisory Tip */}
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-700">
                  <div className="flex items-center space-x-1 text-emerald-800 font-bold mb-0.5">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Advisory Strategy:</span>
                  </div>
                  {rate.advisoryTip}
                </div>
              </div>

              {/* Updated date */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Direct Mandi Feed</span>
                <span>Updated: {rate.updatedDate}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
