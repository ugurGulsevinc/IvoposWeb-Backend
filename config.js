require('dotenv').config();

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('[FATAL] JWT_SECRET env variable is not set in production!');
  process.exit(1);
}

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'dev_only_secret_change_in_production',
  PORT: process.env.PORT || 3001,
  HOST: process.env.HOST || 'https://ivopos.com',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CRM_API_URL: process.env.CRM_API_URL || 'https://api.ivocrm.com/api/public/contact',
  CRM_TENANT_SUBDOMAIN: process.env.CRM_TENANT_SUBDOMAIN || 'ivopos'
};
