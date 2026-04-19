import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function HomePage() {
  const [sample, setSample] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getSampleTable()
      .then((t) => {
        if (!cancelled) setSample(t);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Could not load sample table');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="home">
      <div className="hero">
        <h1>QR Restaurant</h1>
        <p>Scan your table's QR to view the menu and order. No app, no wait.</p>
        <div className="hero-actions">
          {sample ? (
            <Link to={`/t/${sample.code}`} className="btn-primary">
              Preview customer view ({sample.label || `Table ${sample.number}`})
            </Link>
          ) : (
            <button className="btn-primary" disabled>
              {error ? 'Customer preview unavailable' : 'Loading preview…'}
            </button>
          )}
          <Link to="/admin/login" className="btn-ghost">Admin Login</Link>
        </div>
        {error && <p className="muted small">Tip: run the DB seed (<code>npm run seed</code> in <code>server/</code>) to create tables.</p>}
      </div>
      <div className="card">
        <h3>For customers</h3>
        <p>
          In production, each table has a unique printed QR. Scanning it opens a link like
          <code> /t/&lt;table-code&gt; </code> — that is the customer ordering page. The button above
          is a shortcut to preview that experience without scanning a QR.
        </p>
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
