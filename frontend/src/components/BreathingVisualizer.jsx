import React, { useState, useEffect } from 'react';

const phases = [
  { text: 'Breathe In', duration: 4, scale: 'scale-125' },
  { text: 'Hold', duration: 4, scale: 'scale-125' },
  { text: 'Breathe Out', duration: 4, scale: 'scale-100' },
  { text: 'Hold', duration: 4, scale: 'scale-100' }
];

function BreathingVisualizer({ isSpeaking }) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    // 4 phases, 4 seconds each. We just update the phase every 4 seconds.
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % phases.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentPhase = phases[phaseIndex];

  return (
    <div className="flex flex-col items-center justify-center my-8 h-48">
      <div 
        className={`
          relative flex items-center justify-center 
          w-32 h-32 rounded-full 
          border-4 border-teal-400 bg-teal-500/20 
          transition-transform duration-[4000ms] ease-in-out
          ${currentPhase.scale}
          ${isSpeaking ? 'animate-pulse shadow-[0_0_15px_rgba(45,212,191,0.6)]' : ''}
        `}
      >
        <span className="text-teal-800 dark:text-teal-200 font-bold tracking-wide transition-opacity duration-1000">
          {currentPhase.text}
        </span>
      </div>
    </div>
  );
}

export default BreathingVisualizer;
