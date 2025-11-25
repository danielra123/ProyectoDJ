import React, { createContext, useContext } from 'react';
import { useSession } from '../lib/auth-client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data: session, isPending, error } = useSession();

  const value = {
    user: session?.user || null,
    session: session?.session || null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
