/**
 * ELS.SHOP - API de Déclenchement & Envoi des Notifications Client
 * Permet d'envoyer l'email de confirmation, l'avis d'expédition ou de générer les messages WhatsApp / SMS
 */

const { getOrders } = require('./lib/storage');
const { requireAdmin } = require('./lib/auth');
const {
  generateOrderConfirmationEmail,
  generateShippingEmailHtml,
  sendEmailNotification,
  generateWhatsAppMessage,
  generateSmsMessage
} = require('./lib/notifications');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    const { orderId, type = 'confirmation', targetEmail, targetPhone } = body || {};

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Numéro de commande manquant.' });
    }

    const orders = await getOrders();
    const order = orders.find(o => o.id && o.id.trim().toUpperCase() === orderId.trim().toUpperCase());

    if (!order) {
      return res.status(404).json({ success: false, error: `Commande ${orderId} introuvable.` });
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
    const origin = `${proto}://${host}`;

    const emailToSend = targetEmail || order.customerEmail || (order.customerName && order.customerName.includes('@') ? order.customerName : null);
    const phoneToUse = targetPhone || order.customerPhone || '';

    let emailSubject = `Confirmation de votre commande ${order.id} — ELS.SHOP`;
    let emailHtml = generateOrderConfirmationEmail(order, origin);

    if (type === 'shipping') {
      emailSubject = `Votre commande ${order.id} a été expédiée ! (${order.carrier || 'Colissimo'})`;
      emailHtml = generateShippingEmailHtml(order, origin);
    }

    // Préparation des liens WhatsApp et SMS
    const waText = generateWhatsAppMessage(order, origin);
    const smsText = generateSmsMessage(order, origin);

    let cleanPhone = phoneToUse.replace(/[\s.-]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '33' + cleanPhone.substring(1);
    }
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(smsText)}`;

    // Envoi de l'email si adresse disponible
    let emailResult = { success: false, reason: 'no_email_provided' };
    if (emailToSend) {
      emailResult = await sendEmailNotification({
        to: emailToSend,
        subject: emailSubject,
        html: emailHtml,
        text: waText
      });
    }

    return res.status(200).json({
      success: true,
      orderId: order.id,
      emailResult,
      emailSent: emailResult.success,
      recipientEmail: emailToSend,
      whatsappUrl,
      smsUrl,
      whatsappMessage: waText,
      smsMessage: smsText,
      message: emailToSend ? `Notification préparée pour ${emailToSend}` : 'Liens de notification prêts'
    });

  } catch (error) {
    console.error('Erreur notification:', error);
    return res.status(500).json({ success: false, error: 'Erreur interne lors de la notification.' });
  }
};
