export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export type SpeechCallback = (result: SpeechRecognitionResult) => void;

class SpeechManager {
  private recognition: SpeechRecognition | null = null;
  private callback: SpeechCallback | null = null;
  private isListening = false;
  private lang = 'ru-RU';

  constructor() {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.lang;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!this.callback) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        this.callback({
          transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal,
        });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        this.stop();
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try {
          this.recognition?.start();
        } catch {
          this.isListening = false;
        }
      }
    };
  }

  setLanguage(lang: string) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  start(callback: SpeechCallback): boolean {
    if (!this.recognition) return false;
    if (this.isListening) return true;

    this.callback = callback;
    this.isListening = true;
    try {
      this.recognition.start();
      return true;
    } catch {
      this.isListening = false;
      return false;
    }
  }

  stop() {
    this.isListening = false;
    this.recognition?.stop();
    this.callback = null;
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechManager = new SpeechManager();