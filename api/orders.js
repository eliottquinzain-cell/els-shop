/**
 * ELS.SHOP - API des Commandes & Gestion des Ventes
 * Permet à Eliott & Ilies de créer, modifier, lister et supprimer des commandes
 */

const { getOrders, saveOrders, getProducts, saveProducts } = require('./lib/storage');
const { requireAdmin } = require('./lib/auth');
const { sendEmailNotification, generateShippingEmailHtml } = require('./lib/notifications');

function extractId(req, body) {
  if (body && body.id) return String(body.id).trim();
  if (req.query && req.query.id) return String(req.query.id).trim();
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      const paramId = parsed.searchParams.get('id');
      if (paramId) return String(paramId).trim();
    } catch (e) {}
  }
  return null;
}

module.exports = async (req, res) => {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Vérifier authentification Admin (Eliott ou Ilies)
  const admin = requireAdmin(req);
  if (!admin) {
    return res.status(401).json({
      success: false,
      error: 'Accès non autorisé. Veuillez vous connecter avec votre compte Eliott ou Ilies.'
    });
  }

  try {
    let orders = await getOrders();
    if (!Array.isArray(orders)) {
      orders = [];
    }

    // Parse body if present
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    // -------------------------------------------------------------
    // GET: Liste de toutes les commandes avec stats avancées
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      // Calcul des statistiques avancées pour l'onglet Stats
      const productStats = {};
      const sizeStats = {};
      const colorStats = {};
      const brandStats = {};
      const channelStats = {
        'Web (Stripe)': 0,
        'Vente Directe (IRL)': 0
      };

      let totalSoldUnits = 0;
      let validOrdersCount = 0;
      let totalSalesRevenue = 0;

      orders.forEach(o => {
        if (o.status === 'annule') return;
        validOrdersCount++;
        totalSalesRevenue += parseFloat(o.total || 0);

        const channel = (o.paymentMethod || '').toLowerCase().includes('stripe') ? 'Web (Stripe)' : 'Vente Directe (IRL)';
        channelStats[channel] = (channelStats[channel] || 0) + 1;

        (o.items || []).forEach(it => {
          const qty = parseInt(it.quantity, 10) || 1;
          totalSoldUnits += qty;

          // Product stats
          const prodKey = `${it.brand || 'ELS'} - ${it.name}`;
          if (!productStats[prodKey]) {
            productStats[prodKey] = {
              name: it.name,
              brand: it.brand || 'ELS',
              units: 0,
              revenue: 0
            };
          }
          productStats[prodKey].units += qty;
          productStats[prodKey].revenue += (parseFloat(it.price || 0) * qty);

          // Size stats
          const sz = (it.size || 'M').toUpperCase();
          sizeStats[sz] = (sizeStats[sz] || 0) + qty;

          // Color stats
          if (it.color) {
            const clr = it.color.trim();
            colorStats[clr] = (colorStats[clr] || 0) + qty;
          }

          // Brand stats
          const br = (it.brand || 'ELS').trim();
          brandStats[br] = (brandStats[br] || 0) + qty;
        });
      });

      // Sorted arrays for frontend
      const topProducts = Object.values(productStats).sort((a, b) => b.units - a.units);
      const topSizes = Object.entries(sizeStats)
        .map(([size, count]) => ({ size, count }))
        .sort((a, b) => b.count - a.count);
      const topColors = Object.entries(colorStats)
        .map(([color, count]) => ({ color, count }))
        .sort((a, b) => b.count - a.count);
      const topBrands = Object.entries(brandStats)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count);

      const stats = {
        totalOrders: orders.length,
        validOrdersCount,
        pendingCount: orders.filter(o => o.status === 'en_attente' || o.status === 'en_preparation').length,
        shippedCount: orders.filter(o => o.status === 'expedie').length,
        deliveredCount: orders.filter(o => o.status === 'livre').length,
        canceledCount: orders.filter(o => o.status === 'annule').length,
        totalSalesRevenue: Math.round(totalSalesRevenue * 100) / 100,
        averageOrderValue: validOrdersCount > 0 ? Math.round((totalSalesRevenue / validOrdersCount) * 100) / 100 : 0,
        totalSoldUnits,
        topProducts,
        topSizes,
        topColors,
        topBrands,
        channelStats
      };

      return res.status(200).json({
        success: true,
        count: orders.length,
        stats,
        orders
      });
    }

    // -------------------------------------------------------------
    // POST: Créer une nouvelle commande (ex: Vente directe)
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      const {
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        items,
        total,
        paymentMethod = 'Espèces',
        notes = '',
        status = 'en_preparation',
        trackingNumber = '',
        carrier = 'Main propre',
        deductStock = true
      } = body || {};

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'La commande doit comporter au moins un article.'
        });
      }

      const orderId = 'ELS-CMD-' + Math.floor(1000 + Math.random() * 9000);

      const statusLabels = {
        'en_attente': 'En attente',
        'en_preparation': 'En préparation',
        'expedie': 'Expédiée',
        'livre': 'Livrée',
        'annule': 'Annulée'
      };

      const newOrder = {
        id: orderId,
        customerName: (customerName || 'Client').trim(),
        customerEmail: (customerEmail || '').trim().toLowerCase(),
        customerPhone: (customerPhone || '').trim(),
        customerAddress: (customerAddress || 'Remise directe').trim(),
        items: items.map(it => ({
          id: it.id || '',
          name: it.name || 'Article',
          brand: it.brand || '',
          color: it.color || 'Standard',
          size: it.size || 'M',
          price: parseFloat(it.price) || 0,
          quantity: parseInt(it.quantity, 10) || 1
        })),
        total: parseFloat(total) || items.reduce((acc, it) => acc + (parseFloat(it.price || 0) * (parseInt(it.quantity, 10) || 1)), 0),
        paymentMethod,
        status,
        statusLabel: statusLabels[status] || 'En cours',
        trackingNumber: (trackingNumber || '').trim(),
        carrier: (carrier || 'Main propre').trim(),
        notes: (notes || '').trim(),
        createdAt: new Date().toISOString(),
        createdBy: admin.displayName || admin.username
      };

      orders.unshift(newOrder);
      await saveOrders(orders, admin.displayName);

      // Déduire immédiatement le stock si demandé
      if (deductStock) {
        try {
          const products = await getProducts();
          let stockUpdated = false;

          for (const item of newOrder.items) {
            const product = products.find(p => p.id === item.id || (p.name.toLowerCase() === item.name.toLowerCase() && p.brand.toLowerCase() === item.brand.toLowerCase()));
            if (product && product.stock && product.stock[item.size] !== undefined) {
              const currentStock = parseInt(product.stock[item.size], 10) || 0;
              product.stock[item.size] = Math.max(0, currentStock - (item.quantity || 1));
              stockUpdated = true;
            }
          }

          if (stockUpdated) {
            await saveProducts(products, `${admin.displayName} (Déduction Stock ${orderId})`);
          }
        } catch (stockErr) {
          console.error('Erreur déduction stock:', stockErr);
        }
      }

      return res.status(201).json({
        success: true,
        message: `Commande ${orderId} créée avec succès.`,
        order: newOrder
      });
    }

    // -------------------------------------------------------------
    // PUT / PATCH: MODIFIER INTÉGRALEMENT UNE COMMANDE
    // -------------------------------------------------------------
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const id = extractId(req, body);
      if (!id) {
        return res.status(400).json({ success: false, error: 'Identifiant de commande manquant.' });
      }

      const orderIndex = orders.findIndex(o => o.id === id);
      if (orderIndex === -1) {
        return res.status(404).json({ success: false, error: `Commande ${id} introuvable.` });
      }

      const statusLabels = {
        'en_attente': 'En attente',
        'en_preparation': 'En préparation',
        'expedie': 'Expédiée',
        'livre': 'Livrée',
        'annule': 'Annulée'
      };

      const order = orders[orderIndex];

      // Mise à jour de tous les champs modifiables
      const oldStatus = order.status;
      if (body.customerName !== undefined) order.customerName = String(body.customerName).trim();
      if (body.customerEmail !== undefined) order.customerEmail = String(body.customerEmail).trim().toLowerCase();
      if (body.customerPhone !== undefined) order.customerPhone = String(body.customerPhone).trim();
      if (body.customerAddress !== undefined) order.customerAddress = String(body.customerAddress).trim();
      if (body.total !== undefined) order.total = parseFloat(body.total) || order.total;
      if (body.paymentMethod !== undefined) order.paymentMethod = String(body.paymentMethod).trim();
      if (body.carrier !== undefined) order.carrier = String(body.carrier).trim();
      if (body.trackingNumber !== undefined) order.trackingNumber = String(body.trackingNumber).trim();
      if (body.notes !== undefined) order.notes = String(body.notes).trim();

      if (body.status !== undefined) {
        order.status = body.status;
        order.statusLabel = statusLabels[body.status] || body.status;
      }

      // Notification automatique lors du passage à l'état expédié
      if (order.status === 'expedie' && oldStatus !== 'expedie' && order.trackingNumber && order.customerEmail) {
        try {
          const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
          const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
          const origin = `${proto}://${host}`;
          const emailHtml = generateShippingEmailHtml(order, origin);
          sendEmailNotification({
            to: order.customerEmail,
            subject: `Votre commande ${order.id} a été expédiée ! (${order.carrier || 'Colissimo'})`,
            html: emailHtml
          }).catch(e => console.warn('Email expédition non envoyé:', e));
        } catch (e) {}
      }

      // Si les articles de la commande ont été modifiés
      if (body.items && Array.isArray(body.items)) {
        order.items = body.items.map(it => ({
          id: it.id || '',
          name: it.name || 'Article',
          brand: it.brand || '',
          color: it.color || 'Standard',
          size: it.size || 'M',
          price: parseFloat(it.price) || 0,
          quantity: parseInt(it.quantity, 10) || 1
        }));
      }

      order.updatedAt = new Date().toISOString();
      order.updatedBy = admin.displayName;

      await saveOrders(orders, admin.displayName);

      return res.status(200).json({
        success: true,
        message: `Commande ${id} modifiée avec succès.`,
        order: orders[orderIndex]
      });
    }

    // -------------------------------------------------------------
    // DELETE: SUPPRIMER DÉFINITIVEMENT UNE COMMANDE
    // -------------------------------------------------------------
    if (req.method === 'DELETE') {
      const id = extractId(req, body);
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID de commande manquant.' });
      }

      const initialCount = orders.length;
      orders = orders.filter(o => o.id !== id);

      if (orders.length === initialCount) {
        return res.status(404).json({ success: false, error: `Commande ${id} introuvable.` });
      }

      await saveOrders(orders, `${admin.displayName} (Suppression Commande ${id})`);

      return res.status(200).json({
        success: true,
        message: `Commande ${id} supprimée définitivement.`
      });
    }

    return res.status(405).json({ success: false, error: 'Méthode non autorisée.' });

  } catch (error) {
    console.error('Erreur API Commandes:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur interne du serveur lors de la gestion des commandes.'
    });
  }
};
