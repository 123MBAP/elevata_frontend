import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'BUSINESS' | 'FINANCIAL_INSTITUTION';
  isVerified: boolean;
  isPilotApproved: boolean;
  business?: {
    id: string;
    businessName: string;
    ownerName: string;
    businessType: string;
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
    knownPlace?: string;
    latitude: string | number;
    longitude: string | number;
  };
  financialInstitution?: {
    id: string;
    institutionName: string;
    representativeName: string;
    category: string;
    operatingScope: string;
    licenseNumber: string;
    website?: string;
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
    knownPlace?: string;
    latitude: string | number;
    longitude: string | number;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (registrationData: any) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Recover session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('elevata_access_token');
      if (token) {
        try {
          // Query backend profile endpoint
          const res = await apiRequest('/users/profile');
          if (res && res.success && res.data && res.data.user) {
            setUser(res.data.user);
          }
        } catch (error) {
          console.error('Session recovery failed:', error);
          handleClearAuth();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 2. Global listener for auto-logout (from API interceptor)
  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, []);

  const handleClearAuth = () => {
    localStorage.removeItem('elevata_access_token');
    localStorage.removeItem('elevata_refresh_token');
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res && res.success && res.data) {
        localStorage.setItem('elevata_access_token', res.data.token);
        localStorage.setItem('elevata_refresh_token', res.data.refreshToken);
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error('Invalid login response from server');
    } catch (error) {
      handleClearAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (registrationData: any) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registrationData)
      });

      if (res && res.success && res.data) {
        localStorage.setItem('elevata_access_token', res.data.token);
        localStorage.setItem('elevata_refresh_token', res.data.refreshToken);
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error('Invalid registration response from server');
    } catch (error) {
      handleClearAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('API logout error:', error);
    } finally {
      handleClearAuth();
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
