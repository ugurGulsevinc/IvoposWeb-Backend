const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/:slug', (req, res) => {
  const section = db.get('sections').find({ slug: req.params.slug }).value();
  if (!section) return res.status(404).json({ error: 'Bölüm bulunamadı' });
  res.json(section);
});

router.put('/:slug', auth, (req, res) => {
  const { content } = req.body;
  const section = db.get('sections').find({ slug: req.params.slug });
  if (!section.value()) return res.status(404).json({ error: 'Bölüm bulunamadı' });
  section.assign({ content, updated_at: new Date().toISOString() }).write();
  res.json({ success: true });
});

module.exports = router;
