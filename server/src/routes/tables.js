import { Router } from 'express';
import QRCode from 'qrcode';
import Table from '../models/Table.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

function buildTableUrl(code) {
  const base = process.env.PUBLIC_BASE_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  return `${base.replace(/\/$/, '')}/t/${code}`;
}

// Public: resolve a table by its QR code
router.get('/by-code/:code', async (req, res, next) => {
  try {
    const table = await Table.findOne({ code: req.params.code, active: true });
    if (!table) return res.status(404).json({ error: 'Table not found' });
    res.json({ id: table._id, number: table.number, label: table.label, code: table.code });
  } catch (err) {
    next(err);
  }
});

// Admin: list tables with QR data URLs
router.get('/', requireAdmin, async (_req, res, next) => {
  try {
    const tables = await Table.find().sort({ number: 1 });
    const withQr = await Promise.all(
      tables.map(async (t) => {
        const url = buildTableUrl(t.code);
        const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 320 });
        return {
          id: t._id,
          number: t.number,
          label: t.label,
          code: t.code,
          active: t.active,
          url,
          qrDataUrl,
        };
      })
    );
    res.json(withQr);
  } catch (err) {
    next(err);
  }
});

// Admin: create table
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { number, label } = req.body || {};
    if (number === undefined || number === null) return res.status(400).json({ error: 'number required' });
    const table = await Table.create({ number, label: label || `Table ${number}` });
    const url = buildTableUrl(table.code);
    const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 320 });
    res.status(201).json({ ...table.toObject(), url, qrDataUrl });
  } catch (err) {
    next(err);
  }
});

// Admin: get QR PNG for a table
router.get('/:id/qr.png', requireAdmin, async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ error: 'Not found' });
    const url = buildTableUrl(table.code);
    res.setHeader('Content-Type', 'image/png');
    QRCode.toFileStream(res, url, { margin: 1, width: 512 });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const result = await Table.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
