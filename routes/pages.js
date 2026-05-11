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

// Sayfa için tam URL yolunu hesapla (örn. "erp-cozumleri/on-muhasebe")
function getFullPath(pages, pageId) {
  const page = pages.find((p) => p.id === pageId);
  if (!page) return null;
  const segs = [];
  let cur = page;
  while (cur) {
    segs.unshift(cur.slug);
    cur = cur.parentId ? pages.find((p) => p.id === cur.parentId) : null;
  }
  return segs.join('/');
}

// Navbar'daki tüm linkleri özyinelemeli güncelle
function updateNavbarLinks(items, oldPath, newPath) {
  return items.map((item) => {
    const updated = { ...item };
    // Link "/cozum/X" veya "/sayfa/X" formatında, kısmı eşleştir
    const prefixes = ['/cozum/', '/sayfa/'];
    for (const prefix of prefixes) {
      if (updated.link === prefix + oldPath) {
        updated.link = prefix + newPath;
        break;
      }
      // Alt yol eşleştir: /cozum/erp/on-muhasebe → oldPath içeriyor mu
      if (updated.link.startsWith(prefix + oldPath + '/')) {
        updated.link = prefix + newPath + updated.link.slice((prefix + oldPath).length);
        break;
      }
    }
    if (updated.children && updated.children.length > 0) {
      updated.children = updateNavbarLinks(updated.children, oldPath, newPath);
    }
    return updated;
  });
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
  const { title, slug, body, image, images, parentId, order, seoTitle, seoDescription, galleryPosition } = req.body;
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
    galleryPosition: galleryPosition || 'after',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.get('pages').push(page).write();
  res.json(page);
});

router.put('/:id', auth, (req, res) => {
  const { title, slug, body, image, images, order, seoTitle, seoDescription, galleryPosition } = req.body;
  const pages = db.get('pages').value();
  const existing = pages.find((p) => p.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Sayfa bulunamadı' });

  // Slug değişti mi? Değiştiyse navbar linklerini güncelle
  if (slug && slug !== existing.slug) {
    const oldPath = getFullPath(pages, req.params.id);

    // Sayfayı geçici olarak güncelle (pathMap için)
    const tempPages = pages.map((p) => p.id === req.params.id ? { ...p, slug } : p);
    const newPath = getFullPath(tempPages, req.params.id);

    if (oldPath && newPath && oldPath !== newPath) {
      const navbarSection = db.get('sections').find({ slug: 'navbar' }).value();
      if (navbarSection && navbarSection.content && navbarSection.content.menuItems) {
        const updatedItems = updateNavbarLinks(navbarSection.content.menuItems, oldPath, newPath);
        db.get('sections').find({ slug: 'navbar' }).assign({
          content: { ...navbarSection.content, menuItems: updatedItems },
          updated_at: new Date().toISOString()
        }).write();
      }
    }
  }

  db.get('pages').find({ id: req.params.id }).assign({
    title, slug, body,
    image: image || '',
    images: images || [],
    seoTitle: seoTitle || '',
    seoDescription: seoDescription || '',
    galleryPosition: galleryPosition || 'after',
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
