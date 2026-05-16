import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  Smartphone, 
  AlertTriangle,
  Loader2,
  Lock,
  Unlock
} from "lucide-react";
import {
  generateTokenFor2FA,
  getCurrentUserForUpdate,
  VerifyAndToggle2FA,
} from "../../features/actions/auth";
import {
  clearOTPGenerated,
  clearSecretToken,
} from "../../features/slices/auth";
import { Button } from "../../components/ui/button";
import { successToast } from "../../utils/extra";

const TwoFactorAuthSection = () => {
  const dispatch = useDispatch();
  const { userData, isLoading, isSuccess } = useSelector((state) => state.auth);
  const secretToken = userData?.twoFactorAuthenticationSecret;
  const isEnabled = userData?.isTwoFactorAuthenticationEnabled;

  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      dispatch(getCurrentUserForUpdate());
      dispatch(clearOTPGenerated());
    }
  }, [isSuccess, dispatch]);

  useEffect(() => {
    dispatch(getCurrentUserForUpdate());
    return () => {
      dispatch(clearSecretToken());
    };
  }, [dispatch]);

  useEffect(() => {
    setVerificationCode("");
    setError("");
  }, [isEnabled]);

  const handleGenerate = () => {
    setError("");
    setVerificationCode("");
    dispatch(generateTokenFor2FA());
  };

  const copyToClipboard = () => {
    if (!secretToken) return;
    navigator.clipboard.writeText(secretToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitCode = () => {
    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Please enter a valid 6-digit code.");
      return;
    }
    setError("");
    dispatch(VerifyAndToggle2FA({ code: verificationCode }))
      .unwrap()
      .then(() => {
        successToast(`2FA successfully ${isEnabled ? "disabled" : "enabled"}`);
      })
      .catch((err) => {
        setError(err.message || "Invalid verification code. Please try again.");
      });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-700/80">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isEnabled ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
          <ShieldCheck className={`h-6 w-6 ${isEnabled ? 'text-emerald-500' : 'text-amber-500'}`} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Two-Factor Authentication</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Add an extra layer of security to your account</p>
        </div>
      </div>

      <div className="p-6">
        {!isEnabled ? (
          <div className="space-y-6">
            <div className="flex items-start gap-4 rounded-xl bg-blue-50/50 p-4 dark:bg-blue-500/5">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
              <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                Protect your account by requiring a second verification method on login. You'll need an authenticator app like Google Authenticator or Authy.
              </p>
            </div>

            {!secretToken ? (
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="h-11 rounded-xl bg-blue-500 px-6 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:shadow-blue-900/40"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                Enable 2FA Securely
              </Button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 border-t border-slate-100 pt-6 dark:border-slate-700/50"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Setup Key</label>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-900/50">
                        <code className="flex-1 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                          {secretToken ? `${secretToken.slice(0, 4)}••••••${secretToken.slice(-4)}` : ""}
                        </code>
                        <button
                          onClick={copyToClipboard}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-blue-500 dark:hover:bg-slate-800"
                        >
                          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Verification Code</label>
                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        className={`h-11 w-full rounded-xl border px-4 text-center font-mono text-lg font-black tracking-[0.2em] transition-all focus:outline-none focus:ring-2 ${
                          error 
                            ? "border-red-300 bg-red-50 focus:ring-red-500/20 dark:border-red-900/50 dark:bg-red-900/10" 
                            : "border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900"
                        }`}
                      />
                      {error && (
                        <p className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {error}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleSubmitCode}
                      disabled={isLoading || verificationCode.length < 6}
                      className="h-11 w-full rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                      Verify & Activate
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-900/30">
                    <h4 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-200">How to setup?</h4>
                    <ol className="space-y-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <li className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">1</span>
                        Open your Authenticator app (Google Authenticator, Authy, etc.)
                      </li>
                      <li className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">2</span>
                        Choose "Add account" and select "Enter a setup key"
                      </li>
                      <li className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">3</span>
                        Paste the setup key above and enter the generated code
                      </li>
                    </ol>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">2FA is currently active</p>
                <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-500/80">Your account is protected with an extra layer of security.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Disable 2FA</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Enter current 6-digit code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    className={`h-11 flex-1 rounded-xl border px-4 font-mono text-base font-bold transition-all focus:outline-none focus:ring-2 ${
                      error 
                        ? "border-red-300 bg-red-50 focus:ring-red-500/20 dark:border-red-900/50 dark:bg-red-900/10" 
                        : "border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900"
                    }`}
                  />
                  <Button
                    onClick={handleSubmitCode}
                    disabled={isLoading || verificationCode.length < 6}
                    variant="outline"
                    className="h-11 rounded-xl border-red-200 font-bold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlock className="mr-2 h-4 w-4" />}
                    Verify & Disable
                  </Button>
                </div>
                {error && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuthSection;
