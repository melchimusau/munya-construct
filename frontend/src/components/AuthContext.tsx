import React, { createContext, useState, useContext, useEffect } from 'react';
import { setAuthToken } from '../services/api';

interface User {
  id: number;
  username: string;
  role: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (token && savedUser) {
      setAuthToken(token);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch('http://127.0.0.1:8000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    if (!res.ok) throw new Error('Échec de connexion');
    const data = await res.json();
    setAuthToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);