#!/usr/bin/env node
/**
 * Build script: injects env vars from .env (or process.env) into index.html → dist/
 * Run: npm run build
 * Requires: .env (local) or env vars (CI)
 */

const fs = require('fs');
const path = require('path');

// Load .env if it exists (local dev)
try {
  require('dotenv').config();
} catch (_) {}

const ENV_VARS = [
  'OPEN_STATES_API_KEY',
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_SERVICE_ID',
  'EMAILJS_TEMPLATE_ID',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
];

const root = path.join(__dirname);
const templatePath = path.join(root, 'index.html');
const adminPath = path.join(root, 'admin.html');
const distDir = path.join(root, 'dist');

if (!fs.existsSync(templatePath)) {
  console.error('Missing index.html');
  process.exit(1);
}

// Build replacement map (use placeholders when env not set, so demo/fallback logic works)
const DEFAULTS = {
  OPEN_STATES_API_KEY: 'YOUR_OPEN_STATES_API_KEY',
  EMAILJS_PUBLIC_KEY: 'YOUR_EMAILJS_PUBLIC_KEY',
  EMAILJS_SERVICE_ID: 'YOUR_SERVICE_ID',
  EMAILJS_TEMPLATE_ID: 'YOUR_TEMPLATE_ID',
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
};
const replacements = {};
for (const key of ENV_VARS) {
  replacements[`__${key}__`] = process.env[key] || DEFAULTS[key] || '';
}

function injectEnv(html) {
  let out = html;
  for (const [placeholder, value] of Object.entries(replacements)) {
    out = out.split(placeholder).join(value);
  }
  return out;
}

let indexHtml = fs.readFileSync(templatePath, 'utf8');
indexHtml = injectEnv(indexHtml);

let adminHtml = fs.readFileSync(adminPath, 'utf8');
adminHtml = injectEnv(adminHtml);

if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);
fs.writeFileSync(path.join(distDir, 'admin.html'), adminHtml);
fs.copyFileSync(path.join(root, 'CNAME'), path.join(distDir, 'CNAME'));

console.log('Build complete: dist/index.html, dist/admin.html');
