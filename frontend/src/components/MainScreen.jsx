import React, { useState, useRef, useEffect } from 'react';
import EmergencyCard from './EmergencyCard';
import SupportCard from './SupportCard';
import { Mic, MicOff, AlertCircle, SendHorizonal } from 'lucide-react';

function MainScreen({ profile, stealthMode }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('input'); // 'input', 'high', 'low-medium'
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [escrowTimeLeft, setEscrowTimeLeft] = useState(null);
  
  const recognitionRef = useRef(null);

  // Escrow Timer Effect
  useEffect(() => {
    let timer;
    if (escrowTimeLeft !== null && escrowTimeLeft > 0) {
      timer = setInterval(() => setEscrowTimeLeft(prev => prev - 1), 1000);
    } else if (escrowTimeLeft === 0) {
      // Trigger API
      setEscrowTimeLeft(null);
      fetch('/api/caregiver/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}` },
        body: JSON.stringify({ text: "Patient's safety timer expired without confirmation." })
      }).catch(() => {/* silent: non-critical background alert */});
      
      if (!stealthMode) {
        alert('Your trusted contact has been notified to check in on you.');
      }
    }
    return () => clearInterval(timer);
  }, [escrowTimeLeft, stealthMode]);

  const handleEscrowCancel = () => {
    setEscrowTimeLeft(null);
  };

  // M6: Offline Event Listener
  useEffect(() => {
    const handleOffline = () => setView('high');
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, []);

  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser doesn't support speech recognition. Please use text.");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) initSpeechRecognition();
      recognitionRef.current?.start();
    }
  };

  const handleQuickExit = () => {
    window.location.href = 'https://www.google.com';
  };

  // Allow Enter to submit; Shift+Enter for newline
  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !loading) handleSubmit();
    }
  };

  const presetChips = [
    { label: "Active Craving", color: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-800", payload: "I am having a strong craving right now and need grounding", indicator: "🟢" },
    { label: "Severe Anxiety", color: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-800", payload: "I feel overwhelmed and anxious, help me calm down", indicator: "🟡" },
    { label: "Need a Script", color: "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800", payload: "I want to talk to my trusted contact, give me a short script", indicator: "🔵" },
    { label: "Immediate Crisis", color: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-800", payload: "I took something dangerous / I am in immediate physical danger", indicator: "🔴" }
  ];

  const submitText = async (payloadText) => {
    if (!payloadText.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const classifyRes = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: payloadText })
      });
      
      if (!classifyRes.ok) throw new Error('Classification failed');
      
      const classifyData = await classifyRes.json();
      
      if (classifyData.category === 'HIGH' || classifyData.category === 'MEDIUM') {
        setEscrowTimeLeft(300); // 5 minutes grace window
      }
      
      if (classifyData.category === 'HIGH') {
        if (!stealthMode) {
          setView('high');
        } else {
          setGeneratedMessage("Remember to prioritize your well-being today.");
        }
        setLoading(false);
        return;
      }
      
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: payloadText, profile, category: classifyData.category })
      });
      
      if (!generateRes.ok) throw new Error('Generation failed');
      
      const generateData = await generateRes.json();
      setGeneratedMessage(generateData.message);
      
      if (!stealthMode) {
        setView('low-medium');
      }
      
    } catch (err) {
      setError('Something went wrong — please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chip) => {
    setText(chip.payload);
    submitText(chip.payload);
  };

  const handleSubmit = async () => {
    submitText(text);
  };

  // Stealth Mode UI
  if (stealthMode) {
    return (
       <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-[60vh] gap-6">
         {escrowTimeLeft !== null && (
           <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-300 dark:border-slate-700 flex justify-between items-center text-slate-600 dark:text-slate-300 shadow-sm animate-pulse">
             <span className="font-mono font-medium">Focus Sync: {Math.floor(escrowTimeLeft / 60)}:{(escrowTimeLeft % 60).toString().padStart(2, '0')}</span>
             <button onClick={handleEscrowCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-colors">Stop Sync</button>
           </div>
         )}
         
         <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col">
           <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Daily Task & Habit Notes</h3>
           <div className="flex gap-4 mb-8">
            <input 
              type="text" 
              placeholder="Jot down a quick task or note..." 
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              className="flex-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
            />
            <button 
              className="px-6 py-4 bg-slate-800 text-white font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50"
              onClick={handleSubmit}
              disabled={loading || !text.trim()}
            >
              {loading ? 'Saving...' : 'Add Note'}
            </button>
           </div>
           
           {generatedMessage && (
             <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200" />
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{generatedMessage}</p>
                </div>
             </div>
           )}
           {error && <div className="text-red-500 text-sm mt-4 font-medium">{error}</div>}
         </div>
       </div>
    );
  }

  // Normal UI Views
  if (view === 'high') {
    return (
      <div className="w-full flex flex-col gap-4 relative">
        {escrowTimeLeft !== null && (
          <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-2xl border-2 border-red-200 dark:border-red-800 flex justify-between items-center w-full max-w-4xl mx-auto z-10">
             <div className="flex items-center gap-3">
               <AlertCircle className="text-red-600 dark:text-red-400 animate-pulse" />
               <span className="text-red-900 dark:text-red-200 font-bold">Alerting {profile?.trusted_contact || 'trusted contact'} in {Math.floor(escrowTimeLeft / 60)}:{(escrowTimeLeft % 60).toString().padStart(2, '0')}</span>
             </div>
             <button onClick={handleEscrowCancel} className="px-6 py-3 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-red-900 dark:text-red-100 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all">Cancel Alert</button>
          </div>
        )}
        <EmergencyCard />
      </div>
    );
  }

  if (view === 'low-medium') {
    return (
      <div className="w-full flex flex-col gap-4 relative">
        {escrowTimeLeft !== null && (
          <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-800 flex justify-between items-center w-full max-w-4xl mx-auto z-10">
             <div className="flex items-center gap-3">
               <AlertCircle className="text-amber-600 dark:text-amber-400 animate-pulse" />
               <span className="text-amber-900 dark:text-amber-200 font-bold">Alerting {profile?.trusted_contact || 'trusted contact'} in {Math.floor(escrowTimeLeft / 60)}:{(escrowTimeLeft % 60).toString().padStart(2, '0')}</span>
             </div>
             <button onClick={handleEscrowCancel} className="px-6 py-3 bg-amber-100 dark:bg-amber-800 hover:bg-amber-200 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all">I feel grounded / Cancel Alert</button>
          </div>
        )}
        <SupportCard message={generatedMessage} profile={profile} onReset={() => setView('input')} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-[60vh] gap-6 relative">
      
      {profile?.calming_phrase && (
        <div className="mb-6 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-1">Hello {profile?.name || 'there'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Remember your phrase:</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/40 px-6 py-4 rounded-2xl border border-emerald-100 dark:border-emerald-800 max-w-sm">
            <p className="text-lg italic text-emerald-800 dark:text-emerald-200 font-medium">
              "{profile.calming_phrase}"
            </p>
          </div>
        </div>
      )}
      
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Need support?</h3>
        
        <div className="w-full mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {presetChips.map(chip => (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chip)}
                className={`h-14 px-4 flex items-center justify-center gap-2 text-sm md:text-base font-bold rounded-2xl transition-all border shadow-sm ${chip.color}`}
                aria-label={chip.label}
              >
                <span>{chip.indicator}</span> {chip.label}
              </button>
            ))}
          </div>

          {/* Textarea + inline controls row */}
          <div className="relative w-full">
            <textarea
              id="crisis-input-textarea"
              aria-label="Crisis Input Message Text Area"
              placeholder="Type your message here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              disabled={loading}
              rows={3}
              className="w-full p-5 pr-[140px] rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-lg focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-colors resize-none leading-relaxed"
            />

            {/* Inline controls — Send + Mic — anchored to bottom-right of textarea */}
            <div className="absolute bottom-3 right-3 flex gap-2">
              {/* Send button */}
              <button
                id="send-message-button"
                aria-label="Send Crisis Support Message"
                onClick={handleSubmit}
                disabled={loading || !text.trim()}
                className="h-14 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:active:scale-100 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm text-sm"
              >
                <SendHorizonal size={18} />
                <span className="hidden sm:inline">Send</span>
              </button>

              {/* Mic button */}
              <button
                className={`h-14 w-14 rounded-xl flex items-center justify-center transition-all relative border ${
                  isListening
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 shadow-inner'
                    : 'bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600 shadow-sm'
                }`}
                onClick={toggleListen}
                disabled={loading}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening && <span className="absolute inset-0 rounded-xl bg-emerald-400 dark:bg-emerald-600 opacity-20 animate-ping" />}
                {isListening
                  ? <MicOff className="text-emerald-700 dark:text-emerald-400" size={24} />
                  : <Mic className="text-emerald-600 dark:text-emerald-500" size={24} />}
              </button>
            </div>
          </div>
        </div>

        {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl mb-6 text-center border border-red-100 font-medium">{error}</div>}

        <button
          id="primary-support-button"
          className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 text-white text-2xl font-bold rounded-2xl mt-auto shadow-md active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:active:scale-100"
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          aria-label="I need support now"
        >
          {loading ? 'Getting support...' : 'I need support now'}
        </button>
      </div>
    </div>
  );
}

export default MainScreen;
