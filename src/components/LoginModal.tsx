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
    <div className="fixed inset-0 z-[999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="relative bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 text-center text-slate-900">
        {/* Brand Header */}
        <div className="space-y-1">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg text-white font-black text-2xl mb-3 tracking-wider">
            GP
          </div>
          <h1 className="text-3xl font-black text-black tracking-wide">GOLDEN PALACE POS</h1>
          <h2 className="text-xl font-bold text-slate-800">مطعم القصر الذهبي • عند الجيجلي</h2>
          <p className="text-sm font-semibold text-slate-500">شارع بلهوشات، حسين داي، الجزائر العاصمة</p>
        </div>

        {isLocked && user && (
          <div className="p-3.5 rounded-2xl bg-blue-50 border-2 border-blue-200 text-blue-900 text-sm font-extrabold flex items-center justify-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <span>الشاشة مقفلة للمستخدم: {user.fullName}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 text-sm font-black animate-shake">
            {error}
          </div>
        )}

        {/* PIN MODE */}
        {mode === 'PIN' ? (
          <div className="space-y-5">
            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-4 py-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    pin.length > i
                      ? 'bg-blue-600 border-blue-600 scale-125 shadow-md'
                      : 'border-slate-300 bg-slate-100'
                  }`}
                />
              ))}
            </div>

            {/* Quick Demo PIN Helper info */}
            <div className="text-xs font-bold text-slate-500 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200 inline-block">
              PIN الافتراضي: <span className="font-black text-blue-700">1234</span> (Admin) أو{' '}
              <span className="font-black text-blue-700">1111</span> (كاشير)
            </div>

            {/* Touch Numpad (Big and clear, 22-26px font) */}
            <div className="grid grid-cols-3 gap-3 max-w-[290px] mx-auto font-mono">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === '⌫') setPin(pin.slice(0, -1));
                    else handleNumpad(k);
                  }}
                  disabled={isLoading}
                  className="h-14 rounded-2xl bg-slate-100 hover:bg-blue-50 hover:border-blue-500 active:bg-blue-600 active:text-white text-slate-900 font-black text-2xl transition flex items-center justify-center border-2 border-slate-200 active:scale-95 cursor-pointer shadow-sm"
                >
                  {k}
                </button>
              ))}
            </div>

            {!isLocked && (
              <button
                type="button"
                onClick={() => setMode('PASSWORD')}
                className="text-sm text-blue-700 hover:underline pt-2 inline-block font-extrabold cursor-pointer"
              >
                تسجيل الدخول باسم المستخدم وكلمة المرور
              </button>
            )}
          </div>
        ) : (
          /* USERNAME / PASSWORD MODE */
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-right">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">اسم المستخدم أو البريد:</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xl rounded-2xl shadow-xl active:scale-95 transition cursor-pointer"
            >
              {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>

            <button
              type="button"
              onClick={() => setMode('PIN')}
              className="w-full text-center text-sm text-blue-700 hover:underline font-extrabold pt-2 cursor-pointer"
            >
              ← العودة لتسجيل الدخول السريع برمز PIN
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
