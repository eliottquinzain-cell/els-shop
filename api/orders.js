/**
 * ELS.SHOP - API des Commandes & Gestion des Ventes
 * Permet à Eliott & Ilies de suivre les commandes Web et d'enregistrer des ventes en direct
 */

const { getOrders, saveOrders, getProducts, saveProducts } = require('./lib/storage');
const { requireAdmin } = require('./lib/auth');

module.exports = async (req, res) => {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Vérifier authentification Admin
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

    // -------------------------------------------------------------
    // GET: Liste de toutes les commandes
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      // Trier par date décroissante (les plus récentes d'abord)
      orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const stats = {
        totalOrders: orders.length,
        pendingCount: orders.filter(o => o.status === 'en_attente' || o.status === 'en_preparation').length,
        shippedCount: orders.filter(o => o.status === 'expedie').length,
        deliveredCount: orders.filter(o => o.status === 'livre').length,
        totalSalesRevenue: orders
          .filter(o => o.status !== 'annule')
          .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
      };

      return res.status(200).json({
        success: true,
        count: orders.length,
        stats,
        orders
      });
    }

    // -------------------------------------------------------------
    // POST: Créer une nouvelle commande (ex: Vente directe / Main propre)
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }

      const {
        customerName,
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
      } = body;

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
        customerPhone: (customerPhone || '').trim(),
        customerAddress: (customerAddress || 'Remise directe').trim(),
        items: items.map(it => ({
          id: it.id || '',
          name: it.name || 'Article',
          brand: it.brand || '',
          color: it.color || '',
          size: it.size || 'M',
          price: parseFloat(it.price) || 0,
          quantity: parseInt(it.quantity, 10) || 1
        })),
        total: parseFloat(total) || items.reduce((acc, it) => acc + (parseFloat(it.price || 0) * (parseInt(it.quantity, 10) || 1)), 0),
        paymentMethod,
        status,
        statusLabel: statusLabels[status] || 'En cours',
        trackingNumber: trackingNumber.trim(),
        carrier: carrier.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        createdBy: admin.displayName || admin.username
      };

      orders.unshift(newOrder);
      await saveOrders(orders, admin.displayName);

      // Si demandé, déduire immédiatement le stock de l'article dans le catalogue !
      if (deductStock) {
        try {
          const products = await getProducts();
          let stockUpdated = false;

          for (const item of newOrder.items) {
            const product = products.find(p => p.id === item.id || (p.name.toLowerCase() === item.name.toLowerCase() && p.brand.toLowerCase() === item.brand.toLowerCase()));
            if (product && product.stock && product.stock[item.size] !== undefined) {
              const currentStock = parseInt(product.stock[item.size], 10) || 0;
              const newStock = Math.max(0, currentStock - (item.quantity || 1));
              product.stock[item.size] = newStock;
              stockUpdated = true;
            }
          }

          if (stockUpdated) {
            await saveProducts(products, `${admin.displayName} (Déduction Stock Commande ${orderId})`);
          }
        } catch (stockErr) {
          console.error('Erreur lors de la déduction du stock:', stockErr);
        }
      }

      return res.status(201).json({
        success: true,
        message: `Commande ${orderId} créée avec succès.`,
        order: newOrder
      });
    }

    // -------------------------------------------------------------
    // PUT / PATCH: Mettre à jour une commande (statut, suivi, notes)
    // -------------------------------------------------------------
    if (req.method === 'PUT' || req.method === 'PATCH') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }

      const { id, status, trackingNumber, notes, carrier } = body;
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

      if (status !== undefined) {
        orders[orderIndex].status = status;
        orders[orderIndex].statusLabel = statusLabels[status] || status;
      }
      if (trackingNumber !== undefined) orders[orderIndex].trackingNumber = trackingNumber.trim();
      if (notes !== undefined) orders[orderIndex].notes = notes.trim();
      if (carrier !== undefined) orders[orderIndex].carrier = carrier.trim();
      orders[orderIndex].updatedAt = new Date().toISOString();
      orders[orderIndex].updatedBy = admin.displayName;

      await saveOrders(orders, admin.displayName);

      return res.status(200).json({
        success: true,
        message: `Commande ${id} mise à jour.`,
        order: orders[orderIndex]
      });
    }

    // -------------------------------------------------------------
    // DELETE: Supprimer une commande
    // -------------------------------------------------------------
    if (req.method === 'DELETE') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }

      const id = body.id || req.query.id;
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID de commande manquant.' });
      }

      const initialCount = orders.length;
      orders = orders.filter(o => o.id !== id);

      if (orders.length === initialCount) {
        return res.status(404).json({ success: false, error: `Commande ${id} introuvable.` });
      }

      await saveOrders(orders, admin.displayName);

      return res.status(200).json({
        success: true,
        message: `Commande ${id} supprimée.`
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
