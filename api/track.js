/**
 * ELS.SHOP - Endpoint Public de Suivi de Livraison
 * Permet aux clients de suivre l'avancement de leur colis en toute sécurité
 */

const { getOrders } = require('./lib/storage');
const { sanitizePublicOrder } = require('./lib/security');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let orderId = null;
  let contact = null;

  if (req.method === 'GET') {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      orderId = parsed.searchParams.get('id') || parsed.searchParams.get('order');
      contact = parsed.searchParams.get('contact') || parsed.searchParams.get('phone') || parsed.searchParams.get('email');
    } catch (e) {}
  } else if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    orderId = body?.id || body?.order;
    contact = body?.contact || body?.phone || body?.email;
  } else {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée.' });
  }

  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Veuillez renseigner votre numéro de commande (ex: ELS-CMD-1084).'
    });
  }

  const cleanOrderId = orderId.trim().toUpperCase();

  try {
    const orders = await getOrders();
    const order = orders.find(o => o.id && o.id.trim().toUpperCase() === cleanOrderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: `La commande ${cleanOrderId} n'a pas été trouvée. Veuillez vérifier votre référence ou contacter le support.`
      });
    }

    // Sécurisation stricte des données retournées
    const publicOrder = sanitizePublicOrder(order);

    return res.status(200).json({
      success: true,
      order: publicOrder
    });

  } catch (error) {
    console.error('Erreur suivi commande:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des informations de suivi.'
    });
  }
};
