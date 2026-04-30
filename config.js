module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'toya_super_secret_jwt_key_2024',
  PORT: process.env.PORT || 3001,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CRM_API_URL: process.env.CRM_API_URL || 'https://api.ivocrm.com/api/public/contact',
  CRM_TENANT_SUBDOMAIN: process.env.CRM_TENANT_SUBDOMAIN || 'ivopos'
};
