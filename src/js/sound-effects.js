// Sound Effects System
class SoundEffects {
    constructor() {
        this.enabled = true;
        this.completionSound = document.getElementById('completionSound');
        this.mistakeSound = document.getElementById('mistakeSound');
        this.sessionCompleteSound = document.getElementById('sessionCompleteSound');
        
        // Create synthetic tones if audio elements fail
        this.audioContext = null;
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    playTone(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playCompletion() {
        if (!this.enabled) return;
        
        if (this.completionSound && this.completionSound.readyState >= 2) {
            this.completionSound.currentTime = 0;
            this.completionSound.play().catch(() => {
                // Fallback to synthetic tone
                this.playTone(523.25, 0.2); // C5 note
            });
        } else {
            // Fallback: pleasant ascending tone
            this.playTone(523.25, 0.15);
            setTimeout(() => this.playTone(659.25, 0.15), 100);
        }
    }
    
    playMistake() {
        if (!this.enabled) return;
        
        if (this.mistakeSound && this.mistakeSound.readyState >= 2) {
            this.mistakeSound.currentTime = 0;
            this.mistakeSound.play().catch(() => {
                // Fallback to synthetic tone
                this.playTone(220, 0.3, 'sawtooth'); // A3 note, harsh sound
            });
        } else {
            // Fallback: descending error tone
            this.playTone(220, 0.2, 'sawtooth');
            setTimeout(() => this.playTone(196, 0.2, 'sawtooth'), 150);
        }
    }
    
    playSessionComplete() {
        if (!this.enabled) return;
        
        if (this.sessionCompleteSound && this.sessionCompleteSound.readyState >= 2) {
            this.sessionCompleteSound.currentTime = 0;
            this.sessionCompleteSound.play().catch(() => {
                // Fallback to synthetic melody
                this.playCompletionMelody();
            });
        } else {
            this.playCompletionMelody();
        }
    }
    
    playHint() {
        if (!this.enabled) return;
        
        // Subtle hint sound - soft bell-like tone
        this.playTone(880, 0.1, 'sine'); // A5 note, very brief
    }
    
    playCompletionMelody() {
        // Fallback melody for session completion
        this.playTone(523.25, 0.2); // C5
        setTimeout(() => this.playTone(659.25, 0.2), 150); // E5
        setTimeout(() => this.playTone(783.99, 0.3), 300); // G5
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Export for use in other modules
export { SoundEffects };