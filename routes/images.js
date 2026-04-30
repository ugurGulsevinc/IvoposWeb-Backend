const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Sadece resim dosyaları kabul edilir'));
  }
});

router.post('/', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya yüklenemedi' });
  const image = {
    id: uuidv4(),
    filename: req.file.filename,
    original_name: req.file.originalname,
    size: req.file.size,
    mime_type: req.file.mimetype,
    url: `/uploads/${req.file.filename}`,
    created_at: new Date().toISOString()
  };
  db.get('images').push(image).write();
  res.json(image);
});

router.get('/', auth, (req, res) => {
  res.json(db.get('images').value());
});

router.delete('/:id', auth, (req, res) => {
  const image = db.get('images').find({ id: req.params.id }).value();
  if (!image) return res.status(404).json({ error: 'Resim bulunamadı' });
  const filepath = path.join(__dirname, '../uploads', image.filename);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  db.get('images').remove({ id: req.params.id }).write();
  res.json({ success: true });
});

module.exports = router;
