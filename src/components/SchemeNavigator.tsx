import React, { useState } from 'react';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  FileCheck,
  Info,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { GovScheme, Enterprise, LanguageCode } from '../types';

interface SchemeNavigatorProps {
  schemes: GovScheme[];
  enterprise: Enterprise;
  language: LanguageCode;
}

export const SchemeNavigator: React.FC<SchemeNavigatorProps> = ({
  schemes,
  enterprise,
  language,
}) => {
  const [selectedScheme, setSelectedScheme] = useState<GovScheme | null>(schemes[0] || null);

  const isRecommended = (scheme: GovScheme) => {
    if (
      (enterprise.tradeType === 'dairy' || enterprise.tradeType === 'farming') &&
      scheme.code.includes('KCC')
    ) {
      return true;
    }
    if (
      (enterprise.tradeType === 'kirana' || enterprise.tradeType === 'workshop' || enterprise.tradeType === 'retail') &&
      scheme.code.includes('SVANIDHI')
    ) {
      return true;
    }
    if (scheme.code.includes('MUDRA') || scheme.code.includes('MoSJE')) {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
            <Landmark className="w-5 h-5 text-indigo-700" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Government Schemes & Concessional Credit Facilities
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified institutional schemes offering 10% margin / 90% loan structures, collateral-free credit, and interest subvention.
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Scheme Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schemes List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Available Schemes ({schemes.length})
          </div>

          {schemes.map(scheme => {
            const recommended = isRecommended(scheme);
            const isSelected = selectedScheme?.id === scheme.id;

            return (
              <button
                key={scheme.id}
                id={`scheme-card-${scheme.id}`}
                onClick={() => setSelectedScheme(scheme)}
                className={`w-full text-left p-4 rounded-2xl border transition-all relative ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                {recommended && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    ★ Best Fit for {enterprise.tradeType.toUpperCase()}
                  </span>
                )}

                <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  {scheme.code}
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5 pr-16">
                  {scheme.name}
                </h4>

                <div className="flex items-center space-x-3 mt-3 text-xs">
                  <div className="text-slate-600">
                    Max: <span className="font-bold text-slate-900">{scheme.maxFunding}</span>
                  </div>
                  <div className="text-slate-600">
                    Rate: <span className="font-bold text-emerald-700">{scheme.interestRate}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Scheme Detail Panel */}
        <div className="lg:col-span-7">
          {selectedScheme ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 sticky top-24">
              {/* Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Concessional Scheme Details</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 font-serif">
                  {selectedScheme.name}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                    Category: {selectedScheme.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                    Target: {selectedScheme.targetGroup}
                  </span>
                  {selectedScheme.collateralFree && (
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ Collateral Free
                    </span>
                  )}
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium block">Max Financing</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                    {selectedScheme.maxFunding}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <span className="text-emerald-800 font-semibold block">Interest Rate</span>
                  <div className="text-sm font-bold text-emerald-900 mt-0.5 font-mono">
                    {selectedScheme.interestRate}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                  <span className="text-amber-800 font-semibold block">Subsidy Support</span>
                  <div className="text-sm font-bold text-amber-900 mt-0.5 font-mono">
                    {selectedScheme.subsidyRate}
                  </div>
                </div>
              </div>

              {/* Eligibility */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Key Eligibility Criteria
                </h4>
                <ul className="space-y-1.5">
                  {selectedScheme.keyEligibility.map((crit, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Documents */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Required Documentation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedScheme.requiredDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center space-x-2"
                    >
                      <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Channel */}
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-slate-800">
                <span className="font-bold text-indigo-900 block mb-1">How to Apply:</span>
                <div>{selectedScheme.applicationChannel}</div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400">
              Select a scheme on the left to view complete parameters
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
