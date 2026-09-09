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
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-stone-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo and App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-600 flex items-center justify-center shadow-inner text-stone-950 font-bold text-xl sm:text-2xl border border-amber-400">
              🌾
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-amber-400 font-serif">
                  {t.appTitle}
                </h1>
                <span className="text-[10px] sm:text-xs uppercase px-2 py-0.5 rounded-full bg-stone-800 text-amber-300/80 border border-stone-700 tracking-wider">
                  Hyper-Local
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden sm:block">
                {t.appSubtitle}
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
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  isOnline
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900'
                    : 'bg-amber-950/90 text-amber-300 border-amber-600 animate-pulse hover:bg-amber-900'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden md:inline">{t.online}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
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
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs bg-amber-500 text-stone-950 font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
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
              className={`p-2 rounded-lg border text-xs flex items-center justify-center transition-colors ${
                voiceAutoRead
                  ? 'bg-amber-600/20 text-amber-300 border-amber-600/60'
                  : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
              }`}
              title={voiceAutoRead ? 'Voice read-aloud active' : 'Voice read-aloud muted'}
            >
              {voiceAutoRead ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-400" />
              )}
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                id="language-select-dropdown-btn"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs font-medium hover:bg-stone-750 transition-colors text-stone-200"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-amber-300">{currentLangObj?.nativeName || 'हिन्दी'}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {langMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-stone-800 border border-stone-700 shadow-2xl z-50 py-1.5 overflow-hidden">
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-stone-400 border-b border-stone-700/60">
                      Select Voice & Text Language
                    </div>
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        id={`lang-option-${lang.code}`}
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setLangMenuOpen(false);
                          // Announce change in target language
                          voiceService.speak(
                            lang.code === 'hi'
                              ? 'भाषा हिन्दी चुनी गई है'
                              : `Language set to ${lang.name}`,
                            lang.code
                          );
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          selectedLanguage === lang.code
                            ? 'bg-amber-600 text-stone-950 font-bold'
                            : 'text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <span>{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </span>
                        <span className="text-[10px] opacity-75 font-normal">
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
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 hover:border-amber-600/60 transition-colors text-left"
              title="Click to edit village location or enterprise trade"
            >
              <div className="w-7 h-7 rounded-md bg-stone-700 flex items-center justify-center text-amber-400">
                <Store className="w-3.5 h-3.5" />
              </div>
              <div className="hidden lg:block text-xs leading-tight">
                <div className="font-semibold text-stone-200 truncate max-w-[120px]">
                  {currentEnterprise.name}
                </div>
                <div className="text-[10px] text-stone-400 flex items-center space-x-0.5 truncate max-w-[120px]">
                  <MapPin className="w-2.5 h-2.5 text-amber-500" />
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
