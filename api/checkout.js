/**
 * ELS.SHOP - API de Checkout Stripe
 * Gère la création de sessions Stripe Checkout sécurisées pour le panier
 */

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

    const orderNumber = 'ELS-' + Math.floor(100000 + Math.random() * 900000);

    // Calculate discount if promoCode is valid
    let discountPercent = 0;
    if (promoCode && (promoCode.toUpperCase() === 'ELS10' || promoCode.toUpperCase() === 'STREET10')) {
      discountPercent = 0.10; // 10% de réduction
    }

    // Prepare line items
    const lineItems = items.map((item, index) => {
      let unitPrice = parseFloat(item.price || 0);
      if (discountPercent > 0) {
        unitPrice = Math.round(unitPrice * (1 - discountPercent) * 100) / 100;
      }
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${item.brand || 'ELS'} - ${item.name}`,
            description: `Taille : ${item.size || 'Unique'} | État : ${item.condition || 'Certifié 10/10'} | Réf : ${item.id || 'ELS'}`,
            images: item.image ? [item.image] : []
          },
          unit_amount: Math.round(unitPrice * 100) // en centimes
        },
        quantity: Math.max(1, parseInt(item.quantity || 1, 10))
      };
    });

    const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

    if (STRIPE_SECRET) {
      // Direct call to Stripe Checkout API
      const params = new URLSearchParams();
      params.append('payment_method_types[0]', 'card');
      params.append('mode', 'payment');
      params.append('success_url', `${origin}/confirmation.html?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`);
      params.append('cancel_url', `${origin}/#panier`);
      
      if (customer && customer.email) {
        params.append('customer_email', customer.email);
      }

      // Collect shipping address
      params.append('shipping_address_collection[allowed_countries][0]', 'FR');
      params.append('shipping_address_collection[allowed_countries][1]', 'BE');
      params.append('shipping_address_collection[allowed_countries][2]', 'CH');
      params.append('shipping_address_collection[allowed_countries][3]', 'LU');

      // Add line items
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

      // Metadata
      params.append('metadata[orderNumber]', orderNumber);
      params.append('metadata[source]', 'els.shop');
      params.append('metadata[founders]', 'Eliott & Ilies');
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

      return res.status(200).json({
        success: true,
        orderNumber,
        checkoutUrl: session.url,
        sessionId: session.id
      });
    } else {
      // In demonstration/preview mode without direct STRIPE_SECRET_KEY set in current env:
      // Redirect seamlessly to confirmation page with complete receipt details
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
