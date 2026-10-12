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
    <header className="bg-neutral-900 border-b border-amber-600/30 text-neutral-100 px-3 py-1.5 shadow-md flex flex-wrap items-center justify-between text-xs select-none">
      {/* Brand & Terminal Meta (Directly inspired by the photo top bar) */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Brand */}
        <div className="flex items-center gap-2 pr-2 border-l border-neutral-700/60 pl-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow text-black font-black text-sm">
            GR
          </div>
          <div>
            <div className="font-bold text-amber-400 text-sm tracking-wide flex items-center gap-1.5">
              <span>GRINE RESTAURANT</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
                مطعم قرين
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
              نظام الكاشير والطباعة الفورية • DZD
            </div>
          </div>
        </div>

        {/* Live POS Terminal Metrics from Photo */}
        <div className="flex items-center gap-3 bg-neutral-950/80 px-3 py-1 rounded-md border border-neutral-800 font-mono text-[11px]">
          <div>
            <span className="text-neutral-500">JOURNÉE:</span>{' '}
            <span className="text-amber-300 font-bold">
              {currentShift ? `#${currentShift.shiftNumber}` : '5'}
            </span>
          </div>
          <div className="w-px h-3 bg-neutral-700"></div>
          <div className="flex items-center gap-1 text-neutral-300">
            <Calendar className="w-3 h-3 text-amber-500" />
            <span>{currentDate}</span>
          </div>
          <div className="w-px h-3 bg-neutral-700"></div>
          <div className="flex items-center gap-1 text-amber-400 font-bold tracking-wider">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* Active Context: Table, Client, Waiter */}
        <div className="hidden lg:flex items-center gap-2.5 bg-neutral-950/60 px-2.5 py-1 rounded border border-neutral-800 text-[11px] font-mono">
          <div>
            <span className="text-neutral-500">CLIENT:</span>{' '}
            <span className="text-emerald-400 font-semibold">
              {selectedCustomer ? selectedCustomer.name : 'ANONYME'}
            </span>
          </div>
          <div className="w-px h-3 bg-neutral-700"></div>
          <div>
            <span className="text-neutral-500">TABLE:</span>{' '}
            <span className="text-cyan-400 font-bold">
              {selectedTable ? selectedTable.tableNumber : '—'}
            </span>
          </div>
          <div className="w-px h-3 bg-neutral-700"></div>
          <div>
            <span className="text-neutral-500">SERVEUR:</span>{' '}
            <span className="text-amber-200">{selectedWaiter}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Shift, Offline Sync, User, Lock, Exit */}
      <div className="flex items-center gap-2 mt-1 sm:mt-0">
        {/* Held Orders quick badge */}
        {heldOrdersCount > 0 && (
          <button
            onClick={onOpenHeldOrdersModal}
            className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-1 rounded border border-amber-500/40 transition active:scale-95 animate-pulse"
            title="فواتير معلقة"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>معلقة:</span>
            <span className="font-bold font-mono">{heldOrdersCount}</span>
          </button>
        )}

        {/* Offline / Online indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[11px] ${
            isOnline
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300 animate-pulse'
          }`}
        >
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span>{isOnline ? 'متصل' : 'بدون إنترنت'}</span>

          {offlineOrdersCount > 0 && (
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="mr-1 bg-amber-500 text-black px-1.5 py-0.5 rounded text-[10px] font-bold hover:bg-amber-400 flex items-center gap-1"
              title="مزامنة الطلبات غير المتصلة"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
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
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-amber-300 text-[11px] transition active:scale-95"
          title="معاينة وطباعة تذكرة فحص ومعايرة طابعة الإيصالات CAFETERIA"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline font-mono">CAFETERIA</span>
          <span className="bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono text-[9px] font-bold">
            80mm
          </span>
        </button>

        {/* Cash Register Shift Button */}
        <button
          onClick={onOpenCashRegisterModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium transition active:scale-95 ${
            isShiftOpen
              ? 'bg-amber-600/20 border-amber-500/40 text-amber-300 hover:bg-amber-600/30'
              : 'bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/50'
          }`}
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>{isShiftOpen ? 'الصندوق مفتوح' : 'فتح وردية الصندوق'}</span>
        </button>

        {/* Current User Badge */}
        <div className="flex items-center gap-1.5 bg-neutral-800/90 border border-neutral-700 px-2.5 py-1 rounded text-[11px]">
          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-neutral-400">Caissier:</span>
          <span className="font-bold text-amber-300">{user?.fullName || 'Admin'}</span>
          <span className="text-[10px] text-neutral-400 bg-neutral-900 px-1 rounded border border-neutral-700">
            {user?.role}
          </span>
        </div>

        {/* Touch POS Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition active:scale-95"
          title="ملء الشاشة للشاشات اللمسية"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Lock Screen */}
        <button
          onClick={lockTerminal}
          className="p-1.5 rounded bg-neutral-800 hover:bg-amber-900/40 text-amber-300 border border-neutral-700 hover:border-amber-600/50 transition active:scale-95"
          title="قفل الشاشة السريع (Verrouiller)"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>

        {/* Logout / Quitter */}
        <button
          onClick={logout}
          className="flex items-center gap-1 p-1.5 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition active:scale-95"
          title="تسجيل الخروج (Quitter)"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[10px] font-bold">خروج</span>
        </button>
      </div>
    </header>
  );
};
