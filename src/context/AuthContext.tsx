import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<User>;
  loginWithUser: (user: User) => void;
  register: (userData: Partial<User>) => Promise<User>;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<void>;
  switchDemoRole: (role: 'Normal User' | 'Super User' | 'Admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from localStorage or default demo user
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const savedEmail = localStorage.getItem('leaveplan_user_email');
        if (savedEmail) {
          const user = await api.login(savedEmail);
          setCurrentUser(user.user);
        } else {
          // Default to Super User (David Chen) for rich initial preview
          const users = await api.getUsers();
          const defaultUser = users.find(u => u.email === 'david.chen@acmecorp.com') || users[0];
          if (defaultUser) {
            setCurrentUser(defaultUser);
            localStorage.setItem('leaveplan_user_email', defaultUser.email);
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email);
      setCurrentUser(res.user);
      localStorage.setItem('leaveplan_user_email', res.user.email);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('leaveplan_user_email', user.email);
  };

  const register = async (userData: Partial<User>) => {
    setIsLoading(true);
    try {
      const newUser = await api.registerUser(userData);
      setCurrentUser(newUser);
      localStorage.setItem('leaveplan_user_email', newUser.email);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('leaveplan_user_email');
  };

  const updateCurrentUser = async (updates: Partial<User>) => {
    if (!currentUser) throw new Error('No user logged in');
    const updated = await api.updateUser(currentUser.id, updates, {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
    });
    setCurrentUser(updated);
    return updated;
  };

  const refreshUser = async () => {
    if (!currentUser) return;
    try {
      const refreshed = await api.getUserById(currentUser.id);
      setCurrentUser(refreshed);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  const switchDemoRole = async (role: 'Normal User' | 'Super User' | 'Admin') => {
    try {
      const users = await api.getUsers();
      let targetUser = users.find(u => u.role === role && u.status === 'Active');
      if (!targetUser) targetUser = users[0];

      if (targetUser) {
        setCurrentUser(targetUser);
        localStorage.setItem('leaveplan_user_email', targetUser.email);
      }
    } catch (err) {
      console.error('Failed to switch demo role', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        loginWithUser,
        register,
        logout,
        updateCurrentUser,
        refreshUser,
        switchDemoRole,
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
