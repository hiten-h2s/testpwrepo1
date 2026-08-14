import React, { useState } from 'react';
import { Sparkles, RefreshCcw, X } from 'lucide-react';

function KinestheticGrounding({ onClose }) {
  const [nodes, setNodes] = useState(
    Array.from({ length: 16 }).map((_, i) => ({ id: i, popped: false }))
  );

  const handleTouch = (id) => {
    // Kinesthetic Haptic Grounding
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    setNodes(prev => prev.map(node => 
      node.id === id ? { ...node, popped: true } : node
    ));
  };

  const handleReset = () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
    setNodes(prev => prev.map(node => ({ ...node, popped: false })));
  };

  const allPopped = nodes.every(n => n.popped);

  return (
    <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-700 relative overflow-hidden flex flex-col items-center">
      
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
      )}

      <div className="text-center mb-6 mt-2">
        <h3 className="text-xl font-bold text-slate-100 flex items-center justify-center gap-2 mb-2">
          <Sparkles className="text-teal-400" size={24} />
          Sensory Grounding
        </h3>
        <p className="text-slate-400 text-sm">Tap the nodes slowly to connect with your senses.</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {nodes.map(node => (
          <button
            key={node.id}
            onPointerDown={() => !node.popped && handleTouch(node.id)}
            className={`w-16 h-16 rounded-full transition-all duration-500 flex items-center justify-center
              ${node.popped 
                ? 'bg-slate-800 border-2 border-slate-700 scale-95 opacity-50 shadow-inner' 
                : 'bg-gradient-to-br from-teal-400 to-teal-600 border-2 border-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.4)] hover:scale-105 active:scale-90 cursor-pointer'
              }
            `}
            disabled={node.popped}
            aria-label={`Node ${node.id}`}
          >
            {node.popped && <div className="w-2 h-2 rounded-full bg-teal-500/20" />}
          </button>
        ))}
      </div>

      {allPopped && (
        <div className="flex flex-col items-center animate-fade-in">
          <p className="text-teal-400 font-medium mb-4">Great job staying present.</p>
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors text-sm font-bold"
          >
            <RefreshCcw size={16} /> Reset Pattern
          </button>
        </div>
      )}
    </div>
  );
}

export default KinestheticGrounding;
