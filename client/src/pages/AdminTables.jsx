import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [error, setError] = useState('');
  const [number, setNumber] = useState('');
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);

  async function refresh() {
    try {
      const data = await api.admin.listTables();
      setTables(data);
    } catch (err) {
      setError(err.message || 'Failed to load');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createTable(e) {
    e.preventDefault();
    const n = Number(number);
    if (!Number.isFinite(n)) return;
    setCreating(true);
    setError('');
    try {
      await api.admin.createTable(n, label || undefined);
      setNumber('');
      setLabel('');
      refresh();
    } catch (err) {
      setError(err.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this table?')) return;
    try {
      await api.admin.deleteTable(id);
      refresh();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  }

  function printOne(t) {
    const w = window.open('', '_blank', 'width=480,height=640');
    if (!w) return;
    w.document.write(`
      <html><head><title>Table ${t.number}</title>
      <style>
        body { font-family: system-ui, sans-serif; display:flex; flex-direction:column; align-items:center; padding:32px; }
        img { width: 320px; height: 320px; }
        h1 { margin: 8px 0; }
        .url { word-break: break-all; color:#555; font-size: 14px; margin-top: 8px; }
      </style></head><body>
      <h1>${t.label || 'Table ' + t.number}</h1>
      <img src="${t.qrDataUrl}" alt="QR" />
      <div class="url">${t.url}</div>
      <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    w.document.close();
  }

  return (
    <div className="admin-page">
      <h1>Tables & QR codes</h1>

      <form className="card inline-form" onSubmit={createTable}>
        <label className="field">
          <span>Table number</span>
          <input type="number" min="1" value={number} onChange={(e) => setNumber(e.target.value)} required />
        </label>
        <label className="field">
          <span>Label (optional)</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Patio, Booth 3…" />
        </label>
        <button className="btn-primary" disabled={creating} type="submit">
          {creating ? 'Adding…' : 'Add table'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="table-grid">
        {tables.map((t) => (
          <div key={t.id} className="card table-card">
            <div className="table-head">
              <div>
                <div className="muted small">Table</div>
                <h2>{t.label || `Table ${t.number}`}</h2>
              </div>
              <button className="btn-ghost" onClick={() => remove(t.id)}>Delete</button>
            </div>
            <img className="qr" src={t.qrDataUrl} alt={`QR for table ${t.number}`} />
            <div className="muted small break-all">{t.url}</div>
            <div className="row-actions">
              <a className="btn-ghost" href={t.url} target="_blank" rel="noreferrer">Open customer view</a>
              <button className="btn-primary" onClick={() => printOne(t)}>Print QR</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
