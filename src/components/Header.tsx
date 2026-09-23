import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Volume2,
  VolumeX,
  Store,
  MapPin,
  ChevronDown,
  Globe,
  Radio,
  Building2,
} from 'lucide-react';
import { Enterprise, LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES, UI_TEXT } from '../services/i18n';
import { offlineStorage } from '../services/offlineStorage';
import { voiceService } from '../services/voice';

interface HeaderProps {
  currentEnterprise: Enterprise;
  onOpenProfile: () => void;
  selectedLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onManualSync: () => void;
  isSyncing: boolean;
  voiceAutoRead: boolean;
  onToggleVoiceAutoRead: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentEnterprise,
  onOpenProfile,
  selectedLanguage,
  onLanguageChange,
  isOnline,
  pendingSyncCount,
  onManualSync,
  isSyncing,
  voiceAutoRead,
  onToggleVoiceAutoRead,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const t = UI_TEXT[selectedLanguage] || UI_TEXT.en;
  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);

  const handleSimulateOffline = () => {
    offlineStorage.toggleSimulatedOffline();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-800 shadow-xs">
      {/* Top Ministry Banner */}
      <div className="bg-slate-900 text-slate-200 text-[11px] py-1 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <span className="font-semibold text-amber-400">MoSJE</span>
            <span>•</span>
            <span className="truncate">Ministry of Social Justice and Empowerment | State Channelizing Agencies (SCAs)</span>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-slate-400">
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono text-[10px]">
              ID: 26091
            </span>
            <span>Concessional Credit Facility</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-sm text-white font-bold text-xl sm:text-2xl ring-2 ring-emerald-500/20">
              🌾
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-serif">
                  {t.appTitle}
                </h1>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 tracking-wide">
                  Rural Advisory & Schemes
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                AI Feasibility & Concessional Credit Assistant for Rural Micro-Entrepreneurs
              </p>
            </div>
          </div>

          {/* Controls: Online/Offline, Language, Voice Readout, Enterprise Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Online / Offline Indicator & Sync Badge */}
            <div className="flex items-center space-x-1.5">
              <button
                id="toggle-offline-mode-btn"
                onClick={handleSimulateOffline}
                title="Click to toggle simulated offline mode to test offline capabilities"
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse hover:bg-amber-200'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden md:inline">{t.online}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                    <span>{t.offline}</span>
                  </>
                )}
              </button>

              {/* Pending Sync Items & Manual Sync Trigger */}
              {pendingSyncCount > 0 && (
                <button
                  id="sync-now-header-btn"
                  onClick={onManualSync}
                  disabled={isSyncing || !isOnline}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 shadow-xs"
                  title="Offline changes waiting for internet connection"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>
                    {pendingSyncCount} {t.pendingSync}
                  </span>
                </button>
              )}
            </div>

            {/* Voice Readout Toggle */}
            <button
              id="voice-auto-read-toggle-btn"
              onClick={onToggleVoiceAutoRead}
              className={`p-2 rounded-xl border text-xs flex items-center justify-center transition-all ${
                voiceAutoRead
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-200'
              }`}
              title={voiceAutoRead ? 'Voice read-aloud active' : 'Voice read-aloud muted'}
            >
              {voiceAutoRead ? (
                <Volume2 className="w-4 h-4 text-emerald-700" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                id="language-select-dropdown-btn"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold hover:bg-slate-200 transition-colors text-slate-800"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold text-slate-900">{currentLangObj?.nativeName || 'हिन्दी'}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {langMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 py-1.5 overflow-hidden ring-1 ring-black/5 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-100">
                      Select Voice & Text Language
                    </div>
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        id={`lang-option-${lang.code}`}
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setLangMenuOpen(false);
                          voiceService.speak(
                            lang.code === 'hi'
                              ? 'भाषा हिन्दी चुनी गई है'
                              : `Language set to ${lang.name}`,
                            lang.code
                          );
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          selectedLanguage === lang.code
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <span>{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </span>
                        <span className={`text-[10px] ${selectedLanguage === lang.code ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {lang.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Current Enterprise Profile Chip */}
            <button
              id="enterprise-profile-chip-btn"
              onClick={onOpenProfile}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-slate-100 transition-all text-left"
              title="Click to edit village location or enterprise trade"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Store className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="hidden lg:block text-xs leading-tight">
                <div className="font-bold text-slate-800 truncate max-w-[120px]">
                  {currentEnterprise.name}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center space-x-0.5 truncate max-w-[120px]">
                  <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                  <span>{currentEnterprise.village}</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
