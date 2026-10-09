/**
 * ELS.SHOP - Module de Stockage Centralisé Persistant via GitHub API
 * Assure la synchronisation parfaite et permanente entre l'Admin et la Vitrine
 */

const REPO = 'eliottquinzain-cell/els-shop';
const FILE_PATH = 'products.json';
const BRANCH = 'main';

// In-memory cache to guarantee fast response times
let cachedProducts = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5000; // 5 secondes de cache

function getGitHubToken() {
  return process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
}

/**
 * Récupère le catalogue des produits depuis GitHub (ou cache)
 */
async function getProducts() {
  const now = Date.now();
  if (cachedProducts && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedProducts;
  }

  const token = getGitHubToken();
  if (!token) {
    console.warn('GH_TOKEN non configuré, retour du cache local.');
    return cachedProducts || [];
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'ELS-Shop-API',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.status === 404) {
      cachedProducts = [];
      lastCacheTime = now;
      return [];
    }

    if (!res.ok) {
      console.error('Erreur GitHub fetch:', await res.text());
      return cachedProducts || [];
    }

    const data = await res.json();
    const contentStr = Buffer.from(data.content, 'base64').toString('utf8');
    const parsed = JSON.parse(contentStr || '[]');
    cachedProducts = Array.isArray(parsed) ? parsed : [];
    lastCacheTime = now;
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

  // 1. Récupérer le SHA actuel du fichier sur GitHub
  let sha = null;
  try {
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
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

  // 2. Encoder le nouveau contenu en Base64
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

  // 3. Envoyer la mise à jour via PUT
  const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
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

  // Mise à jour immédiate du cache local
  cachedProducts = products;
  lastCacheTime = Date.now();
  return { success: true, count: products.length };
}

module.exports = {
  getProducts,
  saveProducts
};
