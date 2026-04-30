const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', (req, res) => {
  const refs = db.get('references').sortBy('order').value();
  res.json(refs);
});

router.post('/', auth, (req, res) => {
  const { companyName, work, logo, order } = req.body;
  if (!companyName) return res.status(400).json({ error: 'companyName gerekli' });
  const ref = { id: uuidv4(), companyName, work: work || '', logo: logo || '', order: order ?? 0 };
  db.get('references').push(ref).write();
  res.json(ref);
});

router.put('/:id', auth, (req, res) => {
  const { companyName, work, logo, order } = req.body;
  const ref = db.get('references').find({ id: req.params.id });
  if (!ref.value()) return res.status(404).json({ error: 'Bulunamadı' });
  ref.assign({ companyName, work: work || '', logo: logo || '', order: order ?? 0 }).write();
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  db.get('references').remove({ id: req.params.id }).write();
  res.json({ success: true });
});

module.exports = router;
