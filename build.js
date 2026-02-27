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
  'GOOGLE_CIVIC_KEY',
  'OPEN_STATES_API_KEY',
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_SERVICE_ID',
  'EMAILJS_TEMPLATE_ID',
];

const root = path.join(__dirname);
const templatePath = path.join(root, 'index.html');
const distDir = path.join(root, 'dist');

if (!fs.existsSync(templatePath)) {
  console.error('Missing index.html');
  process.exit(1);
}

// Build replacement map (use placeholders when env not set, so demo/fallback logic works)
const DEFAULTS = {
  GOOGLE_CIVIC_KEY: 'YOUR_GOOGLE_CIVIC_API_KEY',
  OPEN_STATES_API_KEY: 'YOUR_OPEN_STATES_API_KEY',
  EMAILJS_PUBLIC_KEY: 'YOUR_EMAILJS_PUBLIC_KEY',
  EMAILJS_SERVICE_ID: 'YOUR_SERVICE_ID',
  EMAILJS_TEMPLATE_ID: 'YOUR_TEMPLATE_ID',
};
const replacements = {};
for (const key of ENV_VARS) {
  replacements[`__${key}__`] = process.env[key] || DEFAULTS[key] || '';
}

let html = fs.readFileSync(templatePath, 'utf8');
for (const [placeholder, value] of Object.entries(replacements)) {
  html = html.split(placeholder).join(value);
}

if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

fs.writeFileSync(path.join(distDir, 'index.html'), html);
fs.copyFileSync(path.join(root, 'CNAME'), path.join(distDir, 'CNAME'));
fs.copyFileSync(path.join(root, 'admin.html'), path.join(distDir, 'admin.html'));

console.log('Build complete: dist/index.html');
