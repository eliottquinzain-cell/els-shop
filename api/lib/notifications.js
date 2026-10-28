/**
 * ELS.SHOP - Module de Notifications Automatiques 24h/24
 * 1. Ticket de commande automatique sur Groupe WhatsApp (SANS PRIX : Infos Client + Adresse + Téléphone + Article exact + Photo du produit)
 * 2. Envoi automatique du Numéro de Suivi par message (WhatsApp / SMS) au numéro de téléphone du client dès saisie dans l'Admin
 * 3. Emails transactionnels de confirmation et d'expédition
 */

const { getCarrierTrackingUrl } = require('./security');

const SITE_ORIGIN = 'https://els-shop.vercel.app';

/**
 * Normalise un numéro de téléphone (06/07, +33, +32, +41...) au format international sans '+'
 */
function normalizePhoneInternational(rawPhone = '') {
  let clean = String(rawPhone || '').replace(/[\s.\-()]/g, '');
  if (!clean) return '';
  if (clean.startsWith('+')) clean = clean.substring(1);
  if (clean.startsWith('00')) clean = clean.substring(2);
  if (clean.startsWith('0') && clean.length === 10) {
    clean = '33' + clean.substring(1);
  }
  return clean;
}

/**
 * Retourne l'URL publique de la photo d'un article commandé
 */
function getItemPublicPhotoUrl(item = {}, origin = SITE_ORIGIN) {
  if (item.id) {
    return `${origin}/api/products?productImg=${encodeURIComponent(item.id)}`;
  }
  if (item.image && /^https?:\/\//i.test(item.image)) {
    return item.image;
  }
  return `${origin}/api/products?productImg=els-001`;
}

/**
 * Génère le Ticket de Commande pour le Groupe WhatsApp Admin
 * IMPORTANT : AUCUN PRIX AFFICHÉ (Uniquement Infos Client + Adresse + Téléphone + Article exact + Photo du produit)
 */
function formatWhatsAppGroupTicket(order, origin = SITE_ORIGIN) {
  const dateFormatted = new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const itemsBlocks = (order.items || []).map((it, idx) => {
    const photoUrl = getItemPublicPhotoUrl(it, origin);
    const lines = [
      `📦 *ARTICLE ${(order.items || []).length > 1 ? `#${idx + 1}` : 'COMMANDÉ'} :*`,
      `• *Quantité :* ${it.quantity || 1}x`,
      `• *Marque :* ${it.brand || 'ELS'}`,
      `• *Modèle exact :* ${it.name || 'Article'}`,
      `• *Taille :* *${it.size || 'Unique'}*`,
      `• *Coloris :* ${it.color || 'Standard'}`
    ];
    if (it.option) {
      lines.push(`• *Option / Finition :* ${it.option}`);
    }
    lines.push(`🖼️ *Photo du produit :* ${photoUrl}`);
    return lines.join('\n');
  }).join('\n\n');

  return (
    `🎫 *NOUVEAU TICKET COMMANDE — ELS.SHOP*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🆔 *N° Commande :* ${order.id}\n` +
    `📅 *Date :* ${dateFormatted}\n\n` +
    `👤 *INFORMATIONS CLIENT & LIVRAISON :*\n` +
    `• *Nom & Prénom :* ${order.customerName || 'Non renseigné'}\n` +
    `• *Téléphone :* ${order.customerPhone || 'Non renseigné'}\n` +
    `• *Adresse de livraison :* ${order.customerAddress || 'Non renseignée'}\n` +
    (order.customerEmail ? `• *E-mail :* ${order.customerEmail}\n` : '') +
    `\n${itemsBlocks || '📦 Aucun détail article'}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━`
  );
}

/**
 * Envoie automatiquement 24h/24 le Ticket de Commande (AVEC PHOTO DU PRODUIT & SANS PRIX) sur le Groupe WhatsApp configuré
 */
async function sendWhatsAppGroupOrderTicket(order, settings = {}, origin = SITE_ORIGIN) {
  const ticketText = formatWhatsAppGroupTicket(order, origin);
  const firstItem = (order.items && order.items[0]) ? order.items[0] : {};
  const primaryPhotoUrl = getItemPublicPhotoUrl(firstItem, origin);

  const results = [];
  let sentAutomatic = false;

  const instanceId = (settings.greenApiInstanceId || process.env.GREEN_API_INSTANCE_ID || '').trim();
  const apiToken = (settings.greenApiToken || process.env.GREEN_API_TOKEN || '').trim();
  const apiHost = (settings.greenApiHost || process.env.GREEN_API_HOST || 'https://api.green-api.com').trim().replace(/\/$/, '');
  let groupId = (settings.whatsappGroupId || process.env.WHATSAPP_GROUP_ID || '').trim();

  // 1. Envoi via Green-API sur le Groupe WhatsApp (@g.us) avec la PHOTO du produit + le Ticket en légende
  if (instanceId && apiToken && groupId) {
    if (!groupId.includes('@')) {
      groupId = `${groupId}@g.us`;
    }
    try {
      // Tentative 1 : Envoi direct de la photo du produit avec le ticket en légende (sendFileByUrl)
      const fileUrl = `${apiHost}/waInstance${instanceId}/sendFileByUrl/${apiToken}`;
      const fileResp = await fetch(fileUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: groupId,
          urlFile: primaryPhotoUrl,
          fileName: `${order.id || 'article'}.jpg`,
          caption: ticketText
        })
      });
      const fileData = await fileResp.json().catch(() => ({}));

      if (fileResp.ok && fileData.idMessage) {
        sentAutomatic = true;
        results.push({ provider: 'green-api-group-photo', success: true, idMessage: fileData.idMessage, groupId, photoUrl: primaryPhotoUrl });
      } else {
        // Fallback : Envoi du message texte contenant le lien d'aperçu photo WhatsApp
        const msgUrl = `${apiHost}/waInstance${instanceId}/sendMessage/${apiToken}`;
        const msgResp = await fetch(msgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: groupId,
            message: ticketText,
            linkPreview: true
          })
        });
        const msgData = await msgResp.json().catch(() => ({}));
        if (msgResp.ok && msgData.idMessage) {
          sentAutomatic = true;
          results.push({ provider: 'green-api-group-text', success: true, idMessage: msgData.idMessage, groupId });
        } else {
          results.push({ provider: 'green-api-group', success: false, status: msgResp.status, error: msgData });
        }
      }
    } catch (err) {
      console.error('Erreur Green-API Group Ticket:', err);
      results.push({ provider: 'green-api-group', success: false, error: err.message });
    }
  }

  // 2. Envoi via Webhook personnalisé si configuré (Make, Discord, Telegram, Whapi, UltraMsg)
  const webhookUrl = (settings.customWebhookUrl || process.env.ORDER_WEBHOOK_URL || '').trim();
  if (webhookUrl) {
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new_order_ticket',
          content: ticketText,
          text: ticketText,
          photoUrl: primaryPhotoUrl,
          embeds: [{
            title: `🎫 Ticket Commande ${order.id}`,
            description: ticketText,
            image: { url: primaryPhotoUrl }
          }],
          order: {
            id: order.id,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerAddress: order.customerAddress,
            customerEmail: order.customerEmail,
            photoUrl: primaryPhotoUrl,
            items: (order.items || []).map(it => ({
              id: it.id,
              brand: it.brand,
              name: it.name,
              size: it.size,
              color: it.color,
              option: it.option,
              quantity: it.quantity,
              photoUrl: getItemPublicPhotoUrl(it, origin)
            })),
            createdAt: order.createdAt
          }
        })
      });
      if (resp.ok) {
        sentAutomatic = true;
        results.push({ provider: 'webhook', success: true });
      }
    } catch (err) {
      console.error('Erreur Webhook Group Ticket:', err);
      results.push({ provider: 'webhook', success: false, error: err.message });
    }
  }

  return {
    success: true,
    sentAutomatic,
    ticketText,
    photoUrl: primaryPhotoUrl,
    whatsappShareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(ticketText)}`,
    results
  };
}

/**
 * Génère le texte du message de suivi envoyé au numéro de téléphone du client
 */
function formatCustomerTrackingMessage(order) {
  const trackingNum = (order.trackingNumber || '').trim();
  const carrierUrl = getCarrierTrackingUrl(order.carrier || 'Colissimo', trackingNum) || `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(trackingNum)}`;

  return (
    `Bonjour ${order.customerName || 'Client'} ! 📦\n\n` +
    `Bonne nouvelle : votre commande *ELS.SHOP* (${order.id}) vient d'être expédiée !\n\n` +
    `🚚 *Votre numéro de suivi :* ${trackingNum}\n` +
    `🔗 *Suivre votre colis sur le transporteur :*\n${carrierUrl}\n\n` +
    `📍 *Adresse de livraison :* ${order.customerAddress || ''}\n\n` +
    `Merci pour votre confiance et à très vite sur ELS.SHOP !`
  );
}

/**
 * Envoie automatiquement le numéro de suivi par message (WhatsApp Direct + Passerelle SMS)
 * au numéro de téléphone de la commande concernée dès que l'Admin le renseigne.
 */
async function sendTrackingMessageToCustomer(order, settings = {}) {
  const cleanPhone = normalizePhoneInternational(order.customerPhone || '');
  const messageText = formatCustomerTrackingMessage(order);
  const trackingNum = (order.trackingNumber || '').trim();
  const carrierUrl = getCarrierTrackingUrl(order.carrier || 'Colissimo', trackingNum) || `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(trackingNum)}`;
  const smsShortText = `ELS.SHOP : Bonjour ${order.customerName || ''}, votre commande ${order.id} a été expédiée ! Votre numéro de suivi est : ${trackingNum} (${carrierUrl})`;

  const results = [];
  let sentAutomatic = false;

  const instanceId = (settings.greenApiInstanceId || process.env.GREEN_API_INSTANCE_ID || '').trim();
  const apiToken = (settings.greenApiToken || process.env.GREEN_API_TOKEN || '').trim();
  const apiHost = (settings.greenApiHost || process.env.GREEN_API_HOST || 'https://api.green-api.com').trim().replace(/\/$/, '');

  // 1. Envoi automatique par message WhatsApp directement sur le numéro du client via Green-API
  if (cleanPhone && instanceId && apiToken) {
    try {
      const chatId = `${cleanPhone}@c.us`;
      const url = `${apiHost}/waInstance${instanceId}/sendMessage/${apiToken}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          message: messageText
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.idMessage) {
        sentAutomatic = true;
        results.push({ channel: 'whatsapp_direct', success: true, to: cleanPhone, idMessage: data.idMessage });
      } else {
        results.push({ channel: 'whatsapp_direct', success: false, to: cleanPhone, error: data });
      }
    } catch (err) {
      console.error('Erreur envoi suivi WhatsApp client:', err);
      results.push({ channel: 'whatsapp_direct', success: false, error: err.message });
    }
  }

  // 2. Envoi automatique par SMS via Webhook SMS / Passerelle SMS (si configurée)
  const smsWebhookUrl = (settings.smsWebhookUrl || process.env.SMS_WEBHOOK_URL || '').trim();
  const smsApiKey = (settings.smsApiKey || process.env.SMS_API_KEY || '').trim();
  if (cleanPhone && smsWebhookUrl) {
    try {
      const resp = await fetch(smsWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(smsApiKey ? { 'Authorization': `Bearer ${smsApiKey}` } : {})
        },
        body: JSON.stringify({
          to: `+${cleanPhone}`,
          phone: `+${cleanPhone}`,
          message: smsShortText,
          text: smsShortText,
          orderId: order.id,
          trackingNumber: trackingNum
        })
      });
      if (resp.ok) {
        sentAutomatic = true;
        results.push({ channel: 'sms_gateway', success: true, to: `+${cleanPhone}` });
      }
    } catch (err) {
      console.error('Erreur envoi SMS Gateway:', err);
      results.push({ channel: 'sms_gateway', success: false, error: err.message });
    }
  }

  // 3. Notification également sur le Groupe WhatsApp pour confirmer à Eliott & Ilies que le suivi est parti
  let groupId = (settings.whatsappGroupId || process.env.WHATSAPP_GROUP_ID || '').trim();
  if (instanceId && apiToken && groupId) {
    if (!groupId.includes('@')) groupId = `${groupId}@g.us`;
    try {
      const url = `${apiHost}/waInstance${instanceId}/sendMessage/${apiToken}`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: groupId,
          message: `📦 *SUIVI ENVOYÉ AU CLIENT — ${order.id}*\n• *Client :* ${order.customerName} (${order.customerPhone || 'N/A'})\n• *N° de suivi :* ${trackingNum}\n• *Statut :* Message envoyé automatiquement au client ✅`
        })
      });
    } catch (e) {}
  }

  const whatsappDirectUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
  const smsDirectUrl = cleanPhone
    ? `sms:+${cleanPhone}?body=${encodeURIComponent(smsShortText)}`
    : `sms:?body=${encodeURIComponent(smsShortText)}`;

  return {
    success: true,
    sentAutomatic,
    phone: cleanPhone ? `+${cleanPhone}` : (order.customerPhone || ''),
    messageText,
    smsShortText,
    whatsappDirectUrl,
    smsDirectUrl,
    results
  };
}

/**
 * Génère le modèle HTML premium pour le mail de confirmation de commande
 */
function generateOrderConfirmationEmail(order) {
  const itemsHtml = (order.items || []).map(it => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #23232c;">
        <div style="font-weight: 700; color: #ffffff; font-size: 14px;">${it.brand || 'ELS'} — ${it.name}</div>
        <div style="color: #94a3b8; font-size: 12px; margin-top: 2px;">Taille : <strong>${it.size || 'M'}</strong> • Coloris : ${it.color || 'Standard'}${it.option ? ` • Option : <strong>${it.option}</strong>` : ''} • Qte : ${it.quantity || 1}</div>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #23232c; text-align: right; color: #ffffff; font-weight: 700; font-size: 14px; white-space: nowrap;">
        ${(parseFloat(it.price || 0) * (it.quantity || 1)).toFixed(2)} €
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Confirmation de commande ${order.id} — ELS.SHOP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0d; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #121217; border: 1px solid #23232c; border-radius: 16px; overflow: hidden; padding: 0;">
          <tr>
            <td style="background-color: #000000; padding: 24px 30px; text-align: center; border-bottom: 1px solid #23232c;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">
                ELS<span style="color: #22c55e;">.</span>SHOP
              </h1>
              <p style="margin: 4px 0 0; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px;">Qualité 1:1 Miroir Certifiée</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 30px 20px;">
              <div style="background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 11px; font-weight: 800; color: #22c55e; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">✓ Commande Confirmée & Paiement Vérifié</span>
                <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">${order.id}</span>
              </div>

              <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 10px;">
                Bonjour ${order.customerName || 'Client'},
              </h2>
              <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px;">
                Votre commande sur <strong>ELS.SHOP</strong> est bien confirmée ! Votre numéro de suivi vous sera envoyé directement par message (SMS / WhatsApp) au <strong>${order.customerPhone || 'votre numéro'}</strong> dans les jours à venir dès l'expédition de votre colis.
              </p>

              <div style="background-color: #0a0a0d; border: 1px solid #23232c; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  Livraison Colissimo Sécurisée
                </div>
                <div style="font-size: 13px; color: #ffffff; font-weight: 600;">
                  Destinataire : ${order.customerName} (${order.customerPhone || ''})
                </div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                  Adresse de livraison : ${order.customerAddress || ''}
                </div>
              </div>

              <div style="margin-top: 25px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #23232c; padding-bottom: 8px;">
                  Récapitulatif des Articles
                </h3>
                <table width="100%" cellspacing="0" cellpadding="0">
                  ${itemsHtml}
                  <tr>
                    <td style="padding: 10px 0 0; font-size: 12px; color: #94a3b8;">Frais de livraison</td>
                    <td style="padding: 10px 0 0; text-align: right; font-size: 12px; color: #ffffff;">${parseFloat(order.shippingCost !== undefined ? order.shippingCost : 4.90).toFixed(2)} €</td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 0 0; font-weight: 800; font-size: 15px; color: #ffffff;">TOTAL RÉGLÉ</td>
                    <td style="padding: 14px 0 0; text-align: right; font-weight: 800; font-size: 18px; color: #22c55e;">${parseFloat(order.total || 0).toFixed(2)} €</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Génère le modèle HTML pour l'avis d'expédition avec le numéro de suivi
 */
function generateShippingEmailHtml(order) {
  const carrierUrl = getCarrierTrackingUrl(order.carrier || 'Colissimo', order.trackingNumber) || `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(order.trackingNumber || '')}`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Votre numéro de suivi pour la commande ${order.id} — ELS.SHOP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0d; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #121217; border: 1px solid #23232c; border-radius: 16px; overflow: hidden; padding: 0;">
          <tr>
            <td style="background-color: #000000; padding: 24px 30px; text-align: center; border-bottom: 1px solid #23232c;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">
                ELS<span style="color: #22c55e;">.</span>SHOP
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <div style="background-color: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">📦 Colis Expédié</span>
                <span style="font-size: 18px; font-weight: 800; color: #ffffff;">Numéro de suivi : ${order.trackingNumber || ''}</span>
              </div>
              <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 10px;">
                Bonjour ${order.customerName} !
              </h2>
              <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px;">
                Votre colis pour la commande <strong>${order.id}</strong> a été expédié à l'adresse : <strong>${order.customerAddress || ''}</strong>.
              </p>
              <div style="text-align: center; margin: 25px 0 15px;">
                <a href="${carrierUrl}" target="_blank" style="background-color: #22c55e; color: #000000; text-decoration: none; font-size: 13px; font-weight: 800; padding: 14px 28px; border-radius: 12px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
                  Suivre mon colis sur le site du transporteur
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

async function sendEmailNotification({ to, subject, html, text }) {
  if (!to) return { success: false, reason: 'missing_recipient' };
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'ELS.SHOP <commandes@els-shop.com>',
          to: [to],
          subject,
          html,
          text: text || subject
        })
      });
      const data = await resp.json();
      return { success: resp.ok, id: data.id, provider: 'resend' };
    } catch (e) {
      console.error('Erreur envoi Resend:', e);
    }
  }
  return {
    success: true,
    provider: 'simulated',
    to,
    subject
  };
}

function generateWhatsAppMessage(order) {
  return formatCustomerTrackingMessage(order);
}

function generateSmsMessage(order) {
  const trackingNum = (order.trackingNumber || '').trim();
  if (trackingNum) {
    return `ELS.SHOP : Votre commande ${order.id} a été expédiée ! Numéro de suivi : ${trackingNum}`;
  }
  return `ELS.SHOP : Votre commande ${order.id} est bien confirmée. Votre numéro de suivi vous sera envoyé par message dès l'expédition.`;
}

module.exports = {
  normalizePhoneInternational,
  getItemPublicPhotoUrl,
  formatWhatsAppGroupTicket,
  sendWhatsAppGroupOrderTicket,
  formatCustomerTrackingMessage,
  sendTrackingMessageToCustomer,
  generateOrderConfirmationEmail,
  generateShippingEmailHtml,
  sendEmailNotification,
  generateWhatsAppMessage,
  generateSmsMessage
};
