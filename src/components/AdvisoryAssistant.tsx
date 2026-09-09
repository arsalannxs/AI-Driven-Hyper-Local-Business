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
  Radio,
  RotateCcw,
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

  // Quick inquiry suggestions based on trade
  const tradePrompts: Record<string, string[]> = {
    dairy: [
      language === 'hi' ? 'दूध में फैट व SNF कैसे बढ़ाएं?' : 'How to increase milk fat and SNF count?',
      language === 'hi' ? 'गर्मियों में दूध उत्पादन घटने से कैसे रोकें?' : 'How to prevent milk drop in summer heat?',
      language === 'hi' ? 'पशु आहार (दाना/खली) की लागत कैसे कम करें?' : 'How to optimize cattle feed costs?',
      language === 'hi' ? 'डेयरी के लिए KCC लोन (4% ब्याज) कैसे लें?' : 'How to get KCC Dairy loan at 4% interest?',
    ],
    farming: [
      language === 'hi' ? 'सरसों/गेहूं की कटाई के बाद उपज कहां बेचें?' : 'Where to sell wheat/mustard for best price?',
      language === 'hi' ? 'सब्जियों में कीट प्रकोप से कैसे बचें?' : 'Natural pest management for seasonal vegetables',
      language === 'hi' ? 'ड्रिप सिंचाई सब्सिडी कैसे प्राप्त करें?' : 'How to apply for micro-irrigation subsidy?',
      language === 'hi' ? 'जैविक खाद बनाकर खाद का खर्च आधा कैसे करें?' : 'How to make vermicompost and cut fertilizer bills?',
    ],
    kirana: [
      language === 'hi' ? 'दुकान की उधारी (Udhaar) बिना संबंध खराब किए कैसे वसूलें?' : 'How to recover pending customer credit politely?',
      language === 'hi' ? 'थोक मंडी से माल खरीदते समय नकद छूट कैसे पाएं?' : 'How to get cash discounts from wholesale suppliers?',
      language === 'hi' ? 'दुकान में कौन से 10 सामान सबसे ज्यादा मुनाफा देते हैं?' : 'Which high-margin items to stock in village store?',
      language === 'hi' ? 'पीएम स्वनिधि (PM-SVANidhi) लोन कैसे लें?' : 'How to apply for PM-SVANidhi working capital?',
    ],
    handloom: [
      language === 'hi' ? 'सूत (यार्न) की थोक खरीद में बचत कैसे करें?' : 'How to source raw yarn at wholesale cooperative rates?',
      language === 'hi' ? 'कारीगर समूह बनाकर सीधे शहरों में माल कैसे बेचें?' : 'How to sell handloom directly to urban exhibitions?',
      language === 'hi' ? 'हथकरघा बुनकर मुद्रा योजना में क्या छूट है?' : 'What subsidies exist under Weavers Mudra Scheme?',
      language === 'hi' ? 'हस्तशिल्प की सही कीमत (Pricing) कैसे तय करें?' : 'How to accurately price handmade crafts for fair wages?',
    ],
    poultry: [
      language === 'hi' ? 'मुर्गी दाने (Feed) का खर्च कम करने का तरीका?' : 'Ways to reduce poultry feed conversion ratio (FCR)?',
      language === 'hi' ? 'चूजों में बीमारी और मृत्यु दर कैसे रोकें?' : 'How to minimize chick mortality and vaccination schedule?',
      language === 'hi' ? 'देसी अंडे स्थानीय बाज़ार में ऊंचे दाम पर कैसे बेचें?' : 'How to brand and sell desi eggs at premium prices?',
      language === 'hi' ? 'पोल्ट्री शेड विस्तार के लिए नाबार्ड सब्सिडी?' : 'NABARD subsidy schemes for poultry farm sheds?',
    ],
    workshop: [
      language === 'hi' ? 'स्पेयर पार्ट्स की थोक खरीदारी कैसे करें?' : 'How to purchase machinery spare parts at wholesale?',
      language === 'hi' ? 'नए आधुनिक औजार खरीदने के लिए PMEGP लोन?' : 'Applying for PMEGP loan for modern repair tools?',
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

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Read aloud automatically if voiceAutoRead is enabled and new assistant message appears
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
      error => {
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
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[550px] rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-xl overflow-hidden">
      {/* Top Advisory Bar */}
      <div className="p-4 border-b border-stone-800 bg-stone-920 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-stone-100">
                GramSathi Hyper-Local Advisor
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-amber-400 font-semibold border border-stone-700">
                {enterprise.village}, {enterprise.district}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Personalized for {enterprise.tradeType.toUpperCase()} • Considers your cash flow & debts
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isOnline && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700 font-medium">
              Offline Rules Active
            </span>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto text-center py-10 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl">
              🌾
            </div>
            <div>
              <h4 className="text-base font-bold text-stone-200">
                Namaste, {enterprise.ownerName}!
              </h4>
              <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                I am your hyper-local business advisor. Ask me anything about cattle feed, crop pricing, customer udhaar, cutting moneylender interest, or getting bank loans.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="pt-2 text-left">
              <div className="text-xs font-semibold text-stone-400 mb-2 flex items-center space-x-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.quickPromptsTitle}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    id={`quick-prompt-btn-${idx}`}
                    onClick={() => handleSend(prompt)}
                    className="p-2.5 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-750 text-left text-xs text-stone-200 transition-colors flex items-start space-x-2 group"
                  >
                    <span className="text-amber-500 font-bold shrink-0">→</span>
                    <span className="group-hover:text-amber-300 transition-colors">
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
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    GS
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-2xl rounded-2xl p-4 shadow-sm ${
                    isUser
                      ? 'bg-amber-600 text-stone-950 font-medium'
                      : 'bg-stone-850 border border-stone-750 text-stone-100'
                  }`}
                >
                  {/* Assistant controls: Voice speak */}
                  {!isUser && (
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
                      <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Hyper-Local Advisory</span>
                      </span>
                      <button
                        id={`read-aloud-msg-${msg.id}`}
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs transition-colors ${
                          isSpeakingThis
                            ? 'bg-amber-500 text-stone-950 font-bold animate-pulse'
                            : 'text-stone-400 hover:text-amber-300 hover:bg-stone-800'
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
                    <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-rose-300">
                          Financial Risk Alert:
                        </div>
                        <div>{msg.riskAlert}</div>
                      </div>
                    </div>
                  )}

                  {/* Action Steps checklist if any */}
                  {msg.keyActionSteps && msg.keyActionSteps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-stone-800 space-y-1.5">
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        Action Steps for Your Micro-Unit:
                      </div>
                      {msg.keyActionSteps.map((step, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start space-x-2 text-xs text-stone-300 bg-stone-900/60 p-2 rounded-lg border border-stone-800/80"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-2 text-right ${
                      isUser ? 'text-stone-900/70' : 'text-stone-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-stone-700 text-stone-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0">
              GS
            </div>
            <div className="bg-stone-850 border border-stone-750 rounded-2xl p-4 text-xs text-amber-300 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Analyzing hyper-local market rates and financial structures...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar with Voice & Send */}
      <div className="p-3 sm:p-4 border-t border-stone-800 bg-stone-920">
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
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/40'
                : 'bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700'
            }`}
            title="Click to speak your question"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
            className="flex-1 px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-xs sm:text-sm text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500"
          />

          {/* Send button */}
          <button
            type="submit"
            id="advisor-send-btn"
            disabled={!inputQuery.trim() || isLoading}
            className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold disabled:opacity-40 transition-colors shadow-md flex items-center justify-center"
            title="Send query"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
