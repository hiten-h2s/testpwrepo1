import React, { useEffect, useState, useRef } from 'react';
import { Phone, Play, Pause, RotateCcw, Hand } from 'lucide-react';
import BreathingVisualizer from './BreathingVisualizer';
import KinestheticGrounding from './KinestheticGrounding';

function SupportCard({ message, profile, onReset }) {
  const contactName = profile?.trusted_contact || 'someone you trust';
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGrounding, setShowGrounding] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any previous speech
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const isHindi = /[\u0900-\u097F]/.test(message);
      
      let voice = null;
      if (isHindi) {
        // Try to find a Hindi voice
        voice = voices.find(v => v.lang.startsWith('hi'));
      } else {
        // Try to find an Indian English voice, fallback to any English
        voice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en'));
      }
      
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    
    // Auto-play on mount
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [message]);

  const togglePlayback = () => {
    if (!('speechSynthesis' in window) || !utteranceRef.current) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.speak(utteranceRef.current);
      }
      setIsPlaying(true);
    }
  };

  const replay = () => {
    if (!('speechSynthesis' in window) || !utteranceRef.current) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utteranceRef.current);
    setIsPlaying(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col justify-center min-h-[60vh]">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center relative">
        
        {/* TTS Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={togglePlayback}
            className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors shadow-sm"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button 
            onClick={replay}
            className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors shadow-sm"
            aria-label="Replay audio"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        <p className="text-2xl md:text-3xl text-emerald-900 dark:text-emerald-100 font-bold leading-relaxed mb-8 mt-8">
          "{message}"
        </p>
        
        <BreathingVisualizer isSpeaking={isPlaying} />
        
        <div className="flex flex-col gap-4 w-full">
          <a href="tel:" className="block w-full" style={{ textDecoration: 'none' }}>
            <button className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-md active:scale-95" aria-label={`Call ${contactName}`}>
              <Phone size={24} /> Call {contactName}
            </button>
          </a>

          {!showGrounding ? (
            <button 
              className="w-full h-16 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-800 text-teal-700 dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-lg font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors active:scale-95 shadow-sm"
              onClick={() => setShowGrounding(true)}
            >
              <Hand size={24} /> Interactive Grounding
            </button>
          ) : (
            <KinestheticGrounding onClose={() => setShowGrounding(false)} />
          )}
          
          
          <button 
            className="w-full h-16 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-lg font-medium rounded-2xl transition-colors active:scale-95" 
            onClick={onReset} 
            aria-label="Start over"
          >
            I need more support
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupportCard;
