import React from 'react';

const EducationLibrary = () => {
  return (
    <div className="flex flex-col flex-1 p-6 space-y-6 overflow-y-auto pb-24">
      <h2 className="text-2xl font-semibold text-slate-800">Education Library</h2>
      
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-medium text-slate-800 mb-2">Understanding Cravings</h3>
        <p className="text-slate-600 leading-relaxed">
          Cravings are temporary. They often peak within 15-20 minutes and then begin to subside. 
          Recognizing a craving as a temporary wave rather than a permanent state can help you ride it out safely.
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-medium text-slate-800 mb-2">The 5-4-3-2-1 Grounding Technique</h3>
        <p className="text-slate-600 leading-relaxed mb-3">
          When you feel overwhelmed, use your senses to bring you back to the present moment:
        </p>
        <ul className="list-disc pl-5 text-slate-600 space-y-1">
          <li><strong>5</strong> things you can see</li>
          <li><strong>4</strong> things you can physically feel</li>
          <li><strong>3</strong> things you can hear</li>
          <li><strong>2</strong> things you can smell</li>
          <li><strong>1</strong> thing you can taste</li>
        </ul>
      </div>

      <div className="bg-teal-50 p-5 rounded-2xl shadow-sm border border-teal-100">
        <h3 className="text-lg font-medium text-teal-900 mb-2">When to Seek Medical Help</h3>
        <p className="text-teal-800 leading-relaxed">
          If you or someone else experiences severe physical withdrawal symptoms, confusion, loss of consciousness, or difficulty breathing, do not wait. Call emergency services immediately (112).
        </p>
      </div>
    </div>
  );
};

export default EducationLibrary;
