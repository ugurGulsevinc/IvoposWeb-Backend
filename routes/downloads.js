const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', (req, res) => {
  const items = db.get('downloads').sortBy('order').value();
  res.json(items);
});

router.post('/', auth, (req, res) => {
  const { name, logo, downloadUrl, order } = req.body;
  if (!name) return res.status(400).json({ error: 'name gerekli' });
  const item = { id: uuidv4(), name, logo: logo || '', downloadUrl: downloadUrl || '', order: order ?? 0 };
  db.get('downloads').push(item).write();
  res.json(item);
});

router.put('/:id', auth, (req, res) => {
  const { name, logo, downloadUrl, order } = req.body;
  const item = db.get('downloads').find({ id: req.params.id });
  if (!item.value()) return res.status(404).json({ error: 'Bulunamadı' });
  item.assign({ name, logo: logo || '', downloadUrl: downloadUrl || '', order: order ?? 0 }).write();
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  db.get('downloads').remove({ id: req.params.id }).write();
  res.json({ success: true });
});

module.exports = router;
