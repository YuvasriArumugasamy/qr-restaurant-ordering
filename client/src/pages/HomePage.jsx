import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="home">
      <div className="hero">
        <h1>QR Restaurant</h1>
        <p>Scan your table's QR to view the menu and order. No app, no wait.</p>
        <div className="hero-actions">
          <Link to="/admin/login" className="btn-primary">Admin Login</Link>
        </div>
      </div>
      <div className="card">
        <h3>For staff</h3>
        <p>
          Go to the <Link to="/admin">Admin</Link> dashboard to view incoming orders in real time,
          update their status, and print QR codes for each table.
        </p>
      </div>
    </div>
  );
}
