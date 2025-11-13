// lib/auth-context.tsx
import { createContext, useContext } from 'react';

type AuthContextType = {
  reloadProfile: () => Promise<void>;
};

const defaultValue: AuthContextType = {
  reloadProfile: async () => {
    console.warn('reloadProfile called before provider mounted');
  }
};

export const AuthContext = createContext<AuthContextType>(defaultValue);

export const useAuth = () => useContext(AuthContext);