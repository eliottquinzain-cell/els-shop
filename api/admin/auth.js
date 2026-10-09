/**
 * ELS.SHOP - Endpoint d'authentification des administrateurs (Eliott & Ilies)
 */

const { verifyAdminCredentials, generateToken, verifyToken } = require('../lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Vérifier si le token actuel est valide
  if (req.method === 'GET') {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
    const admin = verifyToken(token);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Session invalide ou expirée.' });
    }
    return res.status(200).json({
      success: true,
      valid: true,
      user: {
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role
      }
    });
  }

  // POST: Connexion avec identifiant (eliott ou ilies) + mot de passe
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    const { username, password } = body || {};
    const admin = verifyAdminCredentials(username, password);

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Identifiant ou mot de passe incorrect. Utilisez le compte Eliott ou Ilies.'
      });
    }

    const token = generateToken(admin);

    return res.status(200).json({
      success: true,
      token,
      user: {
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role
      },
      message: `Bienvenue sur le back-office ELS.SHOP, ${admin.displayName} !`
    });
  }

  return res.status(405).json({ success: false, error: 'Méthode non autorisée.' });
};
