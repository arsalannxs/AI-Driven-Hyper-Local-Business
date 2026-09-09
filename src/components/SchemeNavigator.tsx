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

  // Check trade compatibility
  const isRecommended = (scheme: GovScheme) => {
    if (
      (enterprise.tradeType === 'dairy' || enterprise.tradeType === 'farming') &&
      scheme.code.includes('KCC')
    ) {
      return true;
    }
    if (
      (enterprise.tradeType === 'kirana' || enterprise.tradeType === 'workshop') &&
      scheme.code.includes('SVANIDHI')
    ) {
      return true;
    }
    if (scheme.code.includes('MUDRA')) {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-md">
        <div className="flex items-center space-x-2.5">
          <Landmark className="w-5 h-5 text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold text-stone-100">
            Government Micro-Enterprise Schemes & Subsidies
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl">
          Verified central & state financial facilities offering collateral-free working capital, interest subventions, and priority rural credit.
        </p>
      </div>

      {/* Main Layout: List & Detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Schemes list */}
        <div className="lg:col-span-5 space-y-3">
          {schemes.map(scheme => {
            const recommended = isRecommended(scheme);
            const isSelected = selectedScheme?.id === scheme.id;

            return (
              <div
                key={scheme.id}
                id={`scheme-card-${scheme.id}`}
                onClick={() => setSelectedScheme(scheme)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-stone-850 border-amber-500 shadow-lg ring-1 ring-amber-500/50'
                    : 'bg-stone-900 border-stone-800 hover:bg-stone-850/80 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-800 text-amber-400 border border-stone-700">
                        {scheme.code}
                      </span>
                      {recommended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Recommended for You
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-stone-100 mt-1.5">
                      {scheme.name}
                    </h3>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-stone-400 transition-transform ${
                      isSelected ? 'rotate-90 text-amber-400' : ''
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-800 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Funding Cap</span>
                    <span className="font-mono font-bold text-amber-400">
                      {scheme.maxFunding}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Interest Rate</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {scheme.interestRate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Scheme Details */}
        <div className="lg:col-span-7">
          {selectedScheme ? (
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-md space-y-5">
              {/* Header */}
              <div className="border-b border-stone-800 pb-4">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-600 text-stone-950">
                    {selectedScheme.code}
                  </span>
                  {selectedScheme.collateralFree && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>100% Collateral-Free</span>
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-amber-400">
                  {selectedScheme.name}
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  {selectedScheme.category} • Target: {selectedScheme.targetGroup}
                </p>
              </div>

              {/* Key Financial highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                  <span className="text-[11px] text-stone-400 uppercase font-semibold block">
                    Maximum Funding Limit
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                    {selectedScheme.maxFunding}
                  </div>
                  <span className="text-[11px] text-stone-500">
                    Term loan or revolving cash credit
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                  <span className="text-[11px] text-stone-400 uppercase font-semibold block">
                    Interest Subsidy / Incentive
                  </span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5 leading-snug">
                    {selectedScheme.subsidyRate}
                  </div>
                </div>
              </div>

              {/* Key Eligibility */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
                  Eligibility Criteria:
                </h4>
                <div className="space-y-1.5">
                  {selectedScheme.keyEligibility.map((crit, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-stone-850 border border-stone-800 text-xs text-stone-300 flex items-start space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Documents */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
                  Documents to Carry:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedScheme.requiredDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-stone-850 border border-stone-800 text-xs text-stone-300 flex items-start space-x-2"
                    >
                      <FileCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How to Apply */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-600/30 text-xs space-y-2">
                <div className="font-bold text-amber-300">
                  Application Process:
                </div>
                <p className="text-stone-300 leading-relaxed">
                  Apply via: <strong className="text-stone-100">{selectedScheme.applicationChannel}</strong>. Carry your Aadhaar, bank passbook, and the Bank Project Appraisal Dossier generated in the Loan Structuring tab.
                </p>
                <div className="pt-1">
                  <a
                    href={selectedScheme.officialPortal}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    <span>Visit Official Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-stone-400 text-sm rounded-2xl bg-stone-900 border border-stone-800">
              Select a scheme from the list to view eligibility, documents, and subsidy details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
