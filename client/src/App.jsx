import { Routes, Route, Link, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import TablePage from './pages/TablePage.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminTables from './pages/AdminTables.jsx';
import { useAuth, AuthProvider } from './context/AuthContext.jsx';

function RequireAdmin({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

function AdminLayout({ children }) {
  const { admin, logout } = useAuth();
  return (
    <div className="admin-shell">
      <header className="admin-nav">
        <div className="brand">
          <Link to="/admin">QR Restaurant · Admin</Link>
        </div>
        <nav>
          <Link to="/admin">Orders</Link>
          <Link to="/admin/tables">Tables & QR</Link>
        </nav>
        <div className="admin-user">
          <span>{admin?.email}</span>
          <button className="btn-ghost" onClick={logout}>Logout</button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/t/:code" element={<TablePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <RequireAdmin>
              <AdminLayout>
                <AdminTables />
              </AdminLayout>
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
