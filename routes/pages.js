const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

function buildTree(pages, parentId = null) {
  return pages
    .filter((p) => p.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((p) => ({ ...p, children: buildTree(pages, p.id) }));
}

function getAllDescendantIds(pages, parentId) {
  const children = pages.filter((p) => p.parentId === parentId);
  let ids = children.map((c) => c.id);
  for (const c of children) {
    ids = ids.concat(getAllDescendantIds(pages, c.id));
  }
  return ids;
}

function resolvePageByPath(pages, pathSegments, parentId = null) {
  if (pathSegments.length === 0) return null;
  const [head, ...rest] = pathSegments;
  const page = pages.find((p) => p.slug === head && p.parentId === parentId);
  if (!page) return null;
  if (rest.length === 0) return page;
  return resolvePageByPath(pages, rest, page.id);
}

function buildBreadcrumb(pages, page) {
  const crumbs = [];
  let current = page;
  while (current) {
    crumbs.unshift({ id: current.id, title: current.title, slug: current.slug });
    current = current.parentId ? pages.find((p) => p.id === current.parentId) : null;
  }
  return crumbs;
}

router.get('/', (req, res) => {
  const pages = db.get('pages').value();
  res.json(buildTree(pages));
});

router.get('/flat', auth, (req, res) => {
  res.json(db.get('pages').value());
});

router.get('/by-path', (req, res) => {
  const { path: pathStr } = req.query;
  if (!pathStr) return res.status(400).json({ error: 'path gerekli' });
  const segments = pathStr.split('/').filter(Boolean);
  const pages = db.get('pages').value();
  const page = resolvePageByPath(pages, segments);
  if (!page) return res.status(404).json({ error: 'Sayfa bulunamadı' });
  const children = pages.filter((p) => p.parentId === page.id).sort((a, b) => a.order - b.order);
  const siblings = pages.filter((p) => p.parentId === page.parentId && p.id !== page.id).sort((a, b) => a.order - b.order);
  const breadcrumb = buildBreadcrumb(pages, page);
  const parent = page.parentId ? pages.find((p) => p.id === page.parentId) : null;
  res.json({ page, children, siblings, breadcrumb, parent });
});

router.post('/', auth, (req, res) => {
  const { title, slug, body, image, images, parentId, order, seoTitle, seoDescription } = req.body;
  if (!title || !slug) return res.status(400).json({ error: 'title ve slug gerekli' });
  const existing = db.get('pages').find({ slug, parentId: parentId || null }).value();
  if (existing) return res.status(409).json({ error: 'Bu parentId altında aynı slug zaten var' });
  const page = {
    id: uuidv4(),
    parentId: parentId || null,
    slug,
    title,
    body: body || '',
    image: image || '',
    images: images || [],
    seoTitle: seoTitle || '',
    seoDescription: seoDescription || '',
    order: order ?? 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.get('pages').push(page).write();
  res.json(page);
});

router.put('/:id', auth, (req, res) => {
  const { title, slug, body, image, images, order, seoTitle, seoDescription } = req.body;
  const page = db.get('pages').find({ id: req.params.id });
  if (!page.value()) return res.status(404).json({ error: 'Sayfa bulunamadı' });
  page.assign({
    title, slug, body,
    image: image || '',
    images: images || [],
    seoTitle: seoTitle || '',
    seoDescription: seoDescription || '',
    order,
    updatedAt: new Date().toISOString()
  }).write();
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  const pages = db.get('pages').value();
  const page = pages.find((p) => p.id === req.params.id);
  if (!page) return res.status(404).json({ error: 'Sayfa bulunamadı' });
  const idsToDelete = [req.params.id, ...getAllDescendantIds(pages, req.params.id)];
  db.get('pages').remove((p) => idsToDelete.includes(p.id)).write();
  res.json({ success: true, deleted: idsToDelete.length });
});

module.exports = router;
