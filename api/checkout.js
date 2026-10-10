/**
 * ELS.SHOP - API de Checkout Stripe & Enregistrement des Commandes
 * Gère la création de sessions Stripe Checkout sécurisées et enregistre les commandes dans l'Admin
 */

const { getOrders, saveOrders, getProducts, saveProducts } = require('./lib/storage');
const { sanitizeString, validateEmail } = require('./lib/security');
const { sendEmailNotification, generateOrderConfirmationEmail } = require('./lib/notifications');

module.exports = async (req, res) => {
  // CORS configuration
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

    const { items, customer, promoCode } = body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Votre panier est vide.' });
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
    const origin = `${proto}://${host}`;

    const orderNumber = 'ELS-CMD-' + Math.floor(1000 + Math.random() * 9000);

    // Calculate discount if promoCode is valid
    let discountPercent = 0;
    if (promoCode && (promoCode.toUpperCase() === 'ELS10' || promoCode.toUpperCase() === 'STREET10')) {
      discountPercent = 0.10; // 10% de réduction
    }

    // Assainissement sécurisé des entrées clients
    const safeCustName = sanitizeString(customer?.name || 'Client Web ELS', 80);
    const safeCustEmail = (customer?.email && validateEmail(customer.email)) ? customer.email.trim().toLowerCase() : '';
    const safeCustPhone = sanitizeString(customer?.phone || '', 30);
    const isMainPropre = customer?.deliveryMethod === 'main_propre';
    const safeCarrier = isMainPropre ? 'Main propre' : (sanitizeString(customer?.carrier || 'Colissimo 24/48h', 50));
    const safeAddress = isMainPropre ? 
      (sanitizeString(customer?.address || 'Remise en main propre (Paris/IDF)', 150)) : 
      (sanitizeString(customer?.address || 'Adresse à confirmer', 150));

    // Helper: Enregistrer la commande dans orders.json et déduire le stock
    const recordOrderAndDeductStock = async (paymentType = 'Stripe (CB)') => {
      try {
        const orders = await getOrders();
        const totalAmount = items.reduce((acc, it) => acc + (parseFloat(it.price || 0) * (1 - discountPercent) * (parseInt(it.quantity, 10) || 1)), 0);

        const newOrder = {
          id: orderNumber,
          customerName: safeCustName,
          customerEmail: safeCustEmail,
          customerPhone: safeCustPhone,
          customerAddress: safeAddress,
          items: items.map(it => ({
            id: sanitizeString(it.id || '', 40),
            name: sanitizeString(it.name || 'Article', 100),
            brand: sanitizeString(it.brand || 'ELS', 50),
            color: sanitizeString(it.color || 'Standard', 40),
            size: sanitizeString(it.size || 'M', 20),
            price: Math.round(parseFloat(it.price || 0) * (1 - discountPercent) * 100) / 100,
            quantity: parseInt(it.quantity, 10) || 1
          })),
          total: Math.round(totalAmount * 100) / 100,
          paymentMethod: paymentType,
          status: 'en_preparation',
          statusLabel: 'En préparation',
          trackingNumber: '',
          carrier: safeCarrier,
          notes: promoCode ? `Code promo ${promoCode.toUpperCase()} appliqué (-${discountPercent * 100}%)` : '',
          createdAt: new Date().toISOString(),
          createdBy: 'Boutique Web'
        };

        orders.unshift(newOrder);
        await saveOrders(orders, `Checkout Web (${orderNumber})`);

        // Déduire le stock
        const products = await getProducts();
        let stockChanged = false;
        for (const item of items) {
          const prod = products.find(p => p.id === item.id || (p.name.toLowerCase() === item.name.toLowerCase() && p.brand.toLowerCase() === item.brand.toLowerCase()));
          if (prod && prod.stock && prod.stock[item.size] !== undefined) {
            const currentStock = parseInt(prod.stock[item.size], 10) || 0;
            prod.stock[item.size] = Math.max(0, currentStock - (parseInt(item.quantity, 10) || 1));
            stockChanged = true;
          }
        }
        if (stockChanged) {
          await saveProducts(products, `Vente Web (${orderNumber})`);
        }

        // Déclenchement automatique de l'email de confirmation si l'email a été renseigné
        if (safeCustEmail) {
          const emailHtml = generateOrderConfirmationEmail(newOrder, origin);
          await sendEmailNotification({
            to: safeCustEmail,
            subject: `Confirmation de votre commande ${newOrder.id} — ELS.SHOP`,
            html: emailHtml
          });
        }

      } catch (err) {
        console.error('Erreur enregistrement commande auto:', err);
      }
    };

    // Prepare line items
    const lineItems = items.map((item) => {
      let unitPrice = parseFloat(item.price || 0);
      if (discountPercent > 0) {
        unitPrice = Math.round(unitPrice * (1 - discountPercent) * 100) / 100;
      }
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${item.brand || 'ELS'} - ${item.name}`,
            description: `Taille : ${item.size || 'Unique'}${item.color ? ` | Coloris : ${item.color}` : ''} | Qualité : 1:1 Miroir | Réf : ${item.id || 'ELS'}`,
            images: item.image ? [item.image] : []
          },
          unit_amount: Math.round(unitPrice * 100)
        },
        quantity: Math.max(1, parseInt(item.quantity || 1, 10))
      };
    });

    const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

    if (STRIPE_SECRET) {
      const params = new URLSearchParams();
      params.append('payment_method_types[0]', 'card');
      params.append('mode', 'payment');
      params.append('success_url', `${origin}/confirmation.html?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`);
      params.append('cancel_url', `${origin}/#panier`);
      
      if (customer && customer.email) {
        params.append('customer_email', customer.email);
      }

      params.append('shipping_address_collection[allowed_countries][0]', 'FR');
      params.append('shipping_address_collection[allowed_countries][1]', 'BE');
      params.append('shipping_address_collection[allowed_countries][2]', 'CH');
      params.append('shipping_address_collection[allowed_countries][3]', 'LU');

      lineItems.forEach((li, idx) => {
        params.append(`line_items[${idx}][price_data][currency]`, li.price_data.currency);
        params.append(`line_items[${idx}][price_data][unit_amount]`, String(li.price_data.unit_amount));
        params.append(`line_items[${idx}][price_data][product_data][name]`, li.price_data.product_data.name);
        params.append(`line_items[${idx}][price_data][product_data][description]`, li.price_data.product_data.description);
        if (li.price_data.product_data.images && li.price_data.product_data.images[0]) {
          params.append(`line_items[${idx}][price_data][product_data][images][0]`, li.price_data.product_data.images[0]);
        }
        params.append(`line_items[${idx}][quantity]`, String(li.quantity));
      });

      params.append('metadata[orderNumber]', orderNumber);
      params.append('metadata[source]', 'els.shop');
      params.append('metadata[itemCount]', String(items.length));

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const session = await stripeRes.json();
      if (!stripeRes.ok) {
        console.error('Stripe error:', session);
        return res.status(500).json({ success: false, error: session.error?.message || 'Erreur Stripe Checkout' });
      }

      // Enregistrer la commande
      await recordOrderAndDeductStock('Stripe');

      return res.status(200).json({
        success: true,
        orderNumber,
        checkoutUrl: session.url,
        sessionId: session.id
      });
    } else {
      // Mode aperçu / pré-production
      await recordOrderAndDeductStock('Commande Web Démo');

      const encodedOrder = encodeURIComponent(JSON.stringify({
        orderNumber,
        items,
        total: items.reduce((acc, it) => acc + (parseFloat(it.price) * (1 - discountPercent) * (it.quantity || 1)), 0),
        discount: discountPercent > 0 ? '10%' : '0%',
        date: new Date().toISOString()
      }));

      return res.status(200).json({
        success: true,
        orderNumber,
        checkoutUrl: `${origin}/confirmation.html?order=${orderNumber}&preview_data=${encodedOrder}`,
        mode: 'preview_ready',
        note: 'Prêt pour Stripe en direct (définir STRIPE_SECRET_KEY dans Vercel).'
      });
    }

  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Une erreur interne est survenue lors du checkout.'
    });
  }
};
