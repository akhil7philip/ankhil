import { useState, useEffect } from 'react';

const PASSCODE = 'rion';
const STORAGE_KEY = 'ankhil-site-unlocked';

export default function PasscodeGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setUnlocked(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().toLowerCase() === PASSCODE) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setInput('');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#3B2F2F] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-[#C4A055] rounded-full animate-spin" />
      </div>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#3B2F2F] flex items-center justify-center px-5">
      <div className="bg-[#F5F1EB] rounded-[4px] p-8 md:p-12 w-full max-w-[400px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] text-center">
        <h1 className="font-serif-display text-3xl text-[#3B2F2F] mb-1">A & A</h1>
        <p className="font-sans-body text-sm text-[#3B2F2F]/60 mb-8">
          Enter the passcode to view the wedding site.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Passcode"
            autoFocus
            className="w-full bg-white border border-[rgba(59,47,47,0.15)] rounded-[2px] px-4 py-3 font-sans-body text-[15px] text-[#3B2F2F] placeholder:text-[#3B2F2F]/40 focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200 mb-4 text-center tracking-[0.2em]"
          />
          {error && (
            <p className="text-xs text-[#7B2D41] mb-3">Incorrect passcode.</p>
          )}
          <button
            type="submit"
            className="w-full bg-[#3B2F2F] text-white font-sans-body text-xs font-semibold uppercase tracking-[0.12em] py-3.5 hover:bg-[#C4A055] transition-colors duration-300"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
