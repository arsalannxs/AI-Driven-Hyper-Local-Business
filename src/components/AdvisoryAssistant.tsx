import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Bot,
  User,
  Lightbulb,
} from 'lucide-react';
import { Enterprise, LanguageCode, AdvisoryMessage } from '../types';
import { UI_TEXT } from '../services/i18n';
import { voiceService } from '../services/voice';

interface AdvisoryAssistantProps {
  enterprise: Enterprise;
  messages: AdvisoryMessage[];
  onSendMessage: (query: string) => Promise<void>;
  isLoading: boolean;
  language: LanguageCode;
  isOnline: boolean;
  voiceAutoRead: boolean;
}

export const AdvisoryAssistant: React.FC<AdvisoryAssistantProps> = ({
  enterprise,
  messages,
  onSendMessage,
  isLoading,
  language,
  isOnline,
  voiceAutoRead,
}) => {
  const t = UI_TEXT[language] || UI_TEXT.en;
  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick inquiry suggestions tailored to trade
  const tradePrompts: Record<string, string[]> = {
    dairy: [
      language === 'hi' ? 'दूध में फैट व SNF कैसे बढ़ाएं?' : 'How to increase milk fat and SNF count?',
      language === 'hi' ? 'MoSJE रियायती ऋण से दुग्ध चिलिंग कैसे लगाएं?' : 'How to finance a chilling unit with MoSJE concessional loan?',
      language === 'hi' ? 'पशु आहार (दाना/खली) की लागत कैसे कम करें?' : 'How to optimize cattle feed costs?',
      language === 'hi' ? 'साहूकार के 36% कर्ज़ को 6.5% रियायती ऋण में कैसे बदलें?' : 'How to refinance 36% moneylender debt into 6.5% micro finance?',
    ],
    retail: [
      language === 'hi' ? 'दुकान की उधारी (Udhaar) बिना संबंध खराब किए कैसे वसूलें?' : 'How to recover pending customer credit politely?',
      language === 'hi' ? 'थोक मंडी से माल खरीदते समय नकद छूट कैसे पाएं?' : 'How to get cash discounts from wholesale suppliers?',
      language === 'hi' ? 'दुकान में कौन से 10 सामान सबसे ज्यादा मुनाफा देते हैं?' : 'Which high-margin items to stock in village store?',
      language === 'hi' ? '10% मार्जिन जमा करके ₹1.40 लाख तक माइक्रो लोन कैसे लें?' : 'How to access up to ₹1.25 Lakh micro finance with 10% margin?',
    ],
    textiles: [
      language === 'hi' ? 'सूत (यार्न) की थोक खरीद में बचत कैसे करें?' : 'How to source raw yarn at wholesale cooperative rates?',
      language === 'hi' ? 'कारीगर समूह बनाकर सीधे शहरों में माल कैसे बेचें?' : 'How to sell handloom directly to urban exhibitions?',
      language === 'hi' ? 'हथकरघा बुनकर मुद्रा व MoSJE योजना में क्या छूट है?' : 'What subsidies exist under MoSJE & Weavers credit schemes?',
      language === 'hi' ? 'हस्तशिल्प की सही कीमत (Pricing) कैसे तय करें?' : 'How to accurately price handmade crafts for fair wages?',
    ],
    farming: [
      language === 'hi' ? 'सरसों/गेहूं की कटाई के बाद उपज कहां बेचें?' : 'Where to sell wheat/mustard for best price?',
      language === 'hi' ? 'सब्जियों में कीट प्रकोप से कैसे बचें?' : 'Natural pest management for seasonal vegetables',
      language === 'hi' ? 'ड्रिप सिंचाई सब्सिडी कैसे प्राप्त करें?' : 'How to apply for micro-irrigation subsidy?',
      language === 'hi' ? 'जैविक खाद बनाकर खाद का खर्च आधा कैसे करें?' : 'How to make vermicompost and cut fertilizer bills?',
    ],
    poultry: [
      language === 'hi' ? 'मुर्गी दाने (Feed) का खर्च कम करने का तरीका?' : 'Ways to reduce poultry feed conversion ratio (FCR)?',
      language === 'hi' ? 'चूजों में बीमारी और मृत्यु दर कैसे रोकें?' : 'How to minimize chick mortality and vaccination schedule?',
      language === 'hi' ? 'देसी अंडे स्थानीय बाज़ार में ऊंचे दाम पर कैसे बेचें?' : 'How to brand and sell desi eggs at premium prices?',
      language === 'hi' ? 'पोल्ट्री शेड विस्तार के लिए नाबार्ड व MoSJE ऋण?' : 'MoSJE & NABARD concessional loans for poultry sheds?',
    ],
    workshop: [
      language === 'hi' ? 'स्पेयर पार्ट्स की थोक खरीदारी कैसे करें?' : 'How to purchase machinery spare parts at wholesale?',
      language === 'hi' ? 'नए आधुनिक औजार खरीदने के लिए टर्म लोन (8% ब्याज)?' : 'Applying for 8% term loan for modern repair tools?',
      language === 'hi' ? 'दुकान का प्रचार आसपास के 5 गांवों में कैसे करें?' : 'How to advertise tractor/pump repair across 5 villages?',
      language === 'hi' ? 'वार्षिक सर्विसिंग अनुबंध (AMC) कैसे शुरू करें?' : 'How to offer seasonal maintenance packages to farmers?',
    ],
  };

  const quickPrompts = tradePrompts[enterprise.tradeType] || [
    t.prompt1,
    t.prompt2,
    t.prompt3,
    t.prompt4,
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (voiceAutoRead && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'assistant' && currentlySpeakingId !== lastMsg.id) {
        handleSpeak(lastMsg.id, lastMsg.text);
      }
    }
  }, [messages, voiceAutoRead]);

  const handleSend = async (queryText?: string) => {
    const text = queryText || inputQuery;
    if (!text.trim() || isLoading) return;
    setInputQuery('');
    await onSendMessage(text);
  };

  const startVoiceRecording = () => {
    setIsListening(true);
    voiceService.startListening(
      language,
      (transcript, isFinal) => {
        setInputQuery(transcript);
        if (isFinal) {
          setIsListening(false);
          handleSend(transcript);
        }
      },
      () => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const stopVoiceRecording = () => {
    voiceService.stopListening();
    setIsListening(false);
  };

  const handleSpeak = (id: string, text: string) => {
    if (currentlySpeakingId === id) {
      voiceService.stopSpeaking();
      setCurrentlySpeakingId(null);
    } else {
      setCurrentlySpeakingId(id);
      voiceService.speak(
        text,
        language,
        () => setCurrentlySpeakingId(id),
        () => setCurrentlySpeakingId(null)
      );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[550px] rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-sm overflow-hidden">
      {/* Top Advisory Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">
                GramSathi Hyper-Local Advisor
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-emerald-800 font-bold border border-slate-200">
                {enterprise.village}, {enterprise.district}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Personalized for {enterprise.tradeType.toUpperCase()} • Grounded in local cash flow & MoSJE schemes
            </p>
          </div>
        </div>

        <div>
          {!isOnline && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-medium">
              Offline Rules Active
            </span>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto text-center py-10 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-2xl shadow-xs">
              🌾
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">
                Namaste, {enterprise.ownerName}!
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                I am your hyper-local business advisor. Ask me questions about raw material prices, customer credit collection, applying for MoSJE concessional loans, or cutting moneylender interest.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="pt-2 text-left">
              <div className="text-xs font-bold text-slate-600 mb-2 flex items-center space-x-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.quickPromptsTitle}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    id={`quick-prompt-btn-${idx}`}
                    onClick={() => handleSend(prompt)}
                    className="p-3 rounded-xl bg-white hover:bg-emerald-50/60 border border-slate-200 text-left text-xs text-slate-800 transition-all flex items-start space-x-2 shadow-xs group"
                  >
                    <span className="text-emerald-600 font-bold shrink-0">→</span>
                    <span className="group-hover:text-emerald-800 transition-colors">
                      {prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map(msg => {
            const isUser = msg.sender === 'user';
            const isSpeakingThis = currentlySpeakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                    GS
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-2xl rounded-2xl p-4 shadow-xs ${
                    isUser
                      ? 'bg-emerald-700 text-white font-medium rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {/* Assistant controls: Voice speak */}
                  {!isUser && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Hyper-Local Advisory</span>
                      </span>
                      <button
                        id={`read-aloud-msg-${msg.id}`}
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                          isSpeakingThis
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                        title="Listen to this advice out loud"
                      >
                        {isSpeakingThis ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>{t.stopAudio}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{t.readAloud}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Message body */}
                  <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Risk Alert if any */}
                  {msg.riskAlert && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-rose-950">Financial Risk Alert:</div>
                        <div>{msg.riskAlert}</div>
                      </div>
                    </div>
                  )}

                  {/* Action Steps checklist if any */}
                  {msg.keyActionSteps && msg.keyActionSteps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                        Action Steps for Your Micro-Unit:
                      </div>
                      {msg.keyActionSteps.map((step, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start space-x-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-2 text-right ${
                      isUser ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              GS
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 flex items-center space-x-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span>Analyzing hyper-local market rates and financial structures...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar with Voice & Send */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          {/* Voice input button */}
          <button
            type="button"
            id="advisor-voice-input-btn"
            onClick={isListening ? stopVoiceRecording : startVoiceRecording}
            className={`p-3 rounded-xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title="Click to speak your question"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-700" />}
          </button>

          {/* Text input */}
          <input
            type="text"
            id="advisor-query-input"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder={
              isListening
                ? t.listening
                : language === 'hi'
                ? 'अपनी समस्या या सवाल पूछें (बोलकर या लिखकर)...'
                : 'Ask business, pricing, or loan structuring advice...'
            }
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />

          {/* Send button */}
          <button
            type="submit"
            id="advisor-send-btn"
            disabled={!inputQuery.trim() || isLoading}
            className="p-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-40 transition-all shadow-xs flex items-center justify-center"
            title="Send query"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
