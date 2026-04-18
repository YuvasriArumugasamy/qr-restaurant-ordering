import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { getSocket } from '../api/socket.js';

const STATUSES = ['pending', 'preparing', 'completed', 'cancelled'];

function nextStatus(s) {
  if (s === 'pending') return 'preparing';
  if (s === 'preparing') return 'completed';
  return null;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    try {
      const data = await api.admin.listOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to load');
    }
  }

  useEffect(() => {
    refresh();
    const socket = getSocket();
    socket.emit('join-admin');

    function upsert(order) {
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o._id === order._id);
        if (idx === -1) return [order, ...prev];
        const next = [...prev];
        next[idx] = order;
        return next;
      });
    }
    socket.on('order:new', upsert);
    socket.on('order:update', upsert);

    return () => {
      socket.off('order:new', upsert);
      socket.off('order:update', upsert);
    };
  }, []);

  const counts = useMemo(() => {
    const c = { pending: 0, preparing: 0, completed: 0, cancelled: 0 };
    for (const o of orders) if (c[o.status] !== undefined) c[o.status]++;
    return c;
  }, [orders]);

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;

  async function setStatus(id, status) {
    try {
      await api.admin.updateOrderStatus(id, status);
    } catch (err) {
      setError(err.message || 'Failed to update');
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Orders</h1>
        <div className="status-tabs">
          <button className={!filter ? 'active' : ''} onClick={() => setFilter('')}>
            All ({orders.length})
          </button>
          {STATUSES.map((s) => (
            <button key={s} className={filter === s ? `active status-${s}` : `status-${s}`} onClick={() => setFilter(s)}>
              {s} ({counts[s] || 0})
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="order-grid">
        {filtered.length === 0 && <div className="muted">No orders.</div>}
        {filtered.map((o) => {
          const next = nextStatus(o.status);
          return (
            <div key={o._id} className={`order-card status-${o.status}`}>
              <div className="order-card-head">
                <div>
                  <div className="muted small">Order #{o._id.slice(-5).toUpperCase()}</div>
                  <h3>Table {o.tableNumber}</h3>
                </div>
                <span className={`pill status-${o.status}`}>{o.status}</span>
              </div>
              <ul className="order-items">
                {o.items.map((i, idx) => (
                  <li key={idx}>
                    <span>{i.quantity}× {i.name}</span>
                    <span>${(i.price * i.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              {o.customerName && <div className="muted small">For: {o.customerName}</div>}
              {o.notes && <div className="muted small">Notes: {o.notes}</div>}
              <div className="order-card-foot">
                <strong>${o.total.toFixed(2)}</strong>
                <div className="order-actions">
                  {next && (
                    <button className="btn-primary" onClick={() => setStatus(o._id, next)}>
                      Mark {next}
                    </button>
                  )}
                  {o.status !== 'completed' && o.status !== 'cancelled' && (
                    <button className="btn-ghost" onClick={() => setStatus(o._id, 'cancelled')}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              <div className="muted small timestamp">
                {new Date(o.createdAt).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
