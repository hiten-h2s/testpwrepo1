import React, { useState } from 'react';

function Onboarding({ user, onComplete }) {
  const [name, setName] = useState('');
  const [trustedContact, setTrustedContact] = useState('');
  const [calmingPhrase, setCalmingPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          trusted_contact: trustedContact,
          calming_phrase: calmingPhrase
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save profile');
      }
      
      const data = await response.json();
      onComplete(data.profile);
    } catch (err) {
      setError('Something went wrong — please try again');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete({ name: '', trusted_contact: '', calming_phrase: '' });
  };

  const copyInviteCode = () => {
    if (user?.inviteCode) {
      navigator.clipboard.writeText(user.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card container p-6 max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-2">Welcome to SafeSpace</h2>
      <p className="text-slate-600 mb-6">Take a moment to set up your support profile.</p>
      
      {user?.inviteCode && (
        <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 mb-6 flex justify-between items-center">
          <div>
            <span className="block text-xs font-semibold text-teal-800 uppercase tracking-wider">Your Invite Code</span>
            <span className="text-xl font-mono text-teal-900">{user.inviteCode}</span>
          </div>
          <button 
            onClick={copyInviteCode}
            className="px-3 py-1 bg-teal-100 text-teal-800 text-sm font-medium rounded-lg hover:bg-teal-200"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}

      <div className="space-y-4">
        <input 
          type="text" 
          placeholder="Your Name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="w-full p-4 border rounded-xl"
        />
        
        <input 
          type="text" 
          placeholder="Trusted Contact Name (e.g. Rahul, Sister)" 
          value={trustedContact}
          onChange={(e) => setTrustedContact(e.target.value)}
          maxLength={100}
          className="w-full p-4 border rounded-xl"
        />
        
        <input 
          type="text" 
          placeholder="A calming phrase that works for you" 
          value={calmingPhrase}
          onChange={(e) => setCalmingPhrase(e.target.value)}
          maxLength={250}
          className="w-full p-4 border rounded-xl"
        />
      </div>

      <div className="mt-6 space-y-3">
        <button 
          className="w-full py-4 bg-slate-800 text-white rounded-xl font-medium" 
          onClick={handleSave} 
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        <button 
          className="w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-medium" 
          onClick={handleSkip}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

export default Onboarding;
