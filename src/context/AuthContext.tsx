import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types.ts';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLocked: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  pinLogin: (pin: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  logout: () => void;
  lockTerminal: () => void;
  hasRole: (roles: Role[]) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isCashier: boolean;
  isKitchen: boolean;
  isInventory: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    api.getMe()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        removeAuthToken();
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (identifier: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(identifier, pass);
      setAuthToken(res.token);
      setUser(res.user);
      setIsLocked(false);
    } finally {
      setIsLoading(false);
    }
  };

  const pinLogin = async (pin: string) => {
    setIsLoading(true);
    try {
      const res = await api.pinLogin(pin);
      setAuthToken(res.token);
      setUser(res.user);
      setIsLocked(false);
    } finally {
      setIsLoading(false);
    }
  };

  const unlockWithPin = async (pin: string): Promise<boolean> => {
    try {
      const res = await api.pinLogin(pin);
      if (res.user) {
        setUser(res.user);
        setIsLocked(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setIsLocked(false);
  };

  const lockTerminal = () => {
    setIsLocked(true);
  };

  const hasRole = (roles: Role[]) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLocked,
        login,
        pinLogin,
        unlockWithPin,
        logout,
        lockTerminal,
        hasRole,
        isAdmin: user?.role === 'ADMIN',
        isManager: user?.role === 'MANAGER' || user?.role === 'ADMIN',
        isCashier: user?.role === 'CASHIER' || user?.role === 'ADMIN' || user?.role === 'MANAGER',
        isKitchen: user?.role === 'KITCHEN' || user?.role === 'ADMIN',
        isInventory: user?.role === 'INVENTORY' || user?.role === 'ADMIN' || user?.role === 'MANAGER',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
