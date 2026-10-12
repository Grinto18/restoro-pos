import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Lock, User, Key, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, pinLogin, unlockWithPin, isLocked, user } = useAuth();
  const [mode, setMode] = useState<'PIN' | 'PASSWORD'>('PIN');
  const [pin, setPin] = useState<string>('');
  const [identifier, setIdentifier] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleNumpad = async (char: string) => {
    setError('');
    if (char === 'C') {
      setPin('');
      return;
    }

    if (pin.length < 6) {
      const nextPin = pin + char;
      setPin(nextPin);

      // Auto submit on 4 digits
      if (nextPin.length === 4) {
        setIsLoading(true);
        try {
          if (isLocked) {
            const success = await unlockWithPin(nextPin);
            if (!success) {
              setError('رمز PIN غير صحيح');
              setPin('');
            }
          } else {
            await pinLogin(nextPin);
          }
        } catch (err: any) {
          setError(err.message || 'رمز PIN غير صحيح');
          setPin('');
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setIsLoading(true);
    setError('');
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-neutral-950 flex items-center justify-center p-4 select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-center">
        {/* Brand Header */}
        <div className="space-y-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-black text-xl mb-3">
            GP
          </div>
          <h1 className="text-xl font-black text-amber-400 tracking-wide">GOLDEN PALACE POS</h1>
          <h2 className="text-sm font-bold text-neutral-200">مطعم القصر الذهبي • عند الجيجلي</h2>
          <p className="text-[11px] text-neutral-400">شارع بلهوشات، حسين داي، الجزائر</p>
        </div>

        {isLocked && user && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            <span>الشاشة مقفلة للمستخدم: {user.fullName}</span>
          </div>
        )}

        {error && (
          <div className="p-2 rounded-xl bg-red-950/80 border border-red-700 text-red-300 text-xs font-bold animate-shake">
            {error}
          </div>
        )}

        {/* PIN MODE */}
        {mode === 'PIN' ? (
          <div className="space-y-4">
            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    pin.length > i
                      ? 'bg-amber-400 border-amber-400 scale-110 shadow'
                      : 'border-neutral-700 bg-neutral-950'
                  }`}
                />
              ))}
            </div>

            {/* Quick Demo PIN Helper info */}
            <div className="text-[10px] text-neutral-400">
              PIN الافتراضي: <span className="font-mono text-amber-300">1234</span> (Admin) أو{' '}
              <span className="font-mono text-amber-300">1111</span> (كاشير)
            </div>

            {/* Touch Numpad */}
            <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto font-mono text-lg">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === '⌫') setPin(pin.slice(0, -1));
                    else handleNumpad(k);
                  }}
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-amber-500 active:text-black text-neutral-100 font-bold transition flex items-center justify-center border border-neutral-700/60 active:scale-95"
                >
                  {k}
                </button>
              ))}
            </div>

            {!isLocked && (
              <button
                type="button"
                onClick={() => setMode('PASSWORD')}
                className="text-xs text-amber-400 hover:underline pt-2 inline-block font-semibold"
              >
                تسجيل الدخول باسم المستخدم وكلمة المرور
              </button>
            )}
          </div>
        ) : (
          /* USERNAME / PASSWORD MODE */
          <form onSubmit={handlePasswordSubmit} className="space-y-3 text-right text-xs">
            <div>
              <label className="block text-neutral-400 mb-1">اسم المستخدم أو البريد:</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-neutral-100 font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">كلمة المرور:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-neutral-100 font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >
              {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>

            <button
              type="button"
              onClick={() => setMode('PIN')}
              className="w-full text-center text-xs text-neutral-400 hover:text-amber-400 font-semibold pt-1"
            >
              ← العودة لتسجيل الدخول السريع برمز PIN
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
