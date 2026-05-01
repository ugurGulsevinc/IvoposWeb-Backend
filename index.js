const config = require('./config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: config.CLIENT_URL }));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 200 }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/images', require('./routes/images'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/collections', require('./routes/collections'));
app.use('/api/seo', require('./routes/seo'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/references', require('./routes/references'));
app.use('/api/downloads', require('./routes/downloads'));
app.use('/api/contact', require('./routes/contact'));

const seoRouter = require('./routes/seo');
app.get('/robots.txt', (req, res) => seoRouter.handle ? seoRouter.handle(req, res) : res.type('text/plain').send('User-agent: *\nAllow: /'));
app.get('/sitemap.xml', (req, res) => {
  req.url = '/sitemap.xml';
  seoRouter(req, res, () => {});
});

// Production: React build dosyalarını serve et
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, 'public');
  app.use(express.static(clientDist));
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(config.PORT, () => console.log(`Server: http://localhost:${config.PORT}`));
