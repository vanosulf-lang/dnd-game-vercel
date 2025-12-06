// scripts/voice-manager.js
class VoiceManager {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.voices = [];
        this.currentVoice = null;
        
        this.initSpeechRecognition();
        this.loadVoices();
    }
    
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.lang = 'ru-RU';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            
            this.setupRecognitionEvents();
        } else {
            console.error('Web Speech API не поддерживается');
        }
    }
    
    setupRecognitionEvents() {
        this.recognition.onstart = () => {
            this.isListening = true;
            this.onListeningStart?.();
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.onSpeechResult?.(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Ошибка распознавания:', event.error);
            this.onError?.(event.error);
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.onListeningEnd?.();
        };
    }
    
    loadVoices() {
        const loadVoices = () => {
            this.voices = this.synthesis.getVoices();
            
            this.currentVoice = this.voices.find(v => 
                v.lang.startsWith('ru') && 
                (v.name.includes('Google') || v.name.includes('Yandex'))
            ) || this.voices.find(v => v.lang.startsWith('ru')) || this.voices[0];
            
            console.log('Доступные голоса:', this.voices.map(v => `${v.name} (${v.lang})`));
        };
        
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = loadVoices;
        }
        loadVoices();
    }
    
    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
                return true;
            } catch (error) {
                console.error('Не удалось начать распознавание:', error);
                return false;
            }
        }
        return false;
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    speak(text, options = {}) {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.lang = 'ru-RU';
        utterance.rate = options.rate || 1.1;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        
        if (this.currentVoice) {
            utterance.voice = this.currentVoice;
        }
        
        utterance.onstart = () => {
            this.onSpeechStart?.(text);
        };
        
        utterance.onend = () => {
            this.onSpeechEnd?.();
        };
        
        utterance.onerror = (event) => {
            console.error('Ошибка озвучки:', event);
            this.onSpeechError?.(event);
        };
        
        this.synthesis.speak(utterance);
        return utterance;
    }
    
    stopSpeaking() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
    }
    
    setVoice(voiceName) {
        const voice = this.voices.find(v => v.name === voiceName);
        if (voice) {
            this.currentVoice = voice;
            return true;
        }
        return false;
    }
    
    getAvailableVoices() {
        return this.voices.filter(v => v.lang.startsWith('ru'));
    }
    
    onListeningStart = null;
    onListeningEnd = null;
    onSpeechResult = null;
    onError = null;
    onSpeechStart = null;
    onSpeechEnd = null;
    onSpeechError = null;
}