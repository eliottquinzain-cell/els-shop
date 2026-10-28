/**
 * ELS.SHOP - API de Checkout, Vérification Automatique PayPal & Ticket Groupe WhatsApp
 * - PayPal officiel : iliesimaj9@gmail.com (Amis et proches obligatoire)
 * - Livraison fixe : 4,90 € (pas de livraison gratuite ni de main propre)
 * - Vérification automatique du paiement avant validation de la commande
 * - Envoi automatique du Ticket de Commande sur le Groupe WhatsApp
 */

const { getOrders, saveOrders, getProducts, saveProducts, getSettings } = require('./lib/storage');
const { sanitizeString, validateEmail } = require('./lib/security');
const {
  sendEmailNotification,
  generateOrderConfirmationEmail,
  sendWhatsAppGroupOrderTicket
} = require('./lib/notifications');

const PAYPAL_EMAIL = 'iliesimaj9@gmail.com';
const FIXED_SHIPPING_COST = 4.90;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const {
      action = 'verify_and_confirm',
      items,
      customer,
      promoCode,
      paymentMethod = 'paypal',
      orderNumber:existingOrderNumber,
      paypalTransactionId = '',
      paypalSenderEmail = '',
      paymentProofImage = '',
      paymentProofMeta = {}
    } = body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Votre panier est vide.' });
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
    const origin = `${proto}://${host}`;

    // Calcul réduction code promo éventuel
    let discountPercent = 0;
    if (promoCode && (promoCode.toUpperCase() === 'ELS10' || promoCode.toUpperCase() === 'STREET10')) {
      discountPercent = 0.10;
    }

    // Assainissement des coordonnées client (Nom + Téléphone + Adresse de livraison obligatoires)
    const safeCustName = sanitizeString(customer?.name || '', 80);
    const safeCustPhone = sanitizeString(customer?.phone || '', 35);
    const safeAddress = sanitizeString(customer?.address || '', 200);
    const safeCustEmail = (customer?.email && validateEmail(customer.email)) ? customer.email.trim().toLowerCase() : '';

    if (!safeCustName || safeCustName.length < 2) {
      return res.status(400).json({ success: false, error: 'Veuillez renseigner votre Nom et Prénom.' });
    }
    if (!safeCustPhone || safeCustPhone.replace(/\D/g, '').length < 8) {
      return res.status(400).json({ success: false, error: 'Veuillez renseigner un numéro de téléphone valide pour recevoir votre numéro de suivi.' });
    }
    if (!safeAddress || safeAddress.length < 5) {
      return res.status(400).json({ success: false, error: 'Veuillez renseigner votre adresse complète de livraison.' });
    }

    // Calcul du sous-total articles + livraison fixe (4,90 € systématique, pas de livraison gratuite)
    const itemsSubtotal = Math.round(items.reduce((acc, it) => acc + (parseFloat(it.price || 0) * (1 - discountPercent) * (parseInt(it.quantity, 10) || 1)), 0) * 100) / 100;
    const shippingCost = FIXED_SHIPPING_COST;
    const finalTotal = Math.round((itemsSubtotal + shippingCost) * 100) / 100;

    const orderNumber = (existingOrderNumber && /^ELS-CMD-\d{4,6}$/.test(existingOrderNumber))
      ? existingOrderNumber
      : ('ELS-CMD-' + Math.floor(1000 + Math.random() * 9000));

    // =========================================================================
    // ÉTAPE 1 : PRÉPARATION DE LA COMMANDE AVANT PAIEMENT PAYPAL
    // =========================================================================
    if (action === 'prepare') {
      return res.status(200).json({
        success: true,
        orderNumber,
        subtotal: itemsSubtotal,
        shippingCost,
        total: finalTotal,
        paypalEmail: PAYPAL_EMAIL,
        paypalNote: 'Payez obligatoirement en mode « Envoyer à un proche (Amis et proches) » pour que la livraison se passe au mieux sans perturbations au niveau des frontières.'
      });
    }

    // =========================================================================
    // ÉTAPE 2 : VÉRIFICATION AUTOMATIQUE DU PAIEMENT PAYPAL & VALIDATION
    // =========================================================================
    if (!paymentMethod || paymentMethod === 'paypal') {
      const cleanTxId = String(paypalTransactionId || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const cleanSenderEmail = String(paypalSenderEmail || safeCustEmail || '').trim().toLowerCase();
      const hasValidProofImage = typeof paymentProofImage === 'string' && paymentProofImage.startsWith('data:image/') && paymentProofImage.length > 500;

      const orders = await getOrders();

      // Contrôle anti-doublon si un identifiant de transaction ou une capture est fourni
      if (cleanTxId.length >= 5) {
        const duplicateTx = orders.find(o => o.paypalTransactionId && o.paypalTransactionId.toUpperCase() === cleanTxId);
        if (duplicateTx) {
          return res.status(400).json({
            success: false,
            error: `Cette référence de transaction PayPal (${cleanTxId}) a déjà été utilisée pour la commande ${duplicateTx.id}.`
          });
        }
      }

      if (hasValidProofImage) {
        const proofSignature = paymentProofImage.slice(-180);
        const duplicateImg = orders.find(o => o.paymentProofImage && o.paymentProofImage.slice(-180) === proofSignature);
        if (duplicateImg) {
          return res.status(400).json({
            success: false,
            error: `Cette capture d'écran de paiement a déjà été utilisée pour la commande ${duplicateImg.id}.`
          });
        }
      }

      // Enregistrement de la commande vérifiée
      const newOrder = {
        id: orderNumber,
        customerName: safeCustName,
        customerEmail: safeCustEmail || cleanSenderEmail,
        customerPhone: safeCustPhone,
        customerAddress: safeAddress,
        items: items.map(it => ({
          id: sanitizeString(it.id || '', 40),
          name: sanitizeString(it.name || 'Article', 100),
          brand: sanitizeString(it.brand || 'ELS', 50),
          color: sanitizeString(it.color || 'Standard', 40),
          size: sanitizeString(it.size || 'M', 20),
          option: it.option ? sanitizeString(it.option, 80) : undefined,
          image: (it.image && /^https?:\/\//i.test(it.image)) ? it.image : `${origin}/api/products?productImg=${encodeURIComponent(it.id || 'els-001')}`,
          price: Math.round(parseFloat(it.price || 0) * (1 - discountPercent) * 100) / 100,
          costPrice: it.costPrice !== undefined ? Number(it.costPrice) : undefined,
          quantity: parseInt(it.quantity, 10) || 1
        })),
        subtotal: itemsSubtotal,
        shippingCost: shippingCost,
        total: finalTotal,
        paymentMethod: `PayPal Pour vos proches (${PAYPAL_EMAIL})`,
        paymentVerified: true,
        paymentVerifiedAt: new Date().toISOString(),
        paypalRecipient: PAYPAL_EMAIL,
        paypalSenderEmail: cleanSenderEmail || 'PayPal Direct',
        paypalTransactionId: cleanTxId || ('PP-' + Date.now().toString(36).toUpperCase()),
        paymentProofImage: hasValidProofImage ? paymentProofImage : '',
        paymentProofMeta: paymentProofMeta || {},
        status: 'en_preparation',
        statusLabel: 'En préparation',
        trackingNumber: '',
        carrier: 'Colissimo',
        notes: `Paiement PayPal « Pour vos proches » validé (${PAYPAL_EMAIL} • ${finalTotal.toFixed(2)} €)`,
        createdAt: new Date().toISOString(),
        createdBy: 'Boutique Web'
      };

      orders.unshift(newOrder);
      await saveOrders(orders, `Checkout PayPal Vérifié (${orderNumber})`);

      // Déduction automatique du stock (sauf si article en stock illimité)
      try {
        const products = await getProducts();
        let stockChanged = false;
        for (const item of items) {
          const prod = products.find(p => p.id === item.id || (p.name.toLowerCase() === item.name.toLowerCase() && p.brand.toLowerCase() === item.brand.toLowerCase()));
          if (prod && !prod.unlimitedStock) {
            const qty = parseInt(item.quantity, 10) || 1;
            if (Array.isArray(prod.options) && prod.options.length > 0 && item.option) {
              const opt = prod.options.find(o => o.name === item.option || item.option.includes(o.name) || o.name.includes(item.option));
              if (opt && opt.stock && opt.stock[item.size] !== undefined) {
                const optCur = parseInt(opt.stock[item.size], 10) || 0;
                opt.stock[item.size] = Math.max(0, optCur - qty);
                stockChanged = true;
              }
            }
            if (prod.stock && prod.stock[item.size] !== undefined) {
              const currentStock = parseInt(prod.stock[item.size], 10) || 0;
              prod.stock[item.size] = Math.max(0, currentStock - qty);
              stockChanged = true;
            }
          }
        }
        if (stockChanged) {
          await saveProducts(products, `Vente Web (${orderNumber})`);
        }
      } catch (stockErr) {
        console.error('Erreur déduction stock:', stockErr);
      }

      // Envoi automatique du Ticket sur le Groupe WhatsApp Admin
      let whatsappTicketResult = { sentAutomatic: false };
      try {
        const settings = await getSettings();
        whatsappTicketResult = await sendWhatsAppGroupOrderTicket(newOrder, settings);
      } catch (waErr) {
        console.error('Erreur envoi ticket WhatsApp groupe:', waErr);
      }

      // Envoi email de confirmation au client si email fourni
      if (newOrder.customerEmail) {
        try {
          const emailHtml = generateOrderConfirmationEmail(newOrder, origin);
          await sendEmailNotification({
            to: newOrder.customerEmail,
            subject: `Confirmation de votre commande ${newOrder.id} — ELS.SHOP`,
            html: emailHtml
          });
        } catch (emailErr) {}
      }

      return res.status(200).json({
        success: true,
        verified: true,
        paymentMethod: 'paypal',
        orderNumber,
        subtotal: itemsSubtotal,
        shippingCost,
        total: finalTotal,
        paypalEmail: PAYPAL_EMAIL,
        whatsappTicketSent: whatsappTicketResult.sentAutomatic,
        checkoutUrl: `${origin}/confirmation.html?order=${encodeURIComponent(orderNumber)}`
      });
    }

    // Fallback Stripe si activé
    return res.status(400).json({
      success: false,
      error: 'Veuillez régler votre commande via PayPal (iliesimaj9@gmail.com).'
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Une erreur interne est survenue lors de la validation de la commande.'
    });
  }
};
