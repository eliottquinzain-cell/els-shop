/**
 * ELS.SHOP - API des Commandes, Suivi Automatique & Configuration Groupe WhatsApp
 * Permet à Eliott & Ilies de :
 * - Gérer les commandes et voir les preuves de paiement PayPal vérifiées
 * - Saisir un numéro de suivi -> Envoi automatique par message au numéro de téléphone de la commande
 * - Configurer et tester le système de Ticket Groupe WhatsApp automatique
 */

const { getOrders, saveOrders, getProducts, saveProducts, getSettings, saveSettings } = require('./lib/storage');
const { requireAdmin } = require('./lib/auth');
const {
  sendEmailNotification,
  generateShippingEmailHtml,
  sendWhatsAppGroupOrderTicket,
  sendTrackingMessageToCustomer,
  formatWhatsAppGroupTicket
} = require('./lib/notifications');

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    // -------------------------------------------------------------
    // GET: Liste de toutes les commandes + stats + settings
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const settings = await getSettings();
      orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const productStats = {};
      const sizeStats = {};
      const colorStats = {};
      const brandStats = {};
      const channelStats = {
        'Boutique Web (PayPal)': 0,
        'Vente Directe': 0
      };

      let totalSoldUnits = 0;
      let validOrdersCount = 0;
      let totalSalesRevenue = 0;

      orders.forEach(o => {
        if (o.status === 'annule') return;
        validOrdersCount++;
        totalSalesRevenue += parseFloat(o.total || 0);

        const isWeb = (o.paymentMethod || '').toLowerCase().includes('paypal') || (o.createdBy || '').toLowerCase().includes('web');
        const channel = isWeb ? 'Boutique Web (PayPal)' : 'Vente Directe';
        channelStats[channel] = (channelStats[channel] || 0) + 1;

        (o.items || []).forEach(it => {
          const qty = parseInt(it.quantity, 10) || 1;
          totalSoldUnits += qty;

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

          const sz = (it.size || 'M').toUpperCase();
          sizeStats[sz] = (sizeStats[sz] || 0) + qty;

          if (it.color) {
            const clr = it.color.trim();
            colorStats[clr] = (colorStats[clr] || 0) + qty;
          }

          const br = (it.brand || 'ELS').trim();
          brandStats[br] = (brandStats[br] || 0) + qty;
        });
      });

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
        settings,
        orders
      });
    }

    // -------------------------------------------------------------
    // POST: Actions spéciales (save_settings, fetch_whatsapp_groups, send_group_ticket) ou Création commande
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      const action = body?.action || '';

      // Action 1: Lister automatiquement les groupes WhatsApp depuis Green-API
      if (action === 'fetch_whatsapp_groups') {
        const instanceId = String(body.greenApiInstanceId || '').trim();
        const apiToken = String(body.greenApiToken || '').trim();
        const apiHost = String(body.greenApiHost || 'https://api.green-api.com').trim().replace(/\/$/, '');

        if (!instanceId || !apiToken) {
          return res.status(400).json({
            success: false,
            error: 'Veuillez renseigner votre idInstance et apiTokenInstance Green-API.'
          });
        }

        try {
          const contactsUrl = `${apiHost}/waInstance${instanceId}/getContacts/${apiToken}`;
          const resp = await fetch(contactsUrl);
          if (!resp.ok) {
            return res.status(400).json({
              success: false,
              error: `Impossible de récupérer les groupes Green-API (Code ${resp.status}). Vérifiez que votre instance est bien connectée par QR Code.`
            });
          }
          const contacts = await resp.json();
          const groups = (Array.isArray(contacts) ? contacts : [])
            .filter(c => c && c.id && String(c.id).endsWith('@g.us'))
            .map(g => ({
              id: g.id,
              name: g.name || g.contactName || g.id
            }));

          return res.status(200).json({
            success: true,
            groups
          });
        } catch (err) {
          return res.status(500).json({
            success: false,
            error: 'Erreur de connexion à Green-API : ' + err.message
          });
        }
      }

      // Action 2: Sauvegarder la configuration Groupe WhatsApp & SMS Automatique
      if (action === 'save_settings') {
        const saved = await saveSettings(body.settings || {}, admin.displayName || admin.username);
        let testResult = null;
        if (body.sendTest) {
          const sampleOrder = {
            id: 'ELS-TEST-' + Math.floor(1000 + Math.random() * 9000),
            customerName: 'Client Test ELS',
            customerPhone: '06 12 34 56 78',
            customerAddress: '15 Avenue des Champs-Élysées, 75008 Paris',
            customerEmail: 'client.test@gmail.com',
            paymentMethod: 'PayPal Amis & Proches (iliesimaj9@gmail.com)',
            paymentVerified: true,
            paypalTransactionId: 'TEST-PP-99281',
            shippingCost: 4.90,
            total: 124.90,
            items: [{ id: 'els-001', brand: 'Corteiz', name: 'Alcatraz Pullover Hoodie (Test Ticket)', size: 'M', color: 'Triple Black', price: 120, quantity: 1 }],
            createdAt: new Date().toISOString()
          };
          testResult = await sendWhatsAppGroupOrderTicket(sampleOrder, saved.settings);
        }
        return res.status(200).json({
          success: true,
          message: 'Configuration WhatsApp Groupe & SMS enregistrée avec succès.',
          settings: saved.settings,
          testResult
        });
      }

      // Action 3: Envoyer / Renvoyer un Ticket de commande sur le Groupe WhatsApp
      if (action === 'send_group_ticket') {
        const orderId = body.orderId;
        const targetOrder = orders.find(o => o.id === orderId);
        if (!targetOrder) {
          return res.status(404).json({ success: false, error: 'Commande introuvable.' });
        }
        const settings = await getSettings();
        const ticketRes = await sendWhatsAppGroupOrderTicket(targetOrder, settings);
        return res.status(200).json({
          success: true,
          ...ticketRes
        });
      }

      // Création d'une commande depuis l'Admin
      const {
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        items,
        total,
        paymentMethod = 'PayPal Amis & Proches (iliesimaj9@gmail.com)',
        notes = '',
        status = 'en_preparation',
        trackingNumber = '',
        carrier = 'Colissimo',
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
        customerAddress: (customerAddress || 'Adresse non renseignée').trim(),
        items: items.map(it => ({
          id: it.id || '',
          name: it.name || 'Article',
          brand: it.brand || '',
          color: it.color || 'Standard',
          size: it.size || 'M',
          price: parseFloat(it.price) || 0,
          quantity: parseInt(it.quantity, 10) || 1
        })),
        shippingCost: 4.90,
        total: parseFloat(total) || items.reduce((acc, it) => acc + (parseFloat(it.price || 0) * (parseInt(it.quantity, 10) || 1)), 0),
        paymentMethod,
        paymentVerified: true,
        status,
        statusLabel: statusLabels[status] || 'En préparation',
        trackingNumber: (trackingNumber || '').trim(),
        carrier: (carrier || 'Colissimo').trim(),
        notes: (notes || '').trim(),
        createdAt: new Date().toISOString(),
        createdBy: admin.displayName || admin.username
      };

      orders.unshift(newOrder);
      await saveOrders(orders, admin.displayName);

      if (deductStock) {
        try {
          const products = await getProducts();
          let stockUpdated = false;
          for (const item of newOrder.items) {
            const product = products.find(p => p.id === item.id || (p.name.toLowerCase() === item.name.toLowerCase() && p.brand.toLowerCase() === item.brand.toLowerCase()));
            if (product && !product.unlimitedStock && product.stock && product.stock[item.size] !== undefined) {
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

      // Envoyer également le ticket sur le groupe WhatsApp si configuré
      try {
        const settings = await getSettings();
        await sendWhatsAppGroupOrderTicket(newOrder, settings);
      } catch (e) {}

      return res.status(201).json({
        success: true,
        message: `Commande ${orderId} créée avec succès.`,
        order: newOrder
      });
    }

    // -------------------------------------------------------------
    // PUT / PATCH: MODIFIER UNE COMMANDE / AJOUTER UN NUMÉRO DE SUIVI
    // Dès qu'un numéro de suivi est ajouté -> Envoi automatique au téléphone de la commande !
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
      const previousTracking = (order.trackingNumber || '').trim();

      if (body.customerName !== undefined) order.customerName = String(body.customerName).trim();
      if (body.customerEmail !== undefined) order.customerEmail = String(body.customerEmail).trim().toLowerCase();
      if (body.customerPhone !== undefined) order.customerPhone = String(body.customerPhone).trim();
      if (body.customerAddress !== undefined) order.customerAddress = String(body.customerAddress).trim();
      if (body.total !== undefined) order.total = parseFloat(body.total) || order.total;
      if (body.paymentMethod !== undefined) order.paymentMethod = String(body.paymentMethod).trim();
      if (body.carrier !== undefined) order.carrier = String(body.carrier).trim();
      if (body.trackingNumber !== undefined) order.trackingNumber = String(body.trackingNumber).trim();
      if (body.notes !== undefined) order.notes = String(body.notes).trim();

      const newTracking = (order.trackingNumber || '').trim();
      const trackingJustSetOrChanged = Boolean(newTracking && (newTracking !== previousTracking || body.sendTrackingMessage === true));

      // Si un numéro de suivi vient d'être mis, on passe automatiquement la commande en "Expédiée"
      if (trackingJustSetOrChanged && (!body.status || body.status === 'en_preparation' || body.status === 'en_attente')) {
        order.status = 'expedie';
        order.statusLabel = 'Expédiée';
      } else if (body.status !== undefined) {
        order.status = body.status;
        order.statusLabel = statusLabels[body.status] || body.status;
      }

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

      // ENVOI AUTOMATIQUE DU NUMÉRO DE SUIVI PAR MESSAGE AU NUMÉRO DE TÉLÉPHONE DE LA COMMANDE
      let trackingDispatch = null;
      if (trackingJustSetOrChanged) {
        try {
          const settings = await getSettings();
          trackingDispatch = await sendTrackingMessageToCustomer(order, settings);
          order.trackingSentAt = new Date().toISOString();
          order.trackingSentTo = order.customerPhone || '';
        } catch (err) {
          console.error('Erreur envoi automatique suivi client:', err);
        }

        // Envoi en parallèle par email si le client avait laissé son email
        if (order.customerEmail) {
          try {
            const emailHtml = generateShippingEmailHtml(order);
            sendEmailNotification({
              to: order.customerEmail,
              subject: `Votre numéro de suivi pour la commande ${order.id} — ELS.SHOP`,
              html: emailHtml
            }).catch(() => {});
          } catch (e) {}
        }
      }

      order.updatedAt = new Date().toISOString();
      order.updatedBy = admin.displayName;

      await saveOrders(orders, admin.displayName);

      return res.status(200).json({
        success: true,
        message: trackingJustSetOrChanged
          ? `Numéro de suivi enregistré et envoyé au ${order.customerPhone || 'client'} !`
          : `Commande ${id} modifiée avec succès.`,
        order: orders[orderIndex],
        trackingDispatch
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
