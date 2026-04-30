const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

function buildCategoryTree(cats, parentId = null) {
  return cats
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ ...c, children: buildCategoryTree(cats, c.id) }));
}

router.get('/', (_req, res) => {
  res.json(buildCategoryTree(db.get('productCategories').value()));
});

router.get('/flat', (_req, res) => {
  res.json(db.get('productCategories').value());
});

router.post('/', auth, (req, res) => {
  const { name, slug, parentId, image, order } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name ve slug gerekli' });
  const cat = { id: uuidv4(), name, slug, parentId: parentId || null, image: image || '', order: order || 0, createdAt: new Date().toISOString() };
  db.get('productCategories').push(cat).write();
  res.json(cat);
});

router.put('/:id', auth, (req, res) => {
  const cat = db.get('productCategories').find({ id: req.params.id });
  if (!cat.value()) return res.status(404).json({ error: 'Kategori bulunamadı' });
  cat.assign({ ...req.body, updatedAt: new Date().toISOString() }).write();
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  db.get('productCategories').remove({ id: req.params.id }).write();
  res.json({ success: true });
});

module.exports = router;
