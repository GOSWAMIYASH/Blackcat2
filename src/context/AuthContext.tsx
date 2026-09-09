import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  switchUser: (role: UserRole) => Promise<void>;
  presetUsers: { email: string; name: string; role: UserRole }[];
}

const PRESET_ACCOUNTS: { email: string; pass: string; name: string; role: UserRole }[] = [
  { email: 'examiner@satsa.gov.in', pass: 'examiner123', name: 'Dr. Arunima Sen', role: 'Lead Examiner' },
  { email: 'supervisor@soc.internal', pass: 'supervisor123', name: 'Rajeev Menon', role: 'SOC Supervisor' },
  { email: 'auditor@cert.gov.in', pass: 'auditor123', name: 'Sunita Rao', role: 'Auditor' }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const res = await api.getMe();
        if (res.user) {
          setUser(res.user);
        }
      } catch (err) {
        console.warn('Auth init note:', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
  };

  const logout = () => {
    api.setToken(null);
    // Default to read-only or unauthenticated
    setUser(null);
  };

  const switchUser = async (role: UserRole) => {
    const target = PRESET_ACCOUNTS.find(p => p.role === role) || PRESET_ACCOUNTS[0];
    await login(target.email, target.pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchUser,
        presetUsers: PRESET_ACCOUNTS.map(a => ({ email: a.email, name: a.name, role: a.role }))
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
