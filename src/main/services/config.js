const path = require('path');
const dotenv = require('dotenv');

function loadConfig(appRoot) {
  dotenv.config({ path: path.join(appRoot, '.env') });

  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;

  return {
    telegram: {
      apiId,
      apiHash,
      configured: Boolean(apiId && apiHash),
    },
  };
}

module.exports = { loadConfig };
