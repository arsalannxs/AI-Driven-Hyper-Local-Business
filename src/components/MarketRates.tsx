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
      <div className="p-5 sm:p-6 rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center space-x-2">
              <span>🌾</span>
              <span>Hyper-Local Mandi & Wholesale Intelligence</span>
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Compare regional wholesale rates vs retail spreads. Maximize margins and avoid middleman discounts.
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
                    ? 'bg-amber-600 text-stone-950 border-amber-500 font-bold'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
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
          const isUp = rate.trend === 'up';
          const isDown = rate.trend === 'down';

          return (
            <div
              key={rate.id}
              className="p-5 rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-md hover:border-amber-600/40 transition-colors flex flex-col justify-between"
            >
              <div>
                {/* Header: Item & Mandi */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-800 text-amber-400 border border-stone-700">
                      {rate.category.toUpperCase()}
                    </span>
                    <h3 className="text-sm font-bold text-stone-100 mt-1.5">
                      {rate.item}
                    </h3>
                  </div>

                  {/* Trend Badge */}
                  <div
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isUp
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : isDown
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-stone-800 text-stone-300 border border-stone-700'
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : isDown ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                    <span>{rate.weeklyChangePercent > 0 ? `+${rate.weeklyChangePercent}%` : `${rate.weeklyChangePercent}%`}</span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-400 flex items-center space-x-1 mt-1">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span>{rate.regionalMandi}</span>
                </div>

                {/* Price Display */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-stone-950 border border-stone-850">
                  <div>
                    <span className="text-[10px] text-stone-400 block">
                      Wholesale / Mandi
                    </span>
                    <div className="text-base font-bold font-mono text-amber-400">
                      ₹{rate.wholesaleRate.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-stone-500">
                      per {rate.unit}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 block">
                      Consumer Retail
                    </span>
                    <div className="text-base font-bold font-mono text-stone-200">
                      ₹{rate.retailRate.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-stone-500">
                      per {rate.unit}
                    </span>
                  </div>
                </div>

                {/* Hyper-Local Advisory Tip */}
                <div className="mt-3 p-2.5 rounded-xl bg-amber-950/20 border border-amber-600/20 text-xs text-amber-200/90 leading-relaxed flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{rate.advisoryTip}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-850 flex items-center justify-between text-[11px] text-stone-500">
                <span>Status: {rate.updatedDate}</span>
                <span className="text-amber-400 font-medium">Verified Mandi Rate</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
