/**
 * ELS.SHOP - Module de Stockage Centralisé Persistant via GitHub API
 * Assure la synchronisation parfaite et permanente pour les Produits et les Commandes
 */

const REPO = 'eliottquinzain-cell/els-shop';
const PRODUCTS_FILE = 'products.json';
const ORDERS_FILE = 'orders.json';
const SETTINGS_FILE = 'settings.json';
const BRANCH = 'main';

// In-memory caches to guarantee fast response times
let cachedProducts = null;
let lastProductsCacheTime = 0;

let cachedOrders = null;
let lastOrdersCacheTime = 0;

let cachedSettings = null;
let lastSettingsCacheTime = 0;

const CACHE_TTL_MS = 4000; // 4 secondes de cache

function getGitHubToken() {
  return process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
}

/**
 * Récupère le catalogue des produits depuis GitHub (ou cache)
 */
async function getProducts() {
  const now = Date.now();
  if (cachedProducts && (now - lastProductsCacheTime < CACHE_TTL_MS)) {
    return cachedProducts;
  }

  const token = getGitHubToken();
  if (!token) {
    console.warn('GH_TOKEN non configuré, retour du cache local.');
    return cachedProducts || [];
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${PRODUCTS_FILE}?ref=${BRANCH}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'ELS-Shop-API',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.status === 404) {
      cachedProducts = [];
      lastProductsCacheTime = now;
      return [];
    }

    if (!res.ok) {
      console.error('Erreur GitHub fetch products:', await res.text());
      return cachedProducts || [];
    }

    const data = await res.json();
    const contentStr = Buffer.from(data.content, 'base64').toString('utf8');
    const parsed = JSON.parse(contentStr || '[]');
    cachedProducts = Array.isArray(parsed) ? parsed : [];
    lastProductsCacheTime = now;
    return cachedProducts;

  } catch (err) {
    console.error('getProducts exception:', err);
    return cachedProducts || [];
  }
}

/**
 * Sauvegarde le catalogue des produits sur GitHub et invalide le cache
 */
async function saveProducts(products, authorName = 'Admin') {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('GH_TOKEN manquant pour enregistrer sur le dépôt GitHub.');
  }

  let sha = null;
  try {
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${PRODUCTS_FILE}?ref=${BRANCH}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'ELS-Shop-API',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }
  } catch (e) {}

  const jsonContent = JSON.stringify(products, null, 2);
  const contentB64 = Buffer.from(jsonContent, 'utf8').toString('base64');

  const payload = {
    message: `chore(catalog): mise à jour par ${authorName} (${products.length} articles)`,
    content: contentB64,
    branch: BRANCH
  };
  if (sha) {
    payload.sha = sha;
  }

  const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${PRODUCTS_FILE}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'ELS-Shop-API',
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify(payload)
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`Échec de la synchronisation GitHub (${putRes.status}): ${errText}`);
  }

  cachedProducts = products;
  lastProductsCacheTime = Date.now();
  return { success: true, count: products.length };
}

/**
 * Récupère la liste des commandes depuis GitHub (ou cache)
 */
async function getOrders() {
  const now = Date.now();
  if (cachedOrders && (now - lastOrdersCacheTime < CACHE_TTL_MS)) {
    return cachedOrders;
  }

  const token = getGitHubToken();
  if (!token) {
    return cachedOrders || [];
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${ORDERS_FILE}?ref=${BRANCH}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'ELS-Shop-API',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.status === 404) {
      cachedOrders = [];
      lastOrdersCacheTime = now;
      return [];
    }

    if (!res.ok) {
      console.error('Erreur GitHub fetch orders:', await res.text());
      return cachedOrders || [];
    }

    const data = await res.json();
    const contentStr = Buffer.from(data.content, 'base64').toString('utf8');
    const parsed = JSON.parse(contentStr || '[]');
    cachedOrders = Array.isArray(parsed) ? parsed : [];
    lastOrdersCacheTime = now;
    return cachedOrders;

  } catch (err) {
    console.error('getOrders exception:', err);
    return cachedOrders || [];
  }
}

/**
 * Sauvegarde la liste des commandes sur GitHub et invalide le cache
 */
async function saveOrders(orders, authorName = 'Admin') {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('GH_TOKEN manquant pour enregistrer sur le dépôt GitHub.');
  }

  let sha = null;
  try {
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${ORDERS_FILE}?ref=${BRANCH}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'ELS-Shop-API',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }
  } catch (e) {}

  const jsonContent = JSON.stringify(orders, null, 2);
  const contentB64 = Buffer.from(jsonContent, 'utf8').toString('base64');

  const payload = {
    message: `chore(orders): mise à jour par ${authorName} (${orders.length} commandes)`,
    content: contentB64,
    branch: BRANCH
  };
  if (sha) {
    payload.sha = sha;
  }

  const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${ORDERS_FILE}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'ELS-Shop-API',
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify(payload)
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`Échec de la synchronisation commandes (${putRes.status}): ${errText}`);
  }

  cachedOrders = orders;
  lastOrdersCacheTime = Date.now();
  return { success: true, count: orders.length };
}

/**
 * Récupère la configuration système (WhatsApp Groupe, SMS, PayPal) depuis GitHub
 */
async function getSettings() {
  const now = Date.now();
  if (cachedSettings && (now - lastSettingsCacheTime < CACHE_TTL_MS)) {
    return cachedSettings;
  }

  const defaultSettings = {
    paypalEmail: 'iliesimaj9@gmail.com',
    shippingCost: 4.90,
    greenApiInstanceId: process.env.GREEN_API_INSTANCE_ID || '',
    greenApiToken: process.env.GREEN_API_TOKEN || '',
     greenApiHost: process.env.GREEN_API_HOST || 'https://api.green-api.com',
    whatsappGroupId: process.env.WHATSAPP_GROUP_ID || '',
    whatsappGroupName: '',
    smsWebhookUrl: process.env.SMS_WEBHOOK_URL || '',
    smsApiKey: process.env.SMS_API_KEY || '',
    customWebhookUrl: process.env.ORDER_WEBHOOK_URL || '',
    autoSendTrackingWhatsApp: true,
    autoSendTrackingSms: true
  };

  const token = getGitHubToken();
  if (!token) {
    return cachedSettings || defaultSettings;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${SETTINGS_FILE}?ref=${BRANCH}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'ELS-Shop-API',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.status === 404) {
      cachedSettings = defaultSettings;
      lastSettingsCacheTime = now;
      return defaultSettings;
    }

    if (!res.ok) {
      return cachedSettings || defaultSettings;
    }

    const data = await res.json();
    const contentStr = Buffer.from(data.content, 'base64').toString('utf8');
    const parsed = JSON.parse(contentStr || '{}');
    cachedSettings = { ...defaultSettings, ...parsed, paypalEmail: 'iliesimaj9@gmail.com', shippingCost: 4.90 };
    lastSettingsCacheTime = now;
    return cachedSettings;
  } catch (err) {
    console.error('getSettings exception:', err);
    return cachedSettings || defaultSettings;
  }
}

/**
 * Sauvegarde la configuration système sur GitHub
 */
async function saveSettings(newSettings, authorName = 'Admin') {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('GH_TOKEN manquant pour enregistrer la configuration.');
  }

  let sha = null;
  try {
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${SETTINGS_FILE}?ref=${BRANCH}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'ELS-Shop-API',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }
  } catch (e) {}

  const current = await getSettings();
  const merged = {
    ...current,
    ...newSettings,
    paypalEmail: 'iliesimaj9@gmail.com',
    shippingCost: 4.90,
    updatedAt: new Date().toISOString(),
    updatedBy: authorName
  };

  const jsonContent = JSON.stringify(merged, null, 2);
  const contentB64 = Buffer.from(jsonContent, 'utf8').toString('base64');

  const payload = {
    message: `chore(settings): configuration WhatsApp/SMS mise à jour par ${authorName}`,
    content: contentB64,
    branch: BRANCH
  };
  if (sha) {
    payload.sha = sha;
  }

  const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${SETTINGS_FILE}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'ELS-Shop-API',
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify(payload)
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`Échec de la sauvegarde settings (${putRes.status}): ${errText}`);
  }

  cachedSettings = merged;
  lastSettingsCacheTime = Date.now();
  return { success: true, settings: merged };
}

module.exports = {
  getProducts,
  saveProducts,
  getOrders,
  saveOrders,
  getSettings,
  saveSettings
};
