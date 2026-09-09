import { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from './i18n';

// Extend window interface for WebkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceAssistantService {
  private recognition: any | null = null;
  private isListening: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  isSpeechRecognitionSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  isSpeechSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  startListening(
    lang: LanguageCode,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      onError('Speech recognition not supported in this browser.');
      return false;
    }

    // Stop any ongoing playback while user speaks
    this.stopSpeaking();

    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === lang);
    this.recognition.lang = langObj ? langObj.speechCode : 'hi-IN';

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        onResult(final.trim(), true);
      } else if (interim) {
        onResult(interim.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      let msg = event.error || 'Microphone error';
      if (event.error === 'not-allowed') {
        msg = 'Microphone permission denied. Please allow microphone access in browser.';
      } else if (event.error === 'no-speech') {
        msg = 'No speech heard. Please try again.';
      }
      onError(msg);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
      return true;
    } catch (e: any) {
      console.warn('Recognition start exception:', e);
      this.isListening = false;
      onError('Could not start microphone.');
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
      this.isListening = false;
    }
  }

  speak(
    text: string,
    lang: LanguageCode,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    if (!this.isSpeechSynthesisSupported()) {
      return;
    }

    this.stopSpeaking();

    // Strip markdown formatting characters for natural speech
    const cleanText = text
      .replace(/[*_#`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === lang);
    utterance.lang = langObj ? langObj.speechCode : 'hi-IN';
    utterance.rate = 0.92; // Slightly measured pace for better comprehension
    utterance.pitch = 1.0;

    // Pick a voice that matches the target language if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.currentUtterance = null;
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }
}

export const voiceService = new VoiceAssistantService();
