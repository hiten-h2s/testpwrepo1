import React, { useState, useEffect } from 'react';
import { PhoneCall } from 'lucide-react';

function EmergencyCard() {
  const [region, setRegion] = useState('national');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        // Approximate bounding box for Kerala/South India
        if (latitude > 8 && latitude < 13 && longitude > 74 && longitude < 78) {
          setRegion('kerala');
        }
      }, () => {
        // silent: geolocation unavailable, defaults to national resources
      }, { timeout: 5000 });
    }
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col justify-center min-h-[60vh]">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-red-100 dark:border-red-900 shadow-xl text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <PhoneCall size={40} />
        </div>
        
        <h2 className="text-3xl font-bold text-red-700 dark:text-red-400 mb-4">Please call for help right now.</h2>
        <p className="text-slate-600 dark:text-slate-300 text-lg mb-10">We detected you might be in immediate danger.</p>
        
        <div className="flex flex-col gap-4">
          <a href="tel:112" style={{ textDecoration: 'none' }}>
            <button className="w-full h-20 bg-red-600 hover:bg-red-700 text-white text-2xl font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-md active:scale-95" aria-label="Call 112 (National Emergency)">
              Call 112 (National Emergency)
            </button>
          </a>

          {region === 'kerala' ? (
            <>
              <a href="tel:14416" style={{ textDecoration: 'none' }}>
                <button className="w-full h-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-lg font-bold rounded-2xl transition-colors active:scale-95" aria-label="Call Tele-MANAS Kerala">
                  Call Tele-MANAS Kerala (14416)
                </button>
              </a>
              <a href="tel:1056" style={{ textDecoration: 'none' }}>
                <button className="w-full h-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-lg font-bold rounded-2xl transition-colors active:scale-95" aria-label="Call DISHA Helpline">
                  Call DISHA Helpline (1056)
                </button>
              </a>
            </>
          ) : (
            <a href="tel:9152987821" style={{ textDecoration: 'none' }}>
              <button className="w-full h-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-lg font-bold rounded-2xl transition-colors active:scale-95" aria-label="Call KIRAN (Mental Health Helpline)">
                Call KIRAN (1800-599-0019)
              </button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmergencyCard;
