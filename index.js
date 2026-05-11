const config = require('./config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

app.use(helmet({ 
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false, // Bazı dış kaynakları engellememesi için esnek tutuyoruz
  crossOriginOpenerPolicy: { policy: "same-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://staticimgly.com"],
      mediaSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "data:", "blob:", "https://api.ivocrm.com", "https://staticimgly.com"],
      workerSrc: ["'self'", "blob:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
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
app.use('/api/seo', require('./routes/seo'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/references', require('./routes/references'));
app.use('/api/downloads', require('./routes/downloads'));
app.use('/api/contact', require('./routes/contact'));

// SEO dosyalarını root'tan da sun (botlar /robots.txt ve /sitemap.xml bekler)
const seoRouter = require('./routes/seo');
app.get('/robots.txt', (req, res, next) => {
  req.url = '/robots.txt';
  seoRouter(req, res, next);
});
app.get('/sitemap.xml', (req, res, next) => {
  req.url = '/sitemap.xml';
  seoRouter(req, res, next);
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
