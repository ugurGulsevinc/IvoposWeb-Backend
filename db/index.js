const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

db.defaults({
  users: [
    {
      id: 1,
      username: 'admin',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    }
  ],
  sections: [
    {
      slug: 'navbar',
      content: {
        logo: '',
        logoText: 'Toya Yazılım',
        phone: '0850 711 0 220',
        menuItems: [
          { label: 'Anasayfa', link: '/', children: [] },
          {
            label: 'ERP', link: '#', children: [
              { label: 'Ön Muhasebe Yönetimi', link: '#' },
              { label: 'Satış Yönetimi', link: '#' },
              { label: 'Üretim Yönetimi', link: '#' },
              { label: 'Stok Yönetimi', link: '#' },
              { label: 'Finans Yönetimi', link: '#' },
              { label: 'Genel Muhasebe', link: '#' }
            ]
          },
          {
            label: 'CRM', link: '#', children: [
              { label: 'Müşteri Yönetimi', link: '#' },
              { label: 'Satış Yönetimi', link: '#' },
              { label: 'Kampanya Yönetimi', link: '#' },
              { label: 'Analitik ve Raporlama', link: '#' }
            ]
          },
          {
            label: 'E-Dönüşüm', link: '#', children: [
              { label: 'E-Fatura', link: '#' },
              { label: 'E-İrsaliye', link: '#' },
              { label: 'E-Arşiv', link: '#' },
              { label: 'E-Defter', link: '#' }
            ]
          },
          {
            label: 'E-Ticaret', link: '#', children: [
              { label: 'B2B', link: '#' },
              { label: 'B2C', link: '#' },
              { label: 'Pazaryeri Entegrasyonları', link: '#' }
            ]
          },
          {
            label: 'İK', link: '#', children: [
              { label: 'Personel İzin Planlama', link: '#' },
              { label: 'Personel Ücret Planlama', link: '#' },
              { label: 'Personel Özlük Bilgileri', link: '#' }
            ]
          },
          { label: 'İletişim', link: '/iletisim', children: [] }
        ]
      },
      updated_at: new Date().toISOString()
    },
    {
      slug: 'hero',
      content: {
        slides: [
          {
            id: 1,
            title: 'Her şirkete uygun Toya Yazılım ürünlerini keşfedin',
            subtitle: 'ERP, CRM, E-Dönüşüm ve daha fazlası ile işletmenizi dijitalleştirin',
            image: '',
            bgColor: '#0a2540',
            btn1Text: 'KEŞFET',
            btn1Link: '#solutions',
            btn2Text: 'TEKLİF AL',
            btn2Link: '/iletisim'
          },
          {
            id: 2,
            title: 'Güçlü ERP Çözümleriyle İşletmenizi Yönetin',
            subtitle: 'Muhasebe, stok, satış ve üretim süreçlerinizi tek platformda yönetin',
            image: '',
            bgColor: '#0d3b6e',
            btn1Text: 'ERP İNCELE',
            btn1Link: '#solutions',
            btn2Text: 'DEMO İSTE',
            btn2Link: '/iletisim'
          }
        ]
      },
      updated_at: new Date().toISOString()
    },
    {
      slug: 'solutions',
      content: {
        title: 'Toya Yazılım Çözümleri',
        subtitle: 'İşletmenize özel yazılım çözümleri sunuyoruz',
        cards: [
          {
            id: 1,
            title: 'ERP Çözümleri',
            description: 'İşletmenizin tüm süreçlerini entegre bir yapıda yönetin. Muhasebe, stok, satış ve daha fazlası.',
            image: '',
            link: '#',
            slug: 'erp-cozumleri'
          },
          {
            id: 2,
            title: 'Mobil Uygulama',
            description: 'iOS ve Android platformlarında işletmenizi her yerden yönetin. Güçlü mobil çözümler.',
            image: '',
            link: '#',
            slug: 'mobil-uygulama'
          },
          {
            id: 3,
            title: 'Müşteri Odaklı CRM',
            description: 'Müşteri ilişkilerinizi güçlendirin. Satış süreçlerinizi optimize edin ve müşteri memnuniyetini artırın.',
            image: '',
            link: '#',
            slug: 'musteri-odakli-crm'
          },
          {
            id: 4,
            title: 'Gelişmiş Entegrasyon',
            description: 'E-ticaret, muhasebe ve lojistik sistemlerinizi tek bir platformda entegre edin.',
            image: '',
            link: '#',
            slug: 'gelismis-entegrasyon'
          },
          {
            id: 5,
            title: 'Tam Entegre Yönetim',
            description: 'Tüm departmanlarınızı birbirine bağlayan kapsamlı yönetim sistemi.',
            image: '',
            link: '#',
            slug: 'tam-entegre-yonetim'
          },
          {
            id: 6,
            title: 'Kamu Projeleri',
            description: 'Kamuya özel yazılım projelerinde 20 yıllık deneyimle yanınızdayız.',
            image: '',
            link: '#',
            slug: 'kamu-projeleri'
          }
        ]
      },
      updated_at: new Date().toISOString()
    },
    {
      slug: 'stats',
      content: {
        items: [
          { id: 1, value: 5000, suffix: '+', label: 'Mutlu Müşteri' },
          { id: 2, value: 20, suffix: '+', label: 'Yıllık Deneyim' },
          { id: 3, value: 150, suffix: '+', label: 'Uzman Kadro' },
          { id: 4, value: 10000, suffix: '+', label: 'Tamamlanan Proje' }
        ]
      },
      updated_at: new Date().toISOString()
    },
    {
      slug: 'cta',
      content: {
        title: 'Toya Yazılım çözümlerinin şirketinize sağlayacağı faydaları öğrenmek ister misiniz?',
        btnText: 'Detaylı Bilgi Al',
        btnLink: '/iletisim'
      },
      updated_at: new Date().toISOString()
    },
    {
      slug: 'footer',
      content: {
        logo: '',
        logoText: 'Toya Yazılım',
        description: '20 yılı aşkın tecrübemizle işletmelerin dijital dönüşümüne liderlik ediyoruz.',
        phone: '0850 711 0 220',
        email: 'info@toyayazilim.com.tr',
        address: 'İstanbul, Türkiye',
        social: {
          facebook: '#',
          twitter: '#',
          linkedin: '#',
          instagram: '#',
          youtube: '#'
        },
        copyright: '© 2024 Toya Yazılım. Tüm hakları saklıdır.'
      },
      updated_at: new Date().toISOString()
    },
    {
      slug: 'pages',
      content: {
        kurumsal: {
          title: 'Hakkımızda',
          body: '<h2>Toya Yazılım Hakkında</h2><p>20 yılı aşkın tecrübemizle işletmelerin dijital dönüşümüne liderlik ediyoruz.</p>'
        },
        iletisim: {
          title: 'İletişim',
          body: '<h2>Bize Ulaşın</h2><p>Her türlü soru ve talebiniz için bizimle iletişime geçebilirsiniz.</p>'
        }
      },
      updated_at: new Date().toISOString()
    }
  ],
  images: [],
  pages: [
    {
      id: 'page-erp',
      parentId: null,
      slug: 'erp-cozumleri',
      title: 'ERP Çözümleri',
      body: '<h2>ERP Çözümleri</h2><p>İşletmenizin tüm süreçlerini entegre bir yapıda yönetin. Muhasebe, stok, satış ve daha fazlası tek platformda.</p>',
      image: '',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'page-mobile',
      parentId: null,
      slug: 'mobil-uygulama',
      title: 'Mobil Uygulama',
      body: '<h2>Mobil Uygulama</h2><p>iOS ve Android platformlarında işletmenizi her yerden yönetin. Güçlü mobil çözümler sunuyoruz.</p>',
      image: '',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'page-crm',
      parentId: null,
      slug: 'musteri-odakli-crm',
      title: 'Müşteri Odaklı CRM',
      body: '<h2>Müşteri Odaklı CRM</h2><p>Müşteri ilişkilerinizi güçlendirin. Satış süreçlerinizi optimize edin ve müşteri memnuniyetini artırın.</p>',
      image: '',
      order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'page-integration',
      parentId: null,
      slug: 'gelismis-entegrasyon',
      title: 'Gelişmiş Entegrasyon',
      body: '<h2>Gelişmiş Entegrasyon</h2><p>E-ticaret, muhasebe ve lojistik sistemlerinizi tek bir platformda entegre edin.</p>',
      image: '',
      order: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'page-management',
      parentId: null,
      slug: 'tam-entegre-yonetim',
      title: 'Tam Entegre Yönetim',
      body: '<h2>Tam Entegre Yönetim</h2><p>Tüm departmanlarınızı birbirine bağlayan kapsamlı yönetim sistemi.</p>',
      image: '',
      order: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'page-public',
      parentId: null,
      slug: 'kamu-projeleri',
      title: 'Kamu Projeleri',
      body: '<h2>Kamu Projeleri</h2><p>Kamuya özel yazılım projelerinde 20 yıllık deneyimle yanınızdayız.</p>',
      image: '',
      order: 5,
      blocks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  productCategories: [],
  products: [],
  seoMeta: [
    {
      id: 'seo-home',
      pageKey: '/',
      title: 'Toya Yazılım | Ana Sayfa',
      description: '20 yıllık tecrübeyle işletmelerin dijital dönüşümüne liderlik ediyoruz. ERP, CRM, E-Dönüşüm ve daha fazlası.',
      keywords: 'erp, crm, e-dönüşüm, yazılım, toya',
      ogTitle: 'Toya Yazılım',
      ogDescription: '20 yıllık tecrübeyle işletmelerin dijital dönüşümüne liderlik ediyoruz.',
      ogImage: '',
      canonical: '',
      robots: 'index, follow',
      jsonLd: null,
      updatedAt: new Date().toISOString()
    }
  ],
  seoGlobal: {
    siteName: 'Toya Yazılım',
    defaultTitle: 'Toya Yazılım | ERP, CRM, E-Dönüşüm Çözümleri',
    defaultDescription: '20 yıllık tecrübeyle işletmelerin dijital dönüşümüne liderlik ediyoruz.',
    defaultOgImage: '',
    robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: /sitemap.xml'
  },
  chatSessions: [],
  chatMessages: [],
  references: [],
  downloads: [],
  collections: [],
  collectionCategories: [],
  collectionEntries: [],
  collectionTemplates: []
}).write();

// sections dizisine theme yok ise ekle
const hasTheme = db.get('sections').find({ slug: 'theme' }).value();
if (!hasTheme) {
  db.get('sections').push({
    slug: 'theme',
    content: {
      colors: {
        primary: '#f97316',
        secondary: '#0a2540',
        accent: '#0d3b6e',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#1a1a2e',
        textMuted: '#64748b'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontFamilyHeading: 'Inter, sans-serif',
        fontSizeBase: '16px',
        h1: { size: '2.5rem', weight: '700' },
        h2: { size: '2rem', weight: '700' },
        h3: { size: '1.5rem', weight: '600' },
        lineHeight: '1.6'
      },
      spacing: {
        sectionPaddingY: '80px',
        cardBorderRadius: '16px',
        buttonBorderRadius: '8px'
      },
      logo: '',
      favicon: ''
    },
    updated_at: new Date().toISOString()
  }).write();
}

const hasHomeLayout = db.get('sections').find({ slug: 'homeLayout' }).value();
if (!hasHomeLayout) {
  db.get('sections').push({
    slug: 'homeLayout',
    content: { activeTheme: 'A' },
    updated_at: new Date().toISOString()
  }).write();
}

[
  'collections',
  'collectionCategories',
  'collectionEntries',
  'collectionTemplates'
].forEach((key) => {
  if (!db.has(key).value()) db.set(key, []).write();
});

module.exports = db;
