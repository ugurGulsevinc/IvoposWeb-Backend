const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

const COLLECTION_DEFAULTS = {
  status: 'published',
  fields: [],
  listSettings: {
    showCategories: true,
    showSearch: true,
    showSort: true,
    gridColumns: 3,
    cardTemplateId: '',
    detailTemplateId: ''
  },
  seo: {
    title: '',
    description: ''
  }
};

function now() {
  return new Date().toISOString();
}

function normalizeSlug(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function requireCollection(collectionId, res) {
  const collection = db.get('collections').find({ id: collectionId }).value();
  if (!collection) {
    res.status(404).json({ error: 'Koleksiyon bulunamadı' });
    return null;
  }
  return collection;
}

function buildCategoryTree(categories, parentId = null) {
  return categories
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((c) => ({ ...c, children: buildCategoryTree(categories, c.id) }));
}

function getCollectionBySlugOrId(value) {
  return db.get('collections')
    .find((c) => c.id === value || c.slug === value)
    .value();
}

function getPublicEntries(collectionId, query = {}) {
  let entries = db.get('collectionEntries')
    .filter((entry) => entry.collectionId === collectionId && entry.status !== 'draft')
    .value();

  if (query.categoryId) {
    entries = entries.filter((entry) => entry.categoryIds?.includes(query.categoryId));
  }

  if (query.q) {
    const q = String(query.q).toLowerCase();
    entries = entries.filter((entry) => {
      const haystack = [
        entry.title,
        entry.shortDescription,
        entry.description,
        ...(entry.tags || []),
        ...Object.values(entry.fields || {})
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  return entries.sort((a, b) => (a.order || 0) - (b.order || 0));
}

router.get('/', (_req, res) => {
  const collections = db.get('collections')
    .filter((collection) => collection.status !== 'draft')
    .sortBy('order')
    .value();
  res.json(collections);
});

router.get('/admin/all', auth, (_req, res) => {
  res.json(db.get('collections').sortBy('order').value());
});

router.get('/:slug', (req, res) => {
  const collection = getCollectionBySlugOrId(req.params.slug);
  if (!collection || collection.status === 'draft') return res.status(404).json({ error: 'Koleksiyon bulunamadı' });
  const categories = db.get('collectionCategories').filter({ collectionId: collection.id }).value();
  const entries = getPublicEntries(collection.id, req.query);
  res.json({ collection, categories: buildCategoryTree(categories), entries });
});

router.post('/', auth, (req, res) => {
  const { name, slug, description, fields, listSettings, seo, order, status } = req.body;
  if (!name) return res.status(400).json({ error: 'name gerekli' });
  const normalizedSlug = normalizeSlug(slug || name);
  if (!normalizedSlug) return res.status(400).json({ error: 'slug gerekli' });
  const exists = db.get('collections').find({ slug: normalizedSlug }).value();
  if (exists) return res.status(409).json({ error: 'Bu slug ile koleksiyon zaten var' });

  const collection = {
    id: uuidv4(),
    name,
    slug: normalizedSlug,
    description: description || '',
    fields: Array.isArray(fields) ? fields : COLLECTION_DEFAULTS.fields,
    listSettings: { ...COLLECTION_DEFAULTS.listSettings, ...(listSettings || {}) },
    seo: { ...COLLECTION_DEFAULTS.seo, ...(seo || {}) },
    status: status || COLLECTION_DEFAULTS.status,
    order: order ?? 0,
    createdAt: now(),
    updatedAt: now()
  };
  db.get('collections').push(collection).write();
  res.json(collection);
});

router.put('/:id', auth, (req, res) => {
  const collectionRef = db.get('collections').find({ id: req.params.id });
  const collection = collectionRef.value();
  if (!collection) return res.status(404).json({ error: 'Koleksiyon bulunamadı' });

  const nextSlug = req.body.slug ? normalizeSlug(req.body.slug) : collection.slug;
  const slugOwner = db.get('collections').find({ slug: nextSlug }).value();
  if (slugOwner && slugOwner.id !== collection.id) return res.status(409).json({ error: 'Bu slug ile koleksiyon zaten var' });

  collectionRef.assign({
    ...collection,
    ...req.body,
    slug: nextSlug,
    listSettings: { ...collection.listSettings, ...(req.body.listSettings || {}) },
    seo: { ...collection.seo, ...(req.body.seo || {}) },
    updatedAt: now()
  }).write();
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  const collection = requireCollection(req.params.id, res);
  if (!collection) return;
  const entryCount = db.get('collectionEntries').filter({ collectionId: collection.id }).value().length;
  const categoryCount = db.get('collectionCategories').filter({ collectionId: collection.id }).value().length;
  if (entryCount || categoryCount) {
    return res.status(400).json({ error: 'Bu koleksiyona bağlı kategori veya içerik var. Önce bağlı kayıtları silin.' });
  }
  db.get('collections').remove({ id: collection.id }).write();
  res.json({ success: true });
});

router.get('/:collectionId/categories', (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  const categories = db.get('collectionCategories').filter({ collectionId: collection.id }).value();
  res.json(buildCategoryTree(categories));
});

router.get('/:collectionId/categories/flat', (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  res.json(db.get('collectionCategories').filter({ collectionId: collection.id }).sortBy('order').value());
});

router.post('/:collectionId/categories', auth, (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  const { name, slug, parentId, description, image, order, status, seo, displaySettings } = req.body;
  if (!name) return res.status(400).json({ error: 'name gerekli' });
  const normalizedSlug = normalizeSlug(slug || name);
  const exists = db.get('collectionCategories').find({ collectionId: collection.id, slug: normalizedSlug }).value();
  if (exists) return res.status(409).json({ error: 'Bu koleksiyon içinde kategori slug zaten var' });
  const category = {
    id: uuidv4(),
    collectionId: collection.id,
    parentId: parentId || null,
    name,
    slug: normalizedSlug,
    description: description || '',
    image: image || '',
    order: order ?? 0,
    status: status || 'published',
    seo: seo || {},
    displaySettings: displaySettings || {},
    createdAt: now(),
    updatedAt: now()
  };
  db.get('collectionCategories').push(category).write();
  res.json(category);
});

router.put('/:collectionId/categories/:id', auth, (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  const categoryRef = db.get('collectionCategories').find({ id: req.params.id, collectionId: collection.id });
  const category = categoryRef.value();
  if (!category) return res.status(404).json({ error: 'Kategori bulunamadı' });
  const nextSlug = req.body.slug ? normalizeSlug(req.body.slug) : category.slug;
  const slugOwner = db.get('collectionCategories').find({ collectionId: collection.id, slug: nextSlug }).value();
  if (slugOwner && slugOwner.id !== category.id) return res.status(409).json({ error: 'Bu koleksiyon içinde kategori slug zaten var' });
  categoryRef.assign({ ...category, ...req.body, slug: nextSlug, updatedAt: now() }).write();
  res.json({ success: true });
});

router.delete('/:collectionId/categories/:id', auth, (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  const category = db.get('collectionCategories').find({ id: req.params.id, collectionId: collection.id }).value();
  if (!category) return res.status(404).json({ error: 'Kategori bulunamadı' });
  const childCount = db.get('collectionCategories').filter({ parentId: category.id }).value().length;
  const entryCount = db.get('collectionEntries').filter((entry) => entry.categoryIds?.includes(category.id)).value().length;
  if (childCount || entryCount) return res.status(400).json({ error: 'Bu kategoriye bağlı alt kategori veya içerik var' });
  db.get('collectionCategories').remove({ id: category.id }).write();
  res.json({ success: true });
});

router.get('/:collectionId/entries', (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  res.json(getPublicEntries(collection.id, req.query));
});

router.get('/:collectionId/entries/admin/all', auth, (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  res.json(db.get('collectionEntries').filter({ collectionId: collection.id }).sortBy('order').value());
});

router.get('/:collectionId/entries/slug/:slug', (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  const entry = db.get('collectionEntries').find({ collectionId: collection.id, slug: req.params.slug }).value();
  if (!entry || entry.status === 'draft') return res.status(404).json({ error: 'İçerik bulunamadı' });
  res.json({ entry, collection });
});

router.post('/:collectionId/entries', auth, (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  const { title, slug, shortDescription, description, categoryIds, fields, images, tags, order, status, seo, displayOverrides } = req.body;
  if (!title) return res.status(400).json({ error: 'title gerekli' });
  const normalizedSlug = normalizeSlug(slug || title);
  const exists = db.get('collectionEntries').find({ collectionId: collection.id, slug: normalizedSlug }).value();
  if (exists) return res.status(409).json({ error: 'Bu koleksiyon içinde içerik slug zaten var' });
  const entry = {
    id: uuidv4(),
    collectionId: collection.id,
    title,
    slug: normalizedSlug,
    shortDescription: shortDescription || '',
    description: description || '',
    categoryIds: Array.isArray(categoryIds) ? categoryIds : [],
    fields: fields || {},
    images: Array.isArray(images) ? images : [],
    tags: Array.isArray(tags) ? tags : [],
    order: order ?? 0,
    status: status || 'published',
    seo: seo || {},
    displayOverrides: displayOverrides || {},
    createdAt: now(),
    updatedAt: now()
  };
  db.get('collectionEntries').push(entry).write();
  res.json(entry);
});

router.put('/:collectionId/entries/:id', auth, (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  const entryRef = db.get('collectionEntries').find({ id: req.params.id, collectionId: collection.id });
  const entry = entryRef.value();
  if (!entry) return res.status(404).json({ error: 'İçerik bulunamadı' });
  const nextSlug = req.body.slug ? normalizeSlug(req.body.slug) : entry.slug;
  const slugOwner = db.get('collectionEntries').find({ collectionId: collection.id, slug: nextSlug }).value();
  if (slugOwner && slugOwner.id !== entry.id) return res.status(409).json({ error: 'Bu koleksiyon içinde içerik slug zaten var' });
  entryRef.assign({ ...entry, ...req.body, slug: nextSlug, updatedAt: now() }).write();
  res.json({ success: true });
});

router.delete('/:collectionId/entries/:id', auth, (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  db.get('collectionEntries').remove({ id: req.params.id, collectionId: collection.id }).write();
  res.json({ success: true });
});

router.get('/:collectionId/templates', (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  res.json(db.get('collectionTemplates').filter({ collectionId: collection.id }).sortBy('order').value());
});

router.post('/:collectionId/templates', auth, (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  const { name, type, config, order, isDefault } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name ve type gerekli' });
  const template = {
    id: uuidv4(),
    collectionId: collection.id,
    name,
    type,
    config: config || {},
    order: order ?? 0,
    isDefault: !!isDefault,
    createdAt: now(),
    updatedAt: now()
  };
  db.get('collectionTemplates').push(template).write();
  res.json(template);
});

router.put('/:collectionId/templates/:id', auth, (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  const templateRef = db.get('collectionTemplates').find({ id: req.params.id, collectionId: collection.id });
  const template = templateRef.value();
  if (!template) return res.status(404).json({ error: 'Şablon bulunamadı' });
  templateRef.assign({ ...template, ...req.body, updatedAt: now() }).write();
  res.json({ success: true });
});

router.delete('/:collectionId/templates/:id', auth, (req, res) => {
  const collection = requireCollection(req.params.collectionId, res);
  if (!collection) return;
  db.get('collectionTemplates').remove({ id: req.params.id, collectionId: collection.id }).write();
  res.json({ success: true });
});

module.exports = router;
