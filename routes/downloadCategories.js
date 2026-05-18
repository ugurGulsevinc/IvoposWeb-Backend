const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', (req, res) => {
  const items = db.get('downloadCategories').sortBy('order').value();
  res.json(items);
});

router.post('/', auth, (req, res) => {
  const { name, order } = req.body;
  if (!name) return res.status(400).json({ error: 'Kategori adı gerekli' });
  const item = { id: uuidv4(), name, order: order ?? 0 };
  db.get('downloadCategories').push(item).write();
  res.json(item);
});

router.put('/:id', auth, (req, res) => {
  const { name, order } = req.body;
  const item = db.get('downloadCategories').find({ id: req.params.id });
  if (!item.value()) return res.status(404).json({ error: 'Bulunamadı' });
  item.assign({ name, order: order ?? 0 }).write();
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  // Kategori silindiğinde programları 'default-genel' kategorisine al
  const downloads = db.get('downloads').filter({ categoryId: req.params.id }).value();
  downloads.forEach(d => {
    db.get('downloads').find({ id: d.id }).assign({ categoryId: 'default-genel' }).write();
  });
  
  db.get('downloadCategories').remove({ id: req.params.id }).write();
  res.json({ success: true });
});

module.exports = router;
