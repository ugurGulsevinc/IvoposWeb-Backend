const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', (req, res) => {
  let products = db.get('products').value().filter((p) => p.isActive !== false);
  const { categoryId, q, sort, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
  if (categoryId) products = products.filter((p) => p.categoryId === categoryId);
  if (q) {
    const ql = q.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(ql) || (p.description || '').toLowerCase().includes(ql) || (p.tags || []).some((t) => t.toLowerCase().includes(ql)));
  }
  if (minPrice) products = products.filter((p) => (p.discountPrice || p.price) >= parseFloat(minPrice));
  if (maxPrice) products = products.filter((p) => (p.discountPrice || p.price) <= parseFloat(maxPrice));
  if (sort === 'price_asc') products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  else if (sort === 'price_desc') products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  else if (sort === 'newest') products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = products.length;
  const start = (parseInt(page) - 1) * parseInt(limit);
  products = products.slice(start, start + parseInt(limit));
  res.json({ products, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/admin/all', auth, (req, res) => {
  res.json(db.get('products').value());
});

router.get('/slug/:slug', (req, res) => {
  const product = db.get('products').find({ slug: req.params.slug }).value();
  if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });
  const related = db.get('products').value()
    .filter((p) => p.isActive !== false && p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);
  res.json({ product, related });
});

router.get('/:id', auth, (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });
  res.json(product);
});

router.post('/', auth, (req, res) => {
  const { name, slug, categoryId, price, discountPrice, images, features, description, shortDescription, stock, tags, youtubeUrl } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name ve slug gerekli' });
  const product = {
    id: uuidv4(), name, slug, categoryId: categoryId || '',
    price: parseFloat(price) || 0,
    discountPrice: discountPrice ? parseFloat(discountPrice) : null,
    images: images || [], features: features || [],
    description: description || '', shortDescription: shortDescription || '',
    stock: parseInt(stock) || 0, tags: tags || [], isActive: true,
    youtubeUrl: youtubeUrl || '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  db.get('products').push(product).write();
  res.json(product);
});

router.put('/:id', auth, (req, res) => {
  const p = db.get('products').find({ id: req.params.id });
  if (!p.value()) return res.status(404).json({ error: 'Ürün bulunamadı' });
  const data = { ...req.body, updatedAt: new Date().toISOString() };
  if (data.price) data.price = parseFloat(data.price);
  if (data.discountPrice) data.discountPrice = parseFloat(data.discountPrice);
  if (data.stock) data.stock = parseInt(data.stock);
  if (data.youtubeUrl === undefined) data.youtubeUrl = '';
  p.assign(data).write();
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  db.get('products').remove({ id: req.params.id }).write();
  res.json({ success: true });
});

module.exports = router;
