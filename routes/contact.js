const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const config = require('../config');

router.post('/submit', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message, companyName } = req.body;

    if (!firstName || !message) {
      return res.status(400).json({ error: 'Ad ve mesaj alanları zorunludur.' });
    }

    const fullName = `${firstName} ${lastName || ''}`.trim();

    // 1. Yerel veritabanına kaydet (Chat sistemi üzerinden görülebilmesi için)
    const localMsg = {
      id: uuidv4(),
      sessionId: uuidv4(),
      visitorName: fullName,
      visitorEmail: email || '',
      message: `[İletişim Formu]\nŞirket: ${companyName || 'Belirtilmedi'}\nTelefon: ${phone || 'Belirtilmedi'}\n\n${message}`,
      reply: '',
      status: 'new',
      createdAt: new Date().toISOString(),
      repliedAt: null
    };
    db.get('chatMessages').push(localMsg).write();

    // 2. CRM API'sine gönder
    const crmPayload = {
      tenant_subdomain: config.CRM_TENANT_SUBDOMAIN,
      full_name: fullName,
      phone: phone || '',
      email: email || '',
      company_name: companyName || fullName,
      message: message
    };

    try {
      const response = await fetch(config.CRM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-subdomain': config.CRM_TENANT_SUBDOMAIN
        },
        body: JSON.stringify(crmPayload)
      });

      if (!response.ok) {
        console.error('CRM API Error:', await response.text());
        // CRM hatası olsa bile yerel kayıt yapıldığı için başarı dönebiliriz 
        // veya kullanıcıya bildirebiliriz. Şimdilik loglayıp devam ediyoruz.
      }
    } catch (crmErr) {
      console.error('CRM Connection Error:', crmErr.message);
    }

    res.json({ success: true, message: 'Mesajınız başarıyla iletildi.' });
  } catch (error) {
    console.error('Contact Submit Error:', error);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
});

module.exports = router;
