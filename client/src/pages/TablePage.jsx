import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { getSocket } from '../api/socket.js';

function groupByCategory(items) {
  const out = {};
  for (const it of items) {
    const cat = it.category || 'Other';
    if (!out[cat]) out[cat] = [];
    out[cat].push(it);
  }
  return out;
}

export default function TablePage() {
  const { code } = useParams();
  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({}); // { [menuItemId]: qty }
  const [orders, setOrders] = useState([]);
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setError('');
        const [t, m, o] = await Promise.all([
          api.getTableByCode(code),
          api.getMenu(),
          api.getOrdersByTableCode(code).catch(() => []),
        ]);
        if (!alive) return;
        setTable(t);
        setMenu(m);
        setOrders(o);
      } catch (err) {
        if (alive) setError(err.message || 'Failed to load');
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [code]);

  useEffect(() => {
    if (!code) return;
    const socket = getSocket();
    socket.emit('join-table', code);
    const onUpdate = (order) => {
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o._id === order._id);
        if (idx === -1) return [order, ...prev];
        const next = [...prev];
        next[idx] = order;
        return next;
      });
    };
    socket.on('order:update', onUpdate);
    return () => {
      socket.off('order:update', onUpdate);
    };
  }, [code]);

  const menuByCat = useMemo(() => groupByCategory(menu), [menu]);
  const menuById = useMemo(() => new Map(menu.map((m) => [m._id, m])), [menu]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ item: menuById.get(id), qty }))
        .filter((x) => x.item && x.qty > 0),
    [cart, menuById]
  );
  const total = cartItems.reduce((s, { item, qty }) => s + item.price * qty, 0);
  const cartCount = cartItems.reduce((s, { qty }) => s + qty, 0);

  function addToCart(id) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }
  function decFromCart(id) {
    setCart((c) => {
      const next = { ...c, [id]: Math.max(0, (c[id] || 0) - 1) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  }

  async function submitOrder() {
    if (cartItems.length === 0 || !table) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        tableCode: code,
        items: cartItems.map(({ item, qty }) => ({ menuItemId: item._id, quantity: qty })),
        customerName,
        notes,
      };
      await api.placeOrder(payload);
      setCart({});
      setNotes('');
      setShowCart(false);
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !table) {
    return (
      <div className="app-shell">
        <div className="card error">Could not load table: {error}</div>
      </div>
    );
  }

  return (
    <div className="app-shell customer">
      <header className="customer-header">
        <div>
          <div className="muted small">Table</div>
          <h1>{table ? table.label || `Table ${table.number}` : 'Loading…'}</h1>
        </div>
        <button className="btn-primary cart-btn" onClick={() => setShowCart(true)} disabled={cartCount === 0}>
          View Cart {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </button>
      </header>

      {orders.length > 0 && (
        <section className="card">
          <h3>Your orders</h3>
          <ul className="order-list">
            {orders.map((o) => (
              <li key={o._id} className={`order-row status-${o.status}`}>
                <div>
                  <strong>#{o._id.slice(-5).toUpperCase()}</strong>
                  <div className="muted small">
                    {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </div>
                </div>
                <span className={`pill status-${o.status}`}>{o.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="menu">
        <h2>Menu</h2>
        {Object.keys(menuByCat).map((cat) => (
          <div key={cat} className="menu-category">
            <h3>{cat}</h3>
            <ul>
              {menuByCat[cat].map((it) => {
                const qty = cart[it._id] || 0;
                return (
                  <li key={it._id} className="menu-item">
                    <div className="menu-info">
                      <div className="menu-name">{it.name}</div>
                      {it.description && <div className="muted small">{it.description}</div>}
                      <div className="price">${it.price.toFixed(2)}</div>
                    </div>
                    <div className="qty-control">
                      {qty > 0 ? (
                        <>
                          <button className="btn-ghost" onClick={() => decFromCart(it._id)}>−</button>
                          <span className="qty">{qty}</span>
                          <button className="btn-ghost" onClick={() => addToCart(it._id)}>+</button>
                        </>
                      ) : (
                        <button className="btn-primary" onClick={() => addToCart(it._id)}>Add</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Your order</h2>
            {cartItems.length === 0 ? (
              <p className="muted">Cart is empty.</p>
            ) : (
              <>
                <ul className="cart-list">
                  {cartItems.map(({ item, qty }) => (
                    <li key={item._id}>
                      <span>{qty}× {item.name}</span>
                      <span>${(item.price * qty).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="cart-total">
                  <span>Total</span>
                  <strong>${total.toFixed(2)}</strong>
                </div>
                <label className="field">
                  <span>Name (optional)</span>
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" />
                </label>
                <label className="field">
                  <span>Special instructions (optional)</span>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="No onions, etc." />
                </label>
                {error && <div className="error">{error}</div>}
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={() => setShowCart(false)}>Keep browsing</button>
                  <button className="btn-primary" onClick={submitOrder} disabled={submitting}>
                    {submitting ? 'Placing…' : 'Place order'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
