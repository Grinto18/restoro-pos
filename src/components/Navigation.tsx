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
      labelFr: 'Caisse POS',
      icon: ShoppingCart,
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'],
    },
    {
      id: 'tables' as ActiveTab,
      label: 'خريطة الصالة',
      labelFr: 'Plan de Salle',
      icon: Grid,
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'],
    },
    {
      id: 'kitchen' as ActiveTab,
      label: 'شاشة المطبخ (KDS)',
      labelFr: 'Écran Cuisine',
      icon: ChefHat,
      allowedRoles: ['ADMIN', 'MANAGER', 'KITCHEN'],
    },
    {
      id: 'caisse' as ActiveTab,
      label: 'إدارة الصندوق (F12)',
      labelFr: 'Gestion Caisse',
      icon: Coins,
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'menu' as ActiveTab,
      label: 'الأطباق والأسعار (F3)',
      labelFr: 'Menu & Plats',
      icon: UtensilsCrossed,
      allowedRoles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'المخزون والجرد',
      labelFr: 'Stock & Ingrédients',
      icon: Package,
      allowedRoles: ['ADMIN', 'MANAGER', 'INVENTORY'],
    },
    {
      id: 'waste' as ActiveTab,
      label: 'الهدر والتالف',
      labelFr: 'Pertes & Déchets',
      icon: AlertTriangle,
      allowedRoles: ['ADMIN', 'MANAGER', 'INVENTORY', 'KITCHEN'],
    },
    {
      id: 'purchases' as ActiveTab,
      label: 'المشتريات (F1)',
      labelFr: 'Achats Fournisseurs',
      icon: FileSpreadsheet,
      allowedRoles: ['ADMIN', 'MANAGER', 'INVENTORY'],
    },
    {
      id: 'delivery' as ActiveTab,
      label: 'التوصيل المنزلي',
      labelFr: 'Livraison Clients',
      icon: Truck,
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'customers' as ActiveTab,
      label: 'الزبائن (F5)',
      labelFr: 'Fichier Clients',
      icon: Users,
      allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'expenses' as ActiveTab,
      label: 'المصاريف',
      labelFr: 'Dépenses & Charges',
      icon: Receipt,
      allowedRoles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'reports' as ActiveTab,
      label: 'الإحصائيات (F10)',
      labelFr: 'Rapports & Ventes',
      icon: BarChart3,
      allowedRoles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'audit' as ActiveTab,
      label: 'سجل العمليات',
      labelFr: 'Journal d\'Audit',
      icon: ShieldCheck,
      allowedRoles: ['ADMIN'],
    },
    {
      id: 'settings' as ActiveTab,
      label: 'الإعدادات والنسخ',
      labelFr: 'Configuration',
      icon: Settings,
      allowedRoles: ['ADMIN'],
    },
  ];

  return (
    <nav className="bg-black border-b border-slate-800 px-3 py-2 overflow-x-auto no-scrollbar select-none">
      <div className="flex items-center gap-2 min-w-max">
        {navItems.map((item) => {
          if (!hasRole(item.allowedRoles as any)) return null;
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400 font-extrabold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/70 hover:border-slate-600'
              }`}
            >
              <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-blue-400'}`} />
              <div className="text-right flex flex-col leading-tight">
                <span className="text-sm font-extrabold">{item.label}</span>
                <span className={`text-[11px] font-medium tracking-wide ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
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
