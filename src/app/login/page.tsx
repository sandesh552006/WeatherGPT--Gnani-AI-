'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRole } from '@/lib/supabase/auth-helpers';
import { useTranslation, LanguageProvider } from '@/lib/i18n/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/i18n/types';
import {
  User,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  ChevronDown,
  Check,
  ShieldCheck,
  Cloud,
  Calendar,
  Map,
  AlertTriangle,
  Leaf,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'forgot';
type LoginRoleType = 'user' | 'admin';

function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, setLanguage, t } = useTranslation();
  const authT = t.auth || {
    signIn: 'Sign In',
    signUp: 'Create New Account',
    userLogin: 'User Login',
    adminLogin: 'Admin Login',
    emailAddress: 'Email address',
    password: 'Password',
    confirmPassword: 'Confirm password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    continueWithGoogle: 'Continue with Google',
    dontHaveAccount: "Don't have an account?",
    createOne: 'Create one',
    alreadyHaveAccount: 'Already have an account?',
    backToSignIn: 'Back to Sign In',
    safeAndSecure: 'Safe & Secure',
    safeAndSecureDesc:
      'Your data is protected. We only use your information to enhance your weather experience.',
    welcomeTitle: 'Welcome to WeatherGPT',
    welcomeSubtitle: 'Your Weather Companion',
    welcomeDescription:
      'Sign in to access real-time weather, forecasts, alerts and more — in your language.',
    heroTitle: 'Smarter Weather for a',
    heroTitleHighlight: 'Better Tomorrow',
    heroSubtitle: 'Get real-time weather, forecasts, alerts, maps and more — all in your language.',
    heroQuote: '“Clearer insights. Safer days. A smarter you.”',
    realtimeWeather: 'Real-time Weather',
    forecast7Day: '7-Day Forecast',
    interactiveMaps: 'Interactive Maps',
    alertsWarnings: 'Alerts & Warnings',
    climateInsights: 'Climate Insights',
    sectoralAdvisory: 'Sectoral Advisory',
    signingIn: 'Signing in...',
    creatingAccount: 'Creating account...',
    adminAccessDenied: 'Admin access is not available for this account.',
    invalidCredentials: 'Invalid email or password. Please try again.',
    resetPasswordTitle: 'Reset Password',
    resetPasswordDescription:
      'Enter your email address and we will send you a password reset link.',
    sendResetLink: 'Send Reset Link',
    resetEmailSent: 'Password reset link sent! Please check your email inbox.',
    signUpSuccess:
      'Account created! Please check your email to verify your account before signing in.',
    logout: 'Sign Out',
    role: 'Role',
    user: 'User',
    admin: 'Admin',
    adminBadge: 'ADMIN',
    userBadge: 'USER',
  };

  const [mode, setMode] = useState<AuthMode>('signin');
  const [selectedRole, setSelectedRole] = useState<LoginRoleType>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close language menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check query parameter errors
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'auth-callback-failed') {
      setErrorMsg('Authentication link expired or invalid. Please try signing in again.');
    }
  }, [searchParams]);

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg(authT.invalidCredentials);
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      if (!data.user) {
        setErrorMsg(authT.invalidCredentials);
        setLoading(false);
        return;
      }

      // STRICT AUTHORIZATION CHECK FOR ADMIN LOGIN:
      if (selectedRole === 'admin') {
        const verifiedRole = await getUserRole(supabase, data.user.id);
        if (verifiedRole !== 'admin') {
          // Normal user selected Admin login: Access Denied!
          await supabase.auth.signOut();
          setErrorMsg(authT.adminAccessDenied);
          setLoading(false);
          return;
        }
      }

      // Authentication & Authorization succeeded -> Proceed to Dashboard
      if (selectedRole === 'admin') {
  router.push('/admin');
} else {
  router.push('/');
}

router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        // Automatically signed in
        router.push('/');
        router.refresh();
      } else {
        // Email confirmation is required
        setSuccessMsg(authT.signUpSuccess);
        setMode('signin');
        setPassword('');
        setConfirmPassword('');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create account.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(authT.resetEmailSent);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#060e1a] text-slate-100 flex flex-col justify-between relative overflow-x-hidden font-sans selection:bg-sky-500 selection:text-white">
      {/* Background Weather Landscape with Golden Sunrise */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-65 md:opacity-75 z-0"
        style={{
          backgroundImage: "url('/images/weather-auth-bg.jpg')",
        }}
      />
      {/* Atmospheric Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#060e1a] via-[#060e1a]/80 to-transparent z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#060e1a] via-transparent to-[#060e1a]/70 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/40 to-slate-950/80 z-0 pointer-events-none" />

      {/* TOP BAR */}
      <header className="relative z-20 w-full px-4 py-3.5 sm:px-6 sm:py-5 md:px-12 flex items-center justify-between">
        {/* WeatherGPT Brand Header (Matches Existing Logo & Subtitle) */}
        <div className="flex items-center gap-3 select-none">
          <img
            src="/weathergpt-logo.jpg"
            alt="WeatherGPT Logo"
            className="h-10 w-10 sm:h-11 sm:w-11 object-contain rounded-2xl shadow-lg shadow-sky-500/20 border border-sky-500/30 ring-1 ring-white/10 flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xl md:text-2xl font-black text-white tracking-tight truncate">
                Weather<span className="text-sky-400">GPT</span>
              </span>
            </div>
            <p className="text-[11px] md:text-xs text-slate-400 font-medium tracking-wide truncate">
              {authT.welcomeSubtitle || 'Your Weather Companion'}
            </p>
          </div>
        </div>

        {/* Global Language Selector Dropdown */}
        <div className="relative flex-shrink-0" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 rounded-full bg-slate-900/70 hover:bg-slate-800/80 border border-slate-700/60 backdrop-blur-md text-xs font-medium text-slate-200 transition-all shadow-md"
            aria-label="Select Language"
          >
            <Globe className="h-3.5 w-3.5 text-sky-400" />
            <span>{currentLangObj.nativeName}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-44 max-w-[calc(100vw-2rem)] rounded-2xl bg-[#0b192c]/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                {SUPPORTED_LANGUAGES.map((opt) => {
                  const isSelected = opt.code === language;
                  return (
                    <button
                      key={opt.code}
                      onClick={() => {
                        setLanguage(opt.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                        isSelected
                          ? 'bg-sky-500 text-white font-medium shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{opt.nativeName} ({opt.label})</span>
                      {isSelected && <Check className="h-3.5 w-3.5 ml-1 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MAIN VIEWPORT: SPLIT-SCREEN LAYOUT */}
      <main className="relative z-10 w-full px-4 py-3 sm:px-8 md:px-12 lg:px-16 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: AUTHENTICATION CARD */}
          <div className="w-full lg:col-span-6 xl:col-span-5 flex flex-col justify-center max-w-lg mx-auto lg:mx-0">
            {/* Primary Glowing Glassmorphic Container */}
            <div className="relative rounded-[28px] bg-[#0c182b]/85 backdrop-blur-2xl border border-sky-500/30 p-5 sm:p-7 md:p-8 shadow-[0_0_50px_-10px_rgba(14,165,233,0.22)] ring-1 ring-sky-400/20">
              
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      {mode === 'signin' && (
                        <>
                          {authT.welcomeTitle.split('WeatherGPT')[0]}
                          <span className="text-white">Weather</span>
                          <span className="text-sky-400">GPT</span>
                        </>
                      )}
                      {mode === 'signup' && authT.signUp}
                      {mode === 'forgot' && authT.resetPasswordTitle}
                    </h2>
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-slate-300 mt-1">
                    {authT.welcomeSubtitle}
                  </p>
                </div>

                {/* Weather Accent Icon */}
                <div className="relative p-2 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex-shrink-0 shadow-inner">
                  <Cloud className="h-7 w-7 text-sky-400" />
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 absolute top-1 right-1 animate-pulse" />
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                {mode === 'signin' && authT.welcomeDescription}
                {mode === 'signup' && 'Create your free account to access real-time weather alerts and AI-driven insights.'}
                {mode === 'forgot' && authT.resetPasswordDescription}
              </p>

              {/* Status Notifications */}
              {errorMsg && (
                <div className="mb-4 bg-rose-950/70 border border-rose-500/40 rounded-2xl p-3 flex items-start gap-2.5 text-rose-200 text-xs shadow-md animate-in fade-in duration-200">
                  <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-3 flex items-start gap-2.5 text-emerald-200 text-xs shadow-md animate-in fade-in duration-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* SIGN-IN FORM */}
              {mode === 'signin' && (
                <>
                  {/* Segmented User / Admin Toggle */}
                  <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#091322] border border-slate-800/80 mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('user');
                        setErrorMsg(null);
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        selectedRole === 'user'
                          ? 'bg-[#1d68f5] text-white shadow-lg shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>{authT.userLogin}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('admin');
                        setErrorMsg(null);
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        selectedRole === 'admin'
                          ? 'bg-[#1d68f5] text-white shadow-lg shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span>{authT.adminLogin}</span>
                    </button>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    {/* Email Input */}
                    <div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={authT.emailAddress}
                          required
                          disabled={loading}
                          className="w-full pl-11 pr-4 py-3 bg-[#0f1d32]/90 border border-slate-700/70 rounded-2xl text-xs md:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={authT.password}
                          required
                          disabled={loading}
                          className="w-full pl-11 pr-11 py-3 bg-[#0f1d32]/90 border border-slate-700/70 rounded-2xl text-xs md:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded-md border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-400 focus:ring-offset-0 cursor-pointer accent-sky-500"
                        />
                        <span>{authT.rememberMe}</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
                      >
                        {authT.forgotPassword}
                      </button>
                    </div>

                    {/* Primary Sign In Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-[#0284c7] via-[#0284c7] to-[#0369a1] hover:brightness-110 active:scale-[0.99] text-white font-semibold text-sm rounded-2xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer mt-2"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{authT.signingIn}</span>
                        </div>
                      ) : (
                        <>
                          <span>{authT.signIn}</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Switch to Sign Up */}
                  <div className="mt-6 text-center text-xs text-slate-400">
                    <span>{authT.dontHaveAccount} </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 ml-1"
                    >
                      {authT.createOne}
                    </button>
                  </div>
                </>
              )}

              {/* SIGN-UP FORM */}
              {mode === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={authT.emailAddress}
                      required
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3 bg-[#0f1d32]/90 border border-slate-700/70 rounded-2xl text-xs md:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={authT.password}
                      required
                      disabled={loading}
                      className="w-full pl-11 pr-11 py-3 bg-[#0f1d32]/90 border border-slate-700/70 rounded-2xl text-xs md:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={authT.confirmPassword}
                      required
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3 bg-[#0f1d32]/90 border border-slate-700/70 rounded-2xl text-xs md:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 px-1">
                    Newly registered accounts automatically join as standard <span className="font-semibold text-slate-200">USER</span>.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-[#0284c7] via-[#0284c7] to-[#0369a1] hover:brightness-110 active:scale-[0.99] text-white font-semibold text-sm rounded-2xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{authT.creatingAccount}</span>
                      </div>
                    ) : (
                      <>
                        <span>{authT.signUp}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="mt-4 text-center text-xs text-slate-400">
                    <span>{authT.alreadyHaveAccount} </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 ml-1"
                    >
                      {authT.signIn}
                    </button>
                  </div>
                </form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {mode === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={authT.emailAddress}
                      required
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3 bg-[#0f1d32]/90 border border-slate-700/70 rounded-2xl text-xs md:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-[#0284c7] via-[#0284c7] to-[#0369a1] hover:brightness-110 active:scale-[0.99] text-white font-semibold text-sm rounded-2xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Link...</span>
                      </div>
                    ) : (
                      <>
                        <span>{authT.sendResetLink}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="mt-4 text-center text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-sky-400 hover:text-sky-300 font-semibold transition-colors"
                    >
                      ← {authT.backToSignIn}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* SAFE & SECURE CARD (Matches Reference Image) */}
            <div className="mt-4 rounded-2xl bg-[#0c182b]/75 backdrop-blur-xl border border-slate-800/80 p-4 flex items-center gap-3.5 shadow-lg">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-inner">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white tracking-wide">
                  {authT.safeAndSecure}
                </h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  {authT.safeAndSecureDesc}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: HERO TEXT & 6 CORE FEATURE BADGES (Matches Reference Image) */}
          <div className="w-full lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-6 lg:pl-6">
            
            {/* Big Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.15]">
                {authT.heroTitle} <br className="hidden md:block" />
                <span className="text-[#38bdf8] drop-shadow-[0_0_35px_rgba(56,189,248,0.4)]">
                  {authT.heroTitleHighlight}
                </span>
              </h1>
              <p className="text-sm md:text-base text-slate-300 max-w-xl leading-relaxed">
                {authT.heroSubtitle}
              </p>
            </div>

            {/* Floating Glassmorphic Quote Badge */}
            <div className="max-w-md p-4 md:p-5 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-700/50 shadow-xl">
              <p className="text-xs md:text-sm italic font-medium text-slate-200">
                {authT.heroQuote}
              </p>
            </div>

            {/* 6 Core Feature Badges Grid */}
            <div className="pt-2">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 md:gap-3">
                
                {/* 1. Real-time Weather */}
                <div className="p-3 rounded-2xl bg-[#0c182b]/80 backdrop-blur-md border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col items-center text-center group shadow-md">
                  <div className="h-9 w-9 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400 mb-2 group-hover:scale-110 transition-transform">
                    <Cloud className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-semibold text-slate-300 leading-tight">
                    {authT.realtimeWeather}
                  </span>
                </div>

                {/* 2. 7-Day Forecast */}
                <div className="p-3 rounded-2xl bg-[#0c182b]/80 backdrop-blur-md border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col items-center text-center group shadow-md">
                  <div className="h-9 w-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-semibold text-slate-300 leading-tight">
                    {authT.forecast7Day}
                  </span>
                </div>

                {/* 3. Interactive Maps */}
                <div className="p-3 rounded-2xl bg-[#0c182b]/80 backdrop-blur-md border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col items-center text-center group shadow-md">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                    <Map className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-semibold text-slate-300 leading-tight">
                    {authT.interactiveMaps}
                  </span>
                </div>

                {/* 4. Alerts & Warnings */}
                <div className="p-3 rounded-2xl bg-[#0c182b]/80 backdrop-blur-md border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col items-center text-center group shadow-md">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-semibold text-slate-300 leading-tight">
                    {authT.alertsWarnings}
                  </span>
                </div>

                {/* 5. Climate Insights */}
                <div className="p-3 rounded-2xl bg-[#0c182b]/80 backdrop-blur-md border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col items-center text-center group shadow-md">
                  <div className="h-9 w-9 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-400 mb-2 group-hover:scale-110 transition-transform">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-semibold text-slate-300 leading-tight">
                    {authT.climateInsights}
                  </span>
                </div>

                {/* 6. Sectoral Advisory */}
                <div className="p-3 rounded-2xl bg-[#0c182b]/80 backdrop-blur-md border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col items-center text-center group shadow-md">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-semibold text-slate-300 leading-tight">
                    {authT.sectoralAdvisory}
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER (Matches Reference Image) */}
      <footer className="relative z-20 w-full px-6 py-4 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-xs border-t border-slate-800/60 bg-[#060e1a]/80 backdrop-blur-sm">
        <p>© 2025 WeatherGPT. All rights reserved.</p>
        <div className="flex items-center gap-5 font-medium text-slate-400">
          <span className="hover:text-slate-200 cursor-pointer transition-colors">About</span>
          <span className="hover:text-slate-200 cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-slate-200 cursor-pointer transition-colors">Terms</span>
          <span className="hover:text-slate-200 cursor-pointer transition-colors">Contact</span>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <LanguageProvider>
      <Suspense fallback={<div className="min-h-screen bg-[#060e1a]" />}>
        <LoginScreen />
      </Suspense>
    </LanguageProvider>
  );
}

