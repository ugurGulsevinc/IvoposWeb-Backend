const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/global', (_req, res) => {
  res.json(db.get('seoGlobal').value());
});

router.put('/global', auth, (req, res) => {
  db.set('seoGlobal', { ...db.get('seoGlobal').value(), ...req.body }).write();
  res.json({ success: true });
});

router.get('/meta', (_req, res) => {
  res.json(db.get('seoMeta').value());
});

router.get('/meta/:pageKey', (req, res) => {
  const key = decodeURIComponent(req.params.pageKey);
  const meta = db.get('seoMeta').find({ pageKey: key }).value();
  const global = db.get('seoGlobal').value();
  if (!meta) return res.json({ pageKey: key, title: global.defaultTitle, description: global.defaultDescription, keywords: '', ogTitle: global.defaultTitle, ogDescription: global.defaultDescription, ogImage: global.defaultOgImage, canonical: '', robots: 'index, follow' });
  res.json(meta);
});

router.put('/meta/:pageKey', auth, (req, res) => {
  const key = decodeURIComponent(req.params.pageKey);
  const existing = db.get('seoMeta').find({ pageKey: key });
  if (existing.value()) {
    existing.assign({ ...req.body, updatedAt: new Date().toISOString() }).write();
  } else {
    db.get('seoMeta').push({ id: uuidv4(), pageKey: key, ...req.body, updatedAt: new Date().toISOString() }).write();
  }
  res.json({ success: true });
});

router.get('/robots.txt', (_req, res) => {
  const global = db.get('seoGlobal').value();
  res.type('text/plain').send(global.robotsTxt || 'User-agent: *\nAllow: /');
});

router.get('/sitemap.xml', (_req, res) => {
  const pages = db.get('pages').value();
  const products = db.get('products').value().filter((p) => p.isActive !== false);
  const global = db.get('seoGlobal').value();
  const host = 'https://example.com';

  function buildPageUrls(nodes, parentSlug = '') {
    let urls = [];
    for (const p of nodes) {
      const slug = parentSlug ? `${parentSlug}/${p.slug}` : p.slug;
      urls.push(`  <url><loc>${host}/cozum/${slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
      if (p.children?.length) urls = urls.concat(buildPageUrls(p.children, slug));
    }
    return urls;
  }

  const pageUrls = buildPageUrls(pages);
  const productUrls = products.map((p) => `  <url><loc>${host}/urun/${p.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${host}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
${pageUrls.join('\n')}
${productUrls.join('\n')}
</urlset>`;
  res.type('application/xml').send(xml);
});

module.exports = router;
