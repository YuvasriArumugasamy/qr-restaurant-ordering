import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'qr_admin_auth';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { token: null, admin: null };
  } catch {
    return { token: null, admin: null };
  }
}

function writeStored(state) {
  try {
    if (state?.token) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore — localStorage may be unavailable
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(readStored);

  const value = useMemo(
    () => ({
      token: state.token,
      admin: state.admin,
      login(token, admin) {
        const next = { token, admin };
        // Persist synchronously so API calls fired during the same render
        // (e.g., AdminDashboard's initial fetch after navigate) see the token.
        writeStored(next);
        setState(next);
      },
      logout() {
        const next = { token: null, admin: null };
        writeStored(next);
        setState(next);
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
