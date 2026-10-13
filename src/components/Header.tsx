import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { usePos } from '../context/PosContext.tsx';
import { printerService } from '../services/printerService.ts';
import {
  Wifi,
  WifiOff,
  Lock,
  LogOut,
  RefreshCw,
  Coins,
  Maximize2,
  Minimize2,
  Clock,
  Calendar,
  UserCheck,
  Printer,
} from 'lucide-react';

interface HeaderProps {
  onOpenCashRegisterModal: () => void;
  onOpenHeldOrdersModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCashRegisterModal,
  onOpenHeldOrdersModal,
}) => {
  const { user, logout, lockTerminal } = useAuth();
  const {
    currentShift,
    isShiftOpen,
    isOnline,
    offlineOrdersCount,
    triggerSync,
    selectedTable,
    selectedCustomer,
    selectedWaiter,
    heldOrdersCount,
    setReceiptToPrint,
  } = usePos();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('fr-FR', { hour12: false }));
      setCurrentDate(now.toLocaleDateString('fr-FR'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await triggerSync();
    setIsSyncing(false);
  };

  return (
    <header className="bg-black border-b-2 border-slate-800 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between text-base select-none">
      {/* Brand & Terminal Meta */}
      <div className="flex items-center gap-5 flex-wrap">
        {/* Brand */}
        <div className="flex items-center gap-3 pr-2 border-l border-slate-700 pl-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg text-white font-black text-xl tracking-wider">
            GP
          </div>
          <div>
            <div className="font-black text-white text-lg tracking-wide flex items-center gap-2">
              <span>GOLDEN PALACE POS</span>
              <span className="text-xs bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded font-bold">
                القصر الذهبي
              </span>
            </div>
            <div className="text-xs text-slate-400 font-bold">
              نظام الكاشير وإدارة المطاعم • عند الجيجلي
            </div>
          </div>
        </div>

        {/* Live POS Terminal Metrics */}
        <div className="flex items-center gap-3.5 bg-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-800 text-sm font-bold">
          <div>
            <span className="text-slate-400">الوردية:</span>{' '}
            <span className="text-blue-400 font-extrabold text-base">
              {currentShift ? `#${currentShift.shiftNumber}` : '1'}
            </span>
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div className="flex items-center gap-1.5 text-slate-200">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>{currentDate}</span>
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div className="flex items-center gap-1.5 text-white font-extrabold text-base tracking-wider">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* Active Context: Table, Client, Waiter */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-sm">
          <div>
            <span className="text-slate-400">الزبون:</span>{' '}
            <span className="text-white font-bold">
              {selectedCustomer ? selectedCustomer.name : 'زبون عام'}
            </span>
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div>
            <span className="text-slate-400">الطاولة:</span>{' '}
            <span className="text-blue-400 font-extrabold">
              {selectedTable ? selectedTable.tableNumber : '—'}
            </span>
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div>
            <span className="text-slate-400">النادل:</span>{' '}
            <span className="text-slate-200 font-bold">{selectedWaiter}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Shift, Offline Sync, User, Lock, Exit */}
      <div className="flex items-center gap-2.5 mt-2 sm:mt-0">
        {/* Held Orders quick badge */}
        {heldOrdersCount > 0 && (
          <button
            onClick={onOpenHeldOrdersModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg border border-blue-500 text-sm font-bold transition active:scale-95 animate-pulse"
            title="فواتير معلقة"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            <span>معلقة:</span>
            <span className="font-extrabold text-base">{heldOrdersCount}</span>
          </button>
        )}

        {/* Offline / Online indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${
            isOnline
              ? 'bg-slate-900 border-slate-700 text-emerald-400'
              : 'bg-red-950/70 border-red-600 text-red-300 animate-pulse'
          }`}
        >
          {isOnline ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <span>{isOnline ? 'متصل' : 'بدون إنترنت'}</span>

          {offlineOrdersCount > 0 && (
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="mr-1.5 bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 shadow"
              title="مزامنة الطلبات غير المتصلة"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{offlineOrdersCount} مزامنة</span>
            </button>
          )}
        </div>

        {/* Quick Printer Diagnostic Button */}
        <button
          onClick={() => {
            const p = printerService.getProfile();
            const testData = printerService.generateTestReceiptData(p);
            setReceiptToPrint(testData);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition active:scale-95"
          title="معاينة وطباعة تذكرة فحص طابعة الإيصالات"
        >
          <Printer className="w-4 h-4 text-blue-400" />
          <span className="hidden xl:inline">طابعة 80mm</span>
        </button>

        {/* Cash Register Shift Button */}
        <button
          onClick={onOpenCashRegisterModal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition active:scale-95 ${
            isShiftOpen
              ? 'bg-blue-600/30 border-blue-500 text-blue-300 hover:bg-blue-600/40'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Coins className="w-4 h-4 text-blue-400" />
          <span>{isShiftOpen ? 'الصندوق مفتوح' : 'فتح الوردية'}</span>
        </button>

        {/* Current User Badge */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold">
          <UserCheck className="w-4 h-4 text-blue-400" />
          <span className="text-white">{user?.fullName || 'Admin'}</span>
          <span className="text-[11px] text-blue-300 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800">
            {user?.role}
          </span>
        </div>

        {/* Touch POS Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition active:scale-95"
          title="ملء الشاشة"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Lock Screen */}
        <button
          onClick={lockTerminal}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-blue-400 transition active:scale-95"
          title="قفل الشاشة السريع"
        >
          <Lock className="w-4 h-4" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 p-2 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-800 transition active:scale-95 font-bold text-xs"
          title="تسجيل الخروج"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">خروج</span>
        </button>
      </div>
    </header>
  );
};
