/**
 * ELS.SHOP - Module d'Authentification Administrateur
 * Gère les comptes Eliott et Ilies avec droits identiques
 */

const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'ELS_SHOP_JWT_SUPER_SECRET_KEY_2026_X99';
const SALT = 'ELS_SHOP_ADMIN_SECURITY_SALT_2026';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + SALT).digest('hex');
}

// Les 2 comptes administrateurs avec droits équivalents
const ADMIN_ACCOUNTS = {
  eliott: {
    username: 'eliott',
    displayName: 'Eliott',
    role: 'Super Admin',
    // Hash pour 'eliott2026'
    passwordHash: hashPassword('eliott2026')
  },
  ilies: {
    username: 'ilies',
    displayName: 'Ilies',
    role: 'Super Admin',
    // Hash pour 'ilies2026'
    passwordHash: hashPassword('ilies2026')
  }
};

function verifyAdminCredentials(username, password) {
  if (!username || !password) return null;
  const userKey = username.trim().toLowerCase();
  const account = ADMIN_ACCOUNTS[userKey];
  if (!account) return null;

  const inputHash = hashPassword(password.trim());
  if (inputHash === account.passwordHash) {
    return {
      username: account.username,
      displayName: account.displayName,
      role: account.role
    };
  }
  return null;
}

function generateToken(user) {
  const payload = {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (14 * 24 * 3600) // 14 jours
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(str).digest('base64url');
  return `${str}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expiré
    }
    return payload;
  } catch (e) {
    return null;
  }
}

function requireAdmin(req) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-admin-token']) {
    token = req.headers['x-admin-token'];
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/els_admin_token=([^;]+)/);
    if (match) token = match[1].trim();
  }

  const user = verifyToken(token);
  return user;
}

module.exports = {
  ADMIN_ACCOUNTS,
  hashPassword,
  verifyAdminCredentials,
  generateToken,
  verifyToken,
  requireAdmin
};
