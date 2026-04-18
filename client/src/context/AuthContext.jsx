import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'qr_admin_auth';

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { token: null, admin: null };
    } catch {
      return { token: null, admin: null };
    }
  });

  useEffect(() => {
    if (state?.token) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  }, [state]);

  const value = useMemo(
    () => ({
      token: state.token,
      admin: state.admin,
      login(token, admin) {
        setState({ token, admin });
      },
      logout() {
        setState({ token: null, admin: null });
      },
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
