import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShoppingCart,
  Grid,
  ChefHat,
  UtensilsCrossed,
  Package,
  Users,
  Truck,
  Coins,
  Receipt,
  BarChart3,
  Settings,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';

export type ActiveTab =
  | 'pos'
  | 'tables'
  | 'kitchen'
  | 'menu'
  | 'inventory'
  | 'waste'
  | 'purchases'
  | 'suppliers'
  | 'customers'
  | 'delivery'
  | 'caisse'
  | 'expenses'
  | 'reports'
  | 'audit'
  | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { hasRole } = useAuth();

  const navItems = [
    {
      id: 'pos' as ActiveTab,
      label: 'نقطة البيع (F2)',
      labelFr: 'Saisie Ventes',
      icon: ShoppingCart,
      color: 'bg-amber-500 hover:bg-amber-400 text-black',
      activeColor: 'ring-2 ring-amber-400 bg-amber-400 text-black shadow-lg shadow-amber-500/20',
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'],
    },
    {
      id: 'tables' as ActiveTab,
      label: 'خريطة الصالة',
      labelFr: 'Plan de Salle',
      icon: Grid,
      color: 'bg-sky-700/80 hover:bg-sky-600 text-white',
      activeColor: 'ring-2 ring-sky-400 bg-sky-600 text-white',
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'],
    },
    {
      id: 'kitchen' as ActiveTab,
      label: 'شاشة المطبخ (KDS)',
      labelFr: 'Bon Cuisine',
      icon: ChefHat,
      color: 'bg-orange-700/80 hover:bg-orange-600 text-white',
      activeColor: 'ring-2 ring-orange-400 bg-orange-600 text-white',
      allowedRoles: ['ADMIN', 'MANAGER', 'KITCHEN'],
    },
    {
      id: 'caisse' as ActiveTab,
      label: 'إدارة الصندوق (F12)',
      labelFr: 'Gestion Caisse',
      icon: Coins,
      color: 'bg-emerald-700/80 hover:bg-emerald-600 text-white',
      activeColor: 'ring-2 ring-emerald-400 bg-emerald-600 text-white',
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'menu' as ActiveTab,
      label: 'الأطباق والأسعار (F3)',
      labelFr: 'Produits',
      icon: UtensilsCrossed,
      color: 'bg-neutral-800 hover:bg-neutral-700 text-amber-300',
      activeColor: 'ring-2 ring-amber-400 bg-neutral-700 text-amber-300',
      allowedRoles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'المخزون والجرد',
      labelFr: 'Stock & Ingrédients',
      icon: Package,
      color: 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200',
      activeColor: 'ring-2 ring-neutral-400 bg-neutral-700 text-white',
      allowedRoles: ['ADMIN', 'MANAGER', 'INVENTORY'],
    },
    {
      id: 'waste' as ActiveTab,
      label: 'الهدر والتالف',
      labelFr: 'Pertes',
      icon: AlertTriangle,
      color: 'bg-neutral-800 hover:bg-neutral-700 text-rose-300',
      activeColor: 'ring-2 ring-rose-400 bg-neutral-700 text-rose-300',
      allowedRoles: ['ADMIN', 'MANAGER', 'INVENTORY', 'KITCHEN'],
    },
    {
      id: 'purchases' as ActiveTab,
      label: 'المشتريات (F1)',
      labelFr: 'Saisie Achats',
      icon: FileSpreadsheet,
      color: 'bg-neutral-800 hover:bg-neutral-700 text-cyan-300',
      activeColor: 'ring-2 ring-cyan-400 bg-neutral-700 text-cyan-300',
      allowedRoles: ['ADMIN', 'MANAGER', 'INVENTORY'],
    },
    {
      id: 'delivery' as ActiveTab,
      label: 'التوصيل المنزلي',
      labelFr: 'Livraison',
      icon: Truck,
      color: 'bg-neutral-800 hover:bg-neutral-700 text-purple-300',
      activeColor: 'ring-2 ring-purple-400 bg-neutral-700 text-purple-300',
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'customers' as ActiveTab,
      label: 'الزبائن (F5)',
      labelFr: 'Clients',
      icon: Users,
      color: 'bg-neutral-800 hover:bg-neutral-700 text-teal-300',
      activeColor: 'ring-2 ring-teal-400 bg-neutral-700 text-teal-300',
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'expenses' as ActiveTab,
      label: 'المصاريف',
      labelFr: 'Charges',
      icon: Receipt,
      color: 'bg-neutral-800 hover:bg-neutral-700 text-yellow-300',
      activeColor: 'ring-2 ring-yellow-400 bg-neutral-700 text-yellow-300',
      allowedRoles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'reports' as ActiveTab,
      label: 'الإحصائيات (F10)',
      labelFr: 'Statistiques',
      icon: BarChart3,
      color: 'bg-neutral-800 hover:bg-neutral-700 text-green-300',
      activeColor: 'ring-2 ring-green-400 bg-neutral-700 text-green-300',
      allowedRoles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'audit' as ActiveTab,
      label: 'سجل العمليات',
      labelFr: 'Audit Logs',
      icon: ShieldCheck,
      color: 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300',
      activeColor: 'ring-2 ring-neutral-400 bg-neutral-700 text-white',
      allowedRoles: ['ADMIN'],
    },
    {
      id: 'settings' as ActiveTab,
      label: 'الإعدادات والنسخ',
      labelFr: 'Configuration',
      icon: Settings,
      color: 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300',
      activeColor: 'ring-2 ring-amber-400 bg-neutral-700 text-white',
      allowedRoles: ['ADMIN'],
    },
  ];

  return (
    <nav className="bg-neutral-950 border-b border-neutral-800 px-3 py-1.5 overflow-x-auto no-scrollbar select-none">
      <div className="flex items-center gap-1.5 min-w-max">
        {navItems.map((item) => {
          if (!hasRole(item.allowedRoles as any)) return null;
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition duration-150 active:scale-95 ${
                isActive ? item.activeColor : `${item.color} border border-neutral-700/50`
              }`}
            >
              <IconComponent className="w-4 h-4 shrink-0" />
              <div className="text-right flex flex-col leading-tight">
                <span>{item.label}</span>
                <span className="text-[9px] opacity-75 font-normal tracking-wide">
                  {item.labelFr}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
