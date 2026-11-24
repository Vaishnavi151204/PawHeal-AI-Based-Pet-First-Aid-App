import { useState } from 'react';
import { ArrowRight, HeartPulse, ShieldCheck, Stethoscope } from 'lucide-react';
import { apiRequest, setStoredToken } from '../lib/api';
import type { UserProfile } from '../types/pawheal';

interface AuthScreenProps {
  onAuthenticated: (user: UserProfile) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setStoredToken(res.token);
        onAuthenticated(res.user);
      } else if (mode === 'signup') {
        const res = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ fullName, email, password }),
        });
        setStoredToken(res.token);
        onAuthenticated(res.user);
      } else if (mode === 'forgot') {
        const res = await apiRequest<{ message: string; demoResetCode?: string }>(
          '/api/auth/forgot-password',
          {
            method: 'POST',
            body: JSON.stringify({ email }),
          },
        );
        setNotice(
          res.demoResetCode
            ? `${res.message} Verification code: ${res.demoResetCode}`
            : res.message,
        );
        setMode('reset');
      } else if (mode === 'reset') {
        const res = await apiRequest<{ message: string }>('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email, code: resetCode, newPassword: password }),
        });
        setNotice(res.message);
        setPassword('');
        setResetCode('');
        setMode('login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#111817] flex flex-col">
      <header className="border-b border-[#E2E8E2] bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <span className="font-display text-lg font-bold tracking-tight text-[#0F766E] whitespace-nowrap shrink-0">
            PawHeal
          </span>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[#4A5553]">
            <span className="whitespace-nowrap shrink-0">Injury Triage</span>
            <span className="whitespace-nowrap shrink-0">Care Assistant</span>
            <span className="whitespace-nowrap shrink-0">Clinic Locator</span>
            <span className="whitespace-nowrap shrink-0">Health Records</span>
          </nav>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setNotice(null);
              setMode(mode === 'signup' ? 'login' : 'signup');
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0F766E] rounded-lg hover:bg-[#0D655E] transition-colors whitespace-nowrap shrink-0"
          >
            {mode === 'signup' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <section className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-[#E2E8E2] bg-[#E8ECE8] min-h-[380px] flex flex-col justify-end">
          <img
            src="/src/assets/images/hero_pet_care_1795541849091.jpg"
            alt="Calm golden retriever resting on a veterinary examination table beside a stethoscope"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1F1D]/90 via-[#0D1F1D]/45 to-transparent" />
          <div className="relative z-10 p-8 text-white max-w-xl">
            <p className="text-xs font-medium tracking-wide text-[#99F6E4] mb-2">
              Pet First-Aid & Veterinary Support
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-balance mb-3">
              Calm, structured pet triage when every minute matters.
            </h1>
            <p className="text-sm sm:text-base text-white/85 leading-relaxed mb-6">
              Organize your pets&apos; medical histories, review visible injuries with multimodal AI guidance, consult the care assistant, and locate nearby veterinary clinics.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/20 text-xs text-white/90">
              <div className="flex items-start gap-2">
                <HeartPulse className="w-4 h-4 text-[#5EEAD4] shrink-0 mt-0.5" />
                <span>Guided injury triage & safe first-aid steps</span>
              </div>
              <div className="flex items-start gap-2">
                <Stethoscope className="w-4 h-4 text-[#5EEAD4] shrink-0 mt-0.5" />
                <span>Pet-aware care chat & clinic finder</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#5EEAD4] shrink-0 mt-0.5" />
                <span>Vaccination, medication & weight tracking</span>
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8E2] p-8 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-[#111817]">
              {mode === 'login' && 'Sign in to PawHeal'}
              {mode === 'signup' && 'Create your PawHeal account'}
              {mode === 'forgot' && 'Reset your password'}
              {mode === 'reset' && 'Enter verification code'}
            </h2>
            <p className="text-sm text-[#4A5553] mt-1">
              {mode === 'login' && 'Access your pet profiles, injury history, and care reminders.'}
              {mode === 'signup' && 'Set up a private workspace for your pets and veterinary records.'}
              {mode === 'forgot' && 'We will generate a 6-digit verification code for your account.'}
              {mode === 'reset' && 'Enter the 6-digit code and choose a new password.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {notice && (
            <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-[#111817] mb-1.5" htmlFor="auth-name">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full h-11 px-3.5 rounded-lg border border-[#D4DDD4] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#111817] mb-1.5" htmlFor="auth-email">
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                className="w-full h-11 px-3.5 rounded-lg border border-[#D4DDD4] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
              />
            </div>

            {mode === 'reset' && (
              <div>
                <label className="block text-sm font-medium text-[#111817] mb-1.5" htmlFor="auth-code">
                  6-Digit Verification Code
                </label>
                <input
                  id="auth-code"
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  className="w-full h-11 px-3.5 rounded-lg border border-[#D4DDD4] bg-white text-sm font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
                />
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-[#111817] mb-1.5" htmlFor="auth-password">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full h-11 px-3.5 rounded-lg border border-[#D4DDD4] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 px-5 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Sign In'
                    : mode === 'signup'
                      ? 'Create Account'
                      : mode === 'forgot'
                        ? 'Send Reset Code'
                        : 'Update Password'}
              </span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E2E8E2] flex flex-wrap items-center justify-between gap-3 text-sm">
            {mode === 'login' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setNotice(null);
                    setMode('forgot');
                  }}
                  className="text-[#4A5553] hover:text-[#111817] underline cursor-pointer"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setNotice(null);
                    setMode('signup');
                  }}
                  className="font-medium text-[#0F766E] hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setNotice(null);
                  setMode('login');
                }}
                className="font-medium text-[#0F766E] hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            )}
          </div>

          <p className="mt-6 text-xs text-[#64716E] leading-relaxed">
            Informational pet first-aid tool only. For severe bleeding, poisoning, seizures, or breathing distress, contact an emergency veterinary clinic immediately.
          </p>
        </section>
      </main>
    </div>
  );
}
