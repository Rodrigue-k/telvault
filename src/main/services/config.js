/**
 * config.js — Runtime configuration loader.
 *
 * In production, Telegram API credentials are stored encrypted in the SQLite
 * database (via safeStorage). This module only handles non-secret app-level
 * config that cannot live in the DB (e.g., feature flags, app metadata).
 *
 * The .env file is kept as a developer convenience ONLY and is never bundled
 * into the production installer.
 */
'use strict';

const path = require('path');
const dotenv = require('dotenv');

function loadConfig(appRoot) {
  // Load .env only in development (ignored in packaged app — file won't exist)
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    dotenv.config({ path: path.join(appRoot, '.env') });
  }

  return {
    // Reserved for future non-secret config (update server URL, feature flags…)
    app: {
      version: process.env.npm_package_version || '1.0.0',
    },
  };
}

module.exports = { loadConfig };
