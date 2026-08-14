import React, { useState } from 'react';

const AuthScreen = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = { email, password, role };
    if (!isLogin && role === 'caregiver') {
      payload.inviteCode = inviteCode;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Re-fetch the /me endpoint or just use the data
      // For simplicity, we trigger the callback which fetches /me in App.jsx
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h1 className="text-3xl font-semibold text-slate-800 mb-2 text-center">SafeSpace</h1>
        <p className="text-slate-500 text-center mb-8">
          {isLogin ? 'Welcome back.' : 'Create an account.'}
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'patient' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
            onClick={() => setRole('patient')}
          >
            Patient
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'caregiver' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
            onClick={() => setRole('caregiver')}
          >
            Caregiver
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email"
              required
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password"
              required
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          
          {!isLogin && role === 'caregiver' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient's Invite Code</label>
              <input 
                type="text"
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 uppercase"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3"
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium text-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
