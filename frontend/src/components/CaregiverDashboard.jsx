import React, { useState, useEffect } from 'react';
import { MessageSquare, HeartPulse } from 'lucide-react';
import EmergencyCard from './EmergencyCard';

const CaregiverDashboard = ({ profile }) => {
  const [situation, setSituation] = useState('');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null);

  const linkedPatient = { name: profile?.name || 'Your linked patient' };

  useEffect(() => {
    const checkAlert = async () => {
      try {
        const res = await fetch('/api/caregiver/alert-status');
        if (res.ok) {
          const data = await res.json();
          if (data.pendingAlert) {
            setAlert(data);
          } else {
            setAlert(null);
          }
        }
      } catch {
        // silent: alert polling failure is non-critical
      }
    };
    checkAlert();
    const interval = setInterval(checkAlert, 10000); // 10s
    return () => clearInterval(interval);
  }, []);

  const handleClearAlert = async () => {
    try {
      await fetch('/api/caregiver/clear-alert', { method: 'POST' });
      setAlert(null);
    } catch {
      // silent: clear-alert failure is non-critical
    }
  };

  const handleGenerateFromAlert = async () => {
    if (!alert?.lastAlertText) return;
    setSituation(alert.lastAlertText);
    await handleClearAlert();
    
    // Programmatically trigger ask advice
    triggerAdvice(alert.lastAlertText);
  };

  const triggerAdvice = async (textToSend) => {
    setLoading(true);
    setError('');
    setAdvice(null);

    try {
      const res = await fetch('/api/caregiver/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend })
      });
      
      if (!res.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await res.json();
      setAdvice(data);
    } catch (err) {
      setError('Something went wrong — please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleAskAdvice = async (e) => {
    e.preventDefault();
    if (!situation.trim()) return;
    triggerAdvice(situation);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-emerald-900">Linked Patient</h2>
            <p className="text-slate-500 text-sm">You are listed as their trusted contact.</p>
          </div>
          <div className="bg-emerald-50 px-6 py-4 rounded-2xl border border-emerald-100">
            <p className="text-lg font-bold text-emerald-800">{linkedPatient.name}</p>
          </div>
        </div>

        <div className="col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-slate-500 text-sm mb-2">Status</p>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${alert ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            <span className={`font-bold ${alert ? 'text-red-600' : 'text-slate-700'}`}>{alert ? 'Action Needed' : 'Monitoring'}</span>
          </div>
        </div>
      </div>

      {alert && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between shadow-sm animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="bg-red-100 text-red-600 p-3 rounded-full">
              <HeartPulse size={24} />
            </div>
            <div>
              <h3 className="text-red-800 font-bold text-lg">🚨 Patient requested support.</h3>
              <p className="text-red-600 text-sm">They recently expressed distress: "{alert.lastAlertText}"</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleClearAlert}
              className="px-4 py-2 text-red-700 bg-red-100 hover:bg-red-200 font-medium rounded-xl transition-colors flex-1 md:flex-none"
            >
              Dismiss
            </button>
            <button 
              onClick={handleGenerateFromAlert}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm transition-colors flex-1 md:flex-none"
            >
              View recommended script
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Provide Support</h3>
        <p className="text-sm text-slate-500 mb-6">Describe the situation, and the AI will suggest the best way to respond to {linkedPatient.name}.</p>
        
        {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl mb-6 text-center border border-red-100 font-medium">{error}</div>}

        <div className="flex flex-col mb-6">
          <textarea 
            className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-base focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none min-h-[150px]"
            placeholder={`e.g. ${linkedPatient.name} is pacing and says they need to leave right now...`}
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            disabled={loading}
          />
        </div>

        <button 
          className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:active:scale-100"
          onClick={handleAskAdvice}
          disabled={loading || !situation.trim()}
        >
          {loading ? 'Analyzing situation...' : 'Get Advice'}
        </button>
      </div>

      {advice && (
        <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          {advice.emergency ? (
            <EmergencyCard />
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Suggested Action Plan</h3>
              </div>
              
              <div className="space-y-4 text-slate-700">
                {advice.script && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <h4 className="text-xs uppercase font-bold tracking-wider mb-2 text-emerald-600">💬 What to say right now:</h4>
                    <p className="text-lg">"{advice.script}"</p>
                  </div>
                )}
                {advice.avoid_tip && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <h4 className="text-xs uppercase font-bold tracking-wider mb-2 text-red-600">🚫 What NOT to say:</h4>
                    <p className="text-sm">{advice.avoid_tip}</p>
                  </div>
                )}
                {advice.physical_action && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <h4 className="text-xs uppercase font-bold tracking-wider mb-2 text-blue-600">🧘 Physical grounding action:</h4>
                    <p className="text-sm">{advice.physical_action}</p>
                  </div>
                )}
              </div>
              
              <button 
                className="mt-8 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors w-full md:w-auto"
                onClick={() => {
                  setAdvice(null);
                  setSituation('');
                }}
              >
                Clear and ask again
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mt-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">General Guidelines</h3>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
          <li>Stay calm and keep your voice steady.</li>
          <li>Do not argue or try to reason logically during an active craving.</li>
          <li>Don't ask "why" questions—they trigger defensiveness.</li>
        </ul>
      </div>

    </div>
  );
};

export default CaregiverDashboard;
