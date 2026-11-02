'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation, LanguageProvider } from '@/lib/i18n/LanguageContext';

function ResetPasswordContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const authT = t.auth || {
    password: 'Password',
    confirmPassword: 'Confirm password',
    signIn: 'Sign In',
  };

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060e1a] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background with blur */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 filter blur-sm scale-105"
        style={{ backgroundImage: "url('/images/weather-auth-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#060e1a] via-[#060e1a]/80 to-transparent" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0c182b]/85 backdrop-blur-xl border border-sky-500/30 shadow-[0_0_50px_-12px_rgba(14,165,233,0.25)] rounded-3xl p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/weathergpt-logo.jpg"
            alt="WeatherGPT Logo"
            className="h-10 w-10 object-contain rounded-xl shadow-md shadow-blue-500/20"
          />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">WeatherGPT</h1>
            <p className="text-xs text-slate-400">Update Your Password</p>
          </div>
        </div>

        {success ? (
          <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-6 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Password Updated!</h3>
            <p className="text-sm text-slate-300 mb-4">
              Your password has been changed successfully. Redirecting you to WeatherGPT...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Set New Password</h2>
            <p className="text-xs text-slate-400">
              Please enter and confirm your new secure password below.
            </p>

            {error && (
              <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3 flex items-start gap-2.5 text-rose-200 text-xs">
                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#0f1d32]/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-[#0f1d32]/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#0284c7] via-[#0284c7] to-[#0369a1] hover:brightness-110 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save Password & Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <LanguageProvider>
      <ResetPasswordContent />
    </LanguageProvider>
  );
}
