import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string) => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await onLogin(email);
    } else {
      setError('Please enter a valid email address.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-zinc-950">
      <div className="bg-zinc-900 p-10 rounded-2xl shadow-2xl max-w-md w-full border border-zinc-800">
        <div className="mb-8">
             <h1 className="text-3xl font-bold text-white tracking-tight mb-2">AutonomHub</h1>
             <p className="text-zinc-400">Sign in to access your agent workspace.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div className="text-left">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="name@company.com"
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white focus:outline-none transition-all text-white placeholder:text-zinc-600"
                required
              />
          </div>
          {error && <p className="text-red-400 text-sm text-left">{error}</p>}
          <button
            type="submit"
            className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3.5 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;