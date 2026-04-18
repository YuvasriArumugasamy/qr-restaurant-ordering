import { Router } from 'express';
import Order, { ORDER_STATUSES } from '../models/Order.js';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public: place order for a table (by code)
router.post('/', async (req, res, next) => {
  try {
    const { tableCode, items, customerName, notes } = req.body || {};
    if (!tableCode || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'tableCode and items are required' });
    }

    const table = await Table.findOne({ code: tableCode, active: true });
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const menuIds = items.map((i) => i.menuItemId).filter(Boolean);
    const menuItems = await MenuItem.find({ _id: { $in: menuIds }, available: true });
    const byId = new Map(menuItems.map((m) => [m._id.toString(), m]));

    const orderItems = [];
    for (const i of items) {
      const m = byId.get(String(i.menuItemId));
      if (!m) return res.status(400).json({ error: `Menu item unavailable: ${i.menuItemId}` });
      const qty = Math.max(1, Math.min(99, Number(i.quantity) || 1));
      orderItems.push({
        menuItem: m._id,
        name: m.name,
        price: m.price,
        quantity: qty,
      });
    }

    const total = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

    const order = await Order.create({
      table: table._id,
      tableNumber: table.number,
      items: orderItems,
      total,
      customerName: (customerName || '').slice(0, 80),
      notes: (notes || '').slice(0, 280),
    });

    // Notify admins and the table's channel
    req.io.to('admins').emit('order:new', order);
    req.io.to(`table:${table.code}`).emit('order:update', order);

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// Public: check orders for a table (by code) — for customer to see their own live status
router.get('/by-table/:code', async (req, res, next) => {
  try {
    const table = await Table.findOne({ code: req.params.code });
    if (!table) return res.status(404).json({ error: 'Table not found' });
    const orders = await Order.find({ table: table._id }).sort({ createdAt: -1 }).limit(20);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Admin: list orders, optionally filter by status
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status && ORDER_STATUSES.includes(String(status))) q.status = status;
    const orders = await Order.find(q).sort({ createdAt: -1 }).limit(200);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Admin: update status
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${ORDER_STATUSES.join(', ')}` });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Not found' });

    const table = await Table.findById(order.table);
    req.io.to('admins').emit('order:update', order);
    if (table) req.io.to(`table:${table.code}`).emit('order:update', order);

    res.json(order);
  } catch (err) {
    next(err);
  }
});

export default router;
