import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  role: UserRole;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const DEFAULT_USER: UserProfile = {
  id: 'usr-dispatch-01',
  email: 'dispatcher@routiq.io',
  full_name: 'Alex Rivera',
  role: 'dispatcher',
  organization_id: 'org-rst9-sf',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('routiq_user_session');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('routiq_user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('routiq_user_session');
    }
  }, [user]);

  const login = (email: string, role: UserRole = 'dispatcher') => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: email.split('@')[0].toUpperCase(),
      role,
      organization_id: 'org-rst9-sf',
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || 'dispatcher',
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

